import { requireSession } from "@/lib/session";
import { WorkstationForm } from "@/components/input-tiket/WorkstationForm";
import { Monitor } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Input Tiket Workstation | Nagari Workstation Monitor",
  description: "Buka tiket kerusakan barang & workstation",
};

export default async function InputTiketWorkstationPage() {
  const session = await requireSession();

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Monitor className="w-5 h-5 text-accent" />
          <h1 className="page-title">Input Tiket Workstation</h1>
        </div>
        <p className="page-subtitle">
          Pendataan kerusakan perangkat & barang workstation. Nomor tiket
          dibuat otomatis. Petugas: <span className="font-medium">{session.nama}</span>
        </p>
      </div>
      <WorkstationForm />
    </div>
  );
}
