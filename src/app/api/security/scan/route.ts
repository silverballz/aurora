import { NextResponse } from "next/server";
import { memoryStore } from "@/lib/data/store";
import { verifyAndExtractQrToken, hashToken } from "@/lib/crypto/tokens";

export async function POST(request: Request) {
  try {
    const { token, gate_id } = await request.json();

    if (!token || typeof token !== "string") {
      return NextResponse.json(
        { valid: false, error_code: "INVALID_FORMAT", message: "Scan failed: Invalid QR code format." },
        { status: 400 }
      );
    }

    // 1. Verify signature or check raw token
    let rawToken = token.trim();
    if (token.includes(".")) {
      const { valid, rawToken: extracted } = verifyAndExtractQrToken(token.trim());
      if (valid) {
        rawToken = extracted;
      }
    }

    const tokenHash = hashToken(rawToken);

    // 2. Look up QR Pass in store
    let qrPass = memoryStore.qrPasses.get(tokenHash);
    if (!qrPass) {
      // Also check if raw token itself matches any direct token
      for (const qr of memoryStore.qrPasses.values()) {
        if (qr.token_hash === rawToken || qr.token_hash === tokenHash) {
          qrPass = qr;
          break;
        }
      }
    }

    if (!qrPass) {
      return NextResponse.json(
        { valid: false, error_code: "INVALID_QR", message: "✕ INVALID QR PASS. Unrecognized credential." },
        { status: 404 }
      );
    }

    if (qrPass.status === "REVOKED") {
      return NextResponse.json(
        { valid: false, error_code: "QR_REVOKED", message: "✕ QR PASS REVOKED. Please contact administration." },
        { status: 403 }
      );
    }

    // 3. Look up Participant
    const participant = memoryStore.participants.get(qrPass.participant_id);
    if (!participant) {
      return NextResponse.json(
        { valid: false, error_code: "PARTICIPANT_NOT_FOUND", message: "Participant record not found." },
        { status: 404 }
      );
    }

    if (participant.status === "REVOKED") {
      return NextResponse.json(
        { valid: false, error_code: "ACCESS_REVOKED", message: "✕ ACCESS REVOKED. Entry denied by fest administration." },
        { status: 403 }
      );
    }

    if (participant.status !== "APPROVED") {
      return NextResponse.json(
        { valid: false, error_code: "NOT_APPROVED", message: "⚠ REGISTRATION NOT VERIFIED. Participant pending approval." },
        { status: 400 }
      );
    }

    // Minimal event details
    const pes = Array.from(memoryStore.participantEvents.values()).filter((pe) => pe.participant_id === participant.id);
    const events = pes.map((pe) => memoryStore.events.get(pe.event_id)?.name).filter(Boolean);

    // Get last entry log if available
    const lastEntry = memoryStore.accessLogs
      .filter((al) => al.participant_id === participant.id && al.action === "ENTRY" && al.result === "ALLOWED")
      .pop();

    // Data minimization: Return only what security needs
    return NextResponse.json({
      valid: true,
      participant: {
        id: participant.id,
        registration_id: participant.registration_id,
        full_name: participant.full_name,
        college: participant.college,
        course: participant.course,
        year_of_study: participant.year_of_study,
        selfie_path: participant.selfie_path || "/assets/participant-avatar.jpg",
        status: participant.status,
        campus_status: participant.campus_status,
        events,
      },
      token_hash: tokenHash,
      last_entry: lastEntry
        ? {
            time: lastEntry.timestamp,
            gate: memoryStore.gates.get(lastEntry.gate_id || "")?.name || "Main Gate",
          }
        : null,
    });
  } catch (error) {
    console.error("Scan error:", error);
    return NextResponse.json(
      { valid: false, error_code: "SERVER_ERROR", message: "Server error validating QR pass." },
      { status: 500 }
    );
  }
}
