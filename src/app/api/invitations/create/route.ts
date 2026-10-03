import { NextResponse } from "next/server";
import { memoryStore } from "@/lib/data/store";
import { generateSecureToken, hashToken } from "@/lib/crypto/tokens";
import { sendInvitationEmail } from "@/lib/email/service";
import { logAuditEvent } from "@/lib/audit/logger";
import { Invitation } from "@/lib/types/database";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      participant_name,
      email,
      mobile,
      payment_reference,
      payment_amount,
      payment_date,
      expires_in_days = 7,
    } = body;

    if (!participant_name || !email || !mobile || !payment_reference) {
      return NextResponse.json(
        { error: "Missing required fields: Name, Email, Mobile, and Payment Reference are mandatory." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if active invitation already exists for this email
    for (const inv of memoryStore.invitations.values()) {
      if (inv.email.toLowerCase() === normalizedEmail && inv.status === "ACTIVE") {
        return NextResponse.json(
          { error: "An active invitation already exists for this email address." },
          { status: 409 }
        );
      }
    }

    // 1. Generate high-entropy cryptographic token
    const rawToken = generateSecureToken(32);
    const tokenHash = hashToken(rawToken);

    const expiresAt = new Date(Date.now() + expires_in_days * 24 * 60 * 60 * 1000).toISOString();
    const invitationId = `inv-${Date.now()}`;

    const newInvitation: Invitation = {
      id: invitationId,
      token_hash: tokenHash,
      email: normalizedEmail,
      mobile: mobile.trim(),
      participant_name: participant_name.trim(),
      payment_reference: payment_reference.trim(),
      payment_amount: Number(payment_amount) || 0,
      payment_date: payment_date || new Date().toISOString().split("T")[0],
      payment_status: "VERIFIED",
      status: "ACTIVE",
      expires_at: expiresAt,
      created_by: "usr-admin-1",
      created_at: new Date().toISOString(),
      used_at: null,
    };

    memoryStore.invitations.set(invitationId, newInvitation);

    // Initialize or link participant record in INVITED status
    const participantId = `part-${Date.now()}`;
    memoryStore.participants.set(participantId, {
      id: participantId,
      user_id: null,
      invitation_id: invitationId,
      registration_id: null,
      full_name: participant_name.trim(),
      email: normalizedEmail,
      mobile: mobile.trim(),
      college: null,
      course: null,
      year_of_study: null,
      address: null,
      city: null,
      state: null,
      pincode: null,
      selfie_path: null,
      status: "INVITED",
      campus_status: "OUTSIDE",
      correction_reason: null,
      rejection_reason: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      submitted_at: null,
      approved_at: null,
      approved_by: null,
    });

    // 2. Dispatch Invitation Email
    const emailResult = await sendInvitationEmail({
      to: normalizedEmail,
      participantName: participant_name.trim(),
      inviteToken: rawToken,
      expiresAt,
    });

    // 3. Log Audit Event
    await logAuditEvent({
      action: "INVITATION_CREATED",
      entityType: "INVITATION",
      entityId: invitationId,
      metadata: {
        email: normalizedEmail,
        payment_reference,
        expiresAt,
        emailDeliverySuccess: emailResult.success,
      },
    });

    return NextResponse.json({
      success: true,
      invitation: newInvitation,
      inviteToken: rawToken, // Provided to admin for quick copy / WhatsApp fallback
      emailDeliverySuccess: emailResult.success,
    });
  } catch (error) {
    console.error("Invitation creation error:", error);
    return NextResponse.json({ error: "Failed to generate invitation" }, { status: 500 });
  }
}
