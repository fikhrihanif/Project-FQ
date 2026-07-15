import {
  LayoutDashboard,
  Activity,
  CalendarRange,
  FileBarChart2,
  Settings,
  ShieldCheck,
  Users,
  FolderOpen,
  MapPin,
  type LucideIcon,
} from "lucide-react";
import type { Role } from "@/lib/roles";

export type { Role };

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  description: string;
  /** Role yang boleh mengakses menu ini. Kosong = semua role login. */
  roles?: Role[];
  /** True bila href adalah URL eksternal (dibuka di tab baru). */
  external?: boolean;
  /** Sub-menu items (collapsible). Jika ada, href item ini tidak navigable. */
  children?: Omit<NavItem, "children">[];
}

export const NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    description: "Ringkasan & status open tiket workstation",
  },
  {
    label: "Daily Monitoring",
    href: "/daily-monitoring",
    icon: Activity,
    description: "Semua tiket workstation aktif",
    roles: ["user"],
  },
  {
    label: "Weekly Monitoring",
    href: "/weekly-monitoring",
    icon: CalendarRange,
    description: "Riwayat tiket workstation (read-only)",
  },
  {
    label: "Supervisi",
    href: "/supervisi",
    icon: ShieldCheck,
    description: "Tinjau & setujui tiket workstation selesai",
    roles: ["supervisi"],
  },
  {
    label: "Input Tiket",
    href: "/input-tiket",
    icon: FolderOpen,
    description: "Input tiket kerusakan workstation",
    roles: ["user"],
  },
  {
    label: "Rekap Laporan",
    href: "/rekap-laporan",
    icon: FileBarChart2,
    description: "Download rekap laporan workstation",
  },
  {
    label: "Master Cabang",
    href: "/master-cabang",
    icon: MapPin,
    description: "Master data cabang Bank Nagari",
    roles: ["superadmin"],
  },
  {
    label: "Manajemen Akun",
    href: "/manajemen-akun",
    icon: Users,
    description: "Tambah & ubah akun User/Supervisi",
    roles: ["superadmin"],
  },
  {
    label: "Setting",
    href: "/setting",
    icon: Settings,
    description: "Profil dan password",
  },
];

export const APP_NAME = "Nagari Workstation Monitor";
export const APP_SUBTITLE = "Sistem Pemantauan Gangguan Workstation";
export const BANK_NAME = "Bank Nagari";
