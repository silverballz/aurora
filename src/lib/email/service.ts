import nodemailer from "nodemailer";
import { Resend } from "resend";
import { memoryStore, loadStoreFromDisk, saveStoreToDisk } from "@/lib/data/store";

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
  registrationId?: string;
  qrDataUrl?: string;
  qrToken?: string;
  participantName?: string;
}

export interface DevEmailLog extends EmailPayload {
  id: string;
  timestamp: string;
  deliveredVia: string;
}

export function getDevMailbox(): DevEmailLog[] {
  loadStoreFromDisk();
  return [...memoryStore.sentEmails].reverse();
}

/**
 * Core send email abstraction function
 * Supports:
 * 1. Free Gmail SMTP (via Nodemailer)
 * 2. Free Resend API
 * 3. Built-in Persistent Outbox (always records every email + QR code)
 */
export async function sendEmail(
  payload: EmailPayload
): Promise<{
  success: boolean;
  realEmailDelivered: boolean;
  messageId?: string;
  deliveredVia?: string;
  error?: string;
}> {
  loadStoreFromDisk();

  const cfg = memoryStore.emailConfig;
  const resendKey = cfg?.resendApiKey || process.env.RESEND_API_KEY || "";
  const smtpUser = cfg?.smtpUser || process.env.SMTP_USER || "";
  const smtpPass = cfg?.smtpPass || process.env.SMTP_PASSWORD || "";
  const smtpHost = cfg?.smtpHost || process.env.SMTP_HOST || "smtp.gmail.com";
  const smtpPort = cfg?.smtpPort || parseInt(process.env.SMTP_PORT || "465", 10);
  const from =
    cfg?.fromEmail ||
    process.env.EMAIL_FROM ||
    (smtpUser ? `Kaltarang 2026 <${smtpUser}>` : "Kaltarang 2026 <onboarding@resend.dev>");

  const id = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  let deliveredVia = "outbox";
  let realEmailDelivered = false;
  let externalError: string | undefined;

  const qrBase64 = payload.qrDataUrl?.startsWith("data:image/png;base64,")
    ? payload.qrDataUrl.replace("data:image/png;base64,", "")
    : null;

  // 1. Try SMTP if configured (100% Free with Gmail App Password)
  if (smtpUser && smtpPass) {
    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      const emailHtmlForSmtp = qrBase64
        ? payload.html.replace(payload.qrDataUrl!, "cid:aurora-qr-pass")
        : payload.html;

      const info = await transporter.sendMail({
        from,
        to: payload.to,
        subject: payload.subject,
        html: emailHtmlForSmtp,
        text: payload.text,
        attachments: qrBase64
          ? [
              {
                filename: `${payload.registrationId || "Kaltarang-Pass"}-QR.png`,
                content: Buffer.from(qrBase64, "base64"),
                cid: "aurora-qr-pass",
              },
            ]
          : undefined,
      });

      deliveredVia = `smtp (${smtpUser})`;
      realEmailDelivered = true;
      console.log(`[AURORA EMAIL] Sent via SMTP to ${payload.to}: ${info.messageId}`);
    } catch (err: unknown) {
      externalError = err instanceof Error ? err.message : String(err);
      console.error("Failed sending email via SMTP:", externalError);
    }
  }
  // 2. Try Resend if configured (Free tier: 3,000 emails/month)
  else if (resendKey && !resendKey.startsWith("re_1234")) {
    try {
      const resend = new Resend(resendKey);
      const res = await resend.emails.send({
        from: from.includes("@kaltarang.in") ? "Kaltarang 2026 <onboarding@resend.dev>" : from,
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
        text: payload.text,
        attachments: qrBase64
          ? [
              {
                filename: `${payload.registrationId || "Kaltarang-Pass"}-QR.png`,
                content: Buffer.from(qrBase64, "base64"),
              },
            ]
          : undefined,
      });

      if (res.error) {
        externalError = res.error.message;
        console.error("Resend API error:", res.error);
      } else {
        deliveredVia = "resend";
        realEmailDelivered = true;
      }
    } catch (err: unknown) {
      externalError = err instanceof Error ? err.message : String(err);
      console.error("Failed sending email via Resend:", externalError);
    }
  }

  // Always record in persistent outbox so Admin can view/download/resend anytime
  memoryStore.sentEmails.push({
    id,
    to: payload.to,
    subject: payload.subject,
    html: payload.html,
    registrationId: payload.registrationId,
    qrDataUrl: payload.qrDataUrl,
    participantName: payload.participantName,
    timestamp: new Date().toISOString(),
    deliveredVia,
  });
  saveStoreToDisk();

  return {
    success: true,
    realEmailDelivered,
    messageId: id,
    deliveredVia,
    error: externalError,
  };
}

/**
 * 1. Approval & Single Static QR Pass Issuance Email
 */
export async function sendApprovalEmail(params: {
  to: string;
  participantName: string;
  registrationId: string;
  college: string;
  course: string;
  year: string;
  qrDataUrl: string;
  qrToken?: string;
  baseUrl?: string;
}) {
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 20px; background: #faf9fb; color: #1e1b24;">
      <div style="border-bottom: 2px solid #e8e3ec; padding-bottom: 16px; margin-bottom: 24px;">
        <h1 style="color: #b82885; font-size: 24px; margin: 0; font-family: Georgia, serif;">Kaltarang 2026 — Official Campus QR Pass</h1>
        <p style="color: #6a6473; font-size: 13px; text-transform: uppercase; letter-spacing: 0.1em; margin: 4px 0 0;">Rajiv Gandhi Institute of Petroleum Technology (RGIPT)</p>
      </div>

      <p style="font-size: 15px; line-height: 1.6;">Dear <strong>${params.participantName}</strong>,</p>
      <p style="font-size: 14px; line-height: 1.6; color: #3c3644;">
        Your external participant registration and identity documents for <strong>Kaltarang 2026</strong> have been verified and approved by the administration.
      </p>
      <p style="font-size: 14px; line-height: 1.6; color: #3c3644;">
        Below is your <strong>single static QR Access Pass</strong> valid for all campus entries and exits throughout the entire fest:
      </p>

      <div style="background: #ffffff; border: 2px solid #b82885; border-radius: 12px; padding: 24px; margin: 24px 0; text-align: center;">
        <p style="margin: 0 0 8px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.15em; color: #6a6473;">Official Registration ID</p>
        <p style="margin: 0 0 16px; font-size: 26px; font-weight: 800; color: #b82885; font-family: monospace;">${params.registrationId}</p>

        <div style="display: inline-block; padding: 14px; border: 1px solid #e8e3ec; border-radius: 8px; background: #ffffff;">
          <img src="${params.qrDataUrl}" alt="Campus Access QR Pass" width="240" height="240" style="display: block; margin: 0 auto;" />
        </div>

        <p style="margin: 16px 0 0; font-size: 13px; font-weight: 600; color: #1e1b24;">
          Save this email or screenshot this QR code.
        </p>
        <p style="margin: 4px 0 0; font-size: 12px; color: #6a6473;">
          Present this single QR pass at any RGIPT campus gate for entry and exit verification.
        </p>
      </div>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 14px; background: #ffffff; border: 1px solid #e8e3ec; border-radius: 8px;">
        <tr><td style="padding: 10px 14px; color: #6a6473; border-bottom: 1px solid #e8e3ec;">Participant Name:</td><td style="padding: 10px 14px; font-weight: 600; border-bottom: 1px solid #e8e3ec;">${params.participantName}</td></tr>
        <tr><td style="padding: 10px 14px; color: #6a6473;">College / Institution:</td><td style="padding: 10px 14px; font-weight: 600;">${params.college}</td></tr>
      </table>

      <p style="font-size: 12px; color: #8e8797; margin-top: 24px; border-top: 1px solid #e8e3ec; padding-top: 16px;">
        This QR pass is personal and non-transferable. Security personnel at the gate will visually match your face against your registered photograph upon scanning.
      </p>
    </div>
  `;

  return sendEmail({
    to: params.to,
    subject: `Kaltarang 2026 — Your Official Campus QR Pass (${params.registrationId})`,
    html,
    text: `Dear ${params.participantName}, Your Kaltarang 2026 Campus Registration (${params.registrationId}) is APPROVED. Please open this email or see the attached QR PNG to scan at RGIPT campus gates.`,
    registrationId: params.registrationId,
    qrDataUrl: params.qrDataUrl,
    qrToken: params.qrToken,
    participantName: params.participantName,
  });
}

/**
 * 2. Correction Request Email
 */
export async function sendCorrectionEmail(params: {
  to: string;
  participantName: string;
  reason: string;
}) {
  const registerUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/register`;

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 20px; background: #faf9fb;">
      <h2 style="color: #b82885; font-family: Georgia, serif; margin: 0 0 16px;">Action Required: Registration Correction</h2>
      <p style="font-size: 15px; color: #3c3644;">Dear <strong>${params.participantName}</strong>,</p>
      <p style="font-size: 14px; color: #3c3644; line-height: 1.6;">
        The Kaltarang 2026 verification desk reviewed your submission and requires a correction before your campus QR pass can be issued:
      </p>

      <div style="background: #fff8eb; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0; border-radius: 4px;">
        <p style="margin: 0; font-size: 14px; color: #92400e;"><strong>Correction Reason:</strong></p>
        <p style="margin: 8px 0 0; font-size: 14px; color: #92400e;">${params.reason}</p>
      </div>

      <p style="font-size: 14px; color: #3c3644;">Please submit your updated registration details using the registration form:</p>
      <div style="margin: 24px 0;">
        <a href="${registerUrl}" style="background-color: #b82885; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">
          Open Registration Form &rarr;
        </a>
      </div>
    </div>
  `;

  return sendEmail({
    to: params.to,
    subject: "Kaltarang 2026 — Registration Correction Required",
    html,
    participantName: params.participantName,
  });
}

/**
 * 3. Rejection Email
 */
export async function sendRejectionEmail(params: {
  to: string;
  participantName: string;
  reason: string;
}) {
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 20px; background: #faf9fb;">
      <h2 style="color: #ef4444; font-family: Georgia, serif; margin: 0 0 16px;">Registration Application Status</h2>
      <p style="font-size: 15px; color: #3c3644;">Dear <strong>${params.participantName}</strong>,</p>
      <p style="font-size: 14px; color: #3c3644; line-height: 1.6;">
        We regret to inform you that your external participant registration for Kaltarang 2026 could not be approved.
      </p>
      <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; margin: 20px 0; border-radius: 4px;">
        <p style="margin: 0; font-size: 14px; color: #991b1b;"><strong>Reason:</strong></p>
        <p style="margin: 8px 0 0; font-size: 14px; color: #991b1b;">${params.reason}</p>
      </div>
      <p style="font-size: 13px; color: #6a6473;">If you believe this decision was made in error, please contact the Kaltarang Fest Administration.</p>
    </div>
  `;

  return sendEmail({
    to: params.to,
    subject: "Kaltarang 2026 — Registration Application Status",
    html,
    participantName: params.participantName,
  });
}

/**
 * 4. Legacy helpers kept for API compatibility
 */
export async function sendInvitationEmail(params: {
  to: string;
  participantName: string;
  inviteToken: string;
  expiresAt: string;
}) {
  const registerUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/register`;
  return sendEmail({
    to: params.to,
    subject: "Kaltarang 2026 — Complete Your Participant Registration",
    html: `<p>Dear ${params.participantName}, please complete your registration at <a href="${registerUrl}">${registerUrl}</a>.</p>`,
    participantName: params.participantName,
  });
}

export async function sendOtpEmail(params: { to: string; otp: string }) {
  return sendEmail({
    to: params.to,
    subject: "Kaltarang 2026 — Verification Code",
    html: `<p>Your code is: <strong>${params.otp}</strong></p>`,
  });
}

export async function sendRevocationEmail(params: {
  to: string;
  participantName: string;
  reason: string;
}) {
  return sendEmail({
    to: params.to,
    subject: "Kaltarang 2026 — Campus Access Pass Revoked",
    html: `<p>Dear ${params.participantName}, your campus pass has been revoked. Reason: ${params.reason}</p>`,
    participantName: params.participantName,
  });
}
