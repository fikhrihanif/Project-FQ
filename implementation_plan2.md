# Rencana Implementasi F2: Redesain Tiket Workstation, Pelacakan Vendor & Integrasi Laporan

Rencana ini dibuat untuk menyesuaikan proses bisnis Tiket Workstation (pendataan barang rusak) sesuai dengan arahan terbaru. Struktur data workstation diubah dari master data autocomplete statis menjadi pengisian detail perangkat secara ad-hoc saat pembukaan tiket, serta menambahkan field pelacakan vendor saat pengeditan tiket di Daily Monitoring.

---

## Ringkasan Perubahan

1. **Skema Database & Model Baru**:
   - Menambahkan kolom-kolom baru pada model `Ticket` di `prisma/schema.prisma` untuk menyimpan data detail barang workstation serta status pelacakan vendor.
   - Kolom Input Awal:
     - `wsCabang` (Cabang)
     - `wsTanggalMasuk` (Tanggal masuk barang)
     - `wsNoSurat` (Nomor surat pengantar)
     - `wsMerekKomputer` (Merek/Tipe PC/AIO)
     - `wsCapem` (Kantor Kas / Cabang Pembantu - Optional)
     - `wsKelengkapan` (Kelengkapan barang bawaan)
     - `wsSnKomputer` (Serial Number)
     - `wsKerusakan` (Deskripsi kerusakan barang)
   - Kolom Update Pelacakan Vendor:
     - `wsTglKeVendor` (Tanggal barang diserahkan ke vendor)
     - `wsVendor` (Nama vendor yang menangani)
     - `wsTglSelesaiVendor` (Tanggal selesai diperbaiki vendor)
     - `wsTglKembaliKeCabang` (Tanggal barang dikembalikan ke cabang)
     - `wsPicTerima` (Nama PIC penerima barang di cabang)

2. **Formulir Input Workstation Baru**:
   - Di halaman `app/(app)/input-tiket/workstation/page.tsx`, pencarian autocomplete workstation lama dihapus.
   - Digantikan dengan formulir pengisian data lengkap:
     - **Cabang**: Dropdown berisi daftar 33 cabang Bank Nagari yang telah ditentukan.
     - **Tanggal Masuk**: Input datetime-local/date picker.
     - **Nomor Surat**: Input text manual format bebas (cth: `SR/00/XX/XXX/00-2026`).
     - **Merek Komputer**: Input text manual.
     - **Capem**: Input text manual (opsional).
     - **Kelengkapan**: Input text manual.
     - **SN Komputer**: Input text manual.
     - **Kerusakan**: Input text manual area.

3. **Logika Edit Tiket di Daily Monitoring**:
   - Khusus untuk tiket dengan kategori `workstation`:
     - Informasi input awal (Cabang, Tanggal Masuk, No Surat, Merek, Capem, Kelengkapan, SN, Kerusakan) **dikunci (read-only)** setelah tiket dibuat dan tidak bisa diubah di modal edit.
     - Modal edit di Daily Monitoring hanya akan menampilkan form input pelacakan vendor: **Tanggal ke Vendor**, **Vendor**, **Selesai dari Vendor**, **Tanggal Balik ke Cabang**, dan **PIC Terima**.

4. **Integrasi Laporan Excel (OPS-001 & Laporan Lengkap)**:
   - Data detail barang workstation dipetakan secara terstruktur ke kolom-kolom Excel harian dan laporan lengkap agar tidak merusak template asli Bank Nagari:
     - **Waktu Kejadian** -> Tanggal Masuk (`wsTanggalMasuk`)
     - **Unit Kerja** -> Cabang (`wsCabang`) + Capem jika ada
     - **Waktu Respon** -> Tanggal ke Vendor (`wsTglKeVendor`)
     - **Contact Person** -> Nomor Surat (`wsNoSurat`)
     - **Jenis Gangguan** -> Merek (`wsMerekKomputer`) + Kelengkapan (`wsKelengkapan`)
     - **Sumber Penyebab** -> Kerusakan (`wsKerusakan`)
     - **Metode Penanganan** -> Vendor (`wsVendor`)
     - **Vendor** -> PIC Terima (`wsPicTerima`)
     - **No Tiket Vendor** -> SN Komputer (`wsSnKomputer`)
     - **Waktu Selesai** -> Tanggal Balik ke Cabang (`wsTglKembaliKeCabang`)
     - **Keterangan** -> Ditambahkan info: `[Tgl Selesai Vendor: wsTglSelesaiVendor] + keterangan`

---

## Rincian Perubahan Kode

### 🗄️ Database
#### [MODIFY] [schema.prisma](file:///d:/Pikkk/Kuliah%20SEM%206/Magang/Nagari/Code/mtr-report/prisma/schema.prisma)
- Menambahkan field baru berikut di model `Ticket`:
  ```prisma
  wsCabang             String?   @map("ws_cabang")
  wsTanggalMasuk       DateTime? @map("ws_tanggal_masuk")
  wsNoSurat            String?   @map("ws_no_surat")
  wsMerekKomputer      String?   @map("ws_merek_komputer")
  wsCapem              String?   @map("ws_capem")
  wsKelengkapan        String?   @map("ws_kelengkapan")
  wsSnKomputer         String?   @map("ws_sn_komputer")
  wsKerusakan          String?   @map("ws_kerusakan")
  
  wsTglKeVendor        DateTime? @map("ws_tgl_ke_vendor")
  wsVendor             String?   @map("ws_vendor")
  wsTglSelesaiVendor   DateTime? @map("ws_tgl_selesai_vendor")
  wsTglKembaliKeCabang DateTime? @map("ws_tgl_kembali_ke_cabang")
  wsPicTerima          String?   @map("ws_pic_terima")
  ```

### 🔌 Backend API
#### [MODIFY] [/api/tickets/route.ts](file:///d:/Pikkk/Kuliah%20SEM%206/Magang/Nagari/Code/mtr-report/app/api/tickets/route.ts)
- Menambahkan parsing dan validasi data input awal workstation.
- Menyimpan data workstation ke field database `Ticket` yang baru.

#### [MODIFY] [/api/tickets/[id]/route.ts](file:///d:/Pikkk/Kuliah%20SEM%206/Magang/Nagari/Code/mtr-report/app/api/tickets/%5Bid%5D/route.ts)
- Menambahkan update data pelacakan vendor (`wsTglKeVendor`, `wsVendor`, `wsTglSelesaiVendor`, `wsTglKembaliKeCabang`, `wsPicTerima`) di handler `PATCH`.

### 📚 Library & Queries
#### [MODIFY] [ticketQueries.ts](file:///d:/Pikkk/Kuliah%20SEM%206/Magang/Nagari/Code/mtr-report/lib/ticketQueries.ts)
- Menyertakan seluruh field `ws...` baru ke dalam query `getTicketDetail` dan type `TicketDetail`.

#### [MODIFY] [reportData.ts](file:///d:/Pikkk/Kuliah%20SEM%206/Magang/Nagari/Code/mtr-report/lib/reportData.ts)
- Memetakan field `ws...` ke objek `ReportTicket` untuk Excel harian.

#### [MODIFY] [reportLengkapQuery.ts](file:///d:/Pikkk/Kuliah%20SEM%206/Magang/Nagari/Code/mtr-report/lib/reportLengkapQuery.ts)
- Memetakan field `ws...` ke objek `LengkapTicket` untuk Excel laporan lengkap.

### 🖥️ UI & Components
#### [MODIFY] [WorkstationForm.tsx](file:///d:/Pikkk/Kuliah%20SEM%206/Magang/Nagari/Code/mtr-report/components/input-tiket/WorkstationForm.tsx)
- Menghapus autocomplete search `WorkstationMaster`.
- Menambahkan input untuk data Cabang (Select), Tanggal Masuk (Datepicker), No Surat, Merek, Capem (opsional), Kelengkapan, SN Komputer, dan Kerusakan.

#### [MODIFY] [TicketDetailClient.tsx](file:///d:/Pikkk/Kuliah%20SEM%206/Magang/Nagari/Code/mtr-report/components/daily-monitoring/TicketDetailClient.tsx)
- Menampilkan seluruh detail barang dan status pelacakan vendor secara rapi pada panel informasi tiket workstation.
- Menyesuaikan modal edit agar jika tiket berkategori `workstation`, data awal di-render sebagai read-only / teks biasa, dan menampilkan input pelacakan vendor untuk diupdate.

---

## Rencana Verifikasi

### Automated Tests
- Menjalankan unit tests (`npm test`) untuk memastikan tidak ada pemetaan query atau logika SLA yang patah.

### Manual Verification
1. Terapkan migrasi database baru (`npx prisma migrate dev --name update_ws_fields`).
2. Akses **Input Tiket -> Workstation**, isi form dengan memilih Cabang dari dropdown, Tanggal Masuk, dsb.
3. Buka tiket baru dan buka detailnya di **Daily Monitoring**.
4. Klik **Ubah Detail** tiket workstation tersebut, masukkan data vendor (Tanggal ke Vendor, dsb.), lalu simpan.
5. Verifikasi bahwa data vendor ter-render dengan benar di halaman detail.
6. Unduh laporan Excel dan periksa apakah pemetaan kolom workstation sudah tercetak dengan benar.
