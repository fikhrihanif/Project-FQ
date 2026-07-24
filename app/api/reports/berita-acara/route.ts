import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

function formatIndonesianDate(date: Date) {
  const hariList = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const bulanList = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];
  const hari = hariList[date.getDay()];
  const tgl = date.getDate();
  const bulan = bulanList[date.getMonth()];
  const tahun = date.getFullYear();
  return {
    hari,
    tglFull: `${tgl} ${bulan} ${tahun}`,
    hariTglFull: `${hari} Tanggal ${tgl} ${bulan} ${tahun}`
  };
}

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Tidak terautentikasi." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const ticketId = searchParams.get("ticketId");
    const format = searchParams.get("format") ?? "word"; // "word" | "print"

    if (!ticketId) {
      return NextResponse.json({ error: "Parameter ticketId wajib diisi." }, { status: 400 });
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        owner: { select: { nama: true } },
      },
    });

    if (!ticket) {
      return NextResponse.json({ error: "Tiket tidak ditemukan." }, { status: 404 });
    }

    const tglMasuk = ticket.wsTanggalMasuk ? new Date(ticket.wsTanggalMasuk) : new Date();
    const dateFormatted = formatIndonesianDate(tglMasuk);

    const merekKomputer = ticket.wsMerekKomputer || "";
    const isEdc = merekKomputer.toLowerCase().includes("edc");
    const tipePerangkatStr = isEdc ? "Mesin EDC" : "Komputer All in One";
    const namaCabangStr = ticket.wsCabang || "Utama";
    const namaMerekPerangkatStr = merekKomputer.replace(/^\[.*?\]\s*/, "") || "Perangkat Workstation";
    const snStr = ticket.wsSnKomputer || "-";
    const namaPetugasStr = (ticket.owner?.nama || session.username || "DIMAS TEGUH PRIBADI").toUpperCase();

    const htmlContent = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="utf-8">
<title>BERITA ACARA SERAH TERIMA PERANGKAT - ${ticket.noTiket}</title>
<style>
  @page {
    size: A4 portrait;
    margin: 20mm 20mm 20mm 20mm;
  }
  body {
    font-family: 'Arial', sans-serif;
    font-size: 13px;
    line-height: 1.6;
    color: #000000;
    background-color: #ffffff;
    margin: 0;
    padding: ${format === 'print' ? '20px' : '0'};
  }
  .header-logo {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    margin-bottom: 24px;
  }
  .logo-text {
    font-size: 24px;
    font-weight: 800;
    color: #00569E;
    letter-spacing: -0.5px;
  }
  .logo-text span {
    color: #E53E3E;
  }
  .title-section {
    text-align: center;
    margin-bottom: 28px;
  }
  .title-section h1 {
    font-size: 16px;
    font-weight: bold;
    margin: 0;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .title-section h2 {
    font-size: 15px;
    font-weight: bold;
    margin: 4px 0 0 0;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .intro-paragraph {
    margin-bottom: 20px;
    text-align: justify;
  }
  table.detail-table {
    width: 100%;
    border-collapse: collapse;
    margin: 20px 0;
  }
  table.detail-table th, table.detail-table td {
    border: 1px solid #000000;
    padding: 10px 12px;
    font-size: 13px;
  }
  table.detail-table th {
    background-color: #99CCFF;
    font-weight: bold;
    text-align: center;
  }
  table.detail-table td.center {
    text-align: center;
  }
  .closing-paragraph {
    margin-top: 24px;
    margin-bottom: 28px;
  }
  .location-date {
    text-align: center;
    margin-bottom: 20px;
    font-size: 13px;
  }
  table.signature-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 10px;
  }
  table.signature-table td {
    border: 1px solid #000000;
    width: 50%;
    vertical-align: top;
    padding: 16px 20px;
    height: 150px;
  }
  .sig-title {
    font-size: 13px;
    margin-bottom: 2px;
  }
  .sig-dept {
    font-size: 13px;
    margin-bottom: 64px;
  }
  .sig-name {
    font-size: 13px;
    font-weight: bold;
    text-decoration: underline;
  }
  .sig-role {
    font-size: 12px;
    color: #333333;
  }
  .print-btn-bar {
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: #00569E;
    color: #fff;
    padding: 10px 20px;
    border-radius: 30px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    cursor: pointer;
    font-weight: bold;
    display: flex;
    align-items: center;
    gap: 8px;
    z-index: 9999;
  }
  @media print {
    .print-btn-bar { display: none !important; }
  }
</style>
</head>
<body>
  ${format === 'print' ? `
    <div className="print-btn-bar" onclick="window.print()">
      🖨️ Cetak Dokumentasi PDF / Word
    </div>
  ` : ''}

  <table style="width:100%; border:none; margin-bottom:20px;">
    <tr>
      <td style="border:none; padding:0;">
        <div style="font-size: 22px; font-weight: bold; color: #0B1941;">
          Fast <span style="color:#EAB308;">Queue</span>
        </div>
      </td>
    </tr>
  </table>

  <div className="title-section">
    <h1>BERITA ACARA</h1>
    <h2>SERAH TERIMA PERANGKAT</h2>
  </div>

  <p className="intro-paragraph">
    Pada hari ini ${dateFormatted.hariTglFull} telah di lakukan penyerahan 1 unit perangkat ${tipePerangkatStr} milik Cabang ${namaCabangStr} dengan detail sebagai berikut:
  </p>

  <table className="detail-table">
    <thead>
      <tr>
        <th style="width: 10%; text-align:center;">No</th>
        <th style="width: 55%; text-align:center;">Nama Perangkat</th>
        <th style="width: 35%; text-align:center;">S/N</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td style="text-align: center;">1</td>
        <td>${namaMerekPerangkatStr}</td>
        <td style="text-align: center;">${snStr}</td>
      </tr>
    </tbody>
  </table>

  <p className="closing-paragraph">
    Demikianlah tanda terima ini dibuat rangkap 2 (dua) untuk dapat digunakan sebagaimana mestinya.
  </p>

  <div className="location-date">
    Padang, ${dateFormatted.tglFull}
  </div>

  <table className="signature-table">
    <tr>
      <td>
        <div className="sig-title">Diserahkan oleh:</div>
        <div className="sig-dept">Bagian Infrastruktur Divisi T&D</div>
        <div className="sig-name">${namaPetugasStr}</div>
        <div className="sig-role">Staff</div>
      </td>
      <td>
        <div className="sig-title">Diterima oleh:</div>
        <div className="sig-dept">Cabang ${namaCabangStr}</div>
      </td>
    </tr>
  </table>
</body>
</html>`;

    if (format === "print") {
      return new Response(htmlContent, {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    // Default: Download sebagai Word File (.doc / .docx compatible)
    const filename = `BERITA_ACARA_${ticket.noTiket.replace(/[^a-zA-Z0-9-]/g, "_")}.doc`;
    return new Response(htmlContent, {
      headers: {
        "Content-Type": "application/msword; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("[GET /api/reports/berita-acara]", error);
    return NextResponse.json({ error: "Gagal membuat dokumen berita acara." }, { status: 500 });
  }
}
