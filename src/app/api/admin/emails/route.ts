import { NextResponse } from "next/server";
import { memoryStore, loadStoreFromDisk, saveStoreToDisk } from "@/lib/data/store";

export async function GET() {
  loadStoreFromDisk();
  return NextResponse.json({
    emails: [...memoryStore.sentEmails].reverse(),
    config: {
      provider: memoryStore.emailConfig.provider,
      smtpHost: memoryStore.emailConfig.smtpHost || "smtp.gmail.com",
      smtpPort: memoryStore.emailConfig.smtpPort || 465,
      smtpUser: memoryStore.emailConfig.smtpUser || "",
      hasSmtpPass: Boolean(memoryStore.emailConfig.smtpPass),
      hasResendKey: Boolean(memoryStore.emailConfig.resendApiKey),
      fromEmail: memoryStore.emailConfig.fromEmail || "Kaltarang 2026 <no-reply@kaltarang.in>",
    },
  });
}

export async function POST(request: Request) {
  try {
    loadStoreFromDisk();
    const body = await request.json();
    const { smtpHost, smtpPort, smtpUser, smtpPass, resendApiKey, fromEmail } = body;

    if (smtpUser !== undefined) memoryStore.emailConfig.smtpUser = smtpUser.trim();
    if (smtpPass !== undefined && smtpPass.trim() !== "") {
      memoryStore.emailConfig.smtpPass = smtpPass.trim();
    }
    if (smtpHost !== undefined) memoryStore.emailConfig.smtpHost = smtpHost.trim() || "smtp.gmail.com";
    if (smtpPort !== undefined) memoryStore.emailConfig.smtpPort = Number(smtpPort) || 465;
    if (resendApiKey !== undefined && resendApiKey.trim() !== "") {
      memoryStore.emailConfig.resendApiKey = resendApiKey.trim();
    }
    if (fromEmail !== undefined) memoryStore.emailConfig.fromEmail = fromEmail.trim();

    if (memoryStore.emailConfig.smtpUser && memoryStore.emailConfig.smtpPass) {
      memoryStore.emailConfig.provider = "smtp";
    } else if (memoryStore.emailConfig.resendApiKey) {
      memoryStore.emailConfig.provider = "resend";
    } else {
      memoryStore.emailConfig.provider = "console";
    }

    saveStoreToDisk();

    return NextResponse.json({
      success: true,
      message: "Email delivery settings saved.",
      provider: memoryStore.emailConfig.provider,
    });
  } catch (err) {
    console.error("Email config error:", err);
    return NextResponse.json({ error: "Failed to save email settings" }, { status: 500 });
  }
}
