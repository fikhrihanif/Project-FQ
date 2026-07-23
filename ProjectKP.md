# Spesifikasi & Dokumentasi Sistem MTR-Report (Web & Mobile FlutterFlow)
## Panduan Lengkap Konversi Sistem Utama ke Mobile App (`mobile/`) & Integrasi Kamera OCR Google ML Kit

Dokumen ini berisi spesifikasi teknis dan dokumentasi lengkap mengenai **Sistem MTR-Report (Bank Nagari IT Support Management System / Nagari Workstation & Server Log Monitor)**. Dokumen ini dirancang sebagai acuan pengembang (Developer & AI) untuk merekonstruksi dan memelihara aplikasi dalam dua platform: **Web (Laptop/Komputer)** dan **Mobile (HP Android/iOS dengan Flutter/FlutterFlow di folder `mobile/`)**.

---

## 📋 DAFTAR ISI

1. [Filosofi Dual-Platform: Web vs Mobile](#1-filosofi-dual-platform-web-vs-mobile)
2. [Arsitektur Sistem & Skema Database PostgreSQL / Prisma](#2-arsitektur-sistem--skema-database-postgresql--prisma)
3. [Detail Fitur & Modul Utama (Keseluruhan Sistem)](#3-detail-fitur--modul-utama-keseluruhan-sistem)
   - [3.1 Modul Autentikasi & Login](#31-modul-autentikasi--login)
   - [3.2 Modul Dashboard Utama](#32-modul-dashboard-utama)
   - [3.3 Modul Input Tiket Workstation (dengan Shortcut OCR Kamera)](#33-modul-input-tiket-workstation-dengan-shortcut-ocr-kamera)
   - [3.4 Modul Log Akses Server Room (dengan Foto & Shortcut OCR Kamera)](#34-modul-log-akses-server-room-dengan-foto--shortcut-ocr-kamera)
   - [3.5 Modul Daily & Weekly Monitoring](#35-modul-daily--weekly-monitoring)
   - [3.6 Modul Supervisi & Approval Digital](#36-modul-supervisi--approval-digital)
   - [3.7 Modul Manajemen Akun & Master Cabang](#37-modul-manajemen-akun--master-cabang)
   - [3.8 Modul Rekap & Export Laporan Excel](#38-modul-rekap--export-laporan-excel)
   - [3.9 Modul Pengaturan Profil & Password](#39-modul-pengaturan-profil--password)
4. [Arsitektur Aplikasi Mobile FlutterFlow (`mobile/`)](#4-arsitektur-aplikasi-mobile-flutterflow-mobile)
5. [Spesifikasi Fitur Shortcut Kamera OCR (Google ML Kit) dengan ROI Overlay](#5-spesifikasi-fitur-shortcut-kamera-ocr-google-ml-kit-dengan-roi-overlay)
   - [5.1 Desain UI Kamera dengan Cutout Rectangular Terang](#51-desain-ui-kamera-dengan-cutout-rectangular-terang)
   - [5.2 Logika Filtering Teks Berdasarkan Region of Interest (ROI)](#52-logika-filtering-teks-berdasarkan-region-of-interest-roi)
   - [5.3 Kode Komponen Flutter Custom Widget (`ocr_camera_scanner_widget.dart`)](#53-kode-komponen-flutter-custom-widget-ocr_camera_scanner_widgetdart)
6. [Panduan Pengujian & Deployment (Docker Web & Mobile Emulator/Device)](#6-panduan-pengujian--deployment-docker-web--mobile-emulatordevice)

---

## 1. FILOSOFI DUAL-PLATFORM: WEB VS MOBILE

Sistem **MTR-Report Bank Nagari** dibangun untuk mendukung operasional IT Support dalam dua lingkungan kerja yang saling terintegrasi secara real-time:

```
                  +-----------------------------------+
                  |   DATABASE POSTGRESQL & REST API  |
                  |     (Satu Database & Backend)     |
                  +-----------------+-----------------+
                                    |
            +-----------------------+-----------------------+
            |                                               |
            v                                               v
+-----------------------+                       +-----------------------+
|  VERSI WEB (LAPTOP)   |                       | VERSI MOBILE (HP)     |
|  - Platform: Next.js  |                       | - Platform: Flutter   |
|  - Akses: Laptop/PC   |                       | - Folder: mobile/     |
|  - Penggunaan:        |                       | - Penggunaan:         |
|    Monitoring Meja,   |                       |    Mobilitas Teknisi, |
|    Rekap, Supervisi   |                       |    Shortcut Kamera    |
+-----------------------+                       |    Scan OCR (SN, MID, |
                                                |    TID, No Surat)     |
                                                +-----------------------+
```

### 🤝 Persamaan Utama (Web & Mobile):
1. **Fitur 100% Identik**: Semua fungsi dari Login, Dashboard, Input Tiket, Log Server, Monitoring, Approval Supervisi, hingga Rekap Laporan tersedia penuh baik di Web maupun Mobile.
2. **Satu Database (PostgreSQL)**: Data yang di-input dari HP Mobile langsung detik itu juga muncul di tampilan Web Laptop, dan sebaliknya.
3. **Satu Data Seed & User**: Menggunakan akun yang sama (`superadmin`, `mtr1`–`mtr5`, `tio`, `berto`) dan 33 Master Cabang Bank Nagari.

### 📱 Perbedaan Utama (Mobile Enhancement):
- **Shortcut Kamera OCR (Google ML Kit)**: Pada versi Mobile, penginputan data teknis (Serial Number/SN Komputer, MID, TID, No Surat Cabang, Instansi Tamu) dilengkapi tombol **Shortcut Scanner Kamera**. 
- Teknisi cukup mengarahkan kamera HP ke stiker/dokumen, dan teks yang berada di dalam **kotak transparan terang (ROI Box)** akan langsung tersalin otomatis ke dalam kolom input tanpa perlu mengetik manual.

---

## 2. ARSITEKTUR SISTEM & SKEMA DATABASE POSTGRESQL / PRISMA

Database menggunakan PostgreSQL 16 dengan 5 model Prisma ORM utama yang melayani API Web & Mobile:

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

// 1. Akun Pengguna (Petugas IT, Supervisi, Superadmin)
model User {
  id                 String              @id @default(cuid())
  username           String              @unique
  nama               String
  role               Role                @default(user)
  passwordHash       String              @map("password_hash")
  fotoProfilUrl      String?             @map("foto_profil_url")
  ttdUrl             String?             @map("ttd_url")
  isAktif            Boolean             @default(true) @map("is_aktif")
  createdAt          DateTime            @default(now()) @map("created_at")
  ticketsOwned       Ticket[]            @relation("TicketOwner")
  activities         TicketActivity[]
  serverLogs         ServerAccessLog[]   @relation("LogPencatat")
  serverLogsApproved ServerAccessLog[]   @relation("LogApprover")

  @@map("users")
}

// 2. Master Data Cabang Bank Nagari
model WorkstationMaster {
  id           String   @id @default(cuid())
  namaCabang   String   @unique @map("nama_cabang")
  kodeKantor   String?  @unique @map("kode_kantor")
  lokasiKantor String?  @map("lokasi_kantor")
  tickets      Ticket[]

  @@map("workstation_master")
}

// 3. Log Akses Masuk/Keluar Ruang Server
model ServerAccessLog {
  id             String    @id @default(cuid())
  namaOrang      String    @map("nama_orang")
  instansi       String    @default("") @map("instansi")
  namaPic        String    @default("") @map("nama_pic")
  keperluan      String?
  jenisAkses     String    @default("masuk") @map("jenis_akses")
  waktuAkses     DateTime  @default(now()) @map("waktu_akses")
  waktuKeluar    DateTime? @map("waktu_keluar")
  fotoUrl        String?   @map("foto_url")
  catatanOleh    String    @map("catatan_oleh")
  statusApproval String    @default("pending") @map("status_approval") // pending | approved
  approvedBy     String?   @map("approved_by")
  createdAt      DateTime  @default(now()) @map("created_at")

  pencatat       User      @relation("LogPencatat", fields: [catatanOleh], references: [id])
  approver       User?     @relation("LogApprover", fields: [approvedBy], references: [id])

  @@map("server_access_logs")
}

// 4. Tiket Gangguan Workstation / Perangkat
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
  wsCabang             String          @map("ws_cabang")
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
  workstation WorkstationMaster? @relation(fields: [wsCabang], references: [namaCabang])

  @@map("tickets")
}

// 5. Timeline Aktivitas / Kegiatan Penanganan Tiket
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

## 3. DETAIL FITUR & MODUL UTAMA (KESELURUHAN SISTEM)

### 3.1 Modul Autentikasi & Login
- **Fungsi**: Memverifikasi identitas pengguna dan menerbitkan JWT Session token (tersimpan di `httpOnly` cookie untuk web & `FlutterSecureStorage` untuk mobile).
- **Peran (Roles)**:
  - `superadmin`: Kontrol penuh atas seluruh modul, manajemen user, dan master data.
  - `user`: Teknisi IT Support untuk input tiket, log server, penanganan harian, dan close tiket.
  - `supervisi`: Supervisor untuk peninjauan dan persetujuan (approval) tiket & log server.
- **API Endpoints**: `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/me`.

### 3.2 Modul Dashboard Utama
- **Fungsi**: Menyajikan visualisasi ringkasan statistik operasional:
  - Kartu Metrik Total Tiket Workstation.
  - Kartu Tiket Berstatus `proses` (Sedang Ditangani).
  - Kartu Tiket Berstatus `selesai` (Close / Menunggu Approve Supervisi).
  - Kartu Jumlah Tamu Pengunjung Server Room Hari Ini.
- **API Endpoints**: `GET /api/dashboard`.

### 3.3 Modul Input Tiket Workstation (dengan Shortcut OCR Kamera)
- **Fungsi**: Mendaftarkan tiket gangguan PC / workstation baru.
- **Fitur Utama**:
  - Auto-generate Nomor Tiket unik dengan format `WS-YYYY-NNNNN` (contoh: `WS-2026-00042`).
  - Dropdown Nama Cabang Bank Nagari (Payakumbuh, Bukittinggi, Batusangkar, Solok, dll).
  - Field input: Unit/Capem, Tanggal Masuk Unit, No Surat Cabang, Merek Komputer, Kelengkapan Perangkat, Serial Number (SN) Komputer, Deskripsi Kerusakan, Tipe CP (PIC / WhatsApp Group), Nama & No Telp CP, Uraian Kegiatan Penanganan Pertama.
  - **📱 Special Mobile Shortcut (OCR Kamera)**: Di samping kolom **SN Komputer**, **MID**, **TID**, dan **No Surat Cabang**, terdapat tombol **[📷 SCAN OCR]**. Menekan tombol ini akan membuka kamera scanner untuk membaca teks secara otomatis tanpa perlu mengetik.
  - Pop-up Modal Notifikasi Sukses dengan animasi centang hijau.
- **API Endpoints**: `POST /api/tickets`, `GET /api/workstation`.

### 3.4 Modul Log Akses Server Room (dengan Foto & Shortcut OCR Kamera)
- **Fungsi**: Mencatat riwayat akses pengunjung/vendor yang masuk ke ruang server Bank Nagari.
- **Fitur Utama**:
  - Input Nama Pengunjung, Instansi (Vendor/Internal), Nama PIC IT Pendamping, Keperluan Masuk.
  - **Capture Foto Pengunjung**: Mengambil foto pengunjung via kamera laptop (Web) atau kamera HP (Mobile).
  - **📱 Special Mobile Shortcut (OCR Kamera)**: Tombol scan untuk membaca Nama Instansi / Kartu Pengunjung.
  - **Pencatatan Jam Keluar**: Tombol **"Catat Keluar"** untuk memperbarui timestamp `waktuKeluar`.
- **API Endpoints**: `GET /api/server-log`, `POST /api/server-log`, `PATCH /api/server-log/[id]/exit`.

### 3.5 Modul Daily & Weekly Monitoring
- **Fungsi**: Pemantauan status pengerjaan tiket gangguan secara berkesinambungan.
- **Daily Monitoring (`/daily-monitoring`)**: Menampilkan tabel tiket yang masih berstatus `proses`. Dilengkapi fitur pencarian real-time (No Tiket, Cabang, Merek, Kerusakan).
- **Weekly Monitoring (`/weekly-monitoring`)**: Menampilkan riwayat seluruh tiket (Proses & Selesai) dengan filter rentang tanggal dan cabang.
- **Detail Tiket & Log Aktivitas**: Menampilkan informasi rinci unit komputer, status pengiriman ke vendor, serta timeline kronologi uraian kegiatan penanganan bertimestamp otomatis.
- **Close Tiket**: Menutup tiket (`status = selesai`, mencatat `waktuSelesai`).
- **API Endpoints**: `GET /api/tickets`, `GET /api/tickets/[id]`, `POST /api/tickets/[id]/activities`, `POST /api/tickets/[id]/close`.

### 3.6 Modul Supervisi & Approval Digital
- **Fungsi**: Halaman khusus role `supervisi` & `superadmin` untuk melakukan peninjauan pekerjaan.
- **Approval Tiket Workstation**: Membuka modal detail pekerjaan tiket berstatus `selesai`. Menekan tombol **"Approve Tiket"** otomatis membubuhkan Tanda Tangan Digital supervisor (`ttdUrl`).
- **Approval Log Server**: Menyetujui log akses server room berstatus `pending` menjadi `approved`.
- **API Endpoints**: `POST /api/tickets/[id]/approve-workstation`, `POST /api/server-log/[id]/approve`.

### 3.7 Modul Manajemen Akun & Master Cabang
- **Fungsi**: Pengelolaan data master sistem (khusus `superadmin`):
  - **Manajemen Akun (`/manajemen-akun`)**: CRUD User, reset password, atur role, upload foto profil & file tanda tangan digital (`ttdUrl`).
  - **Master Cabang (`/master-cabang`)**: CRUD Nama Cabang, Kode Kantor, dan Lokasi Kantor.
- **API Endpoints**: `GET/POST/PUT/DELETE /api/users`, `GET/POST/PUT/DELETE /api/workstation`.

### 3.8 Modul Rekap & Export Laporan Excel
- **Fungsi**: Mengunduh rekap laporan penanganan gangguan ke dalam format file Excel (`.xlsx`).
- **Layout Excel**: Diformat persis sesuai template resmi Bank Nagari (Form OPS-001) menggunakan `exceljs`, lengkap dengan header biru Bank Nagari, border tipis, dan Logo Bank Nagari di pojok kiri atas.
- **API Endpoints**: `GET /api/rekap/workstation`.

### 3.9 Modul Pengaturan Profil & Password
- **Fungsi**: Mengubah foto profil pribadi, memperbarui file tanda tangan digital, dan mengganti kata sandi.
- **API Endpoints**: `POST /api/me/foto`, `POST /api/me/ttd`, `POST /api/me/password`.

---

## 4. ARSITEKTUR APLIKASI MOBILE FLUTTERFLOW (`mobile/`)

Kode aplikasi mobile diletakkan di dalam folder `mobile/` pada repositori yang sama:

```
Project/
├── app/                  # Application Next.js 15 (Web Version - Laptop)
├── prisma/               # Database Schema & Migrations (PostgreSQL)
├── public/               # Uploaded Media Assets (Profil, TTD, Foto Server Log)
└── mobile/               # Application Flutter / FlutterFlow (Mobile Version - HP)
    ├── android/          # Native Android Configuration (CompileSdk 36, Kotlin v2)
    ├── ios/              # Native iOS Configuration (Camera Permissions)
    ├── lib/
    │   ├── api/          # REST API Service Client (ApiService)
    │   ├── custom_code/  # Custom Widgets (OcrCameraScannerWidget ML Kit)
    │   ├── models/       # Data Models (User, Ticket, ServerLog)
    │   └── main.dart     # Entry Point & Navigation UI Mobile
    └── pubspec.yaml      # Dependencies (google_mlkit_text_recognition, camera, dll)
```

### 📡 Koneksi API Service Mobile (`api_service.dart`)
Aplikasi mobile menggunakan class `ApiService` untuk berkomunikasi dengan REST API Next.js:
- **Emulator Android**: Menghubungi `http://10.0.2.2:3000/api`.
- **HP Fisik (Wi-Fi)**: Menghubungi IP lokal laptop (contoh: `http://192.168.1.10:3000/api`).

---

## 5. SPESIFIKASI FITUR SHORTCUT KAMERA OCR (GOOGLE ML KIT) DENGAN ROI OVERLAY

### 5.1 Desain UI Kamera dengan Cutout Rectangular Terang
Untuk mencegah kesalahan baca dari teks acak di luar fokus:
1. **Area Luar Box**: Diberikan overlay semi-transparan gelap (*dimmed* dengan Opacity 0.68).
2. **Area ROI Box (Tengah)**: **Persegi Panjang Terang Transparan**, dipagari oleh border **Cyan Neon Glowing** (`#00E5FF`) dengan sudut melengkung.
3. **Instruksi Visual**: Teks petunjuk melayang *"Posisikan teks (SN / MID / TID / No Surat) tepat di dalam kotak terang"*.

```
+---------------------------------------------------+
|               Semi-Transparent Dark               |
|                                                   |
|       +-----------------------------------+       |
|       |   [ TERANG / CLEAR ROI WINDOW ]   |       |
|       |   Arahkan SN / MID / TID ke sini  |       |
|       |   -----------------------------   |       |
|       |     SN: MY-5839210-X              |       |
|       +-----------------------------------+       |
|                 Border Neon Glowing               |
|                                                   |
|               Semi-Transparent Dark               |
|                                                   |
|       [ CANCEL ]              [ SALIN KE INPUT ]  |
+---------------------------------------------------+
```

### 5.2 Logika Filtering Teks Berdasarkan Region of Interest (ROI)
Setiap frame kamera diperiksa oleh `TextRecognizer.processImage(inputImage)`:
1. `TextBlock` -> `TextLine` diekstrak beserta koordinat `boundingBox`-nya `(left, top, right, bottom)`.
2. Sistem mencocokkan koordinat teks:
   $$\text{IsInsideROI} = \text{line.left} \ge \text{ROI.left} \land \text{line.right} \le \text{ROI.right} \land \text{line.top} \ge \text{ROI.top} \land \text{line.bottom} \le \text{ROI.bottom}$$
3. **Hanya teks yang posisinya berada penuh di dalam kotak transparan terang yang disalin**.

---

### 5.3 Kode Komponen Flutter Custom Widget (`ocr_camera_scanner_widget.dart`)

Berikut adalah kode komponen Flutter Custom Widget lengkap di `mobile/lib/custom_code/widgets/ocr_camera_scanner_widget.dart`:

```dart
import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:camera/camera.dart';
import 'package:google_mlkit_text_recognition/google_mlkit_text_recognition.dart';

class OcrCameraScannerWidget extends StatefulWidget {
  const OcrCameraScannerWidget({
    super.key,
    this.width,
    this.height,
    required this.targetFieldName,
    required this.onTextScanned,
  });

  final double? width;
  final double? height;
  final String targetFieldName; // Contoh: 'SN Komputer', 'MID / TID', 'No Surat'
  final Function(String scannedText) onTextScanned;

  @override
  State<OcrCameraScannerWidget> createState() => _OcrCameraScannerWidgetState();
}

class _OcrCameraScannerWidgetState extends State<OcrCameraScannerWidget> {
  CameraController? _cameraController;
  final TextRecognizer _textRecognizer = TextRecognizer(script: TextRecognitionScript.latin);
  bool _isProcessing = false;
  String _detectedText = "";
  List<CameraDescription> _cameras = [];

  @override
  void initState() {
    super.initState();
    _initializeCamera();
  }

  Future<void> _initializeCamera() async {
    try {
      _cameras = await availableCameras();
      if (_cameras.isNotEmpty) {
        _cameraController = CameraController(
          _cameras.first,
          ResolutionPreset.high,
          enableAudio: false,
        );
        await _cameraController!.initialize();
        if (!mounted) return;
        _cameraController!.startImageStream(_processCameraImage);
        setState(() {});
      }
    } catch (e) {
      debugPrint("Camera initialization error: $e");
    }
  }

  void _processCameraImage(CameraImage image) async {
    if (_isProcessing) return;
    _isProcessing = true;

    try {
      final WriteBuffer allBytes = WriteBuffer();
      for (final Plane plane in image.planes) {
        allBytes.putUint8List(plane.bytes);
      }
      final bytes = allBytes.done().buffer.asUint8List();

      final Size imageSize = Size(image.width.toDouble(), image.height.toDouble());
      final InputImageRotation imageRotation =
          InputImageRotationValue.fromRawValue(_cameras.first.sensorOrientation) ??
              InputImageRotation.rotation0deg;
      final InputImageFormat inputImageFormat =
          InputImageFormatValue.fromRawValue(image.format.raw) ?? InputImageFormat.nv21;

      final inputImage = InputImage.fromBytes(
        bytes: bytes,
        metadata: InputImageMetadata(
          size: imageSize,
          rotation: imageRotation,
          format: inputImageFormat,
          bytesPerRow: image.planes[0].bytesPerRow,
        ),
      );

      final RecognizedText recognizedText = await _textRecognizer.processImage(inputImage);

      // Koordinat ROI Cutout Box (Kotak Terang Tengah)
      final double roiLeft = imageSize.width * 0.15;
      final double roiTop = imageSize.height * 0.35;
      final double roiRight = imageSize.width * 0.85;
      final double roiBottom = imageSize.height * 0.55;

      String capturedInRoi = "";

      for (TextBlock block in recognizedText.blocks) {
        for (TextLine line in block.lines) {
          final Rect rect = line.boundingBox;
          if (rect.left >= roiLeft &&
              rect.right <= roiRight &&
              rect.top >= roiTop &&
              rect.bottom <= roiBottom) {
            capturedInRoi += "${line.text} ";
          }
        }
      }

      capturedInRoi = capturedInRoi.trim();

      if (capturedInRoi.isNotEmpty && capturedInRoi != _detectedText) {
        setState(() {
          _detectedText = capturedInRoi;
        });
      }
    } catch (e) {
      debugPrint("OCR Scanner Error: $e");
    } finally {
      _isProcessing = false;
    }
  }

  @override
  void dispose() {
    _cameraController?.dispose();
    _textRecognizer.close();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (_cameraController == null || !_cameraController!.value.isInitialized) {
      return Scaffold(
        backgroundColor: Colors.black,
        appBar: AppBar(
          title: Text("Scan OCR ${widget.targetFieldName}"),
          backgroundColor: const Color(0xFF00569E),
        ),
        body: const Center(
          child: CircularProgressIndicator(color: Color(0xFF00569E)),
        ),
      );
    }

    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        children: [
          Positioned.fill(child: CameraPreview(_cameraController!)),
          Positioned.fill(child: CustomPaint(painter: RoiOverlayPainter())),
          Positioned(
            top: 50,
            left: 20,
            right: 20,
            child: Column(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  decoration: BoxDecoration(
                    color: Colors.black.withValues(alpha: 0.75),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    "Scan ${widget.targetFieldName}",
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                    ),
                  ),
                ),
                const SizedBox(height: 8),
                const Text(
                  "Posisikan teks tepat di dalam kotak terang",
                  textAlign: TextAlign.center,
                  style: TextStyle(color: Colors.white70, fontSize: 13),
                ),
              ],
            ),
          ),
          Positioned(
            bottom: 40,
            left: 20,
            right: 20,
            child: Column(
              children: [
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.92),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        "Teks Terdeteksi (Dalam Kotak):",
                        style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.grey),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        _detectedText.isEmpty ? "Arahkan kamera ke teks..." : _detectedText,
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: _detectedText.isEmpty ? Colors.grey : const Color(0xFF00569E),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 14),
                Row(
                  children: [
                    Expanded(
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.grey.shade800,
                          padding: const EdgeInsets.symmetric(vertical: 14),
                        ),
                        onPressed: () => Navigator.pop(context),
                        child: const Text("Batal", style: TextStyle(color: Colors.white)),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF00569E),
                          padding: const EdgeInsets.symmetric(vertical: 14),
                        ),
                        onPressed: _detectedText.isEmpty
                            ? null
                            : () {
                                widget.onTextScanned(_detectedText);
                                Navigator.pop(context);
                              },
                        child: const Text(
                          "Salin ke Input",
                          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class RoiOverlayPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final double rectWidth = size.width * 0.85;
    final double rectHeight = size.height * 0.22;
    final double rectLeft = (size.width - rectWidth) / 2;
    final double rectTop = (size.height - rectHeight) / 2 - 30;

    final Rect roiRect = Rect.fromLTWH(rectLeft, rectTop, rectWidth, rectHeight);

    final Paint darkPaint = Paint()
      ..color = Colors.black.withValues(alpha: 0.68)
      ..style = PaintingStyle.fill;

    final Path backgroundPath = Path()..addRect(Rect.fromLTWH(0, 0, size.width, size.height));
    final Path roiPath = Path()..addRRect(RRect.fromRectAndRadius(roiRect, const Radius.circular(14)));

    final Path overlayPath = Path.combine(PathOperation.difference, backgroundPath, roiPath);
    canvas.drawPath(overlayPath, darkPaint);

    final Paint borderPaint = Paint()
      ..color = const Color(0xFF00E5FF)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 3.0;

    canvas.drawRRect(RRect.fromRectAndRadius(roiRect, const Radius.circular(14)), borderPaint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
```

---

## 6. PANDUAN PENGUJIAN & DEPLOYMENT (DOCKER WEB & MOBILE EMULATOR/DEVICE)

### 6.1 Jalankan Backend Server & Database (Docker)
1. Jalankan container Docker utama di root project:
   ```bash
   docker compose up -d
   ```
2. Aplikasi Web Next.js & REST API berjalan di **`http://localhost:3000`**.

### 6.2 Jalankan Aplikasi Mobile (Flutter CLI / Android Studio)
1. Buka terminal di folder `mobile`:
   ```bash
   cd mobile
   ```
2. Jalankan aplikasi ke Emulator atau HP Fisik:
   ```bash
   flutter run
   ```
3. Uji coba penginputan tiket dan shortcut **Scan OCR Kamera**. Hasil scan akan langsung otomatis terisi di kolom input dan tersimpan ke database PostgreSQL yang sama dengan Web!
