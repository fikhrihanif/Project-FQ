import { NextRequest, NextResponse } from "next/server";
import createWorker from "tesseract.js";

function cleanAndExtractText(rawText: string, targetField: string): string {
  if (!rawText) return "";

  // Split lines and clean whitespace
  const lines = rawText
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const fieldUpper = targetField.toUpperCase();

  // Try to find matching line
  for (const line of lines) {
    const cleanLine = line.replace(/[^a-zA-Z0-9\-\/]/g, "");

    if (fieldUpper.includes("MID") || fieldUpper.includes("TID")) {
      const matchNumbers = cleanLine.match(/\d{6,15}/);
      if (matchNumbers) return matchNumbers[0];
    }

    if (fieldUpper.includes("SURAT")) {
      const matchSurat = cleanLine.match(/[A-Za-z0-9\-\/]{6,30}/);
      if (matchSurat) return matchSurat[0];
    }

    if (fieldUpper.includes("SN") || fieldUpper.includes("SERIAL")) {
      const matchSn = cleanLine.match(/[A-Z0-9\-]{5,25}/);
      if (matchSn) return matchSn[0];
    }
  }

  // Fallback to first non-empty line cleaned
  const fallback = rawText.replace(/[^a-zA-Z0-9\-\/]/g, "").trim();
  return fallback.slice(0, 30);
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
