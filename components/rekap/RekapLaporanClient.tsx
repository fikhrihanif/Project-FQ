"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Download, FileSpreadsheet, FileText, Printer, CheckCircle2 } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

interface Props {
  today: string; // YYYY-MM-DD
}

interface TicketOption {
  id: string;
  noTiket: string;
  wsCabang: string;
  wsMerekKomputer: string;
  wsSnKomputer: string;
  wsTanggalMasuk?: string;
  ownerNama?: string;
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

function formatIndonesianDate(dateStr: string) {
  if (!dateStr) return { hari: "Selasa", tglFull: "22 April 2025", hariTglFull: "Selasa Tanggal 22 April 2025" };
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return { hari: "Selasa", tglFull: "22 April 2025", hariTglFull: "Selasa Tanggal 22 April 2025" };
  
  const hariList = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const bulanList = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];
  const hari = hariList[d.getDay()];
  const tgl = d.getDate();
  const bulan = bulanList[d.getMonth()];
  const tahun = d.getFullYear();
  return {
    hari,
    tglFull: `${tgl} ${bulan} ${tahun}`,
    hariTglFull: `${hari} Tanggal ${tgl} ${bulan} ${tahun}`
  };
}

export function RekapLaporanClient({ today }: Props) {
  const [activeTab, setActiveTab] = useState<"workstation" | "berita-acara">("workstation");

  // --- Sub-Judul 1: Workstation ---
  const sevenDaysAgo = (() => {
    const d = new Date(`${today}T00:00:00+07:00`);
    d.setDate(d.getDate() - 6);
    return d.toISOString().slice(0, 10);
  })();

  const [tglDariWs, setTglDariWs] = useState(sevenDaysAgo);
  const [tglSampaiWs, setTglSampaiWs] = useState(today);
  const [loadingWs, setLoadingWs] = useState(false);
  const [errWs, setErrWs] = useState("");

  // --- Sub-Judul 2: Berita Acara ---
  const [tickets, setTickets] = useState<TicketOption[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState("");
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [downloadingBa, setDownloadingBa] = useState(false);

  // Editable Form Fields untuk Berita Acara
  const [baForm, setBaForm] = useState({
    namaPerangkat: "Lenovo V50a All in One",
    sn: "MP1VZ0PX",
    cabang: "Payakumbuh",
    tgl: today,
    diserahkanOleh: "DIMAS TEGUH PRIBADI",
    jabatanDiserahkan: "Staff Bagian Infrastruktur Divisi T&D",
    diterimaOleh: "Cabang Payakumbuh",
  });

  useEffect(() => {
    async function loadTickets() {
      setLoadingTickets(true);
      try {
        const res = await fetch("/api/tickets");
        if (res.ok) {
          const data = await res.json();
          const items: TicketOption[] = data.items || [];
          setTickets(items);
          if (items.length > 0) {
            const first = items[0];
            setSelectedTicketId(first.id);
            updateFormFromTicket(first);
          }
        }
      } catch (e) {
        console.error("Gagal memuat tiket:", e);
      } finally {
        setLoadingTickets(false);
      }
    }
    loadTickets();
  }, []);

  function updateFormFromTicket(t: TicketOption) {
    const isEdc = t.wsMerekKomputer.toLowerCase().includes("edc");
    const namaPerangkat = t.wsMerekKomputer.replace(/^\[.*?\]\s*/, "") || (isEdc ? "Mesin EDC" : "Komputer All in One");
    setBaForm({
      namaPerangkat,
      sn: t.wsSnKomputer || "-",
      cabang: t.wsCabang || "Payakumbuh",
      tgl: t.wsTanggalMasuk ? t.wsTanggalMasuk.split("T")[0] : today,
      diserahkanOleh: t.ownerNama?.toUpperCase() || "DIMAS TEGUH PRIBADI",
      jabatanDiserahkan: "Staff Bagian Infrastruktur Divisi T&D",
      diterimaOleh: `Cabang ${t.wsCabang || 'Payakumbuh'}`,
    });
  }

  function handleSelectTicket(id: string) {
    setSelectedTicketId(id);
    const found = tickets.find((t) => t.id === id);
    if (found) {
      updateFormFromTicket(found);
    }
  }

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

  async function handleDownloadBeritaAcaraWord() {
    setDownloadingBa(true);
    const url = selectedTicketId
      ? `/api/reports/berita-acara?ticketId=${selectedTicketId}&format=word`
      : `/api/reports/berita-acara?format=word`;
    const fallbackName = `BERITA_ACARA_SERAH_TERIMA_${baForm.cabang.replace(/\s+/g, '_')}.doc`;
    await downloadFile(url, fallbackName);
    setDownloadingBa(false);
  }

  function handlePrintBeritaAcara() {
    const url = selectedTicketId
      ? `/api/reports/berita-acara?ticketId=${selectedTicketId}&format=print`
      : `/api/reports/berita-acara?format=print`;
    window.open(url, "_blank");
  }

  const dateFormatted = formatIndonesianDate(baForm.tgl);
  const tipeHeaderLabel = baForm.namaPerangkat.toLowerCase().includes("edc") ? "Mesin EDC" : "Komputer All in One";

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* TAB NAVIGATION / SUB-JUDUL */}
      <div className="flex border-b border-gray-200 bg-white rounded-t-xl overflow-hidden shadow-sm">
        <button
          onClick={() => setActiveTab("workstation")}
          className={`flex-1 py-4 px-6 text-center font-bold text-sm transition-all flex items-center justify-center gap-2 border-b-2 ${
            activeTab === "workstation"
              ? "border-primary text-primary bg-primary-50/30"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" /> 1. Rekap Laporan Workstation
        </button>
        <button
          onClick={() => setActiveTab("berita-acara")}
          className={`flex-1 py-4 px-6 text-center font-bold text-sm transition-all flex items-center justify-center gap-2 border-b-2 ${
            activeTab === "berita-acara"
              ? "border-primary text-primary bg-primary-50/30"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
          }`}
        >
          <FileText className="w-4 h-4" /> 2. Berita Acara
        </button>
      </div>

      {/* SUB-JUDUL 1: REKAP LAPORAN WORKSTATION */}
      {activeTab === "workstation" && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <Card padding="lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <FileSpreadsheet className="w-5 h-5 text-primary" /> Rekap Laporan Workstation (Format Excel .xlsx)
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
                {!loadingWs && <Download className="w-4 h-4" />} Download Rekap Laporan Workstation (.xlsx)
              </Button>
            </div>
          </Card>
        </motion.div>
      )}

      {/* SUB-JUDUL 2: LAPORAN BERITA ACARA SERAH TERIMA PERANGKAT */}
      {activeTab === "berita-acara" && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* FORM INPUT DOKUMEN */}
            <div className="lg:col-span-5 space-y-4">
              <Card padding="md">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600" /> Data Berita Acara
                  </CardTitle>
                </CardHeader>

                {tickets.length > 0 && (
                  <div className="mb-4">
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Pilih dari Tiket Perangkat (Otomatis Isi)
                    </label>
                    <select
                      value={selectedTicketId}
                      onChange={(e) => handleSelectTicket(e.target.value)}
                      className="w-full text-xs border border-gray-300 rounded-md p-2 bg-white"
                    >
                      {tickets.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.noTiket} — [{t.wsCabang}] {t.wsMerekKomputer}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-0.5">Nama Perangkat</label>
                    <Input
                      value={baForm.namaPerangkat}
                      onChange={(e) => setBaForm({ ...baForm, namaPerangkat: e.target.value })}
                      placeholder="Lenovo V50a All in One"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-0.5">Serial Number (S/N)</label>
                    <Input
                      value={baForm.sn}
                      onChange={(e) => setBaForm({ ...baForm, sn: e.target.value })}
                      placeholder="MP1VZ0PX"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-0.5">Cabang</label>
                    <Input
                      value={baForm.cabang}
                      onChange={(e) => setBaForm({ ...baForm, cabang: e.target.value })}
                      placeholder="Payakumbuh"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-0.5">Tanggal Penyerahan</label>
                    <Input
                      type="date"
                      value={baForm.tgl}
                      onChange={(e) => setBaForm({ ...baForm, tgl: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-0.5">Diserahkan Oleh (Petugas)</label>
                    <Input
                      value={baForm.diserahkanOleh}
                      onChange={(e) => setBaForm({ ...baForm, diserahkanOleh: e.target.value })}
                      placeholder="DIMAS TEGUH PRIBADI"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-0.5">Diterima Oleh</label>
                    <Input
                      value={baForm.diterimaOleh}
                      onChange={(e) => setBaForm({ ...baForm, diterimaOleh: e.target.value })}
                      placeholder="Cabang Payakumbuh"
                    />
                  </div>
                </div>

                <div className="mt-5 space-y-2">
                  <Button
                    onClick={handleDownloadBeritaAcaraWord}
                    loading={downloadingBa}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {!downloadingBa && <FileText className="w-4 h-4 mr-1.5" />} Download Berita Acara (.doc)
                  </Button>

                  <Button
                    variant="outline"
                    onClick={handlePrintBeritaAcara}
                    className="w-full border-blue-600 text-blue-700 hover:bg-blue-50"
                  >
                    <Printer className="w-4 h-4 mr-1.5 text-blue-600" /> Cetak / Export PDF
                  </Button>
                </div>
              </Card>
            </div>

            {/* LIVE DOCUMENT PREVIEW (EXACT MATCH IMAGE 2) */}
            <div className="lg:col-span-7">
              <Card padding="md" className="bg-gray-100/70 border border-gray-300">
                <div className="flex items-center justify-between mb-3 px-1">
                  <span className="text-xs font-bold text-gray-600 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-green-600" /> Preview Dokumen Berita Acara (A4)
                  </span>
                  <span className="text-[11px] text-gray-400">Otomatis Update</span>
                </div>

                {/* TEMPLAT DOKUMEN BERITA ACARA */}
                <div className="bg-white p-6 sm:p-8 rounded-lg shadow-md border border-gray-300 text-gray-900 text-xs sm:text-sm font-sans leading-relaxed">
                  {/* LOGO */}
                  <div className="flex items-center justify-start mb-6 gap-2">
                    <img src="/logo-fq.png" alt="Fast Queue Logo" className="h-9 object-contain" />
                    <div className="text-xl font-extrabold text-[#0B1941] tracking-tight">
                      Fast <span className="text-[#EAB308]">Queue</span>
                    </div>
                  </div>

                  {/* JUDUL */}
                  <div className="text-center my-6 space-y-0.5">
                    <h1 className="font-bold text-sm sm:text-base uppercase tracking-wide">BERITA ACARA</h1>
                    <h2 className="font-bold text-xs sm:text-sm uppercase tracking-wide">SERAH TERIMA PERANGKAT</h2>
                  </div>

                  {/* PARAGRAF PENYERAHAN */}
                  <p className="mb-4 text-justify leading-relaxed">
                    Pada hari ini <strong>{dateFormatted.hari}</strong> Tanggal <strong>{dateFormatted.tglFull}</strong> telah di lakukan penyerahan <strong>1 unit perangkat {tipeHeaderLabel}</strong> milik <strong>{baForm.cabang.startsWith('Cabang') ? baForm.cabang : `Cabang ${baForm.cabang}`}</strong> dengan detail sebagai berikut:
                  </p>

                  {/* TABEL RINCIAN */}
                  <table className="w-full border-collapse border border-black my-4 text-xs">
                    <thead>
                      <tr className="bg-[#99CCFF] border-b border-black">
                        <th className="border border-black p-2 text-center w-[12%] font-bold">No</th>
                        <th className="border border-black p-2 text-center w-[58%] font-bold">Nama Perangkat</th>
                        <th className="border border-black p-2 text-center w-[30%] font-bold">S/N</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-black p-2 text-center">1</td>
                        <td className="border border-black p-2">{baForm.namaPerangkat}</td>
                        <td className="border border-black p-2 text-center font-mono">{baForm.sn}</td>
                      </tr>
                    </tbody>
                  </table>

                  {/* PARAGRAF PENUTUP */}
                  <p className="my-5 text-justify">
                    Demikianlah tanda terima ini dibuat rangkap 2 (dua) untuk dapat digunakan sebagaimana mestinya.
                  </p>

                  {/* TANGGAL */}
                  <div className="text-center my-4 font-medium">
                    Padang, {dateFormatted.tglFull}
                  </div>

                  {/* BOX TANDA TANGAN 2 KOLOM */}
                  <div className="grid grid-cols-2 border border-black min-h-[140px] text-xs">
                    <div className="border-r border-black p-3 flex flex-col justify-between">
                      <div>
                        <div>Diserahkan oleh:</div>
                        <div className="text-[11px] text-gray-700">{baForm.jabatanDiserahkan}</div>
                      </div>
                      <div className="pt-10">
                        <div className="font-bold underline uppercase">{baForm.diserahkanOleh}</div>
                        <div className="text-[11px] text-gray-600">Staff</div>
                      </div>
                    </div>
                    <div className="p-3 flex flex-col justify-between">
                      <div>
                        <div>Diterima oleh:</div>
                        <div className="text-[11px] text-gray-700">{baForm.diterimaOleh}</div>
                      </div>
                      <div className="pt-10">
                        <div className="border-b border-black w-32 inline-block">&nbsp;</div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
