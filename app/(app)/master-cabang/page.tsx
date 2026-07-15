import { redirect } from "next/navigation";
import { requireSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { MasterCabangClient } from "@/components/master-cabang/MasterCabangClient";

export const dynamic = "force-dynamic";

export default async function MasterCabangPage() {
  const session = await requireSession();
  if (session.role !== "superadmin") {
    redirect("/dashboard");
  }

  const branches = await prisma.workstationMaster.findMany({
    orderBy: { namaCabang: "asc" },
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="page-title">Master Cabang Workstation</h1>
        <p className="page-subtitle">
          Kelola data master cabang Bank Nagari untuk referensi penginputan tiket workstation (CRUD).
        </p>
      </div>
      <MasterCabangClient initialBranches={branches} />
    </div>
  );
}
