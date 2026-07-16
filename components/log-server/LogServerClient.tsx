"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, RefreshCw, Database, CalendarRange } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";
import { SummaryCards } from "./SummaryCards";
import { LogServerTable } from "./LogServerTable";
import { TambahLogModal, type ServerLog } from "./TambahLogModal";

type FilterType = "harian" | "mingguan" | "bulanan" | "semua" | "custom";

function getLocalDateString(date: Date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

interface LogServerClientProps {
  currentUserNama: string;
  currentUserRole: string;
  currentUserId: string;
}

export function LogServerClient({
  currentUserNama,
  currentUserRole,
  currentUserId: _currentUserId,
}: LogServerClientProps) {
  const [filter, setFilter] = useState<FilterType>("harian");
  const [logs, setLogs] = useState<ServerLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const [periodDropdownOpen, setPeriodDropdownOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // State untuk filter rentang waktu custom
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return getLocalDateString(d);
  });
  const [endDate, setEndDate] = useState(() => getLocalDateString(new Date()));

  const fetchLogs = useCallback(async (f: FilterType, start?: string, end?: string) => {
    setLoading(true);
    try {
      let url = `/api/server-log?filter=${f}`;
      if (f === "custom" && start && end) {
        url += `&startDate=${start}&endDate=${end}`;
      }
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setLogs(data.logs ?? []);
      setLastRefresh(new Date());
    } catch {
      // tetap gunakan data lama jika error
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch log ketika filter berubah
  useEffect(() => {
    fetchLogs(filter, startDate, endDate);
  }, [filter, startDate, endDate, fetchLogs]);

  function handleFilterChange(f: FilterType) {
    if (f === filter) return;
    setFilter(f);
  }

  function showToast(msg: string) {
    setToastMessage(msg);
    // Auto-dismiss after 4 seconds
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 4000);
  }

  function handleLogAdded(log: ServerLog) {
    setLogs((prev) => [log, ...prev]);
    setLastRefresh(new Date());
    showToast("Log akses berhasil ditambahkan!");
  }

  // Aksi Keluar (Exit)
  async function handleExit(id: string) {
    try {
      const res = await fetch("/api/server-log", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "exit" }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error ?? "Gagal merekam waktu keluar.");
        return;
      }
      showToast("Waktu keluar berhasil direkam!");
      await fetchLogs(filter, startDate, endDate);
    } catch {
      alert("Terjadi kesalahan koneksi.");
    }
  }

  // Aksi Approval
  async function handleApprove(id: string) {
    try {
      const res = await fetch("/api/server-log", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "approve" }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error ?? "Gagal menyetujui log.");
        return;
      }
      showToast("Log akses berhasil disetujui!");
      await fetchLogs(filter, startDate, endDate);
    } catch {
      alert("Terjadi kesalahan koneksi.");
    }
  }

  const getPeriodBanner = () => {
    if (!mounted) return "Menampilkan data...";
    const today = new Date();
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const todayStr = today.toLocaleDateString('id-ID', options);
    
    if (filter === "harian") {
      return `Menampilkan Log Akses Hari Ini — ${todayStr}`;
    }
    if (filter === "mingguan") {
      const start = new Date();
      const day = start.getDay();
      const diff = start.getDate() - day + (day === 0 ? -6 : 1);
      start.setDate(diff);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      
      const startStr = start.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
      const endStr = end.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
      return `Menampilkan Log Akses Minggu Ini — ${startStr} s.d ${endStr}`;
    }
    if (filter === "bulanan") {
      const monthName = today.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
      return `Menampilkan Log Akses Bulan Ini — ${monthName}`;
    }
    if (filter === "custom") {
      const formatLocalStr = (dStr: string) => {
        const d = new Date(dStr);
        if (isNaN(d.getTime())) return dStr;
        return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
      };
      return `Menampilkan Rentang Waktu — ${formatLocalStr(startDate)} s.d ${formatLocalStr(endDate)}`;
    }
    return `Menampilkan Seluruh Riwayat Akses Server Room`;
  };

  const formatRefreshTime = (d: Date) => {
    if (!mounted) return "--:--:--";
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;
  };

  return (
    <div className="space-y-4">
      {/* ── Toolbar ─────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-gray-100 rounded-2xl p-4 shadow-card">
        {/* Tab Filter & Input Rentang Waktu */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center gap-1 bg-gray-50 border border-gray-200/50 rounded-xl p-1">
            {/* Dropdown Harian / Mingguan Custom */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setPeriodDropdownOpen(!periodDropdownOpen)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all duration-150 outline-none border-0 cursor-pointer bg-transparent",
                  filter === "harian" || filter === "mingguan" || filter === "bulanan"
                    ? "bg-primary text-white shadow-sm"
                    : "text-gray-500 hover:bg-surface-subtle hover:text-gray-800"
                )}
              >
                <span>
                  {filter === "harian"
                    ? "📅 Harian (Hari Ini)"
                    : filter === "mingguan"
                    ? "📅 Mingguan (Minggu Ini)"
                    : "📅 Bulanan (Bulan Ini)"}
                </span>
                <motion.span
                  animate={{ rotate: periodDropdownOpen ? 180 : 0 }}
                  transition={{ duration: 0.15 }}
                  className="inline-block text-[10px] ml-0.5"
                >
                  ▼
                </motion.span>
              </button>

              <AnimatePresence>
                {periodDropdownOpen && (
                  <>
                    {/* Backdrop to close click outside */}
                    <div className="fixed inset-0 z-40" onClick={() => setPeriodDropdownOpen(false)} />
                    
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      transition={{ duration: 0.15, ease: "easeOut" }}
                      className="absolute left-0 mt-1.5 w-56 rounded-xl bg-white border border-gray-100 shadow-card-lg p-1.5 z-50 flex flex-col gap-1"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          handleFilterChange("harian");
                          setPeriodDropdownOpen(false);
                        }}
                        className={cn(
                          "w-full text-left px-3 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5",
                          filter === "harian"
                            ? "bg-primary-50 text-primary"
                            : "text-gray-600 hover:bg-gray-50"
                        )}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                        Harian (Hari Ini)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          handleFilterChange("mingguan");
                          setPeriodDropdownOpen(false);
                        }}
                        className={cn(
                          "w-full text-left px-3 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5",
                          filter === "mingguan"
                            ? "bg-primary-50 text-primary"
                            : "text-gray-600 hover:bg-gray-50"
                        )}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                        Mingguan (Minggu Ini)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          handleFilterChange("bulanan");
                          setPeriodDropdownOpen(false);
                        }}
                        className={cn(
                          "w-full text-left px-3 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5",
                          filter === "bulanan"
                            ? "bg-primary-50 text-primary"
                            : "text-gray-600 hover:bg-gray-50"
                        )}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                        Bulanan (Bulan Ini)
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Tab Rentang Waktu */}
            <button
              type="button"
              onClick={() => handleFilterChange("custom")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150",
                filter === "custom"
                  ? "bg-primary text-white shadow-sm font-semibold"
                  : "text-gray-500 hover:bg-surface-subtle hover:text-gray-800"
              )}
            >
              <CalendarRange className="w-3.5 h-3.5" />
              Rentang Waktu
            </button>

            {/* Tab Semua Data */}
            <button
              type="button"
              onClick={() => handleFilterChange("semua")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150",
                filter === "semua"
                  ? "bg-primary text-white shadow-sm font-semibold"
                  : "text-gray-500 hover:bg-surface-subtle hover:text-gray-800"
              )}
            >
              <Database className="w-3.5 h-3.5" />
              Semua Data
            </button>
          </div>

          {/* Form Date Range untuk custom filter */}
          {filter === "custom" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5"
            >
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Mulai</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="text-xs bg-transparent border-0 p-0 text-gray-700 font-semibold outline-none cursor-pointer"
                />
              </div>
              <span className="text-gray-300 text-xs">—</span>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Akhir</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="text-xs bg-transparent border-0 p-0 text-gray-700 font-semibold outline-none cursor-pointer"
                />
              </div>
            </motion.div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 justify-between md:justify-end w-full md:w-auto border-t md:border-t-0 pt-3 md:pt-0 border-gray-100">
          <div className="flex items-center gap-2">
            <p className="text-[11px] text-gray-400">
              Diperbarui: {formatRefreshTime(lastRefresh)}
            </p>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => fetchLogs(filter, startDate, endDate)}
              loading={loading}
              title="Refresh data"
              className="!px-2.5 !py-1 text-xs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </Button>
          </div>
          
          {/* Hanya Petugas IT Support (user) dan Superadmin yang boleh mengisi log */}
          {currentUserRole !== "supervisi" && (
            <Button
              size="sm"
              onClick={() => setModalOpen(true)}
              className="text-xs font-semibold"
            >
              <Plus className="w-4 h-4" />
              Tambah Log
            </Button>
          )}
        </div>
      </div>

      {/* ── Period Banner ─────────────────────────────────────── */}
      <motion.div
        key={filter + startDate + endDate}
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2 px-4 py-2.5 bg-primary-50/50 border border-primary-100 rounded-xl text-primary text-xs font-semibold"
      >
        <span className="flex h-2 w-2 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
        </span>
        {getPeriodBanner()}
      </motion.div>

      {/* ── Summary Cards ───────────────────────────────────────── */}
      <SummaryCards logs={logs} filter={filter} />

      {/* ── Tabel ───────────────────────────────────────────────── */}
      <Card padding="none">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Riwayat Akses</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {loading
                ? "Memuat..."
                : `${logs.length} entri ditemukan — ${
                    filter === "harian"
                      ? "hari ini"
                      : filter === "mingguan"
                      ? "minggu ini"
                      : filter === "bulanan"
                      ? "bulan ini"
                      : filter === "custom"
                      ? `rentang waktu (${startDate} s.d ${endDate})`
                      : "semua data"
                  }`}
            </p>
          </div>
          <span className="text-xs text-gray-300 hidden sm:block">
            Login sebagai: <span className="text-gray-500 font-semibold">{currentUserNama} ({currentUserRole})</span>
          </span>
        </div>
        <LogServerTable
          logs={logs}
          loading={loading}
          currentUserRole={currentUserRole}
          onExit={handleExit}
          onApprove={handleApprove}
        />
      </Card>

      {/* ── Modal ───────────────────────────────────────────────── */}
      <TambahLogModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={handleLogAdded}
      />

      {/* ── Toast Notification ──────────────────────────────────── */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 bg-green-600 border border-green-500/20 text-white px-4.5 py-3 rounded-2xl shadow-xl font-semibold text-sm"
          >
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-white/25 text-white font-bold text-xs">✓</span>
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
