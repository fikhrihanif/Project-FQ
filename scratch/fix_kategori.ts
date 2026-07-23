import { prisma } from "../lib/prisma";

async function main() {
  console.log("Fixing tickets.kategori column type in PostgreSQL...");

  try {
    // Check current column type
    const colInfo: any[] = await prisma.$queryRaw`
      SELECT column_name, data_type, udt_name 
      FROM information_schema.columns 
      WHERE table_name = 'tickets' AND column_name = 'kategori';
    `;
    console.log("Current column info:", colInfo);

    // Alter column type from TicketKategori enum to TEXT
    await prisma.$executeRawUnsafe(`
      ALTER TABLE tickets ALTER COLUMN kategori TYPE TEXT USING kategori::text;
    `);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE tickets ALTER COLUMN kategori SET DEFAULT 'workstation';
    `);

    console.log("Column tickets.kategori successfully altered to TEXT!");

    // Verify
    const updatedColInfo: any[] = await prisma.$queryRaw`
      SELECT column_name, data_type, udt_name 
      FROM information_schema.columns 
      WHERE table_name = 'tickets' AND column_name = 'kategori';
    `;
    console.log("Updated column info:", updatedColInfo);

  } catch (err) {
    console.error("Error executing query:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
