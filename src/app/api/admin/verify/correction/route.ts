import { NextResponse } from "next/server";
import { memoryStore, loadStoreFromDisk, saveStoreToDisk } from "@/lib/data/store";
import { sendCorrectionEmail } from "@/lib/email/service";
import { logAuditEvent } from "@/lib/audit/logger";

export async function POST(request: Request) {
  try {
    loadStoreFromDisk();
    const { participant_id, reason } = await request.json();

    if (!participant_id || !reason) {
      return NextResponse.json({ error: "Participant ID and correction reason are required." }, { status: 400 });
    }

    const participant = memoryStore.participants.get(participant_id);
    if (!participant) {
      return NextResponse.json({ error: "Participant not found" }, { status: 404 });
    }

    participant.status = "CORRECTION";
    participant.correction_reason = reason.trim();
    participant.updated_at = new Date().toISOString();
    saveStoreToDisk();

    // Send correction email to participant
    let emailSent = false;
    try {
      const emailRes = await sendCorrectionEmail({
        to: participant.email,
        participantName: participant.full_name,
        reason: reason.trim(),
      });
      emailSent = emailRes.success;
    } catch (e) {
      console.warn("Correction email failed:", e);
    }

    await logAuditEvent({
      action: "CORRECTION_REQUESTED",
      entityType: "PARTICIPANT",
      entityId: participant.id,
      metadata: {
        reason,
        emailSent,
      },
    });

    return NextResponse.json({
      success: true,
      participant,
      message: "Correction request dispatched to participant.",
    });
  } catch (error) {
    console.error("Correction request error:", error);
    return NextResponse.json({ error: "Failed to request correction." }, { status: 500 });
  }
}
