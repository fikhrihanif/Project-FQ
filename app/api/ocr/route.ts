import { NextRequest, NextResponse } from "next/server";
import createWorker from "tesseract.js";

function cleanAndExtractText(rawText: string, targetField: string): string {
  if (!rawText || !rawText.trim()) return "";

  const fieldUpper = targetField.toUpperCase();
  const rawCleaned = rawText.replace(/\r/g, "");

  // 1. Dapatkan semua baris teks
  const lines = rawCleaned
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length >= 3);

  // Helper untuk membersihkan kerancuan OCR angka (O->0, I->1, S->5, Z->2)
  const fixDigitConfusion = (str: string) => {
    return str
      .replace(/[Oo]/g, "0")
      .replace(/[Ii|l]/g, "1")
      .replace(/[Ss]/g, "5")
      .replace(/[Zz]/g, "2")
      .replace(/[B]/g, "8");
  };

  // Target: NO SURAT CABANG / SURAT
  if (fieldUpper.includes("SURAT")) {
    for (const line of lines) {
      const matchSurat = line.match(/([A-Z0-9\-\/]{6,35})/i);
      if (matchSurat && (matchSurat[0].includes("/") || matchSurat[0].includes("-"))) {
        return matchSurat[0].toUpperCase();
      }
    }
    const combined = lines.join(" ").replace(/[^a-zA-Z0-9\-\/]/g, " ");
    const match = combined.match(/[A-Z0-9]{2,10}[\/\-][A-Z0-9]{2,10}[\/\-][A-Z0-9]{2,10}/i);
    if (match) return match[0].toUpperCase();
  }

  // Target: MID atau TID
  if (fieldUpper.includes("MID") || fieldUpper.includes("TID")) {
    for (const line of lines) {
      const fixedLine = fixDigitConfusion(line);
      const match = fixedLine.match(/\b\d{6,15}\b/);
      if (match) return match[0];
    }
    const numbersOnly = fixDigitConfusion(rawCleaned).match(/\b\d{6,15}\b/);
    if (numbersOnly) return numbersOnly[0];
  }

  // Target: SN / SERIAL NUMBER
  if (fieldUpper.includes("SN") || fieldUpper.includes("SERIAL")) {
    for (const line of lines) {
      if (
        line.toUpperCase().includes("SN") ||
        line.toUpperCase().includes("S/N") ||
        line.toUpperCase().includes("SERIAL")
      ) {
        const afterPrefix = line.replace(/^(SN|S\/N|SERIAL|NO|NUM|\:|\=|\s)+/i, "").trim();
        const cleaned = fixDigitConfusion(afterPrefix).replace(/[^A-Z0-9\-]/gi, "");
        if (cleaned.length >= 4) return cleaned.toUpperCase();
      }
    }
    for (const line of lines) {
      const matchSn = line.match(/([A-Z0-9\-]{5,25})/i);
      if (matchSn) return fixDigitConfusion(matchSn[0]).toUpperCase();
    }
  }

  // Fallback: Ambil baris pertama yang paling bersih
  if (lines.length > 0) {
    const firstLine = lines.find((l) => /[a-zA-Z0-9]/.test(l)) || lines[0];
    return firstLine.replace(/[^a-zA-Z0-9\-\/]/g, " ").trim().slice(0, 35);
  }

  return "";
}

export async function POST(req: NextRequest) {
  try {
    const { image, targetField } = await req.json();

    if (!image || typeof image !== "string") {
      return NextResponse.json({ error: "Gambar tidak ditemukan." }, { status: 400 });
    }

    // Strip base64 prefix if present
    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
    const imageBuffer = Buffer.from(base64Data, "base64");

    // Perform OCR recognition using Tesseract.js
    const worker = await createWorker.createWorker("eng");
    const { data } = await worker.recognize(imageBuffer);
    await worker.terminate();

    const rawText = data.text || "";
    const extracted = cleanAndExtractText(rawText, targetField || "");

    return NextResponse.json({
      success: true,
      text: extracted || rawText.trim(),
      rawText: rawText.trim(),
    });
  } catch (err: any) {
    console.error("OCR API error:", err);
    return NextResponse.json(
      { error: "Gagal memproses OCR gambar.", details: err?.message },
      { status: 500 }
    );
  }
}
