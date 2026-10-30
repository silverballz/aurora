import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key");
    const field = searchParams.get("f") || "selfie";

    if (!key) {
      return NextResponse.redirect(new URL("/assets/participant-avatar.jpg", request.url));
    }

    const res = await fetch(`https://bytebin.lucko.me/${encodeURIComponent(key)}`, {
      next: { revalidate: 31536000 },
    });

    if (!res.ok) {
      return NextResponse.redirect(new URL("/assets/participant-avatar.jpg", request.url));
    }

    const json = await res.json();
    const dataUrl: string | undefined = json?.[field];

    if (!dataUrl || typeof dataUrl !== "string") {
      return NextResponse.redirect(new URL("/assets/participant-avatar.jpg", request.url));
    }

    const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) {
      return NextResponse.redirect(new URL("/assets/participant-avatar.jpg", request.url));
    }

    const mimeType = match[1] || "image/jpeg";
    const base64Data = match[2];
    const buffer = Buffer.from(base64Data, "base64");

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": mimeType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (err) {
    console.warn("Doc image fetch error:", err);
    return NextResponse.redirect(new URL("/assets/participant-avatar.jpg", request.url));
  }
}
