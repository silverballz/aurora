import { NextResponse } from "next/server";
import { memoryStore, loadStoreFromDisk, saveStoreToDisk } from "@/lib/data/store";
import { AccessLog } from "@/lib/types/database";

export async function POST(request: Request) {
  try {
    await loadStoreFromDisk();
    const { participant_id, gate_id = "gate-main", operator_id = "usr-sec-1", notes } = await request.json();

    if (!participant_id) {
      return NextResponse.json({ error: "Participant ID is required" }, { status: 400 });
    }

    const participant = memoryStore.participants.get(participant_id);
    if (!participant) {
      return NextResponse.json({ error: "Participant not found" }, { status: 404 });
    }

    // STATE CHECK: If already OUTSIDE, block exit
    if (participant.campus_status === "OUTSIDE") {
      const blockedLog: AccessLog = {
        id: `log-${Date.now()}`,
        participant_id: participant.id,
        registration_id: participant.registration_id || "UNKNOWN",
        gate_id,
        operator_id,
        action: "EXIT",
        result: "BLOCKED",
        notes: notes || "Exit blocked: participant is not currently inside campus",
        timestamp: new Date().toISOString(),
      };
      memoryStore.accessLogs.push(blockedLog);
      await saveStoreToDisk();

      return NextResponse.json({
        success: false,
        blocked: true,
        error_code: "NOT_INSIDE",
        message: "⚠ PARTICIPANT IS NOT CURRENTLY INSIDE. Cannot record campus exit.",
        campus_status: "OUTSIDE",
      }, { status: 409 });
    }

    // STATE TRANSITION: INSIDE -> OUTSIDE
    participant.campus_status = "OUTSIDE";
    participant.updated_at = new Date().toISOString();

    const allowedLog: AccessLog = {
      id: `log-${Date.now()}`,
      participant_id: participant.id,
      registration_id: participant.registration_id || "UNKNOWN",
      gate_id,
      operator_id,
      action: "EXIT",
      result: "ALLOWED",
      notes: notes || "Normal QR scan exit allowed",
      timestamp: new Date().toISOString(),
    };
    memoryStore.accessLogs.push(allowedLog);
    await saveStoreToDisk();

    return NextResponse.json({
      success: true,
      action: "EXIT",
      result: "ALLOWED",
      campus_status: "OUTSIDE",
      message: `✓ Exit recorded for ${participant.full_name} (${participant.registration_id})`,
      timestamp: allowedLog.timestamp,
    });
  } catch (error) {
    console.error("Exit error:", error);
    return NextResponse.json({ error: "Failed to process gate exit" }, { status: 500 });
  }
}
