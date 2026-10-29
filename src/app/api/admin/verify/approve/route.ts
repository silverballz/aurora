import { NextResponse } from "next/server";
import { memoryStore, getNextRegistrationId, loadStoreFromDisk, saveStoreToDisk } from "@/lib/data/store";
import { hashToken } from "@/lib/crypto/tokens";
import { generateQrDataUrl } from "@/lib/qr/generator";
import { sendApprovalEmail } from "@/lib/email/service";
import { logAuditEvent } from "@/lib/audit/logger";

export async function POST(request: Request) {
  try {
    await loadStoreFromDisk();
    const { participant_id, resend } = await request.json();

    if (!participant_id) {
      return NextResponse.json({ error: "Participant ID is required" }, { status: 400 });
    }

    const participant = memoryStore.participants.get(participant_id);
    if (!participant) {
      return NextResponse.json({ error: "Participant not found" }, { status: 404 });
    }

    // 1. Keep ONE single static Registration ID & crisp 12-char QR code (e.g. KLT26-000425)
    // so the QR image is a low-density Version 1 (21x21) grid that scans in 0.05s on any camera!
    const registrationId = participant.registration_id || getNextRegistrationId();
    const signedQrPayload = registrationId;
    const tokenHash = hashToken(signedQrPayload);
    const qrDataUrl = await generateQrDataUrl(signedQrPayload);

    // Register active static QR pass in store
    const qrPassId = `qr-${participant.id}`;
    memoryStore.qrPasses.set(tokenHash, {
      id: qrPassId,
      participant_id: participant.id,
      token_hash: tokenHash,
      status: "ACTIVE",
      issued_at: new Date().toISOString(),
      revoked_at: null,
      revoked_by: null,
    });

    // 2. Update Participant to APPROVED with their single static QR
    participant.status = "APPROVED";
    participant.registration_id = registrationId;
    participant.qr_token = signedQrPayload;
    participant.qr_data_url = qrDataUrl;
    participant.approved_at = participant.approved_at || new Date().toISOString();
    participant.approved_by = "usr-super-admin-1";
    participant.updated_at = new Date().toISOString();

    memoryStore.participants.set(participant.id, participant);

    // 3. Send Email with the Single Static QR Pass
    let emailSent = false;
    let realEmailDelivered = false;
    let deliveredVia = "outbox";
    let emailError: string | undefined;
    try {
      const origin = new URL(request.url).origin;
      const emailResult = await sendApprovalEmail({
        to: participant.email,
        participantName: participant.full_name,
        registrationId,
        college: participant.college || "Participant Institution",
        course: participant.course || "",
        year: participant.year_of_study || "",
        qrDataUrl,
        qrToken: signedQrPayload,
        baseUrl: origin,
      });
      emailSent = emailResult.success;
      realEmailDelivered = emailResult.realEmailDelivered;
      deliveredVia = emailResult.deliveredVia || "outbox";
      emailError = emailResult.error;
    } catch (emailErr) {
      console.warn("Approval confirmation email delivery failed:", emailErr);
    }

    // 4. Log Approval Audit Event
    await logAuditEvent({
      action: resend ? "QR_PASS_RESENT" : "PROFILE_APPROVED",
      entityType: "PARTICIPANT",
      entityId: participant.id,
      metadata: {
        registration_id: registrationId,
        email: participant.email,
        emailDelivered: emailSent,
        realEmailDelivered,
        deliveredVia,
      },
    });
    await saveStoreToDisk();

    return NextResponse.json({
      success: true,
      participant,
      registration_id: registrationId,
      qrDataUrl,
      qrToken: signedQrPayload,
      emailSent,
      realEmailDelivered,
      deliveredVia,
      emailError,
      message: realEmailDelivered
        ? `Approved! Single static QR pass (${registrationId}) sent via ${deliveredVia} to ${participant.email}.`
        : `Approved! Static QR pass (${registrationId}) generated & saved to QR Outbox (configure Gmail SMTP to deliver directly to inbox).`,
    });
  } catch (error) {
    console.error("Approval error:", error);
    return NextResponse.json({ error: "Failed to approve participant." }, { status: 500 });
  }
}
