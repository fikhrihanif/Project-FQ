"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, TicketPlus, X } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

const DAFTAR_CABANG = [
  "PAYAKUMBUH",
  "BUKITTINGGI",
  "BATUSANGKAR",
  "SOLOK",
  "PARIAMAN",
  "PAINAN",
  "SIJUNJUNG",
  "LUBUK SIKAPING",
  "PASAR RAYA",
  "SITEBA",
  "SAWAHLUNTO",
  "SIMPANG EMPAT",
  "MUARA LABUH",
  "LUBUK GADANG",
  "KOTO BARU",
  "PULAU PUNJUNG",
  "UJUNG GADING",
  "LUBUK BASUNG",
  "LUBUK ALUNG",
  "TAPAN",
  "LINTAU",
  "CABANG UTAMA",
  "MENTAWAI",
  "TAPUS",
  "ALAHAN PANJANG",
  "JAKARTA",
  "PEKANBARU",
  "BANDUNG",
  "SYARIAH PADANG",
  "SYARIAH PAYAKUMBUH",
  "SYARIAH BUKITTINGGI",
  "SYARIAH BATUSANGKAR",
  "PADANG PANJANG",
];

type CpTipe = "pic" | "wag";

export function WorkstationForm() {
  const [daftarCabang, setDaftarCabang] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/workstation")
      .then((res) => res.json())
      .then((data) => {
        if (data.items && data.items.length > 0) {
          setDaftarCabang(data.items.map((item: { namaCabang: string }) => item.namaCabang));
        } else {
          setDaftarCabang(DAFTAR_CABANG);
        }
      })
      .catch((err) => {
        console.error("Gagal memuat cabang:", err);
        setDaftarCabang(DAFTAR_CABANG);
      });
  }, []);

  // Input Awal Workstation
  const [wsCabang, setWsCabang] = useState("");
  const [wsTanggalMasuk, setWsTanggalMasuk] = useState("");
  const [wsNoSurat, setWsNoSurat] = useState("");
  const [wsMerekKomputer, setWsMerekKomputer] = useState("");
  const [wsCapem, setWsCapem] = useState("");
  const [wsKelengkapan, setWsKelengkapan] = useState("");
  const [wsSnKomputer, setWsSnKomputer] = useState("");
  const [wsKerusakan, setWsKerusakan] = useState("");

  // Field Tiket/CP & Kegiatan
  const [cpTipe, setCpTipe] = useState<CpTipe>("pic");
  const [cpNama, setCpNama] = useState("");
  const [cpTelp, setCpTelp] = useState("");
  const [kegiatan, setKegiatan] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState<string | null>(null);

  function resetForm() {
    setWsCabang("");
    setWsTanggalMasuk("");
    setWsNoSurat("");
    setWsMerekKomputer("");
    setWsCapem("");
    setWsKelengkapan("");
    setWsSnKomputer("");
    setWsKerusakan("");
    setCpTipe("pic");
    setCpNama("");
    setCpTelp("");
    setKegiatan("");
    setError("");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    // Validasi input wajib
    if (!wsCabang) return setError("Cabang wajib dipilih.");
    if (!wsTanggalMasuk) return setError("Tanggal Masuk wajib diisi.");
    if (!wsNoSurat.trim()) return setError("Nomor Surat wajib diisi.");
    if (!wsMerekKomputer.trim()) return setError("Merek Komputer wajib diisi.");
    if (!wsKelengkapan.trim()) return setError("Kelengkapan wajib diisi.");
    if (!wsSnKomputer.trim()) return setError("SN Komputer wajib diisi.");
    if (!wsKerusakan.trim()) return setError("Kerusakan wajib diisi.");

    if (cpTipe === "pic" && (!cpNama.trim() || !cpTelp.trim()))
      return setError("No PIC wajib mengisi nama dan nomor telepon.");
    if (cpTipe === "wag" && !cpNama.trim()) return setError("Nama WAG wajib diisi.");
    if (!kegiatan.trim()) return setError("Kegiatan penanganan pertama wajib diisi.");

    setSubmitting(true);
    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kategori: "workstation",
          wsCabang,
          wsTanggalMasuk,
          wsNoSurat,
          wsMerekKomputer,
          wsCapem: wsCapem.trim() || undefined,
          wsKelengkapan,
          wsSnKomputer,
          wsKerusakan,
          cpTipe,
          cpNama,
          cpTelp: cpTipe === "pic" ? cpTelp : "",
          kegiatan,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gagal membuka tiket.");
        return;
      }
      setCreated(data.item.noTiket);
      resetForm();
    } catch {
      setError("Terjadi kesalahan jaringan.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-3xl space-y-4">
      <Modal
        open={Boolean(created)}
        onClose={() => setCreated(null)}
        title=""
        size="sm"
      >
        <div className="flex flex-col items-center justify-center text-center p-4">
          <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center text-green-600 mb-4 animate-bounce">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">Tiket Berhasil Dibuka!</h3>
          <p className="text-sm text-gray-500 mb-4">
            Tiket Workstation berhasil dibuat dengan nomor seri tiket:
            <span className="block mt-2 font-bold font-mono text-xl text-green-700 bg-green-50 px-3 py-1.5 rounded-md border border-green-100">{created}</span>
          </p>
          <Button onClick={() => setCreated(null)} className="w-full">
            Tutup &amp; Buat Tiket Lain
          </Button>
        </div>
      </Modal>

      <Card padding="lg">
        <form onSubmit={submit} className="space-y-6">
          <div className="border-b border-gray-100 pb-3">
            <h2 className="text-base font-semibold text-gray-900">1. Data Barang Workstation</h2>
            <p className="text-xs text-gray-500">Isi detail lengkap perangkat workstation yang rusak.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Cabang"
              required
              value={wsCabang}
              onChange={(e) => setWsCabang(e.target.value)}
            >
              <option value="">— Pilih Cabang —</option>
              {daftarCabang.map((cabang) => (
                <option key={cabang} value={cabang}>
                  {cabang}
                </option>
              ))}
            </Select>

            <div className="flex flex-col gap-1">
              <label htmlFor="ws-tanggal-masuk" className="text-sm font-medium text-gray-700">
                Tanggal Masuk <span className="text-red-500">*</span>
              </label>
              <input
                id="ws-tanggal-masuk"
                type="datetime-local"
                required
                value={wsTanggalMasuk}
                onChange={(e) => setWsTanggalMasuk(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Nomor Surat"
              required
              value={wsNoSurat}
              onChange={(e) => setWsNoSurat(e.target.value)}
              placeholder="cth: SR/00/XX/XXX/00-2026"
            />
            <Input
              label="Merek Komputer"
              required
              value={wsMerekKomputer}
              onChange={(e) => setWsMerekKomputer(e.target.value)}
              placeholder="cth: Lenovo AIO, dsb"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Cabang Pembantu / Capem (opsional)"
              value={wsCapem}
              onChange={(e) => setWsCapem(e.target.value)}
              placeholder="cth: UNAND, dsb"
            />
            <Input
              label="Kelengkapan"
              required
              value={wsKelengkapan}
              onChange={(e) => setWsKelengkapan(e.target.value)}
              placeholder="cth: Adaptor, kabel, dus, dsb"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="SN Komputer"
              required
              value={wsSnKomputer}
              onChange={(e) => setWsSnKomputer(e.target.value)}
              placeholder="Nomor seri mesin / perangkat..."
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="ws-kerusakan" className="text-sm font-medium text-gray-700">
              Kerusakan <span className="text-red-500">*</span>
            </label>
            <textarea
              id="ws-kerusakan"
              required
              rows={2}
              value={wsKerusakan}
              onChange={(e) => setWsKerusakan(e.target.value)}
              placeholder="Jelaskan detail kerusakan komputer..."
              className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
            />
          </div>

          <div className="border-b border-gray-100 pb-3 pt-2">
            <h2 className="text-base font-semibold text-gray-900">2. Informasi Kontak & Penanganan</h2>
            <p className="text-xs text-gray-500">Detail contact person pelapor dan tindakan pertama.</p>
          </div>

          {/* Contact Person */}
          <div>
            <label className="text-sm font-medium text-gray-700">
              Contact Person <span className="text-red-500">*</span>
            </label>
            <div className="mt-1.5 flex gap-4">
              {([
                ["pic", "No PIC"],
                ["wag", "WAG (WhatsApp Group)"],
              ] as [CpTipe, string][]).map(([val, label]) => (
                <label
                  key={val}
                  className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="cpTipe"
                    checked={cpTipe === val}
                    onChange={() => setCpTipe(val)}
                    className="accent-primary"
                  />
                  {label}
                </label>
              ))}
            </div>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {cpTipe === "pic" ? (
                <>
                  <Input
                    label="Nama PIC"
                    required
                    value={cpNama}
                    onChange={(e) => setCpNama(e.target.value)}
                  />
                  <Input
                    label="Nomor Telepon"
                    required
                    value={cpTelp}
                    onChange={(e) => setCpTelp(e.target.value)}
                    placeholder="08xxxxxxxxxx"
                  />
                </>
              ) : (
                <Input
                  label="Nama WAG"
                  required
                  value={cpNama}
                  onChange={(e) => setCpNama(e.target.value)}
                  placeholder="cth. WAG IT Support"
                />
              )}
            </div>
          </div>

          {/* Kegiatan pertama */}
          <div className="flex flex-col gap-1">
            <label
              htmlFor="kegiatan-ws"
              className="text-sm font-medium text-gray-700"
            >
              Kegiatan Penanganan Pertama <span className="text-red-500">*</span>
            </label>
            <textarea
              id="kegiatan-ws"
              required
              rows={3}
              value={kegiatan}
              onChange={(e) => setKegiatan(e.target.value)}
              placeholder="cth: Menerima barang komputer rusak, melakukan pendataan awal dan kelengkapan..."
              className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 bg-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
            />
            <p className="text-xs text-gray-500">
              Timestamp dicatat otomatis saat tiket dibuka.
            </p>
          </div>

          {error && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2"
            >
              {error}
            </motion.p>
          )}

          <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
            <Button type="button" variant="secondary" onClick={resetForm}>
              Reset
            </Button>
            <Button type="submit" loading={submitting}>
              <TicketPlus className="w-4 h-4" /> Buka Tiket Workstation
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
