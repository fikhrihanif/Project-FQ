"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Table,
  TableHead,
  TableBody,
  Th,
  Td,
} from "@/components/ui/Table";
import { Modal } from "@/components/ui/Modal";
import { ServerOff, Check, LogOut, Loader2, ZoomIn, Image as ImageIcon } from "lucide-react";
import type { ServerLog } from "./TambahLogModal";
import { useState } from "react";

interface LogServerTableProps {
  logs: ServerLog[];
  loading: boolean;
  currentUserRole: string;
  onExit: (id: string) => Promise<void>;
  onApprove: (id: string) => Promise<void>;
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function FotoThumbnail({
  fotoUrl,
  nama,
  onClick,
}: {
  fotoUrl: string;
  nama: string;
  onClick: (url: string) => void;
}) {
  const [imgError, setImgError] = useState(false);

  const displayUrl = fotoUrl.startsWith("/uploads/")
    ? `/api/uploads/${fotoUrl.replace("/uploads/", "")}`
    : fotoUrl;

  if (imgError) {
    return (
      <div
        className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-md border border-gray-200 text-[10px] text-gray-400 font-medium"
        title="File foto fisik terhapus saat Docker di-reset"
      >
        <ImageIcon className="w-3 h-3 text-gray-400 shrink-0" />
        <span>Foto Reset</span>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onClick(displayUrl)}
      className="group relative inline-block rounded-lg overflow-hidden border border-gray-200 shadow-sm hover:border-primary transition-all cursor-pointer"
      title="Klik untuk memperbesar foto"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={displayUrl}
        alt={`Foto ${nama}`}
        onError={() => setImgError(true)}
        className="w-10 h-10 object-cover group-hover:scale-110 transition-transform duration-200"
      />
      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
        <ZoomIn className="w-4 h-4 text-white" />
      </div>
    </button>
  );
}

export function LogServerTable({
  logs,
  loading,
  currentUserRole,
  onExit,
  onApprove,
}: LogServerTableProps) {
  const [actionId, setActionId] = useState<string | null>(null);
  const [previewFoto, setPreviewFoto] = useState<{ url: string; nama: string } | null>(null);

  async function handleExitClick(id: string) {
    setActionId(id);
    try {
      await onExit(id);
    } finally {
      setActionId(null);
    }
  }

  async function handleApproveClick(id: string) {
    setActionId(id);
    try {
      await onApprove(id);
    } finally {
      setActionId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-400">Memuat data...</p>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400"
      >
        <ServerOff className="w-10 h-10 text-gray-300" />
        <p className="text-sm font-medium">Belum ada log akses pada periode ini.</p>
        <p className="text-xs">Gunakan tombol &quot;Tambah Log&quot; untuk mencatat akses baru.</p>
      </motion.div>
    );
  }

  return (
    <>
      <Table>
        <TableHead>
          <tr>
            <Th className="w-8">No</Th>
            <Th>Nama Orang</Th>
            <Th>Instansi</Th>
            <Th>PIC Pendamping</Th>
            <Th>Keperluan</Th>
            <Th className="text-center">Waktu Masuk</Th>
            <Th className="text-center">Waktu Keluar</Th>
            <Th className="text-center">Foto</Th>
            <Th>Dicatat Oleh</Th>
            <Th className="text-center">Mengetahui (Supervisi)</Th>
          </tr>
        </TableHead>
        <TableBody>
          <AnimatePresence initial={false}>
            {logs.map((log, idx) => (
              <motion.tr
                key={log.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2, delay: idx * 0.03 }}
                whileHover={{ y: -2, scale: 1.005, backgroundColor: "#f8fafc", zIndex: 10 }}
                className="border-b border-gray-100 hover:shadow-sm transition-all duration-100 relative cursor-pointer"
              >
                {/* No */}
                <Td className="text-gray-400 font-mono text-xs !align-middle">{idx + 1}</Td>

                {/* Nama Orang */}
                <Td className="font-semibold text-gray-900 whitespace-nowrap !align-middle">{log.namaOrang}</Td>

                {/* Instansi */}
                <Td className="font-medium text-gray-700 whitespace-nowrap !align-middle">{log.instansi || "-"}</Td>

                {/* PIC Pendamping */}
                <Td className="font-medium text-gray-700 whitespace-nowrap !align-middle">{log.namaPic || "-"}</Td>

                {/* Keperluan */}
                <Td className="text-gray-500 max-w-[160px] truncate !align-middle" title={log.keperluan ?? "-"}>
                  {log.keperluan ?? <span className="text-gray-300">—</span>}
                </Td>

                {/* Waktu Masuk */}
                <Td className="text-center whitespace-nowrap !align-middle">
                  <div className="inline-flex items-center gap-1.5 text-xs text-gray-700 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                    {formatDateTime(log.waktuAkses)}
                  </div>
                </Td>

                {/* Waktu Keluar */}
                <Td className="text-center whitespace-nowrap !align-middle">
                  {log.waktuKeluar ? (
                    <div className="inline-flex items-center gap-1.5 text-xs text-gray-700 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                      {formatDateTime(log.waktuKeluar)}
                    </div>
                  ) : currentUserRole !== "supervisi" ? (
                    <button
                      type="button"
                      disabled={actionId !== null}
                      onClick={() => handleExitClick(log.id)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 hover:bg-amber-100 active:bg-amber-200 text-amber-700 border border-amber-200 rounded-lg text-xs font-semibold shadow-sm transition-all duration-150 disabled:opacity-50"
                    >
                      {actionId === log.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <LogOut className="w-3 h-3" />
                      )}
                      Keluar
                    </button>
                  ) : (
                    <span className="text-xs text-gray-400 italic">Belum keluar</span>
                  )}
                </Td>

                {/* Foto Thumbnail + Popup Modal */}
                <Td className="text-center !align-middle">
                  {log.fotoUrl ? (
                    <FotoThumbnail
                      fotoUrl={log.fotoUrl}
                      nama={log.namaOrang}
                      onClick={(url) => setPreviewFoto({ url, nama: log.namaOrang })}
                    />
                  ) : (
                    <span className="text-gray-300 text-xs">—</span>
                  )}
                </Td>

                {/* Dicatat Oleh */}
                <Td className="text-gray-500 !align-middle">
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-700">{log.pencatat.nama}</span>
                    <span className="text-xs text-gray-400">@{log.pencatat.username}</span>
                  </div>
                </Td>

                {/* Mengetahui */}
                <Td className="text-center whitespace-nowrap !align-middle">
                  {log.statusApproval === "approved" ? (
                    <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-green-700 bg-green-50/50 border border-green-200 px-2 py-0.5 rounded-full" title={`Disetujui oleh @${log.approver?.username}`}>
                      <Check className="w-3 h-3 text-green-600 shrink-0" />
                      Mengetahui {log.approver ? `(${log.approver.nama})` : ""}
                    </div>
                  ) : (currentUserRole === "supervisi" || currentUserRole === "superadmin") ? (
                    <button
                      type="button"
                      disabled={actionId !== null}
                      onClick={() => handleApproveClick(log.id)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white rounded-lg text-xs font-semibold shadow-sm transition-all duration-150 disabled:opacity-50"
                    >
                      {actionId === log.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Check className="w-3 h-3" />
                      )}
                      Setujui
                    </button>
                  ) : (
                    <div className="inline-flex items-center gap-1.5 text-xs text-gray-400 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-300 shrink-0 animate-pulse" />
                      Menunggu Approval
                    </div>
                  )}
                </Td>
              </motion.tr>
            ))}
          </AnimatePresence>
        </TableBody>
      </Table>

      {/* Modal Preview Foto Full HD */}
      <Modal
        open={Boolean(previewFoto)}
        onClose={() => setPreviewFoto(null)}
        title={`Foto Akses: ${previewFoto?.nama ?? ""}`}
        size="md"
      >
        {previewFoto && (
          <div className="space-y-4">
            <div className="rounded-2xl overflow-hidden bg-black flex items-center justify-center border border-gray-100 max-h-[70vh]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewFoto.url}
                alt={previewFoto.nama}
                className="w-full max-h-[70vh] object-contain"
              />
            </div>
            <div className="flex justify-between items-center text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <ImageIcon className="w-3.5 h-3.5" /> Bukti foto kunjungan ruang server
              </span>
              <a
                href={previewFoto.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline font-semibold"
              >
                Buka Ukuran Penuh ↗
              </a>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
