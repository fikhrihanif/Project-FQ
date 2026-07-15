"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Pencil,
  CheckCircle2,
  Trash2,
  Clock,
  Monitor,
  Send,
  AlertTriangle,
} from "lucide-react";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { cn } from "@/lib/cn";
import { fmtDateTime, toWibInputValue, wibInputToISO } from "@/lib/format";
import type { TicketDetail } from "@/lib/ticketQueries";

interface Props {
  initialTicket: TicketDetail;
  role: "superadmin" | "user" | "supervisi";
  currentUserId: string;
  backHref?: string;
  backLabel?: string;
  readOnly?: boolean;
}

export function TicketDetailClient({
  initialTicket,
  role,
  currentUserId,
  backHref = "/daily-monitoring",
  backLabel = "Kembali ke Daily Monitoring",
  readOnly = false,
}: Props) {
  const router = useRouter();
  const [ticket, setTicket] = useState<TicketDetail>(initialTicket);

  const canMutate =
    !readOnly &&
    role !== "supervisi" &&
    (role === "superadmin" || ticket.ownerId === currentUserId);
  
  const isSelesai = ticket.status === "selesai";

  // --- Kegiatan baru ---
  const [kegiatan, setKegiatan] = useState("");
  const [savingKegiatan, setSavingKegiatan] = useState(false);
  const [kegiatanErr, setKegiatanErr] = useState("");

  // --- Edit Detail ---
  const [editOpen, setEditOpen] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editErr, setEditErr] = useState("");
  const [editForm, setEditForm] = useState({
    jenisGangguan: ticket.jenisGangguan || "",
    sumberPenyebab: ticket.sumberPenyebab || "",
    metodePenanganan: ticket.metodePenanganan || "",
    wsVendor: ticket.wsVendor || "",
    wsTglKeVendor: ticket.wsTglKeVendor ? toWibInputValue(ticket.wsTglKeVendor) : "",
    wsTglSelesaiVendor: ticket.wsTglSelesaiVendor ? toWibInputValue(ticket.wsTglSelesaiVendor) : "",
    wsTglKembaliKeCabang: ticket.wsTglKembaliKeCabang ? toWibInputValue(ticket.wsTglKembaliKeCabang) : "",
    wsPicTerima: ticket.wsPicTerima || "",
    keterangan: ticket.keterangan || "",
  });

  // --- Hapus & Close ---
  const [delOpen, setDelOpen] = useState(false);
  const [delBusy, setDelBusy] = useState(false);
  const [closeOpen, setCloseOpen] = useState(false);
  const [closeBusy, setCloseBusy] = useState(false);
  const [actionErr, setActionErr] = useState("");

  async function reload() {
    try {
      const res = await fetch(`/api/tickets/${ticket.id}`);
      if (res.ok) {
        const data = await res.json();
        setTicket(data.item);
      }
    } catch (e) {
      console.error("Gagal memuat ulang tiket:", e);
    }
  }

  async function submitKegiatan(e: React.FormEvent) {
    e.preventDefault();
    setKegiatanErr("");
    if (!kegiatan.trim()) return setKegiatanErr("Teks kegiatan wajib diisi.");
    setSavingKegiatan(true);
    try {
      const res = await fetch(`/api/tickets/${ticket.id}/activities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teks: kegiatan }),
      });
      const data = await res.json();
      if (!res.ok) {
        setKegiatanErr(data.error ?? "Gagal menyimpan kegiatan.");
        return;
      }
      setKegiatan("");
      await reload();
    } catch {
      setKegiatanErr("Terjadi kesalahan jaringan.");
    } finally {
      setSavingKegiatan(false);
    }
  }

  async function submitEdit(e: React.FormEvent) {
    e.preventDefault();
    setEditErr("");
    setSavingEdit(true);
    try {
      const res = await fetch(`/api/tickets/${ticket.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...editForm,
          wsTglKeVendor: editForm.wsTglKeVendor ? wibInputToISO(editForm.wsTglKeVendor) : null,
          wsTglSelesaiVendor: editForm.wsTglSelesaiVendor ? wibInputToISO(editForm.wsTglSelesaiVendor) : null,
          wsTglKembaliKeCabang: editForm.wsTglKembaliKeCabang ? wibInputToISO(editForm.wsTglKembaliKeCabang) : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setEditErr(data.error ?? "Gagal menyimpan detail.");
        return;
      }
      setEditOpen(false);
      await reload();
    } catch {
      setEditErr("Terjadi kesalahan jaringan.");
    } finally {
      setSavingEdit(false);
    }
  }

  async function confirmClose() {
    setActionErr("");
    setCloseBusy(true);
    try {
      const res = await fetch(`/api/tickets/${ticket.id}/close`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        setActionErr(data.error ?? "Gagal menutup tiket.");
        return;
      }
      setCloseOpen(false);
      await reload();
    } catch {
      setActionErr("Terjadi kesalahan jaringan.");
    } finally {
      setCloseBusy(false);
    }
  }

  async function confirmDelete() {
    setActionErr("");
    setDelBusy(true);
    try {
      const res = await fetch(`/api/tickets/${ticket.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        setActionErr(data.error ?? "Gagal menghapus tiket.");
        return;
      }
      setDelOpen(false);
      router.push(backHref);
    } catch {
      setActionErr("Terjadi kesalahan jaringan.");
    } finally {
      setDelBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* Header back link */}
      <div>
        <button
          onClick={() => router.push(backHref)}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> {backLabel}
        </button>
      </div>

      {/* Rincian tiket utama */}
      <Card padding="lg">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="grid place-items-center w-12 h-12 rounded-xl bg-primary-50 text-primary shrink-0 mt-1">
              <Monitor className="w-6 h-6" />
            </span>
            <div>
              <div className="flex items-center flex-wrap gap-2">
                <span className="font-mono text-xl font-bold text-gray-900">
                  {ticket.noTiket}
                </span>
                <Badge variant={isSelesai ? "success" : "warning"}>
                  {isSelesai ? "Selesai" : "Dalam Proses"}
                </Badge>
                <Badge variant={ticket.statusSupervisi === "approved" ? "success" : "neutral"}>
                  {ticket.statusSupervisi === "approved" ? "Diapprove Supervisi" : "Belum Diapprove"}
                </Badge>
              </div>
              <h1 className="mt-1 text-base font-semibold text-gray-900 leading-tight">
                {ticket.wsCabang} {ticket.wsCapem ? `(Capem ${ticket.wsCapem})` : ""}
              </h1>
              <p className="mt-0.5 text-sm text-gray-500">
                Merek: {ticket.wsMerekKomputer || "—"} · SN: {ticket.wsSnKomputer || "—"}
              </p>
            </div>
          </div>
          <div className="text-sm text-gray-500 sm:text-right space-y-0.5">
            <div>
              Petugas IT: <span className="font-medium text-gray-800">{ticket.ownerNama}</span>
            </div>
            <div className="flex items-center gap-1 sm:justify-end">
              <Clock className="w-3.5 h-3.5" /> Masuk IT: {fmtDateTime(ticket.wsTanggalMasuk)}
            </div>
            {ticket.waktuSelesai && (
              <div className="flex items-center gap-1 sm:justify-end text-green-700">
                <CheckCircle2 className="w-3.5 h-3.5" /> Selesai: {fmtDateTime(ticket.waktuSelesai)}
              </div>
            )}
          </div>
        </div>

        {/* Aksi */}
        {canMutate && (
          <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
              <Pencil className="w-4 h-4" /> Ubah Detail
            </Button>
            {!isSelesai && (
              <Button
                size="sm"
                onClick={() => {
                  setActionErr("");
                  setCloseOpen(true);
                }}
              >
                <CheckCircle2 className="w-4 h-4" /> Close Tiket
              </Button>
            )}
            <Button
              variant="danger"
              size="sm"
              className="ml-auto"
              onClick={() => {
                setActionErr("");
                setDelOpen(true);
              }}
            >
              <Trash2 className="w-4 h-4" /> Hapus Tiket
            </Button>
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Detail gangguan */}
        <div className="space-y-5 lg:col-span-1">
          <Card>
            <CardTitle className="mb-3">Detail Perangkat & Kerusakan</CardTitle>
            <dl className="space-y-2.5 text-sm">
              <Field label="No Surat Cabang" value={ticket.wsNoSurat} />
              <Field label="Kelengkapan" value={ticket.wsKelengkapan} />
              <Field label="Kerusakan" value={ticket.wsKerusakan} />
              <Field
                label="Kontak Pelapor"
                value={
                  ticket.cpTipe === "wag"
                    ? `WAG: ${ticket.cpNama}`
                    : `${ticket.cpNama} (${ticket.cpTelp || "—"})`
                }
              />
              <Field label="Jenis Gangguan" value={ticket.jenisGangguan} />
              <Field label="Sumber Penyebab" value={ticket.sumberPenyebab} />
              <Field label="Metode Penanganan" value={ticket.metodePenanganan} />
            </dl>
          </Card>

          <Card>
            <CardTitle className="mb-3">Penanganan Vendor</CardTitle>
            <dl className="space-y-2.5 text-sm">
              <Field label="Vendor" value={ticket.wsVendor} />
              <Field label="Tanggal ke Vendor" value={ticket.wsTglKeVendor ? fmtDateTime(ticket.wsTglKeVendor) : null} />
              <Field label="Selesai Vendor" value={ticket.wsTglSelesaiVendor ? fmtDateTime(ticket.wsTglSelesaiVendor) : null} />
              <Field label="Kembali ke Cabang" value={ticket.wsTglKembaliKeCabang ? fmtDateTime(ticket.wsTglKembaliKeCabang) : null} />
              <Field label="PIC Penerima" value={ticket.wsPicTerima} />
              <Field label="Keterangan" value={ticket.keterangan} />
            </dl>
          </Card>
        </div>

        {/* Kegiatan penanganan */}
        <Card className="lg:col-span-2">
          <CardTitle className="mb-1">Log Kronologi Penanganan</CardTitle>
          <p className="text-xs text-gray-500 mb-4">
            Catatan log aktivitas perbaikan. Entri baru akan ditambahkan di bagian bawah secara kronologis.
          </p>

          {canMutate && !isSelesai && (
            <form onSubmit={submitKegiatan} className="mb-5">
              <textarea
                rows={2}
                value={kegiatan}
                onChange={(e) => setKegiatan(e.target.value)}
                placeholder="Tulis perkembangan penanganan terbaru…"
                className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 bg-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
              />
              {kegiatanErr && <p className="mt-1 text-xs text-red-600">{kegiatanErr}</p>}
              <div className="mt-2 flex justify-end">
                <Button type="submit" size="sm" loading={savingKegiatan}>
                  <Send className="w-4 h-4" /> Simpan Kegiatan
                </Button>
              </div>
            </form>
          )}

          <ol className="relative border-l-2 border-gray-100 ml-2 space-y-4">
            {ticket.activities.map((a) => (
              <li key={a.id} className="ml-4 relative">
                <span className="absolute -left-[23px] mt-1.5 w-3 h-3 rounded-full bg-primary border-2 border-white" />
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span className="font-medium text-gray-700">{fmtDateTime(a.waktu)}</span>
                  <span>· {a.userNama}</span>
                </div>
                <p className="mt-1 text-sm text-gray-800 whitespace-pre-wrap">{a.teks}</p>
              </li>
            ))}
            {ticket.activities.length === 0 && (
              <li className="ml-4 text-sm text-gray-400">Belum ada kegiatan.</li>
            )}
          </ol>
        </Card>
      </div>

      {/* ---- Modal edit detail ---- */}
      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Ubah Detail & Klasifikasi Gangguan"
        size="lg"
      >
        <form onSubmit={submitEdit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Jenis Gangguan"
              value={editForm.jenisGangguan}
              onChange={(e) => setEditForm({ ...editForm, jenisGangguan: e.target.value })}
            />
            <Input
              label="Sumber Penyebab"
              value={editForm.sumberPenyebab}
              onChange={(e) => setEditForm({ ...editForm, sumberPenyebab: e.target.value })}
            />
            <Input
              label="Metode Penanganan"
              value={editForm.metodePenanganan}
              onChange={(e) => setEditForm({ ...editForm, metodePenanganan: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Vendor"
              value={editForm.wsVendor}
              onChange={(e) => setEditForm({ ...editForm, wsVendor: e.target.value })}
            />
            <div className="flex flex-col gap-1">
              <label htmlFor="edit-tgl-vendor" className="text-sm font-medium text-gray-700">Tanggal Kirim ke Vendor</label>
              <input
                id="edit-tgl-vendor"
                type="datetime-local"
                value={editForm.wsTglKeVendor}
                onChange={(e) => setEditForm({ ...editForm, wsTglKeVendor: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label htmlFor="edit-tgl-selesai-vendor" className="text-sm font-medium text-gray-700">Tanggal Selesai Vendor</label>
              <input
                id="edit-tgl-selesai-vendor"
                type="datetime-local"
                value={editForm.wsTglSelesaiVendor}
                onChange={(e) => setEditForm({ ...editForm, wsTglSelesaiVendor: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="edit-tgl-kembali" className="text-sm font-medium text-gray-700">Tanggal Kembali ke Cabang</label>
              <input
                id="edit-tgl-kembali"
                type="datetime-local"
                value={editForm.wsTglKembaliKeCabang}
                onChange={(e) => setEditForm({ ...editForm, wsTglKembaliKeCabang: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="PIC Penerima Cabang"
              value={editForm.wsPicTerima}
              onChange={(e) => setEditForm({ ...editForm, wsPicTerima: e.target.value })}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Keterangan Tambahan</label>
            <textarea
              rows={2}
              value={editForm.keterangan}
              onChange={(e) => setEditForm({ ...editForm, keterangan: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>

          {editErr && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">{editErr}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setEditOpen(false)}>
              Batal
            </Button>
            <Button type="submit" loading={savingEdit}>
              Simpan Perubahan
            </Button>
          </div>
        </form>
      </Modal>

      {/* ---- Modal close ---- */}
      <Modal open={closeOpen} onClose={() => setCloseOpen(false)} title="Tutup/Selesaikan Tiket?" size="sm">
        <p className="text-sm text-gray-600">
          Tiket akan ditandai <span className="font-semibold">Selesai</span>. Seterusnya tiket tinggal menunggu Approval dari pihak Supervisi.
        </p>
        {actionErr && <p className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">{actionErr}</p>}
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="secondary" onClick={() => setCloseOpen(false)}>
            Batal
          </Button>
          <Button loading={closeBusy} onClick={confirmClose}>
            <CheckCircle2 className="w-4 h-4" /> Ya, Selesaikan
          </Button>
        </div>
      </Modal>

      {/* ---- Modal hapus ---- */}
      <Modal open={delOpen} onClose={() => setDelOpen(false)} title="Hapus Tiket Workstation?" size="sm">
        <div className="flex items-start gap-2 text-sm text-gray-600">
          <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <p>
            Hapus tiket <span className="font-mono font-semibold text-gray-900">{ticket.noTiket}</span>?
            Tindakan ini permanen dan tidak bisa dibatalkan.
          </p>
        </div>
        {actionErr && <p className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">{actionErr}</p>}
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="secondary" onClick={() => setDelOpen(false)}>
            Batal
          </Button>
          <Button variant="danger" loading={delBusy} onClick={confirmDelete}>
            <Trash2 className="w-4 h-4" /> Hapus
          </Button>
        </div>
      </Modal>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-gray-500 shrink-0">{label}</dt>
      <dd className={cn("text-right text-gray-800 font-medium", !value && "text-gray-400 italic")}>
        {value || "—"}
      </dd>
    </div>
  );
}
