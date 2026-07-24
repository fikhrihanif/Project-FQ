import { PrismaClient } from "@prisma/client";

const dbUrlDirect = "postgresql://postgres.hzsneztyptdporfghtsz:Aezakmi558081363987659.@db.hzsneztyptdporfghtsz.supabase.co:5432/postgres?sslmode=require";
const dbUrlPooler = "postgresql://postgres.hzsneztyptdporfghtsz:Aezakmi558081363987659.@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require";

async function testConn(name: string, url: string) {
  console.log(`Testing ${name}...`);
  const prisma = new PrismaClient({ datasources: { db: { url } } });
  try {
    const users = await prisma.user.findMany();
    console.log(`[SUCCESS] ${name} connected! Total users found: ${users.length}`);
  } catch (err: any) {
    console.error(`[FAILED] ${name} error:`, err.message);
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  await testConn("Direct (5432 + sslmode)", dbUrlDirect);
  await testConn("Pooler (6543 + pgbouncer + sslmode)", dbUrlPooler);
}

main();
