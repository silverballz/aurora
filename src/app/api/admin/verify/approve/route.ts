import { NextResponse } from "next/server";
import { memoryStore, getNextRegistrationId } from "@/lib/data/store";
import { generateSecureToken, hashToken, signQrToken } from "@/lib/crypto/tokens";
import { generateQrDataUrl } from "@/lib/qr/generator";
import { sendApprovalEmail } from "@/lib/email/service";
import { logAuditEvent } from "@/lib/audit/logger";

export async function POST(request: Request) {
  try {
    const { participant_id } = await request.json();

    if (!participant_id) {
      return NextResponse.json({ error: "Participant ID is required" }, { status: 400 });
    }

    const participant = memoryStore.participants.get(participant_id);
    if (!participant) {
      return NextResponse.json({ error: "Participant not found" }, { status: 404 });
    }

    // Idempotency: if already approved and has QR, return existing
    if (participant.status === "APPROVED" && participant.registration_id) {
      return NextResponse.json({
        success: true,
        participant,
        message: "Participant is already approved.",
      });
    }

    // 1. Generate sequential Registration ID (KLT26-XXXXXX)
    const registrationId = participant.registration_id || getNextRegistrationId();

    // 2. Generate high-entropy opaque QR secret and signed token
    const rawQrSecret = generateSecureToken(32);
    const signedQrPayload = signQrToken(rawQrSecret);
    const tokenHash = hashToken(rawQrSecret);

    // 3. Generate QR code image
    const qrDataUrl = await generateQrDataUrl(signedQrPayload);

    // Revoke any previous QR passes for this participant
    for (const [hash, qr] of memoryStore.qrPasses.entries()) {
      if (qr.participant_id === participant.id && qr.status === "ACTIVE") {
        qr.status = "REVOKED";
        qr.revoked_at = new Date().toISOString();
      }
    }

    // Create new QR Pass
    const qrPassId = `qr-${Date.now()}`;
    memoryStore.qrPasses.set(tokenHash, {
      id: qrPassId,
      participant_id: participant.id,
      token_hash: tokenHash,
      status: "ACTIVE",
      issued_at: new Date().toISOString(),
      revoked_at: null,
      revoked_by: null,
    });

    // 4. Update Participant to APPROVED
    participant.status = "APPROVED";
    participant.registration_id = registrationId;
    participant.approved_at = new Date().toISOString();
    participant.approved_by = "usr-admin-1";
    participant.updated_at = new Date().toISOString();

    // 5. Send Confirmation Email (Failure to deliver does NOT fail approval)
    let emailSent = false;
    try {
      const emailResult = await sendApprovalEmail({
        to: participant.email,
        participantName: participant.full_name,
        registrationId,
        college: participant.college || "Participant Institution",
        course: participant.course || "Degree Course",
        year: participant.year_of_study || "Participant Year",
        qrDataUrl,
      });
      emailSent = emailResult.success;
    } catch (emailErr) {
      console.warn("Approval confirmation email delivery failed:", emailErr);
    }

    // 6. Log Approval Audit Event
    await logAuditEvent({
      action: "PROFILE_APPROVED",
      entityType: "PARTICIPANT",
      entityId: participant.id,
      metadata: {
        registration_id: registrationId,
        email: participant.email,
        emailDelivered: emailSent,
      },
    });

    return NextResponse.json({
      success: true,
      participant,
      registration_id: registrationId,
      qrDataUrl,
      emailSent,
      message: "Participant approved successfully. QR access credential issued.",
    });
  } catch (error) {
    console.error("Approval error:", error);
    return NextResponse.json({ error: "Failed to approve participant." }, { status: 500 });
  }
}
