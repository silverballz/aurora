import { NextResponse } from "next/server";
import { memoryStore } from "@/lib/data/store";
import { AccessLog } from "@/lib/types/database";
import { logAuditEvent } from "@/lib/audit/logger";

const VALID_SUPERVISOR_PIN = "2026"; // Default supervisor operational PIN

export async function POST(request: Request) {
  try {
    const { participant_id, action, reason, supervisor_pin, gate_id = "gate-main" } = await request.json();

    if (!participant_id || !action || !reason || !supervisor_pin) {
      return NextResponse.json({ error: "Missing required fields for supervisor override." }, { status: 400 });
    }

    if (supervisor_pin !== VALID_SUPERVISOR_PIN) {
      return NextResponse.json({ error: "Invalid supervisor authorization PIN." }, { status: 403 });
    }

    const participant = memoryStore.participants.get(participant_id);
    if (!participant) {
      return NextResponse.json({ error: "Participant not found." }, { status: 404 });
    }

    // Force state transition
    const targetStatus = action === "ENTRY" ? "INSIDE" : "OUTSIDE";
    participant.campus_status = targetStatus;
    participant.updated_at = new Date().toISOString();

    const overrideLog: AccessLog = {
      id: `log-override-${Date.now()}`,
      participant_id: participant.id,
      registration_id: participant.registration_id || "UNKNOWN",
      gate_id,
      operator_id: "usr-sec-supervisor",
      action,
      result: "OVERRIDDEN",
      notes: `Supervisor Override: ${reason}`,
      timestamp: new Date().toISOString(),
    };
    memoryStore.accessLogs.push(overrideLog);

    await logAuditEvent({
      action: "ACCESS_OVERRIDE",
      entityType: "ACCESS_LOG",
      entityId: overrideLog.id,
      metadata: {
        participant_id: participant.id,
        registration_id: participant.registration_id,
        action,
        reason,
        gate_id,
      },
    });

    return NextResponse.json({
      success: true,
      action,
      result: "OVERRIDDEN",
      campus_status: targetStatus,
      message: `Supervisor override confirmed. Participant marked ${targetStatus}.`,
    });
  } catch (error) {
    console.error("Override error:", error);
    return NextResponse.json({ error: "Failed to process manual override." }, { status: 500 });
  }
}
