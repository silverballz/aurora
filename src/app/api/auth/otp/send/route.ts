import { NextResponse } from "next/server";
import { memoryStore } from "@/lib/data/store";
import { sendOtpEmail } from "@/lib/email/service";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email address is required" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check rate limiting / existing OTP
    const existing = memoryStore.otpCodes.get(normalizedEmail);
    if (existing && Date.now() < existing.expiresAt && existing.attempts >= 5) {
      return NextResponse.json(
        { error: "Too many attempts. Please wait 10 minutes before requesting a new code." },
        { status: 429 }
      );
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    memoryStore.otpCodes.set(normalizedEmail, {
      code: otp,
      expiresAt,
      attempts: 0,
    });

    // Send email via email service abstraction (free Resend, free SMTP, or dev console)
    await sendOtpEmail({
      to: normalizedEmail,
      otp,
    });

    const hasLiveProvider = Boolean(
      process.env.RESEND_API_KEY ||
      (process.env.SMTP_USER && process.env.SMTP_PASSWORD)
    );

    return NextResponse.json({
      success: true,
      message: hasLiveProvider
        ? `Authentication code sent to ${normalizedEmail.slice(0, 2)}***${normalizedEmail.slice(normalizedEmail.indexOf("@"))}`
        : `Your verification code is: ${otp}`,
      devHint: otp,
    });
  } catch (error) {
    console.error("OTP send error:", error);
    return NextResponse.json({ error: "Failed to send authentication code" }, { status: 500 });
  }
}
