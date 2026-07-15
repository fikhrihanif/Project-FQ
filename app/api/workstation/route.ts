import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

function cleanStr(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}
function optStr(v: unknown): string | null {
  const s = cleanStr(v);
  return s.length ? s : null;
}

/**
 * GET /api/workstation — daftar master cabang workstation Bank Nagari.
 * Query param: ?q= (pencarian nama/kode), &limit=
 */
export async function GET(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Tidak terautentikasi." }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();
  const limitRaw = Number(searchParams.get("limit"));
  const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(limitRaw, 200) : 200;

  const where: Prisma.WorkstationMasterWhereInput = q
    ? {
        OR: [
          { namaCabang: { contains: q, mode: "insensitive" } },
          { kodeKantor: { contains: q, mode: "insensitive" } },
          { lokasiKantor: { contains: q, mode: "insensitive" } },
        ],
      }
    : {};

  const [items, total] = await Promise.all([
    prisma.workstationMaster.findMany({
      where,
      orderBy: { namaCabang: "asc" },
      take: limit,
    }),
    prisma.workstationMaster.count(),
  ]);

  return NextResponse.json({ items, total });
}

/** POST /api/workstation — tambah data cabang workstation. */
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Tidak terautentikasi." }, { status: 401 });
  }
  if (session.role === "supervisi") {
    return NextResponse.json(
      { error: "Supervisi tidak dapat menambah data cabang." },
      { status: 403 }
    );
  }

  const body = await req.json().catch(() => null);
  const namaCabang = cleanStr(body?.namaCabang);

  if (!namaCabang) {
    return NextResponse.json(
      { error: "Nama Cabang wajib diisi." },
      { status: 400 }
    );
  }

  try {
    const created = await prisma.workstationMaster.create({
      data: {
        namaCabang,
        kodeKantor: optStr(body?.kodeKantor),
        lokasiKantor: optStr(body?.lokasiKantor),
      },
    });
    return NextResponse.json({ item: created }, { status: 201 });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return NextResponse.json(
        { error: `Kode kantor "${optStr(body?.kodeKantor)}" sudah terdaftar.` },
        { status: 409 }
      );
    }
    throw e;
  }
}
