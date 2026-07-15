# Rencana Implementasi: Input SN Mesin, Rekomendasi Workstation, & Pembersihan Open Tiket

Rencana ini bertujuan untuk memodifikasi form Workstation agar input dropdown menjadi kolom rekomendasi (bisa diketik manual), menambahkan input nomor seri "SN Mesin" (pada tiket kategori workstation), serta menghapus menu "Open Tiket" yang fungsinya sama persis dengan "Input ATM".

---

## Ringkasan Perubahan

1. **Rekomendasi Input Workstation**:
   - Kolom "Jenis Kerusakan", "Sumber Penyebab Kerusakan", dan "Metode Penanganan" pada form workstation akan diubah dari Select Dropdown biasa menjadi Input Text biasa yang memiliki `<datalist>` (autocomplete rekomendasi). Pengguna dapat memilih rekomendasi yang sudah ada atau mengetikkan nilai baru secara bebas.

2. **Input "SN Mesin" (Serial Number)**:
   - Menambahkan field `snMesin` opsional di tabel `Ticket`.
   - Menambahkan kolom input manual "SN Mesin" di form Workstation.
   - Mengintegrasikan `snMesin` ke API endpoint, query detail tiket, tampilan UI detail tiket, dan ekspor laporan Excel (digabungkan secara rapi ke kolom Keterangan).

3. **Pembersihan Menu "Open Tiket"**:
   - Karena menu "Open Tiket" fungsinya sama persis dengan "Input ATM", menu root "Open Tiket" akan dihapus dari Sidebar.
   - Halaman `app/(app)/open-tiket/page.tsx` akan dihapus, dan semua navigasi dialihkan secara penuh ke `app/(app)/input-tiket/atm/page.tsx` ("Input ATM").

---

## Rincian Perubahan Kode

### 🗄️ Database
#### [MODIFY] [schema.prisma](file:///d:/Pikkk/Kuliah/SEM%206/Magang/Nagari/Code/mtr-report/prisma/schema.prisma)
- Menambahkan field baru pada model `Ticket`:
  ```prisma
  snMesin String? @map("sn_mesin")
  ```

### 🔌 Backend API
#### [MODIFY] [/api/tickets/route.ts](file:///d:/Pikkk/Kuliah/SEM%206/Magang/Nagari/Code/mtr-report/app/api/tickets/route.ts)
- Menerima `snMesin` (optional string) dari body request saat pembuatan tiket (`POST`).
- Melakukan validasi dan menyimpannya ke database.

#### [MODIFY] [/api/tickets/[id]/route.ts](file:///d:/Pikkk/Kuliah/SEM%206/Magang/Nagari/Code/mtr-report/app/api/tickets/%5Bid%5D/route.ts)
- Mengizinkan pembaruan field `snMesin` melalui endpoint update jika diperlukan.

### 📚 Library & Queries
#### [MODIFY] [ticketQueries.ts](file:///d:/Pikkk/Kuliah/SEM%206/Magang/Nagari/Code/mtr-report/lib/ticketQueries.ts)
- Menyertakan field `snMesin` di type definition `TicketRow` dan hasil query pencarian tiket detail/list.

#### [MODIFY] [reportData.ts](file:///d:/Pikkk/Kuliah/SEM%206/Magang/Nagari/Code/mtr-report/lib/reportData.ts)
- Memetakan field `snMesin` ke properti `keterangan` di Excel harian (Contoh: `t.keterangan (SN: t.snMesin)`).

#### [MODIFY] [reportLengkapQuery.ts](file:///d:/Pikkk/Kuliah/SEM%206/Magang/Nagari/Code/mtr-report/lib/reportLengkapQuery.ts)
- Memetakan field `snMesin` ke properti `keterangan` di Excel laporan lengkap.

#### [MODIFY] [constants.ts](file:///d:/Pikkk/Kuliah/SEM%206/Magang/Nagari/Code/mtr-report/lib/constants.ts)
- Menghapus item navigasi `"Open Tiket"` dari array `NAV_ITEMS`.

### 🖥️ UI & Components
#### [DELETE] [open-tiket page.tsx](file:///d:/Pikkk/Kuliah/SEM%206/Magang/Nagari/Code/mtr-report/app/(app)/open-tiket/page.tsx)
- Menghapus folder dan file halaman Open Tiket yang lama.

#### [MODIFY] [WorkstationForm.tsx](file:///d:/Pikkk/Kuliah/SEM%206/Magang/Nagari/Code/mtr-report/components/input-tiket/WorkstationForm.tsx)
- Mengubah elemen input dropdown "Jenis Kerusakan", "Sumber Penyebab", dan "Metode Penanganan" menjadi input teks dengan `<datalist>` HTML5 agar pengguna bisa memilih atau mengetik manual bebas.
- Menambahkan input text manual untuk "SN Mesin".
- Mengirim data `snMesin` ke payload API POST `/api/tickets`.

#### [MODIFY] [TicketDetailClient.tsx](file:///d:/Pikkk/Kuliah/SEM%206/Magang/Nagari/Code/mtr-report/components/daily-monitoring/TicketDetailClient.tsx)
- Menampilkan informasi "SN Mesin" di samping atau di bawah informasi workstation jika diisi.

---

## Rencana Verifikasi

### Automated Tests
- Menjalankan unit tests (`npm test`) untuk memastikan tidak ada pemetaan query atau logika SLA yang patah.

### Manual Verification
1. Jalankan migrasi schema baru (`npx prisma migrate dev --name add_sn_mesin`).
2. Masuk ke halaman **Input Tiket -> Workstation**.
3. Ketik manual opsi Jenis Kerusakan baru yang tidak ada di dropdown rekomendasi.
4. Isi kolom **SN Mesin** secara manual.
5. Klik **Buka Tiket** dan pastikan tiket berhasil dibuat.
6. Buka halaman detail tiket tersebut di **Daily Monitoring** dan verifikasi nomor **SN Mesin** tampil dengan benar.
7. Download laporan harian Excel dan pastikan kolom Keterangan mencantumkan nomor SN Mesin secara rapi.
