import { NextResponse } from "next/server";
import { memoryStore, loadStoreFromDisk, saveStoreToDisk } from "@/lib/data/store";
import { AccessLog } from "@/lib/types/database";

export async function POST(request: Request) {
  try {
    loadStoreFromDisk();
    const { participant_id, gate_id = "gate-main", operator_id = "usr-sec-1", notes } = await request.json();

    if (!participant_id) {
      return NextResponse.json({ error: "Participant ID is required" }, { status: 400 });
    }

    const participant = memoryStore.participants.get(participant_id);
    if (!participant) {
      return NextResponse.json({ error: "Participant not found" }, { status: 404 });
    }

    if (participant.status !== "APPROVED") {
      return NextResponse.json(
        { error: "Cannot admit participant: Registration is not approved." },
        { status: 403 }
      );
    }

    // STATE CHECK: If already INSIDE, block duplicate entry
    if (participant.campus_status === "INSIDE") {
      const lastEntry = memoryStore.accessLogs
        .filter((al) => al.participant_id === participant.id && al.action === "ENTRY" && al.result === "ALLOWED")
        .pop();

      // Log blocked entry attempt
      const blockedLog: AccessLog = {
        id: `log-${Date.now()}`,
        participant_id: participant.id,
        registration_id: participant.registration_id || "UNKNOWN",
        gate_id,
        operator_id,
        action: "ENTRY",
        result: "BLOCKED",
        notes: notes || "Duplicate entry blocked: participant already inside campus",
        timestamp: new Date().toISOString(),
      };
      memoryStore.accessLogs.push(blockedLog);
      saveStoreToDisk();

      const gateName = memoryStore.gates.get(lastEntry?.gate_id || "")?.name || "Main Gate";
      const timeFormatted = lastEntry ? new Date(lastEntry.timestamp).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "Earlier today";

      return NextResponse.json({
        success: false,
        blocked: true,
        error_code: "ALREADY_INSIDE",
        message: `⚠ PARTICIPANT ALREADY INSIDE. Last recorded entry at ${gateName} (${timeFormatted}). No new entry recorded.`,
        campus_status: "INSIDE",
      }, { status: 409 });
    }

    // STATE TRANSITION: OUTSIDE -> INSIDE
    participant.campus_status = "INSIDE";
    participant.updated_at = new Date().toISOString();

    const allowedLog: AccessLog = {
      id: `log-${Date.now()}`,
      participant_id: participant.id,
      registration_id: participant.registration_id || "UNKNOWN",
      gate_id,
      operator_id,
      action: "ENTRY",
      result: "ALLOWED",
      notes: notes || "Normal QR scan entry allowed",
      timestamp: new Date().toISOString(),
    };
    memoryStore.accessLogs.push(allowedLog);
    saveStoreToDisk();

    return NextResponse.json({
      success: true,
      action: "ENTRY",
      result: "ALLOWED",
      campus_status: "INSIDE",
      message: `✓ Entry approved for ${participant.full_name} (${participant.registration_id})`,
      timestamp: allowedLog.timestamp,
    });
  } catch (error) {
    console.error("Entry error:", error);
    return NextResponse.json({ error: "Failed to process gate entry" }, { status: 500 });
  }
}
