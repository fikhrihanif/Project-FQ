# Rencana Implementasi F3: Pemisahan Penuh ATM & Jaringan vs Workstation

Rencana ini mendefinisikan pemisahan **total** antara modul **ATM & Jaringan** dan modul **Workstation** di seluruh sistem — mulai dari database, alur tiket, monitoring harian & mingguan, supervisi, rekap laporan, hingga data master. Perubahan ini bersifat arsitektural dan menyentuh hampir semua lapisan aplikasi.

---

## Latar Belakang & Klarifikasi Alur Bisnis

| Aspek | ATM & Jaringan | Workstation |
|---|---|---|
| Shift & Serah Terima | ✅ Ada (shift A–E, serah terima, tutup shift) | ❌ Tidak Ada (tiket langsung masuk tanpa shift) |
| Daily Monitoring | ✅ Muncul (scoped ke shift aktif) | ✅ Sub-seksi tersendiri (semua tiket workstation `proses`) |
| Weekly Monitoring | ✅ Riwayat tiket ATM/jaringan | ✅ Sub-seksi tersendiri untuk riwayat tiket workstation |
| Alur Supervisi | Melalui ShiftReport (approve laporan shift) | **Langsung** — tiket workstation langsung muncul di supervisi tanpa menunggu tutup shift / serah terima |
| Rekap Laporan | OPS-001 (template Excel ATM) | Laporan Workstation terpisah (download button tersendiri) |
| Data Master | `AtmMaster` (tab ATM & Jaringan) | `WorkstationMaster` diubah menjadi daftar cabang — bisa dikelola via tab baru di halaman Data ATM |

---

## Ringkasan 9 Area Perubahan

### 1. Database & Schema
- Modifikasi `WorkstationMaster`: ubah dari data per-unit komputer menjadi **master cabang** Bank Nagari.
- Masalah kritis: field `shiftKode` & `openShiftKode` di tabel `Ticket` saat ini `NOT NULL`. Workstation tidak mengenal shift — perlu keputusan desain (lihat bagian Open Questions).
- Jalankan migrasi baru setelah schema diubah.
- Update seed: `WorkstationMaster` diisi 33 cabang Bank Nagari, bukan data unit komputer.

### 2. Input Tiket Workstation
- **Hapus syarat shift aktif**: Halaman `/input-tiket/workstation` saat ini menampilkan `ShiftRequiredNotice` jika user tidak punya shift aktif. Ini harus dihapus untuk workstation.
- Workstation bisa diinput kapan saja, tanpa mulai shift terlebih dahulu.
- Saat tiket dibuat, sistem langsung set `statusSupervisi = belum` (siap muncul di menu supervisi).

### 3. Daily Monitoring — Dua Sub-Seksi
- Tampilan halaman `/daily-monitoring` dibagi menjadi dua seksi dengan judul/separator yang jelas:
  - **🏧 ATM & Jaringan**: Tiket ATM/jaringan dalam shift aktif user (logika lama, tidak berubah).
  - **🖥️ Workstation**: Tiket workstation berstatus `proses` dari siapapun — tidak dibatasi shift atau user.
- Tiket workstation yang sudah `selesai` tidak muncul di sini (hanya weekly monitoring).
- Query dipisah: ATM & Jaringan tetap pakai `listTickets(dailyMonitoring: true)`, Workstation pakai fungsi baru `listWorkstationTickets()`.

### 4. Weekly Monitoring — Dua Sub-Seksi
- Tambahkan tab/seksi kedua di `/weekly-monitoring`:
  - **🏧 ATM & Jaringan**: Riwayat seperti sekarang.
  - **🖥️ Workstation**: Riwayat tiket workstation, filter: tanggal, cabang (`wsCabang`), status.
- Kolom tabel workstation berbeda dari ATM (tidak ada kode ATM, tapi ada cabang, merek, tanggal masuk, dsb.).

### 5. Supervisi — Alur Workstation Langsung
- Halaman `/supervisi` dibagi menjadi dua tab:
  - **Tab "Laporan Shift"**: Daftar `ShiftReport` ATM & Jaringan (seperti sekarang via `ShiftReportListClient`).
  - **Tab "Tiket Workstation"**: Daftar tiket `kategori = workstation` langsung — tidak melalui ShiftReport.
- Tombol **Approve** pada tiket workstation memanggil endpoint baru (`POST /api/tickets/[id]/approve-workstation`) yang langsung set `statusSupervisi = approved` tanpa perlu ShiftReport.

### 6. Rekap Laporan — Download Terpisah
- Halaman `/rekap-laporan` ditambah seksi baru **"Laporan Workstation"**:
  - Pilih rentang tanggal (dari – sampai).
  - Filter cabang (opsional).
  - Tombol **"Download Laporan Workstation (.xlsx)"**.
- Endpoint baru: `GET /api/rekap/workstation?dari=&sampai=&cabang=`.
- Library baru: `lib/workstationReportExcel.ts` untuk generate Excel workstation dengan kolom-kolom spesifik.

### 7. Data ATM — Tab Workstation (Master Cabang)
- Halaman `/data-atm` ditambah tab kedua **"Workstation (Cabang)"**:
  - CRUD daftar cabang workstation (dari `WorkstationMaster`).
  - Kolom: Nama Cabang, Kode Kantor, Lokasi, dsb.
- Buat komponen baru `DataWorkstationClient.tsx` atau extend `DataAtmClient.tsx` dengan tab selector.
- API baru: `GET/POST/PATCH/DELETE /api/workstation/[id]`.

### 8. SLA Monitoring — Workstation Dikecualikan
- Pastikan kalkulasi SLA di `lib/slaMonitoring.ts` hanya menghitung tiket `atm` & `jaringan`.
- Sudah ada `SlaKategori = "workstation"` di sana — verifikasi filter query benar-benar mengecualikan workstation saat `kategori = semua`.

### 9. Sinkronisasi Seluruh Lapisan
- Update `lib/constants.ts`: deskripsi menu "Data ATM" → bisa diubah jadi "Data ATM & Workstation".
- Pastikan `SupervisiClient.tsx` yang lama (daftar tiket langsung) tidak tumpang tindih dengan `ShiftReportListClient`.
- Pastikan nomor tiket workstation (`noTiket`) menggunakan prefix berbeda dari ATM jika diinginkan (opsional).

---

## Rincian Perubahan Kode

### 🗄️ Database

#### [MODIFY] [schema.prisma](file:///d:/Pikkk/Kuliah/SEM%206/Magang/Nagari/Code/mtr-report/prisma/schema.prisma)
- Ubah model `WorkstationMaster` — field baru untuk representasi cabang:
  ```prisma
  model WorkstationMaster {
    id          String  @id @default(cuid())
    namaCabang  String  @map("nama_cabang")
    kodeKantor  String? @map("kode_kantor")
    lokasiKantor String? @map("lokasi_kantor")
    tickets     Ticket[]
    @@map("workstation_master")
  }
  ```
- Opsi: jadikan `shiftKode` & `openShiftKode` nullable di model `Ticket` (lihat Open Questions).

#### [MODIFY] `prisma/seed.ts` atau `master_seed.json`
- Hapus/ganti seed `WorkstationMaster` lama dengan 33 data cabang Bank Nagari.

---

### 🔌 Backend API

#### [MODIFY] [/api/tickets/route.ts](file:///d:/Pikkk/Kuliah/SEM%206/Magang/Nagari/Code/mtr-report/app/api/tickets/route.ts)
- Hapus validasi shift aktif untuk `kategori = workstation` saat `POST` (buat tiket baru).
- Workstation langsung bisa dibuat tanpa session shift.
- Set `shiftKode` / `openShiftKode` sesuai keputusan Open Questions (null / NONE / nilai dummy).

#### [NEW] `POST /api/tickets/[id]/approve-workstation`
- Validasi: user harus role `supervisi` atau `superadmin`.
- Set `statusSupervisi = approved`, `approvedById = session.sub`, `approvedAt = now()`.
- Tidak memerlukan ShiftReport.

#### [NEW] `GET /api/workstation` & `POST /api/workstation`
- CRUD master cabang workstation — mirip `/api/atm`.

#### [NEW] `PATCH /api/workstation/[id]` & `DELETE /api/workstation/[id]`
- Edit & hapus data cabang workstation.

#### [NEW] `GET /api/rekap/workstation`
- Query param: `?dari=YYYY-MM-DD&sampai=YYYY-MM-DD&cabang=`
- Return: stream file Excel laporan workstation.

---

### 📚 Library & Queries

#### [MODIFY] [ticketQueries.ts](file:///d:/Pikkk/Kuliah/SEM%206/Magang/Nagari/Code/mtr-report/lib/ticketQueries.ts)
- Tambahkan filter `kategori NOT IN ['workstation']` pada `listTickets()` saat `dailyMonitoring = true` agar tiket workstation tidak tercampur di seksi ATM.
- **[NEW]** Fungsi `listWorkstationTickets()`:
  - Filter: `kategori = workstation`, `status = proses`.
  - Tidak dibatasi shift / user / tanggal.
  - Return `TicketListItem[]` (atau type turunan khusus workstation).
- **[NEW]** Fungsi `listWorkstationWeeklyTickets(filter)`:
  - Filter: `kategori = workstation`, rentang `waktuOpen`, optional `wsCabang`, `status`.

#### [NEW] `lib/workstationReportExcel.ts`
- Generate Excel laporan workstation.
- Kolom: No, No Tiket, Tanggal Masuk, No Surat, Merek/Tipe, SN Komputer, Cabang, Capem, Kelengkapan, Kerusakan, Tgl ke Vendor, Vendor, Tgl Selesai Vendor, Tgl Kembali ke Cabang, PIC Terima, Status Supervisi.
- Gunakan `exceljs` seperti laporan lainnya (`lib/excelReport.ts`).

#### [MODIFY] [slaMonitoring.ts](file:///d:/Pikkk/Kuliah/SEM%206/Magang/Nagari/Code/mtr-report/lib/slaMonitoring.ts)
- Verifikasi dan pastikan filter `kategori` mengecualikan `workstation` saat nilai filter adalah `"semua"` (agar SLA hanya menghitung ATM & jaringan).
- Jika saat ini belum ada filter tersebut, tambahkan: `where.kategori = { in: ['atm', 'jaringan'] }` saat kategori = semua.

---

### 🖥️ UI & Components

#### [MODIFY] [input-tiket/workstation/page.tsx](file:///d:/Pikkk/Kuliah/SEM%206/Magang/Nagari/Code/mtr-report/app/%28app%29/input-tiket/workstation/page.tsx)
- Hapus blok `if (!ALL_SHIFTS.includes(...)) { return <ShiftRequiredNotice /> }`.
- Hapus tampilan info shift dari subtitle (atau ganti hanya dengan nama user saja).
- Halaman langsung render `<WorkstationForm />` tanpa kondisi shift.

#### [MODIFY] [DailyMonitoringClient.tsx](file:///d:/Pikkk/Kuliah/SEM%206/Magang/Nagari/Code/mtr-report/components/daily-monitoring/DailyMonitoringClient.tsx)
- Tambahkan prop baru: `workstationItems: TicketListItem[]`.
- Render dua seksi terpisah dengan header section:
  ```tsx
  {/* Seksi 1 */}
  <SectionHeader icon={<Cpu />} title="ATM & Jaringan" />
  <TicketTable items={atmItems} ... />

  {/* Seksi 2 */}
  <SectionHeader icon={<Monitor />} title="Workstation" />
  <WorkstationTable items={workstationItems} ... />
  ```
- Tabel Workstation menampilkan kolom berbeda: No Tiket, Cabang, Merek Komputer, Tanggal Masuk, Kerusakan, Status, Status Supervisi.

#### [MODIFY] [daily-monitoring/page.tsx](file:///d:/Pikkk/Kuliah/SEM%206/Magang/Nagari/Code/mtr-report/app/%28app%29/daily-monitoring/page.tsx)
- Fetch dua sumber data terpisah:
  ```typescript
  const [atmItems, workstationItems, ...] = await Promise.all([
    listTickets({ dailyMonitoring: true, currentUserId: ..., currentShift: ..., ... }),
    listWorkstationTickets(),
    ...
  ]);
  ```
- Pass keduanya ke `DailyMonitoringClient`.

#### [MODIFY] `components/weekly-monitoring/WeeklyMonitoringClient.tsx`
- Tambahkan state/tab untuk memilih antara "ATM & Jaringan" dan "Workstation".
- Tabel Workstation memiliki kolom & filter tersendiri.
- Fetch data workstation via query param tambahan ke API atau fungsi terpisah.

#### [MODIFY] [weekly-monitoring/page.tsx](file:///d:/Pikkk/Kuliah/SEM%206/Magang/Nagari/Code/mtr-report/app/%28app%29/weekly-monitoring/page.tsx)
- Tambahkan fetch: `listWorkstationWeeklyTickets({ from, to })`.
- Tambahkan fetch master cabang workstation untuk dropdown filter.
- Pass data workstation ke client component.

#### [MODIFY] [supervisi/page.tsx](file:///d:/Pikkk/Kuliah/SEM%206/Magang/Nagari/Code/mtr-report/app/%28app%29/supervisi/page.tsx)
- Tambahkan fetch tiket workstation (`kategori = workstation`, `supervisiId = session.sub` jika supervisi / semua jika superadmin).
- Ubah komponen utama menjadi dua tab.

#### [MODIFY] `components/supervisi/` — buat komponen baru atau modifikasi yang ada
- **[NEW]** `WorkstationSupervisiClient.tsx`:
  - Tampilkan daftar tiket workstation yang menunggu approval.
  - Kolom: No Tiket, Cabang, Tanggal Masuk, Merek, Status, Tombol Approve.
  - Tombol Approve memanggil `POST /api/tickets/[id]/approve-workstation`.
- Halaman Supervisi menggunakan tab:
  - Tab "Laporan Shift" → `ShiftReportListClient` (tidak berubah).
  - Tab "Workstation" → `WorkstationSupervisiClient` (baru).

#### [MODIFY] [RekapLaporanClient.tsx](file:///d:/Pikkk/Kuliah/SEM%206/Magang/Nagari/Code/mtr-report/components/rekap/RekapLaporanClient.tsx)
- Tambahkan `Card` baru "Laporan Workstation" di bawah seksi ATM & Jaringan:
  - Input tanggal dari – sampai.
  - Dropdown filter cabang (opsional, dari data `WorkstationMaster`).
  - Tombol "Download Laporan Workstation (.xlsx)".
- Panggil endpoint baru `GET /api/rekap/workstation?...`.

#### [MODIFY] [rekap-laporan/page.tsx](file:///d:/Pikkk/Kuliah/SEM%206/Magang/Nagari/Code/mtr-report/app/%28app%29/rekap-laporan/page.tsx)
- Fetch daftar cabang workstation untuk dropdown filter.
- Pass ke `RekapLaporanClient`.

#### [MODIFY] [data-atm/page.tsx](file:///d:/Pikkk/Kuliah/SEM%206/Magang/Nagari/Code/mtr-report/app/%28app%29/data-atm/page.tsx)
- Fetch data cabang workstation bersamaan dengan ATM.
- Update judul halaman menjadi "Data ATM & Workstation" atau serupa.
- Pass data workstation ke client.

#### [MODIFY] [DataAtmClient.tsx](file:///d:/Pikkk/Kuliah/SEM%206/Magang/Nagari/Code/mtr-report/components/data-atm/DataAtmClient.tsx)
- Tambahkan tab selector di bagian atas: **"ATM & Jaringan"** | **"Workstation (Cabang)"**.
- Saat tab ATM aktif: tampilan dan logika CRUD sama seperti sekarang.
- Saat tab Workstation aktif: tampilkan tabel cabang workstation dari `WorkstationMaster`, CRUD via `/api/workstation`.

#### [NEW] `components/data-atm/DataWorkstationClient.tsx`
- Komponen CRUD untuk master cabang workstation.
- Field form: Nama Cabang, Kode Kantor, Lokasi Kantor.

---

## Open Questions (Perlu Keputusan Sebelum Implementasi)

> [!IMPORTANT]
> **Masalah `shiftKode` Wajib Isi**: Field `shiftKode` & `openShiftKode` di `Ticket` saat ini `NOT NULL`. Tiket workstation tidak punya shift. Pilih salah satu:
> - **Opsi A** *(Direkomendasikan)*: Jadikan keduanya **nullable** di schema. Workstation diisi `null`. Perlu migrasi.
> - **Opsi B**: Buat nilai enum baru `NONE` di `ShiftKode` sebagai placeholder.
> - **Opsi C**: Tetap isi dengan shift sesi user saat input (workaround, tidak akurat).

> [!IMPORTANT]
> **Field `WorkstationMaster` Baru**: Untuk data cabang, field apa saja yang dibutuhkan? Minimal: `namaCabang`. Opsional: `kodeKantor`, `lokasiKantor`. Apakah field `relasi ke `Ticket` (`workstationId`) tetap dipakai atau dihapus (karena data cabang sudah ada di `wsCabang` teks)?

> [!NOTE]
> **Assign Supervisi saat Input Workstation**: Apakah saat membuat tiket workstation, user harus memilih supervisi yang akan meng-approve? Atau tiket muncul ke semua supervisi dan supervisi yang aktif memilih mana yang akan di-approve?

> [!NOTE]
> **Prefix Nomor Tiket Workstation**: Apakah nomor tiket workstation perlu prefix berbeda (mis: `WS-YYYY-XXXX` vs `MTR-YYYY-XXXX`)? Atau tetap menggunakan format yang sama?

---

## Urutan Implementasi yang Disarankan

1. **Konfirmasi Open Questions** dengan user (terutama `shiftKode` nullable).
2. **Schema & Migrasi**: Ubah `WorkstationMaster`, jadikan `shiftKode` nullable (jika Opsi A), buat migrasi, update seed.
3. **Queries**: `listWorkstationTickets`, `listWorkstationWeeklyTickets`, filter SLA.
4. **API Baru**: CRUD workstation master, `approve-workstation`, rekap workstation.
5. **Input Tiket**: Hapus guard shift di halaman workstation.
6. **Daily Monitoring**: Pisah dua seksi (ATM & Jaringan + Workstation).
7. **Weekly Monitoring**: Tambah tab/seksi workstation.
8. **Supervisi**: Dua tab (Laporan Shift + Workstation langsung).
9. **Rekap Laporan**: Seksi download workstation + Excel generator.
10. **Data ATM**: Tab workstation (data cabang) + CRUD.
11. **Testing & Verifikasi Menyeluruh**.

---

## Rencana Verifikasi

### Automated Tests
- `npm test` setelah setiap perubahan besar pada `lib/`.
- Verifikasi query workstation dan ATM tidak saling mencampur data.

### Manual Verification
1. **Input tanpa shift**: Akses `/input-tiket/workstation` tanpa mulai shift → form langsung tampil.
2. **Daily Monitoring**: Dua seksi terpisah — ATM hanya shift aktif, Workstation semua yang `proses`.
3. **Weekly Monitoring**: Tab workstation tampilkan riwayat dengan filter cabang yang benar.
4. **Supervisi Workstation**: Buat tiket workstation → langsung muncul di tab Workstation halaman supervisi → approve berhasil tanpa tutup/serah terima shift.
5. **Rekap Laporan Workstation**: Download berhasil, kolom Excel sesuai data `ws...`.
6. **Data ATM – Tab Workstation**: CRUD cabang workstation berfungsi penuh.
7. **SLA Monitoring**: Angka SLA tidak terpengaruh oleh tiket workstation.
8. **Laporan Shift ATM**: Pastikan tidak ada regresi — serah terima, tutup shift, approve ShiftReport masih berjalan normal.
