import { PrismaClient, Role, CpTipe, TicketStatus, StatusSupervisi } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function seedUsers() {
  const users: { username: string; nama: string; role: Role }[] = [
    { username: "user1", nama: "Petugas Operator 1", role: Role.user },
    { username: "user2", nama: "Petugas Operator 2", role: Role.user },
    { username: "user3", nama: "Petugas Operator 3", role: Role.user },
    { username: "superadmin", nama: "Administrator Sistem", role: Role.superadmin },
    { username: "supervisi1", nama: "Supervisi Utama", role: Role.supervisi },
    { username: "supervisi2", nama: "Supervisi Operasional", role: Role.supervisi },
  ];

  for (const u of users) {
    const passwordHash = await bcrypt.hash(u.username, 10);
    await prisma.user.upsert({
      where: { username: u.username },
      update: { nama: u.nama, role: u.role },
      create: { ...u, passwordHash },
    });
  }
  console.log(`  users: ${users.length} akun dummy (password = username)`);
}

async function seedWorkstationMaster() {
  const count = await prisma.workstationMaster.count();
  if (count > 0) {
    console.log("  workstation_master: sudah ada data cabang, dilewati");
    return;
  }
  const cabangList = [
    { namaCabang: "CABANG UTAMA", kodeKantor: "001" },
    { namaCabang: "CABANG BARAT", kodeKantor: "002" },
    { namaCabang: "CABANG TIMUR", kodeKantor: "003" },
    { namaCabang: "CABANG SELATAN", kodeKantor: "004" },
    { namaCabang: "CABANG UTARA", kodeKantor: "005" },
    { namaCabang: "CABANG PUSAT", kodeKantor: "006" },
    { namaCabang: "CABANG ALPHA", kodeKantor: "007" },
    { namaCabang: "CABANG BETA", kodeKantor: "008" },
    { namaCabang: "CABANG GAMMA", kodeKantor: "009" },
    { namaCabang: "CABANG DELTA", kodeKantor: "010" },
  ];
  const res = await prisma.workstationMaster.createMany({
    data: cabangList,
    skipDuplicates: true,
  });
  console.log(`  workstation_master: ${res.count} cabang dummy di-seed`);
}

async function seedSampleTickets() {
  const count = await prisma.ticket.count();
  if (count > 0) {
    console.log("  tickets: sudah ada data tiket, dilewati");
    return;
  }

  const user = await prisma.user.findFirst({ where: { role: Role.user } });
  if (!user) return;

  const samples = [
    {
      noTiket: "WS-2026-00001",
      wsCabang: "CABANG UTAMA",
      wsMerekKomputer: "[Komputer - AIO] Demo PC Workstation 1",
      wsSnKomputer: "SN-DEMO-00123",
      wsKerusakan: "Layar monitor bergaris dan sering mati mendadak",
      wsKelengkapan: "Adaptor, Power Cable, Mouse, Keyboard",
      wsNoSurat: "SR/01/CBO/01-2026",
      cpTipe: CpTipe.pic,
      cpNama: "Budi Santoso",
      cpTelp: "081234567890",
      status: TicketStatus.proses,
      statusSupervisi: StatusSupervisi.belum,
      ownerUserId: user.id,
    },
    {
      noTiket: "WS-2026-00002",
      wsCabang: "CABANG BARAT",
      wsMerekKomputer: "[EDC] Terminal EDC Demo A1",
      wsSnKomputer: "SN-EDC-998811",
      wsKerusakan: "Kertas printer struk tidak keluar dan layar macet",
      wsKelengkapan: "Charger EDC, USB Cable",
      wsNoSurat: "SR/02/CBB/01-2026",
      cpTipe: CpTipe.wag,
      cpNama: "Tim Admin Cabang Barat",
      cpTelp: "",
      status: TicketStatus.selesai,
      statusSupervisi: StatusSupervisi.belum,
      ownerUserId: user.id,
    },
    {
      noTiket: "WS-2026-00003",
      wsCabang: "CABANG TIMUR",
      wsMerekKomputer: "[Komputer - Desktop] Server Mini Demo",
      wsSnKomputer: "SN-PC-778899",
      wsKerusakan: "Power supply mengeluarkan bunyi dan PC mati sendiri",
      wsKelengkapan: "Unit PC CPU saja",
      wsNoSurat: "SR/03/CBT/01-2026",
      cpTipe: CpTipe.pic,
      cpNama: "Siti Rahma",
      cpTelp: "081987654321",
      status: TicketStatus.selesai,
      statusSupervisi: StatusSupervisi.approved,
      ownerUserId: user.id,
    },
    {
      noTiket: "WS-2026-00004",
      wsCabang: "CABANG SELATAN",
      wsMerekKomputer: "[EDC] Terminal EDC Demo B2",
      wsSnKomputer: "SN-EDC-554433",
      wsKerusakan: "Koneksi jaringan gagal dan kartu chip tidak terbaca",
      wsKelengkapan: "Adaptor, Base Docking",
      wsNoSurat: "SR/04/CBS/01-2026",
      cpTipe: CpTipe.pic,
      cpNama: "Agus Pratama",
      cpTelp: "082123456789",
      status: TicketStatus.proses,
      statusSupervisi: StatusSupervisi.belum,
      ownerUserId: user.id,
    },
  ];

  for (const s of samples) {
    await prisma.ticket.create({
      data: {
        ...s,
        wsTanggalMasuk: new Date(),
        activities: {
          create: {
            teks: "Pendataan awal perangkat & registrasi tiket baru",
            userId: user.id,
          },
        },
      },
    });
  }
  console.log(`  tickets: ${samples.length} tiket sampel dummy di-seed`);
}

const sampleFotoAvatar1 = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOJM9PDkeODFDZCORQGQzOkjDxub78gAAAAAA";
const sampleFotoAvatar2 = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOJM9PDkeODFDZCORQGQzOkjDxub78gAAAAAA";

async function seedServerLogs() {
  const user = await prisma.user.findFirst({ where: { role: Role.user } });
  const supervisi = await prisma.user.findFirst({ where: { role: Role.supervisi } });
  if (!user) return;

  const now = new Date();

  await prisma.serverAccessLog.createMany({
    data: [
      {
        namaOrang: "Teknisi Listrik (Vendor A)",
        instansi: "PT. Daya Kelistrikan",
        namaPic: "Petugas PIC 1",
        keperluan: "Pengecekan Rutin Panel Listrik Server Room",
        jenisAkses: "masuk",
        waktuAkses: new Date(now.getTime() - 2 * 60 * 60 * 1000),
        waktuKeluar: new Date(now.getTime() - 30 * 60 * 1000),
        fotoUrl: sampleFotoAvatar1,
        catatanOleh: user.id,
        statusApproval: "approved",
        approvedBy: supervisi?.id ?? user.id,
      },
      {
        namaOrang: "Teknisi Pendingin (Vendor B)",
        instansi: "PT. Pendingin Utama",
        namaPic: "Petugas PIC 2",
        keperluan: "Pencegahan & Pembersihan Filter AC Precision",
        jenisAkses: "masuk",
        waktuAkses: new Date(now.getTime() - 45 * 60 * 1000),
        waktuKeluar: null,
        fotoUrl: sampleFotoAvatar2,
        catatanOleh: user.id,
        statusApproval: "pending",
      },
    ],
  });
  console.log(`  server_logs: 2 log sampel dummy di-seed`);
}

async function main() {
  console.log("Seeding data dummy Fast Queue...");
  await seedUsers();
  await seedWorkstationMaster();
  await seedServerLogs();
  console.log("Seeding selesai.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
