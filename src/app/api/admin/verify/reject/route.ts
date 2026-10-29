import { NextResponse } from "next/server";
import { memoryStore, loadStoreFromDisk, saveStoreToDisk } from "@/lib/data/store";
import { sendRejectionEmail } from "@/lib/email/service";
import { logAuditEvent } from "@/lib/audit/logger";

export async function POST(request: Request) {
  try {
    await loadStoreFromDisk();
    const { participant_id, reason } = await request.json();

    if (!participant_id || !reason) {
      return NextResponse.json({ error: "Participant ID and rejection reason are required." }, { status: 400 });
    }

    const participant = memoryStore.participants.get(participant_id);
    if (!participant) {
      return NextResponse.json({ error: "Participant not found" }, { status: 404 });
    }

    participant.status = "REVOKED";
    participant.rejection_reason = reason.trim();
    participant.updated_at = new Date().toISOString();

    // Revoke any active QR passes
    for (const qr of memoryStore.qrPasses.values()) {
      if (qr.participant_id === participant.id) {
        qr.status = "REVOKED";
        qr.revoked_at = new Date().toISOString();
      }
    }

    try {
      await sendRejectionEmail({
        to: participant.email,
        participantName: participant.full_name,
        reason: reason.trim(),
      });
    } catch (e) {
      console.warn("Rejection email dispatch failed:", e);
    }

    await logAuditEvent({
      action: "PROFILE_REJECTED",
      entityType: "PARTICIPANT",
      entityId: participant.id,
      metadata: { reason },
    });
    await saveStoreToDisk();

    return NextResponse.json({
      success: true,
      participant,
      message: "Participant registration rejected.",
    });
  } catch (error) {
    console.error("Rejection error:", error);
    return NextResponse.json({ error: "Failed to reject participant." }, { status: 500 });
  }
}
