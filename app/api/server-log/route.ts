import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}
function endOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}
function startOfWeek(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}
function startOfMonth(date: Date) {
  const d = new Date(date.getFullYear(), date.getMonth(), 1);
  d.setHours(0, 0, 0, 0);
  return d;
}
function endOfMonth(date: Date) {
  const d = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  d.setHours(23, 59, 59, 999);
  return d;
}

/** GET /api/server-log — daftar log akses server */
export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Tidak terautentikasi." }, { status: 401 });
    }

    const sp = new URL(req.url).searchParams;
    const filter = sp.get("filter") ?? "semua";

    const now = new Date();
    let where: { waktuAkses?: { gte: Date; lte: Date } } = {};

    if (filter === "harian") {
      where = { waktuAkses: { gte: startOfDay(now), lte: endOfDay(now) } };
    } else if (filter === "mingguan") {
      const weekStart = startOfWeek(now);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);
      where = { waktuAkses: { gte: weekStart, lte: weekEnd } };
    } else if (filter === "bulanan") {
      where = { waktuAkses: { gte: startOfMonth(now), lte: endOfMonth(now) } };
    } else if (filter === "custom") {
      const startDateStr = sp.get("startDate");
      const endDateStr = sp.get("endDate");
      if (startDateStr && endDateStr) {
        const start = new Date(startDateStr);
        start.setHours(0, 0, 0, 0);
        const end = new Date(endDateStr);
        end.setHours(23, 59, 59, 999);
        if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
          where = { waktuAkses: { gte: start, lte: end } };
        }
      }
    }

    const logs = await prisma.serverAccessLog.findMany({
      where,
      orderBy: { waktuAkses: "desc" },
      include: {
        pencatat: { select: { id: true, nama: true, username: true } },
        approver: { select: { id: true, nama: true, username: true } },
      },
    });

    return NextResponse.json({ logs });
  } catch (err) {
    console.error("[GET /api/server-log]", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server." },
      { status: 500 }
    );
  }
}

/** POST /api/server-log — tambah log akses server */
export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Tidak terautentikasi." }, { status: 401 });
    }
    if (session.role === "supervisi") {
      return NextResponse.json(
        { error: "Supervisi tidak dapat mencatat log server." },
        { status: 403 }
      );
    }

    let body: Record<string, unknown> | null = null;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Body request tidak valid." }, { status: 400 });
    }

    const namaOrang = typeof body?.namaOrang === "string" ? body.namaOrang.trim() : "";
    const instansi = typeof body?.instansi === "string" ? body.instansi.trim() : "";
    const namaPic = typeof body?.namaPic === "string" ? body.namaPic.trim() : "";
    const keperluan = typeof body?.keperluan === "string" ? body.keperluan.trim() || null : null;
    const fotoUrl = typeof body?.fotoUrl === "string" ? body.fotoUrl.trim() || null : null;

    if (!namaOrang) {
      return NextResponse.json({ error: "Nama orang wajib diisi." }, { status: 400 });
    }
    if (!instansi) {
      return NextResponse.json({ error: "Nama instansi wajib diisi." }, { status: 400 });
    }
    if (!namaPic) {
      return NextResponse.json({ error: "Nama PIC wajib diisi." }, { status: 400 });
    }

    const dbUser = await prisma.user.findFirst({
      where: {
        OR: [{ id: session.sub }, { username: session.username }],
      },
    });

    if (!dbUser || !dbUser.isAktif) {
      return NextResponse.json(
        { error: "Sesi login Anda telah kedaluwarsa. Silakan login kembali." },
        { status: 401 }
      );
    }

    const log = await prisma.serverAccessLog.create({
      data: {
        namaOrang,
        instansi,
        namaPic,
        keperluan,
        jenisAkses: "masuk",
        waktuAkses: new Date(),
        fotoUrl,
        catatanOleh: dbUser.id,
        statusApproval: "pending",
      },
      include: {
        pencatat: { select: { id: true, nama: true, username: true } },
        approver: { select: { id: true, nama: true, username: true } },
      },
    });

    return NextResponse.json({ log }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/server-log]", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server saat membuat log." },
      { status: 500 }
    );
  }
}

/** PATCH /api/server-log — update waktu keluar atau approve */
export async function PATCH(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Tidak terautentikasi." }, { status: 401 });
    }

    let body: Record<string, unknown> | null = null;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Body request tidak valid." }, { status: 400 });
    }

    const id = typeof body?.id === "string" ? body.id : "";
    const action = typeof body?.action === "string" ? body.action : "";

    if (!id) {
      return NextResponse.json({ error: "ID log wajib disertakan." }, { status: 400 });
    }

    const existingLog = await prisma.serverAccessLog.findUnique({ where: { id } });
    if (!existingLog) {
      return NextResponse.json({ error: "Log tidak ditemukan." }, { status: 404 });
    }

    let updatedData: Record<string, unknown> = {};

    if (action === "exit") {
      if (session.role === "supervisi") {
        return NextResponse.json(
          { error: "Supervisi tidak dapat mengedit waktu keluar log." },
          { status: 403 }
        );
      }
      if (existingLog.waktuKeluar) {
        return NextResponse.json({ error: "Waktu keluar sudah terekam." }, { status: 400 });
      }
      updatedData = { waktuKeluar: new Date() };
    } else if (action === "approve") {
      if (session.role !== "supervisi" && session.role !== "superadmin") {
        return NextResponse.json(
          { error: "Hanya supervisi atau superadmin yang dapat melakukan approval." },
          { status: 403 }
        );
      }
      updatedData = {
        statusApproval: "approved",
        approvedBy: session.sub,
      };
    } else {
      return NextResponse.json({ error: "Aksi tidak dikenali." }, { status: 400 });
    }

    const log = await prisma.serverAccessLog.update({
      where: { id },
      data: updatedData,
      include: {
        pencatat: { select: { id: true, nama: true, username: true } },
        approver: { select: { id: true, nama: true, username: true } },
      },
    });

    return NextResponse.json({ log });
  } catch (err) {
    console.error("[PATCH /api/server-log]", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server saat memperbarui log." },
      { status: 500 }
    );
  }
}
