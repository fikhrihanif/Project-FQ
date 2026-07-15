import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function seedUsers() {
  const users: { username: string; nama: string; role: Role }[] = [
    { username: "mtr1", nama: "Afrinaldi", role: Role.user },
    { username: "mtr2", nama: "Rian Islami Putra", role: Role.user },
    { username: "mtr3", nama: "Kurnia Fajri", role: Role.user },
    { username: "mtr4", nama: "Ibnu Sauki", role: Role.user },
    { username: "mtr5", nama: "Ridho M R", role: Role.user },
    { username: "superadmin", nama: "Super Admin", role: Role.superadmin },
    { username: "tio", nama: "Tio Rahmayunda", role: Role.supervisi },
    { username: "berto", nama: "Berto L", role: Role.supervisi },
  ];

  for (const u of users) {
    // Password default = username (di-hash bcrypt).
    const passwordHash = await bcrypt.hash(u.username, 10);
    await prisma.user.upsert({
      where: { username: u.username },
      update: { nama: u.nama, role: u.role },
      create: { ...u, passwordHash },
    });
  }
  console.log(`  users: ${users.length} akun (password = username)`);
}

async function seedWorkstationMaster() {
  const count = await prisma.workstationMaster.count();
  if (count > 0) {
    console.log("  workstation_master: sudah ada data cabang, dilewati");
    return;
  }
  const cabangList = [
    { namaCabang: "PAYAKUMBUH", kodeKantor: "001" },
    { namaCabang: "BUKITTINGGI", kodeKantor: "002" },
    { namaCabang: "BATUSANGKAR", kodeKantor: "003" },
    { namaCabang: "SOLOK", kodeKantor: "004" },
    { namaCabang: "PARIAMAN", kodeKantor: "005" },
    { namaCabang: "PAINAN", kodeKantor: "006" },
    { namaCabang: "SIJUNJUNG", kodeKantor: "007" },
    { namaCabang: "LUBUK SIKAPING", kodeKantor: "008" },
    { namaCabang: "PASAR RAYA", kodeKantor: "009" },
    { namaCabang: "SITEBA", kodeKantor: "010" },
    { namaCabang: "SAWAHLUNTO", kodeKantor: "011" },
    { namaCabang: "SIMPANG EMPAT", kodeKantor: "012" },
    { namaCabang: "MUARA LABUH", kodeKantor: "013" },
    { namaCabang: "LUBUK GADANG", kodeKantor: "014" },
    { namaCabang: "KOTO BARU", kodeKantor: "015" },
    { namaCabang: "PULAU PUNJUNG", kodeKantor: "016" },
    { namaCabang: "UJUNG GADING", kodeKantor: "017" },
    { namaCabang: "LUBUK BASUNG", kodeKantor: "018" },
    { namaCabang: "LUBUK ALUNG", kodeKantor: "019" },
    { namaCabang: "TAPAN", kodeKantor: "020" },
    { namaCabang: "LINTAU", kodeKantor: "021" },
    { namaCabang: "CABANG UTAMA", kodeKantor: "022" },
    { namaCabang: "MENTAWAI", kodeKantor: "023" },
    { namaCabang: "TAPUS", kodeKantor: "024" },
    { namaCabang: "ALAHAN PANJANG", kodeKantor: "025" },
    { namaCabang: "JAKARTA", kodeKantor: "026" },
    { namaCabang: "PEKANBARU", kodeKantor: "027" },
    { namaCabang: "BANDUNG", kodeKantor: "028" },
    { namaCabang: "SYARIAH PADANG", kodeKantor: "029" },
    { namaCabang: "SYARIAH PAYAKUMBUH", kodeKantor: "030" },
    { namaCabang: "SYARIAH BUKITTINGGI", kodeKantor: "031" },
    { namaCabang: "SYARIAH BATUSANGKAR", kodeKantor: "032" },
    { namaCabang: "PADANG PANJANG", kodeKantor: "033" },
  ];
  const res = await prisma.workstationMaster.createMany({
    data: cabangList,
    skipDuplicates: true,
  });
  console.log(`  workstation_master: ${res.count} cabang Bank Nagari di-seed`);
}

async function main() {
  console.log("Seeding mtr-Report...");
  await seedUsers();
  await seedWorkstationMaster();
  console.log("Selesai.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
