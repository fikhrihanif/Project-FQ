import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function cleanSeedTickets() {
  const deleted = await prisma.ticket.deleteMany({
    where: {
      noTiket: {
        in: ["WS-2026-00001", "WS-2026-00002", "WS-2026-00003", "WS-2026-00004"],
      },
    },
  });
  console.log(`Deleted ${deleted.count} sample seed tickets.`);
}

cleanSeedTickets()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
