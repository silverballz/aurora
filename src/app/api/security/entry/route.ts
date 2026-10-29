import { NextResponse } from "next/server";
import { memoryStore, loadStoreFromDisk, saveStoreToDisk } from "@/lib/data/store";
import { AccessLog, Participant } from "@/lib/types/database";

export async function POST(request: Request) {
  try {
    await loadStoreFromDisk();
    const {
      participant_id,
      participant_snapshot,
      gate_id = "gate-main",
      operator_id = "usr-sec-1",
      notes,
      force = false,
    } = await request.json();

    if (!participant_id) {
      return NextResponse.json({ error: "Participant ID is required" }, { status: 400 });
    }

    let participant = memoryStore.participants.get(participant_id);

    // Fallback hydration if this serverless container cold-started
    if (!participant && participant_snapshot && participant_snapshot.id === participant_id) {
      const now = new Date().toISOString();
      const hydrated: Participant = {
        id: participant_snapshot.id,
        user_id: `usr-${participant_snapshot.id}`,
        invitation_id: null,
        registration_id: participant_snapshot.registration_id || "KLT26-PASS",
        full_name: participant_snapshot.full_name || "Verified Participant",
        email: participant_snapshot.email || "",
        mobile: participant_snapshot.mobile || "",
        college: participant_snapshot.college || "",
        course: "",
        year_of_study: "",
        address: "",
        city: "",
        state: "",
        pincode: "",
        selfie_path: participant_snapshot.selfie_path || "/assets/participant-avatar.jpg",
        student_id_path: null,
        aadhaar_path: null,
        payment_reference: "N/A",
        qr_token: participant_snapshot.registration_id || null,
        qr_data_url: null,
        status: "APPROVED",
        campus_status: participant_snapshot.campus_status || "OUTSIDE",
        correction_reason: null,
        rejection_reason: null,
        created_at: now,
        updated_at: now,
        submitted_at: now,
        approved_at: now,
        approved_by: "usr-super-admin-1",
      };
      memoryStore.participants.set(hydrated.id, hydrated);
      participant = hydrated;
    }

    if (!participant) {
      return NextResponse.json({ error: "Participant not found", message: "Participant not found in store." }, { status: 404 });
    }

    if (participant.status !== "APPROVED") {
      return NextResponse.json(
        { error: "Cannot admit participant: Registration is not approved.", message: "Registration is not approved." },
        { status: 403 }
      );
    }

    // STATE CHECK: If already INSIDE and not forced, warn guard
    if (participant.campus_status === "INSIDE" && !force) {
      const lastEntry = memoryStore.accessLogs
        .filter((al) => al.participant_id === participant!.id && al.action === "ENTRY" && al.result === "ALLOWED")
        .pop();

      const gateName = memoryStore.gates.get(lastEntry?.gate_id || "")?.name || "Main Gate";
      const timeFormatted = lastEntry
        ? new Date(lastEntry.timestamp).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
        : "Earlier today";

      return NextResponse.json(
        {
          success: false,
          blocked: true,
          error_code: "ALREADY_INSIDE",
          message: `⚠ ALREADY CHECKED IN (${gateName}, ${timeFormatted}). Click ALLOW EXIT to check them out, or Re-Confirm Entry below.`,
          campus_status: "INSIDE",
        },
        { status: 409 }
      );
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
      notes: notes || "Gate check-in (ENTRY) verified",
      timestamp: new Date().toISOString(),
    };
    memoryStore.accessLogs.push(allowedLog);
    await saveStoreToDisk();

    return NextResponse.json({
      success: true,
      action: "ENTRY",
      result: "ALLOWED",
      campus_status: "INSIDE",
      message: `✓ CHECKED IN: ${participant.full_name} (${participant.registration_id}) is now INSIDE campus.`,
      timestamp: allowedLog.timestamp,
    });
  } catch (error) {
    console.error("Entry error:", error);
    return NextResponse.json({ error: "Failed to process gate entry", message: "Failed to process gate entry" }, { status: 500 });
  }
}
