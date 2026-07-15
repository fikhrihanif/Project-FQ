import { requireSession } from "@/lib/session";
import { fmtDateKey } from "@/lib/format";
import { RekapLaporanClient } from "@/components/rekap/RekapLaporanClient";

export const dynamic = "force-dynamic";

export default async function RekapLaporanPage() {
  await requireSession();

  return (
    <div>
      <div className="mb-6">
        <h1 className="page-title">Rekap Laporan</h1>
        <p className="page-subtitle">
          Unduh rekap laporan penanganan gangguan workstation Bank Nagari dalam format Excel.
          Visual Excel otomatis mengikuti standar Bank Nagari (warna biru, border tipis, dan logo Bank Nagari).
        </p>
      </div>
      <RekapLaporanClient today={fmtDateKey(new Date())} />
    </div>
  );
}
