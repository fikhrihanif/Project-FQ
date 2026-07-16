# Fitur: Log Server — Sistem Monitoring Akses Ruang Server

## Ringkasan

Menambahkan menu baru **"Log Server"** yang diposisikan tepat di atas menu "Setting" pada sidebar navigasi.  
Fitur ini khusus untuk role **`user`** (Petugas IT Support) dan `superadmin`.

Fungsi utamanya adalah mencatat dan menampilkan **siapa saja yang masuk/keluar ruang server** beserta opsi foto dari kamera (upload manual), dengan tampilan rekap per hari, per minggu, dan total.

---

## Desain Fitur

### Alur Kerja
1. Petugas membuka menu "Log Server"
2. Petugas mencatat **entry baru** (akses masuk/keluar) via form modal
3. Data tersimpan ke database
4. Halaman menampilkan tabel log dengan filter: **Harian / Mingguan / Total**
5. Opsional: foto kamera dapat di-upload per entri

### Struktur Halaman
- **Header**: Judul + tombol "Tambah Log" (CTA)
- **Tab Filter**: Harian | Mingguan | Total
- **Summary Cards** (ringkasan di atas tabel):
  - Total Akses Hari Ini
  - Total Masuk Hari Ini
  - Total Keluar Hari Ini
  - Total Orang Berbeda
- **Tabel Log**: Waktu | Nama | Keperluan | Jenis (Masuk/Keluar) | Foto | Dicatat Oleh

---

## Proposed Changes

### 1. Database (Prisma Schema)

#### [MODIFY] schema.prisma
Tambah model baru `ServerAccessLog`:

```prisma
model ServerAccessLog {
  id          String   @id @default(cuid())
  namaOrang   String   @map("nama_orang")
  keperluan   String?
  jenisAkses  String   @map("jenis_akses")  // "masuk" | "keluar"
  waktuAkses  DateTime @default(now()) @map("waktu_akses")
  fotoUrl     String?  @map("foto_url")     // opsional, hasil upload kamera
  catatanOleh String   @map("catatan_oleh") // userId yang mencatat
  keterangan  String?
  createdAt   DateTime @default(now()) @map("created_at")

  pencatat    User     @relation("LogPencatat", fields: [catatanOleh], references: [id])

  @@map("server_access_logs")
}
```

Tambah relasi balik ke model `User`:
```prisma
serverLogs  ServerAccessLog[] @relation("LogPencatat")
```

#### [NEW] Migration SQL

---

### 2. Constants (Sidebar)

#### [MODIFY] lib/constants.ts
- Import ikon `ServerCog` dari lucide-react
- Tambah nav item "Log Server" dengan `roles: ["user", "superadmin"]`, posisi tepat sebelum "Setting"

---

### 3. API Routes

#### [NEW] app/api/server-log/route.ts
- **GET** — query semua log, support query param `filter=harian|mingguan|semua`
- **POST** — tambah entry baru, auto-isi `catatanOleh` dari session

#### [NEW] app/api/server-log/upload/route.ts
- **POST** — upload foto per entri (sama polanya dengan upload TTD/foto profil yang ada)

---

### 4. Halaman (App Route)

#### [NEW] app/(app)/log-server/page.tsx
- Server Component, fetch session untuk validasi role
- Render `LogServerClient`

#### [NEW] components/log-server/LogServerClient.tsx
- Client Component utama
- State: tab aktif (harian/mingguan/semua), list log, modal buka/tutup
- Fetch ke `/api/server-log?filter=...`

#### [NEW] components/log-server/LogServerTable.tsx
- Komponen tabel log, pakai `Table` UI yang sudah ada

#### [NEW] components/log-server/TambahLogModal.tsx
- Form modal: Nama, Keperluan, Jenis Akses (Masuk/Keluar), Waktu (default now), Upload Foto, Keterangan
- Pakai komponen `Modal`, `Input`, `Select`, `Button` yang sudah ada

#### [NEW] components/log-server/SummaryCards.tsx
- 4 kartu statistik ringkasan menggunakan komponen `Card` yang ada

---

## Gaya Visual
- Konsisten dengan sistem: warna `primary` (biru Bank Nagari) + aksen `accent` (emas)
- Font: Inter / Plus Jakarta Sans (sudah di-import)
- Badge `jenisAkses`: **Masuk** = `variant="success"`, **Keluar** = `variant="warning"`
- Animasi: `motion.div` dari Framer Motion untuk table rows dan modal
- Tab filter mengikuti pola desain kartu/tab yang ada di weekly-monitoring

---

## Verification Plan

### Automated
- `npm run build` — pastikan tidak ada TypeScript error

### Manual
1. Login sebagai `user` (mis. `mtr1`) → menu "Log Server" muncul di sidebar
2. Login sebagai `supervisi` → menu "Log Server" **tidak muncul**
3. Tambah log masuk → data muncul di tabel
4. Tab Harian/Mingguan/Semua berfungsi sebagai filter
5. Upload foto opsional berfungsi
6. Tampilan responsive dan animasi berjalan mulus
