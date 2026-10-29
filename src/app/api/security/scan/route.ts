import { NextResponse } from "next/server";
import { memoryStore, loadStoreFromDisk, saveStoreToDisk } from "@/lib/data/store";
import { verifyAndExtractQrToken, verifySignedParticipantQr, hashToken } from "@/lib/crypto/tokens";
import { Participant } from "@/lib/types/database";

export async function POST(request: Request) {
  try {
    await loadStoreFromDisk();
    const { token } = await request.json();

    if (!token || typeof token !== "string") {
      return NextResponse.json(
        { valid: false, error_code: "INVALID_FORMAT", message: "Scan failed: Invalid QR code format." },
        { status: 400 }
      );
    }

    const trimmed = token.trim();
    let rawToken = trimmed;

    // 1. Check if token is a self-contained cryptographically signed KLT26.<payload>.<sig> QR pass
    const signedCheck = verifySignedParticipantQr(trimmed);

    if (!signedCheck.valid && trimmed.includes(".")) {
      const { valid, rawToken: extracted } = verifyAndExtractQrToken(trimmed);
      if (valid) {
        rawToken = extracted;
      }
    }

    const tokenHash = hashToken(rawToken);

    // 2. Look up Participant by QR pass, qr_token, registration_id, or email
    let participant: Participant | undefined;

    const qrPass = memoryStore.qrPasses.get(tokenHash);
    if (qrPass) {
      if (qrPass.status === "REVOKED") {
        return NextResponse.json(
          { valid: false, error_code: "QR_REVOKED", message: "✕ QR PASS REVOKED. Please contact administration." },
          { status: 403 }
        );
      }
      participant = memoryStore.participants.get(qrPass.participant_id);
    }

    if (!participant && signedCheck.valid && signedCheck.claims) {
      participant = memoryStore.participants.get(signedCheck.claims.id);
    }

    if (!participant) {
      const upper = trimmed.toUpperCase();
      const lower = trimmed.toLowerCase();
      for (const p of memoryStore.participants.values()) {
        if (
          p.qr_token === trimmed ||
          p.qr_token === rawToken ||
          (p.registration_id && p.registration_id.toUpperCase() === upper) ||
          p.email.toLowerCase() === lower ||
          p.id === trimmed
        ) {
          participant = p;
          break;
        }
      }
    }

    // 3. Serverless / Multi-Instance Hydration:
    // If the QR token has a valid cryptographic HMAC signature (KLT26.<payload>.<sig>)
    // and this serverless instance cold-started without the participant in memoryStore,
    // automatically hydrate the verified participant so Entry/Exit works seamlessly!
    if (!participant && signedCheck.valid && signedCheck.claims) {
      const c = signedCheck.claims;
      const now = new Date().toISOString();
      participant = {
        id: c.id,
        user_id: `usr-${c.id}`,
        invitation_id: null,
        registration_id: c.reg,
        full_name: c.name,
        email: c.email,
        mobile: "",
        college: c.col,
        course: c.crs,
        year_of_study: c.yr,
        address: "",
        city: "",
        state: "",
        pincode: "",
        selfie_path: "/assets/participant-avatar.jpg",
        student_id_path: null,
        aadhaar_path: null,
        payment_reference: "VERIFIED",
        qr_token: trimmed,
        qr_data_url: null,
        status: "APPROVED",
        campus_status: "OUTSIDE",
        correction_reason: null,
        rejection_reason: null,
        created_at: now,
        updated_at: now,
        submitted_at: now,
        approved_at: now,
        approved_by: "usr-super-admin-1",
      };
      memoryStore.participants.set(participant.id, participant);
      await saveStoreToDisk();
    }

    if (!participant) {
      return NextResponse.json(
        { valid: false, error_code: "INVALID_QR", message: "✕ INVALID QR PASS. Unrecognized credential." },
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
        { valid: false, error_code: "NOT_APPROVED", message: "⚠ REGISTRATION NOT VERIFIED. Participant pending admin approval." },
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
