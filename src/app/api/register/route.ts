import { NextResponse } from "next/server";
import { memoryStore, loadStoreFromDisk, saveStoreToDisk } from "@/lib/data/store";
import { Participant } from "@/lib/types/database";
import { logAuditEvent } from "@/lib/audit/logger";

export async function POST(request: Request) {
  try {
    loadStoreFromDisk();
    const body = await request.json();

    const {
      full_name,
      email,
      mobile,
      college,
      selfie_data_url,
      student_id_data_url,
      student_id_filename,
      aadhaar_data_url,
      aadhaar_filename,
    } = body;

    if (!full_name || !email || !mobile || !college) {
      return NextResponse.json(
        { error: "Please fill in your Name, College Name, Mobile Number, and Email Address." },
        { status: 400 }
      );
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const now = new Date().toISOString();

    let existingParticipant: Participant | undefined;
    for (const p of memoryStore.participants.values()) {
      if (p.email.toLowerCase() === normalizedEmail) {
        existingParticipant = p;
        break;
      }
    }

    const participantId = existingParticipant?.id || `part-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    const participant: Participant = {
      id: participantId,
      user_id: existingParticipant?.user_id || `usr-${Date.now()}`,
      invitation_id: null,
      registration_id: existingParticipant?.registration_id || null,
      full_name: String(full_name).trim(),
      email: normalizedEmail,
      mobile: String(mobile).trim(),
      college: String(college).trim(),
      course: "",
      year_of_study: "",
      address: "",
      city: "",
      state: "",
      pincode: "",
      selfie_path: selfie_data_url || existingParticipant?.selfie_path || "/assets/participant-avatar.jpg",
      student_id_path: student_id_data_url || existingParticipant?.student_id_path || null,
      aadhaar_path: aadhaar_data_url || existingParticipant?.aadhaar_path || null,
      payment_reference: "N/A",
      qr_token: existingParticipant?.qr_token || null,
      qr_data_url: existingParticipant?.qr_data_url || null,
      status: "UNDER_REVIEW",
      campus_status: existingParticipant?.campus_status || "OUTSIDE",
      correction_reason: null,
      rejection_reason: null,
      created_at: existingParticipant?.created_at || now,
      updated_at: now,
      submitted_at: now,
      approved_at: existingParticipant?.approved_at || null,
      approved_by: existingParticipant?.approved_by || null,
    };

    memoryStore.participants.set(participantId, participant);

    if (student_id_data_url || student_id_filename) {
      const docId = `doc-stu-${participantId}`;
      memoryStore.documents.set(docId, {
        id: docId,
        participant_id: participantId,
        document_type: "STUDENT_ID",
        storage_path: student_id_data_url || `participants/${participantId}/student_id`,
        original_filename: student_id_filename || "student_id.jpg",
        mime_type: "image/jpeg",
        file_size: student_id_data_url ? student_id_data_url.length : 102400,
        status: "PENDING",
        uploaded_at: now,
        verified_at: null,
        verified_by: null,
      });
    }

    if (aadhaar_data_url || aadhaar_filename) {
      const docId = `doc-aad-${participantId}`;
      memoryStore.documents.set(docId, {
        id: docId,
        participant_id: participantId,
        document_type: "AADHAAR",
        storage_path: aadhaar_data_url || `participants/${participantId}/aadhaar`,
        original_filename: aadhaar_filename || "aadhaar.jpg",
        mime_type: "image/jpeg",
        file_size: aadhaar_data_url ? aadhaar_data_url.length : 102400,
        status: "PENDING",
        uploaded_at: now,
        verified_at: null,
        verified_by: null,
      });
    }

    saveStoreToDisk();

    await logAuditEvent({
      action: "PUBLIC_REGISTRATION_SUBMITTED",
      entityType: "PARTICIPANT",
      entityId: participantId,
      metadata: {
        full_name: participant.full_name,
        email: participant.email,
        college: participant.college,
        mobile: participant.mobile,
      },
    });

    return NextResponse.json({
      success: true,
      participant_id: participantId,
      message: "Registration submitted! After admin review, your single static QR pass will be emailed to you.",
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Failed to submit registration. Please try again." },
      { status: 500 }
    );
  }
}
