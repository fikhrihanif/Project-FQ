# Rencana Implementasi: Menu Input Tiket (ATM & Workstation)

Rencana ini bertujuan untuk menambahkan menu baru **"Input Tiket"** di bawah menu **"Open Tiket"**. Menu ini memiliki 2 opsi/sub-menu:
1.  **Input ATM**: Formulir pembukaan tiket gangguan ATM (berfungsi persis sama seperti "Open Tiket" saat ini).
2.  **Workstation**: Formulir pembukaan tiket untuk pendataan barang-barang workstation yang rusak.

Kedua menu ini hanya dapat diakses oleh pengguna dengan peran **Petugas Monitoring (role: user)** dan terintegrasi penuh dengan seluruh fitur sistem (Dashboard, Daily Monitoring, Weekly Monitoring, Rekap Excel, SLA, dll.).

---

## User Review Required

> [!IMPORTANT]
> - Perubahan ini memerlukan migrasi database Prisma untuk menambahkan tipe kategori baru (`workstation`) pada enum `TicketKategori`, tabel master baru `WorkstationMaster`, dan field relasi baru `workstation_id` pada tabel `Ticket`.
> - Data master workstation awal akan di-seed dengan 5 sampel workstation (misalnya PC CSO, PC Teller, Printer Slip, UPS, dll.) untuk memudahkan pengujian pencarian autocomplete.

---

## Proposed Changes

### Database & Seed

#### [MODIFY] [schema.prisma](file:///d:/Pikkk/Kuliah/SEM%206/Magang/Nagari/Code/mtr-report/prisma/schema.prisma)
- Tambahkan `workstation` pada enum `TicketKategori`.
- Tambahkan model baru `WorkstationMaster` untuk pendataan barang/workstation:
  ```prisma
  model WorkstationMaster {
    id              String  @id @default(cuid())
    kodeWorkstation String  @unique @map("kode_workstation")
    namaWorkstation String  @map("nama_workstation")
    cabang          String?
    lokasi          String?
    vendor          String?

    tickets Ticket[]

    @@map("workstation_master")
  }
  ```
- Hubungkan `Ticket` dengan `WorkstationMaster`:
  ```prisma
  model Ticket {
    ...
    workstationId   String?            @map("workstation_id")
    workstation     WorkstationMaster? @relation(fields: [workstationId], references: [id])
    ...
  }
  ```

#### [MODIFY] [seed.ts](file:///d:/Pikkk/Kuliah/SEM%206/Magang/Nagari/Code/mtr-report/prisma/seed.ts)
- Impor data tipe baru atau buat fungsi `seedWorkstationMaster` untuk memasukkan data sampel workstation awal:
  - `WS001` - PC Kerja CSO 1 (Cabang Utama)
  - `WS002` - PC Kerja Teller 1 (Cabang Utama)
  - `WS003` - Printer Slip Teller 2 (Cabang Utama)
  - `WS004` - UPS 10kVA Ruang Server (Divisi TI)
  - `WS005` - PC Kerja Pimpinan Cabang (Cabang Padang Baru)

---

### Backend API & Libs

#### [NEW] [route.ts](file:///d:/Pikkk/Kuliah/SEM%206/Magang/Nagari/Code/mtr-report/app/api/workstation/route.ts)
- Buat endpoint pencarian autocomplete workstation `GET /api/workstation?q=&limit=` dan penambahan master workstation `POST /api/workstation`.

#### [NEW] [route.ts](file:///d:/Pikkk/Kuliah/SEM%206/Magang/Nagari/Code/mtr-report/app/api/workstation/[id]/route.ts)
- Buat endpoint mutasi master workstation: `PATCH /api/workstation/[id]` dan `DELETE /api/workstation/[id]`.

#### [MODIFY] [route.ts](file:///d:/Pikkk/Kuliah/SEM%206/Magang/Nagari/Code/mtr-report/app/api/tickets/route.ts)
- Modifikasi handler `POST /api/tickets` agar jika kategori bernilai `workstation`, data divalidasi ke tabel `WorkstationMaster` dan disimpan ke field `workstationId` (menggantikan `atmId`).

#### [MODIFY] [dbStudio.ts](file:///d:/Pikkk/Kuliah/SEM%206/Magang/Nagari/Code/mtr-report/lib/dbStudio.ts)
- Daftarkan `workstation_master` ke dalam `REGISTRY` agar dapat diakses oleh Super Admin lewat Database Studio.

#### [MODIFY] [ticketQueries.ts](file:///d:/Pikkk/Kuliah/SEM%206/Magang/Nagari/Code/mtr-report/lib/ticketQueries.ts)
- Tambahkan select `workstation` pada `listTickets`, `listWeeklyTickets`, dan `getTicketDetail`.
- Petakan data workstation ke field `kodeAtm` dan `namaAtm` (atau objek `atm` pada `getTicketDetail`) jika kategorinya adalah `workstation` agar seluruh UI hilir tidak pecah.

#### [MODIFY] [dashboardQueries.ts](file:///d:/Pikkk/Kuliah/SEM%206/Magang/Nagari/Code/mtr-report/lib/dashboardQueries.ts)
- Tambahkan agregasi tiket `workstation` pada data dashboard counts.
- Tambahkan select `workstation` pada query `openTickets`.

#### [MODIFY] [slaMonitoring.ts](file:///d:/Pikkk/Kuliah/SEM%206/Magang/Nagari/Code/mtr-report/lib/slaMonitoring.ts)
- Tambahkan tipe kategori `workstation` pada filter SLA.
- Perbarui `ticketSelect` dan helper `atmKode`/`atmNama`/`atmLokasi`/`atmVendor` agar mendukung pembacaan properti dari `workstation` jika tiket berkategori `workstation`.

#### [MODIFY] [reportData.ts](file:///d:/Pikkk/Kuliah/SEM%206/Magang/Nagari/Code/mtr-report/lib/reportData.ts)
- Hubungkan pengambilan data `workstation` ke dalam query laporan harian. Petakan kode dan nama workstation ke field `unitKerja` jika kategori tiket adalah `workstation` agar tercetak rapi di file Excel.

#### [MODIFY] [reportLengkapQuery.ts](file:///d:/Pikkk/Kuliah%206/Magang/Nagari/Code/mtr-report/lib/reportLengkapQuery.ts)
- Hubungkan properti `workstation` ke dalam mapping ekspor data laporan lengkap.

#### [MODIFY] [shiftReportQueries.ts](file:///d:/Pikkk/Kuliah/SEM%206/Magang/Nagari/Code/mtr-report/lib/shiftReportQueries.ts)
- Tambahkan select `workstation` pada detail laporan shift untuk rendering daftar tiket.

---

### Layout & Navigation

#### [MODIFY] [constants.ts](file:///d:/Pikkk/Kuliah/SEM%206/Magang/Nagari/Code/mtr-report/lib/constants.ts)
- Perbarui `NAV_ITEMS` untuk mendefinisikan menu baru dengan sub-item (dropdown/collapsible) atau menyisipkan menu baru secara langsung:
  - **Open Tiket** (tetap ada)
  - **Input Tiket** (Menu Utama)
    - Sub-menu 1: **Input ATM** (Link ke `/input-tiket/atm`)
    - Sub-menu 2: **Workstation** (Link ke `/input-tiket/workstation`)

#### [MODIFY] [Sidebar.tsx](file:///d:/Pikkk/Kuliah/SEM%206/Magang/Nagari/Code/mtr-report/components/layout/Sidebar.tsx)
- Modifikasi logika rendering navigasi agar mendeteksi jika sebuah `NavItem` memiliki `children`.
- Tampilkan sub-menu secara collapsible atau ter-indentasi rapi dengan gaya premium (hover effect, active pills, chevron icons, transition).

#### [MODIFY] [rbac.ts](file:///d:/Pikkk/Kuliah/SEM%206/Magang/Nagari/Code/mtr-report/lib/rbac.ts)
- Daftarkan prefix `/input-tiket` agar hanya dapat diakses oleh role `user` (Petugas Monitoring).

---

### Pages & Components

#### [NEW] [page.tsx](file:///d:/Pikkk/Kuliah/SEM%206/Magang/Nagari/Code/mtr-report/app/(app)/input-tiket/atm/page.tsx)
- Halaman form input tiket ATM. Memanfaatkan `OpenTiketForm` yang sudah ada (kategori diset otomatis ke `atm` atau `jaringan` sesuai pilihan formulir).

#### [NEW] [page.tsx](file:///d:/Pikkk/Kuliah/SEM%206/Magang/Nagari/Code/mtr-report/app/(app)/input-tiket/workstation/page.tsx)
- Halaman form input tiket Workstation. Memanggil komponen baru `WorkstationForm`.

#### [NEW] [WorkstationForm.tsx](file:///d:/Pikkk/Kuliah/SEM%206/Magang/Nagari/Code/mtr-report/components/input-tiket/WorkstationForm.tsx)
- Komponen formulir input workstation baru. Tampilannya sama persis dengan `OpenTiketForm` namun:
  - Cari ATM diganti dengan **Cari Workstation / Barang** (melakukan autocomplete search ke `/api/workstation`).
  - Kategori tiket disembunyikan/diset langsung ke `workstation` di payload.
  - Nama-nama label disesuaikan untuk konteks workstation/barang rusak.

#### [MODIFY] [DailyMonitoringClient.tsx](file:///d:/Pikkk/Kuliah/SEM%206/Magang/Nagari/Code/mtr-report/components/daily-monitoring/DailyMonitoringClient.tsx)
- Tambahkan filter option `Workstation` pada dropdown kategori.
- Perbarui rendering badge kategori untuk mencakup kategori `workstation`.

#### [MODIFY] [WeeklyMonitoringClient.tsx](file:///d:/Pikkk/Kuliah/SEM%206/Magang/Nagari/Code/mtr-report/components/weekly-monitoring/WeeklyMonitoringClient.tsx)
- Tambahkan filter option `Workstation` pada dropdown kategori.
- Perbarui rendering badge kategori pada tabel tiket mingguan.

#### [MODIFY] [TicketDetailClient.tsx](file:///d:/Pikkk/Kuliah/SEM%206/Magang/Nagari/Code/mtr-report/components/daily-monitoring/TicketDetailClient.tsx)
- Perbarui rendering badge kategori pada detail tiket untuk menampilkan badge `Workstation` dengan warna yang serasi.

---

## Verification Plan

### Automated Tests
- Jalankan `cmd.exe /c npm test` untuk memastikan semua uji unit yang ada tetap berjalan dengan sukses tanpa mengalami regresi.

### Manual Verification
- Melakukan registrasi migrasi database: `npx prisma migrate dev --name add_workstation`.
- Jalankan seeding database: `npx prisma db seed` untuk memuat data master workstation.
- Jalankan server lokal: `npm run dev`.
- Login menggunakan akun petugas (misal: `mtr1` / `mtr1`).
- Buka sidebar dan verifikasi menu **Input Tiket**:
  - Klik **Input ATM** dan buat tiket gangguan ATM. Pastikan berhasil tersimpan.
  - Klik **Workstation** dan cari workstation (misal ketik `WS`). Pilih barang dari daftar autocomplete, lengkapi formulir, lalu simpan tiket.
- Buka **Daily Monitoring** dan verifikasi:
  - Apakah tiket ATM dan Workstation yang baru dibuat muncul di daftar.
  - Coba filter kategori (ATM / Jaringan / Workstation).
- Buka detail tiket workstation dan verifikasi detail penanganan serta penambahan log kegiatan.
- Lakukan serah terima shift dan verifikasi apakah tiket workstation diteruskan dengan benar.
- Lakukan ekspor laporan Excel harian dan pastikan barang workstation tercetak di kolom "Unit Kerja".
