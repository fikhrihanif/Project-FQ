# Planning KP - Spesifikasi Aplikasi Sistem Pemantauan Gangguan Workstation (Nagari Workstation Monitor)

Dokumen ini merupakan panduan spesifikasi dan arsitektur bagi AI untuk merekonstruksi aplikasi sistem pemantauan gangguan dari awal dengan **hanya menyisakan fitur-fitur yang berkaitan dengan Workstation** (menghapus seluruh fitur ATM, Jaringan, Suhu AC/Server, dan alur Shift).

---

## 🚀 1. Stack Teknologi
- **Framework**: Next.js 15+ (App Router)
- **Styling**: Tailwind CSS & Vanilla CSS (Desain Premium & Modern dengan HSL color palette, Glassmorphism, dan Micro-animations)
- **Database ORM**: Prisma ORM
- **Database Engine**: PostgreSQL
- **Library Excel**: `exceljs` (untuk ekspor laporan rekap)
- **State Management & Icons**: React Hooks & Lucide Icons

---

## 👥 2. Role Pengguna & Autentikasi
Sistem memiliki 3 level hak akses (Role):
1. **Superadmin**:
   - Memiliki kontrol penuh atas seluruh sistem.
   - Dapat mengelola data master cabang workstation (CRUD).
   - Dapat mengelola akun pengguna (CRUD).
2. **User (Petugas/Teknisi)**:
   - Dapat menginput tiket workstation baru.
   - Dapat melihat dashboard, daily monitoring, dan weekly monitoring.
   - Dapat mengunduh rekap laporan workstation.
3. **Supervisi**:
   - Berhak melakukan **Approval (Persetujuan)** terhadap tiket workstation yang sudah selesai ditangani oleh teknisi.

---

## 🗄️ 3. Skema Database (Prisma Schema - Khusus Workstation)

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum Role {
  superadmin
  user
  supervisi
}

enum CpTipe {
  pic
  wag
}

enum TicketStatus {
  proses
  selesai
}

enum StatusSupervisi {
  belum
  approved
}

model User {
  id             String           @id @default(cuid())
  username       String           @unique
  nama           String
  role           Role             @default(user)
  passwordHash   String           @map("password_hash")
  fotoProfilUrl  String?          @map("foto_profil_url")
  ttdUrl         String?          @map("ttd_url")
  isAktif        Boolean          @default(true) @map("is_aktif")
  createdAt      DateTime         @default(now()) @map("created_at")
  ticketsOwned   Ticket[]         @relation("TicketOwner")
  activities     TicketActivity[]

  @@map("users")
}

model WorkstationMaster {
  id           String   @id @default(cuid())
  namaCabang   String   @map("nama_cabang")
  kodeKantor   String?  @unique @map("kode_kantor")
  lokasiKantor String?  @map("lokasi_kantor")
  tickets      Ticket[]

  @@map("workstation_master")
}

model Ticket {
  id                   String          @id @default(cuid())
  noTiket              String          @unique @map("no_tiket") // Format: WS-YYYY-NNNNN
  kategori             String          @default("workstation")
  waktuOpen            DateTime        @default(now()) @map("waktu_open")
  waktuSelesai         DateTime?       @map("waktu_selesai")
  cpTipe               CpTipe          @map("cp_tipe")
  cpNama               String          @map("cp_nama")
  cpTelp               String?         @map("cp_telp")
  jenisGangguan        String          @default("Kerusakan Perangkat") @map("jenis_gangguan")
  sumberPenyebab       String          @default("Workstation") @map("sumber_penyebab")
  metodePenanganan     String          @default("Penanganan Teknisi") @map("metode_penanganan")
  wsCabang             String          @map("ws_cabang") // Disimpan redundan berupa nama cabang untuk kestabilan report
  wsTanggalMasuk       DateTime        @map("ws_tanggal_masuk")
  wsNoSurat            String?         @map("ws_no_surat")
  wsMerekKomputer      String?         @map("ws_merek_komputer")
  wsCapem              String?         @map("ws_capem")
  wsKelengkapan        String?         @map("ws_kelengkapan")
  wsSnKomputer         String?         @map("ws_sn_komputer")
  wsKerusakan          String          @map("ws_kerusakan")
  wsTglKeVendor        DateTime?       @map("ws_tgl_ke_vendor")
  wsVendor             String?         @map("ws_vendor")
  wsTglSelesaiVendor   DateTime?       @map("ws_tgl_selesai_vendor")
  wsTglKembaliKeCabang DateTime?       @map("ws_tgl_kembali_ke_cabang")
  wsPicTerima          String?         @map("ws_pic_terima")
  status               TicketStatus    @default(proses)
  statusSupervisi      StatusSupervisi @default(belum) @map("status_supervisi")
  ownerUserId          String          @map("owner_user_id")
  keterangan           String?
  createdAt            DateTime        @default(now()) @map("created_at")

  owner       User               @relation("TicketOwner", fields: [ownerUserId], references: [id])
  activities  TicketActivity[]
  workstation WorkstationMaster? @relation(fields: [wsCabang], references: [namaCabang]) // Relasi opsional jika nama cabang sama

  @@map("tickets")
}

model TicketActivity {
  id        String   @id @default(cuid())
  ticketId  String   @map("ticket_id")
  userId    String   @map("user_id")
  waktu     DateTime @default(now())
  teks      String
  createdAt DateTime @default(now()) @map("created_at")

  ticket Ticket @relation(fields: [ticketId], references: [id], onDelete: Cascade)
  user   User   @relation(fields: [userId], references: [id])

  @@map("ticket_activities")
}
```

---

## 💻 4. Alur & Arsitektur Fitur Aplikasi

### 📊 A. Dashboard
- Menampilkan grafik dan widget metrik jumlah tiket workstation:
  - Jumlah total tiket workstation.
  - Jumlah tiket dalam proses penanganan.
  - Jumlah tiket selesai (sudah di-approve supervisi).
- Tidak menampilkan grafik suhu, SLA ATM, atau problem report jaringan.

### 📝 B. Input Tiket Workstation
- Form input ad-hoc untuk pendataan kerusakan unit PC/Workstation.
- **PENTING**: Alur ini **TIDAK memerlukan shift aktif**. Form bisa diakses kapan saja setelah login.
- Penomoran tiket dibuat acak & unik otomatis dengan prefix `WS-` (contoh: `WS-32F7A8E1`).
- Field input form mencakup:
  - Dropdown Cabang (diambil dinamis dari data master `WorkstationMaster`).
  - Unit Kerja / Capem.
  - Tanggal Masuk Unit ke IT.
  - No Surat Cabang.
  - Merek/Tipe Komputer.
  - Kelengkapan Perangkat.
  - Serial Number Komputer.
  - Deskripsi Kerusakan.
  - Kontak Person (Tipe: No PIC / WhatsApp Group).
  - Kegiatan penanganan pertama.
- **UI/UX Pop-up Notifikasi**: Setelah data berhasil ditambahkan, sistem tidak boleh menampilkan pesan notifikasi statis biasa di atas halaman. Sebagai gantinya, tampilkan sebuah **Pop-up Modal Notifikasi Sukses** yang profesional (memiliki animasi ikon centang hijau, teks informasi nomor tiket yang berhasil dibuat, dan tombol tutup/konfirmasi yang jelas) untuk memberikan kepastian visual yang nyaman bagi pengguna.

### 🔍 C. Daily Monitoring (Pemantauan Harian)
- Menampilkan seluruh daftar tiket workstation yang saat ini berstatus `proses`.
- Fitur pencarian tiket berdasarkan nomor tiket, kerusakan, merek, maupun nama cabang.
- Detail tiket menampilkan riwayat aktivitas/penanganan pertama.

### 📅 D. Weekly Monitoring (Riwayat Mingguan)
- Menampilkan riwayat seluruh tiket workstation (baik status `proses` maupun `selesai`).
- Filter pencarian berbasis:
  - Rentang tanggal (dari - sampai).
  - Pilihan cabang tertentu.
  - Status pengerjaan.

### 👔 E. Supervisi Workstation
- Menampilkan daftar tiket workstation yang berstatus `proses` dan `statusSupervisi = belum`.
- **Tampilan Ringkas (List View)**: Di halaman utama supervisi, baris tabel hanya menyajikan informasi judul/kolom utama saja (seperti No Tiket, Cabang, Tanggal Masuk, Merek, dan Status).
- **Detail Pekerjaan Ekspandabel / Modal**: Ketika salah satu baris tiket diklik, sistem akan menampilkan **Detail Pekerjaan secara lengkap** menggunakan modal pop-up interaktif (berisi: Merek, Serial Number, Kelengkapan Perangkat, Uraian Kerusakan lengkap, Kontak Person, Kegiatan Penanganan Pertama, serta Log Aktivitas) agar Supervisi dapat memeriksa detail pekerjaan secara menyeluruh sebelum menyetujuinya.
- **Aksi Approval**: Tombol **"Approve"** ditempatkan secara terhormat di dalam modal detail pekerjaan tersebut. Saat ditekan, tombol memicu request `POST` ke API `/api/tickets/[id]/approve-workstation` untuk menyetujui tiket secara instan. Tanda tangan digital Supervisi otomatis disematkan, dan pop-up notifikasi sukses yang interaktif langsung muncul di layar.

### 📥 F. Rekap Laporan Workstation
- Halaman unduh rekap laporan khusus dalam format file Excel (`.xlsx`).
- Input rentang tanggal (dari - sampai) dan tombol **"Download Rekap Laporan Workstation"**.
- Layout Excel yang di-generate menggunakan `exceljs` dengan struktur kolom:
  `No | No Tiket | Cabang | Capem / Unit | Tanggal Masuk | No Surat Cabang | Merek Komputer | Kelengkapan | Serial Number | Kerusakan | Tanggal ke Vendor | Vendor | Selesai Vendor | Kembali ke Cabang | PIC Terima | Status | Supervisi | Keterangan`
- Visual Excel mengikuti tema Bank Nagari (Header biru muda `FF83CAFF`, font bersih, ber-border tipis, fit-to-page, dan logo Bank Nagari di pojok kiri atas).

### 🛠️ G. Master Cabang Workstation
- Halaman khusus (aksesibilitas untuk Superadmin) untuk mengelola data master cabang Bank Nagari (CRUD):
  - Nama Cabang (wajib diisi dan unik).
  - Kode Kantor (opsional).
  - Lokasi Kantor (opsional).

---

## 🔒 5. Keamanan & Aturan Teknis
- **Sesi Pengguna**: Menggunakan JWT/Session berbasis cookie terenkripsi.
- **Validasi Unik**: Kode kantor cabang tidak boleh duplikat (tampilkan pesan kesalahan kustom jika terjadi pelanggaran unique constraint `P2002`).
- **Edge cases**: Saat penginputan tiket, status awal diset sebagai `proses` dan `statusSupervisi` diset sebagai `belum`. Tiket baru dianggap selesai penuh ketika status diubah dan disetujui oleh supervisi.
