"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Download, FileSpreadsheet } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

interface Props {
  today: string; // YYYY-MM-DD
}

async function downloadFile(
  url: string,
  fallbackName: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const res = await fetch(url);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    return { ok: false, error: data.error ?? `Gagal mengunduh (${res.status}).` };
  }
  const cd = res.headers.get("Content-Disposition") ?? "";
  const match = /filename="?([^"]+)"?/.exec(cd);
  const name = match?.[1] ?? fallbackName;

  const blob = await res.blob();
  const objUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objUrl;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(objUrl);
  return { ok: true };
}

export function RekapLaporanClient({ today }: Props) {
  const sevenDaysAgo = (() => {
    const d = new Date(`${today}T00:00:00+07:00`);
    d.setDate(d.getDate() - 6);
    return d.toISOString().slice(0, 10);
  })();

  const [tglDariWs, setTglDariWs] = useState(sevenDaysAgo);
  const [tglSampaiWs, setTglSampaiWs] = useState(today);
  const [loadingWs, setLoadingWs] = useState(false);
  const [errWs, setErrWs] = useState("");

  async function unduhWorkstation() {
    setErrWs("");
    if (!tglDariWs || !tglSampaiWs) {
      setErrWs("Pilih rentang tanggal terlebih dahulu.");
      return;
    }
    if (tglDariWs > tglSampaiWs) {
      setErrWs("Tanggal 'dari' tidak boleh setelah tanggal 'sampai'.");
      return;
    }
    setLoadingWs(true);
    const res = await downloadFile(
      `/api/rekap/workstation?dari=${tglDariWs}&sampai=${tglSampaiWs}`,
      `REKAP_WORKSTATION_${tglDariWs}_sd_${tglSampaiWs}.xlsx`
    );
    if (!res.ok) setErrWs(res.error);
    setLoadingWs(false);
  }

  return (
    <div className="max-w-2xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <Card padding="lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-primary" /> Download Rekap Workstation
            </CardTitle>
          </CardHeader>
          <p className="text-sm text-gray-500 mb-6">
            Pilih rentang tanggal kerusakan perangkat untuk mengunduh rekap laporan dalam format Excel. 
            Laporan ini berisi informasi lengkap termasuk merek, kelengkapan, nomor seri, kerusakan, status penanganan vendor, status approval, dan keterangan lainnya.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Dari Tanggal"
              type="date"
              value={tglDariWs}
              max={tglSampaiWs}
              onChange={(e) => setTglDariWs(e.target.value)}
            />
            <Input
              label="Sampai Tanggal"
              type="date"
              value={tglSampaiWs}
              min={tglDariWs}
              onChange={(e) => setTglSampaiWs(e.target.value)}
            />
          </div>
          {errWs && (
            <p className="mt-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              {errWs}
            </p>
          )}
          <div className="flex justify-end mt-6">
            <Button onClick={unduhWorkstation} loading={loadingWs} className="w-full sm:w-auto">
              {!loadingWs && <Download className="w-4 h-4" />} Download Rekap Laporan Workstation
            </Button>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
