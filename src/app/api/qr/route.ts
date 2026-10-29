import { NextResponse } from "next/server";
import QRCode from "qrcode";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const data = searchParams.get("data") || "KLT26-PASS";

    const pngBuffer = await QRCode.toBuffer(data, {
      errorCorrectionLevel: "M",
      margin: 4,
      width: 400,
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
    });

    return new NextResponse(new Uint8Array(pngBuffer), {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("QR PNG generation error:", error);
    return NextResponse.json({ error: "Failed to render QR PNG" }, { status: 500 });
  }
}
