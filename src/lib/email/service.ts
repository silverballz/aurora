import nodemailer from "nodemailer";
import { Resend } from "resend";

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface DevEmailLog extends EmailPayload {
  id: string;
  timestamp: string;
}

// In-memory development outbox for zero-dependency testing & verification
const devMailbox: DevEmailLog[] = [];

export function getDevMailbox(): DevEmailLog[] {
  return [...devMailbox].reverse();
}

/**
 * Core send email abstraction function
 */
export async function sendEmail(payload: EmailPayload): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const provider = process.env.EMAIL_PROVIDER || (process.env.RESEND_API_KEY ? "resend" : process.env.SMTP_USER ? "smtp" : "console");
  const from = process.env.EMAIL_FROM || "Kaltarang 2026 <no-reply@kaltarang.in>";

  // 1. Console / Development Fallback (Free & zero-credential)
  if (provider === "console" || (!process.env.RESEND_API_KEY && !process.env.SMTP_USER)) {
    const id = `dev_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const logEntry: DevEmailLog = {
      ...payload,
      id,
      timestamp: new Date().toISOString(),
    };
    devMailbox.push(logEntry);
    console.log(`\n================== [AURORA DEV EMAIL] ==================`);
    console.log(`TO: ${payload.to}`);
    console.log(`SUBJECT: ${payload.subject}`);
    console.log(`TIME: ${logEntry.timestamp}`);
    console.log(`--------------------------------------------------------`);
    console.log(payload.text || payload.html.replace(/<[^>]+>/g, " ").slice(0, 300));
    console.log(`========================================================\n`);

    return { success: true, messageId: id };
  }

  // 2. Resend (Free tier: 3,000 emails/month free)
  if (provider === "resend" && process.env.RESEND_API_KEY) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const res = await resend.emails.send({
        from,
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
        text: payload.text,
      });

      if (res.error) {
        console.error("Resend API error:", res.error);
        return { success: false, error: res.error.message };
      }

      return { success: true, messageId: res.data?.id };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error("Failed sending email via Resend:", errorMsg);
      return { success: false, error: errorMsg };
    }
  }

  // 3. Free SMTP (e.g., Gmail SMTP or Brevo free tier)
  if (provider === "smtp" && process.env.SMTP_USER) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || "smtp.gmail.com",
        port: parseInt(process.env.SMTP_PORT || "465", 10),
        secure: process.env.SMTP_SECURE === "true" || process.env.SMTP_PORT === "465",
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        },
      });

      const info = await transporter.sendMail({
        from,
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
        text: payload.text,
      });

      return { success: true, messageId: info.messageId };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error("Failed sending email via SMTP:", errorMsg);
      return { success: false, error: errorMsg };
    }
  }

  return { success: false, error: "No configured email delivery provider." };
}

// ----------------------------------------------------------------------
// Specific Email Methods required by Aurora specifications
// ----------------------------------------------------------------------

/**
 * 1. Invitation Email with single-use secure button
 */
export async function sendInvitationEmail(params: {
  to: string;
  participantName: string;
  inviteToken: string;
  expiresAt: string;
}) {
  const portalUrl = process.env.NEXT_PUBLIC_PORTAL_URL || `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/portal`;
  const inviteUrl = `${portalUrl}/invite/${params.inviteToken}`;
  const expiryFormatted = new Date(params.expiresAt).toLocaleDateString("en-IN", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 20px; color: #1e1b24; background: #faf9fb;">
      <div style="border-bottom: 2px solid #e8e3ec; padding-bottom: 16px; margin-bottom: 24px;">
        <h1 style="color: #b82885; font-size: 24px; margin: 0; font-family: Georgia, serif;">Aurora · Kaltarang 2026</h1>
        <p style="color: #6a6473; font-size: 13px; text-transform: uppercase; letter-spacing: 0.1em; margin: 4px 0 0;">RGIPT External Participant Identity System</p>
      </div>

      <p style="font-size: 16px; line-height: 1.6;">Dear <strong>${params.participantName}</strong>,</p>
      <p style="font-size: 15px; line-height: 1.6; color: #3c3644;">
        Your participation fee for <strong>Kaltarang 2026 at RGIPT</strong> has been verified by the fest administration.
        You are now invited to complete your official external participant registration and digital campus access credential.
      </p>

      <div style="margin: 32px 0; text-align: center;">
        <a href="${inviteUrl}" style="background-color: #b82885; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 15px; display: inline-block;">
          Complete Registration &rarr;
        </a>
      </div>

      <div style="background: #ffffff; border: 1px solid #e8e3ec; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
        <p style="margin: 0; font-size: 13px; color: #6a6473;"><strong>Important:</strong></p>
        <ul style="margin: 8px 0 0; padding-left: 20px; font-size: 13px; color: #6a6473; line-height: 1.5;">
          <li>This link is secure, single-use, and issued exclusively to <strong>${params.to}</strong>.</li>
          <li>Invitation expires on: <strong>${expiryFormatted}</strong>.</li>
          <li>You will need a valid Student ID, Government ID (Aadhaar), and your device camera for a live identity photo.</li>
        </ul>
      </div>

      <p style="font-size: 12px; color: #8e8797; line-height: 1.5; border-top: 1px solid #e8e3ec; padding-top: 16px;">
        Direct link: <a href="${inviteUrl}" style="color: #b82885;">${inviteUrl}</a><br/>
        If you did not make this request or have questions, contact the Kaltarang Registration Desk at support@kaltarang.in.
      </p>
    </div>
  `;

  return sendEmail({
    to: params.to,
    subject: "Kaltarang 2026 — Complete Your External Participant Registration",
    html,
  });
}

/**
 * 2. OTP Authentication Email
 */
export async function sendOtpEmail(params: {
  to: string;
  otp: string;
}) {
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 500px; margin: 0 auto; padding: 32px 20px; background: #faf9fb;">
      <h2 style="color: #b82885; font-family: Georgia, serif; margin: 0 0 16px;">Aurora Verification Code</h2>
      <p style="font-size: 15px; color: #3c3644;">Your one-time authentication code for Kaltarang 2026 registration is:</p>
      <div style="background: #ffffff; border: 2px dashed #b82885; padding: 16px; text-align: center; font-size: 32px; font-weight: 700; letter-spacing: 0.25em; color: #b82885; margin: 24px 0; border-radius: 8px;">
        ${params.otp}
      </div>
      <p style="font-size: 13px; color: #6a6473;">This code expires in 10 minutes. Never share this code with anyone.</p>
    </div>
  `;

  return sendEmail({
    to: params.to,
    subject: "Kaltarang 2026 — Your Authentication Code",
    html,
  });
}

/**
 * 3. Correction Request Email
 */
export async function sendCorrectionEmail(params: {
  to: string;
  participantName: string;
  reason: string;
}) {
  const portalUrl = process.env.NEXT_PUBLIC_PORTAL_URL || `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/portal`;

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

      <p style="font-size: 14px; color: #3c3644;">Please sign in to update the required details or re-upload your document:</p>
      <div style="margin: 24px 0;">
        <a href="${portalUrl}/registration" style="background-color: #b82885; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">
          Update Registration &rarr;
        </a>
      </div>
    </div>
  `;

  return sendEmail({
    to: params.to,
    subject: "Kaltarang 2026 — Registration Correction Required",
    html,
  });
}

/**
 * 4. Approval & QR Pass Issuance Email
 */
export async function sendApprovalEmail(params: {
  to: string;
  participantName: string;
  registrationId: string;
  college: string;
  course: string;
  year: string;
  qrDataUrl: string;
}) {
  const portalUrl = process.env.NEXT_PUBLIC_PORTAL_URL || `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/portal`;

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 20px; background: #faf9fb; color: #1e1b24;">
      <div style="border-bottom: 2px solid #e8e3ec; padding-bottom: 16px; margin-bottom: 24px;">
        <h1 style="color: #b82885; font-size: 24px; margin: 0; font-family: Georgia, serif;">Registration Confirmed</h1>
        <p style="color: #6a6473; font-size: 13px; text-transform: uppercase; letter-spacing: 0.1em; margin: 4px 0 0;">Kaltarang 2026 · RGIPT</p>
      </div>

      <p style="font-size: 15px; line-height: 1.6;">Dear <strong>${params.participantName}</strong>,</p>
      <p style="font-size: 14px; line-height: 1.6; color: #3c3644;">
        Your Kaltarang 2026 external participant registration and identity documents have been successfully verified and approved.
      </p>

      <div style="background: #ffffff; border: 1px solid #e8e3ec; border-radius: 8px; padding: 20px; margin: 24px 0; text-align: center;">
        <p style="margin: 0 0 12px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.15em; color: #6a6473;">Official Registration ID</p>
        <p style="margin: 0 0 16px; font-size: 24px; font-weight: 800; color: #b82885; font-family: monospace;">${params.registrationId}</p>

        <div style="display: inline-block; padding: 12px; border: 1px solid #e8e3ec; border-radius: 8px; background: #ffffff;">
          <img src="${params.qrDataUrl}" alt="Campus Access QR Pass" width="220" height="220" style="display: block; margin: 0 auto;" />
        </div>

        <p style="margin: 16px 0 0; font-size: 12px; color: #8e8797;">
          Present this QR pass at campus gates for entry and exit verification.
        </p>
      </div>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 14px;">
        <tr><td style="padding: 8px 0; color: #6a6473;">Institution:</td><td style="padding: 8px 0; font-weight: 600;">${params.college}</td></tr>
        <tr><td style="padding: 8px 0; color: #6a6473;">Course / Degree:</td><td style="padding: 8px 0; font-weight: 600;">${params.course}</td></tr>
        <tr><td style="padding: 8px 0; color: #6a6473;">Year of Study:</td><td style="padding: 8px 0; font-weight: 600;">${params.year}</td></tr>
      </table>

      <div style="text-align: center; margin-top: 24px;">
        <a href="${portalUrl}/pass" style="background-color: #b82885; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">
          View Live Pass in Portal &rarr;
        </a>
      </div>

      <p style="font-size: 12px; color: #8e8797; margin-top: 32px; border-top: 1px solid #e8e3ec; padding-top: 16px;">
        This pass is non-transferable. Visual identity checks against your registered photograph will be performed at the campus gates.
      </p>
    </div>
  `;

  return sendEmail({
    to: params.to,
    subject: "Kaltarang 2026 — Registration Confirmed & Campus QR Pass",
    html,
  });
}

/**
 * 5. Rejection Email
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
      <p style="font-size: 13px; color: #6a6473;">If you believe this decision was made in error, please contact the Kaltarang Fest Administration at support@kaltarang.in.</p>
    </div>
  `;

  return sendEmail({
    to: params.to,
    subject: "Kaltarang 2026 — Registration Application Status",
    html,
  });
}

/**
 * 6. Revocation Email
 */
export async function sendRevocationEmail(params: {
  to: string;
  participantName: string;
  reason: string;
}) {
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 20px; background: #faf9fb;">
      <h2 style="color: #ef4444; font-family: Georgia, serif; margin: 0 0 16px;">Campus Access Pass Revoked</h2>
      <p style="font-size: 15px; color: #3c3644;">Dear <strong>${params.participantName}</strong>,</p>
      <p style="font-size: 14px; color: #3c3644; line-height: 1.6;">
        Your digital campus pass for Kaltarang 2026 has been revoked by fest administration.
      </p>
      <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; margin: 20px 0; border-radius: 4px;">
        <p style="margin: 0; font-size: 14px; color: #991b1b;"><strong>Reason:</strong> ${params.reason}</p>
      </div>
      <p style="font-size: 13px; color: #6a6473;">Any active QR passes have been deactivated and will be denied at campus gates.</p>
    </div>
  `;

  return sendEmail({
    to: params.to,
    subject: "Kaltarang 2026 — Campus Access Pass Revoked",
    html,
  });
}
