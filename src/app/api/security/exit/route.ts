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
        campus_status: participant_snapshot.campus_status || "INSIDE",
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

    if (participant.campus_status === "OUTSIDE" && !force) {
      return NextResponse.json(
        {
          success: false,
          blocked: true,
          error_code: "NOT_INSIDE",
          message: "⚠ ALREADY OUTSIDE CAMPUS. Click ALLOW ENTRY to check them in.",
          campus_status: "OUTSIDE",
        },
        { status: 409 }
      );
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
      notes: notes || "Gate check-out (EXIT) verified",
      timestamp: new Date().toISOString(),
    };
    memoryStore.accessLogs.push(allowedLog);
    await saveStoreToDisk();

    return NextResponse.json({
      success: true,
      action: "EXIT",
      result: "ALLOWED",
      campus_status: "OUTSIDE",
      message: `✓ CHECKED OUT: ${participant.full_name} (${participant.registration_id}) is now OUTSIDE campus.`,
      timestamp: allowedLog.timestamp,
    });
  } catch (error) {
    console.error("Exit error:", error);
    return NextResponse.json({ error: "Failed to process gate exit", message: "Failed to process gate exit" }, { status: 500 });
  }
}
