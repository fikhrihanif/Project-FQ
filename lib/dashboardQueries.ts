import "server-only";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export interface DashboardData {
  counts: {
    total: number;
    proses: number;
    selesai: number;
  };
  openTickets: {
    id: string;
    noTiket: string;
    wsCabang: string;
    wsMerekKomputer: string | null;
    waktuOpen: Date;
    ownerNama: string;
  }[];
  generatedAt: string;
}

export async function getDashboardData(currentUserId?: string): Promise<DashboardData> {
  const whereTotal: Prisma.TicketWhereInput = { kategori: "workstation" };
  const whereProses: Prisma.TicketWhereInput = { kategori: "workstation", status: "proses" };
  const whereSelesai: Prisma.TicketWhereInput = {
    kategori: "workstation",
    status: "selesai",
    statusSupervisi: "approved",
  };

  if (currentUserId) {
    // If needed, filter can be added here
  }

  const [total, proses, selesai, openList] = await Promise.all([
    prisma.ticket.count({ where: whereTotal }),
    prisma.ticket.count({ where: whereProses }),
    prisma.ticket.count({ where: whereSelesai }),
    prisma.ticket.findMany({
      where: whereProses,
      orderBy: { waktuOpen: "desc" },
      take: 10,
      select: {
        id: true,
        noTiket: true,
        wsCabang: true,
        wsMerekKomputer: true,
        waktuOpen: true,
        owner: {
          select: { nama: true },
        },
      },
    }),
  ]);

  return {
    counts: { total, proses, selesai },
    openTickets: openList.map((t) => ({
      id: t.id,
      noTiket: t.noTiket,
      wsCabang: t.wsCabang,
      wsMerekKomputer: t.wsMerekKomputer,
      waktuOpen: t.waktuOpen,
      ownerNama: t.owner.nama,
    })),
    generatedAt: new Date().toISOString(),
  };
}
