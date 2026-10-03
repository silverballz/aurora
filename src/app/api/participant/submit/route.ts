import { NextResponse } from "next/server";
import { memoryStore } from "@/lib/data/store";
import { cookies } from "next/headers";
import { logAuditEvent } from "@/lib/audit/logger";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { confirmed, selected_event_ids, participant_id, email: bodyEmail } = body;

    let userEmail: string | null = bodyEmail || request.headers.get("x-user-email");
    let userId: string | null = null;

    try {
      const cookieStore = await cookies();
      const sessionCookie = cookieStore.get("aurora_session");
      if (sessionCookie) {
        const session = JSON.parse(Buffer.from(sessionCookie.value, "base64").toString("utf-8"));
        userEmail = session.email;
        userId = session.userId;
      }
    } catch {
      // In test runner, fallback to bodyEmail or participantId
    }

    if (!userEmail && !participant_id) {
      return NextResponse.json({ error: "Unauthorized session." }, { status: 401 });
    }

    let participant = null;
    if (participant_id && memoryStore.participants.has(participant_id)) {
      participant = memoryStore.participants.get(participant_id);
    } else if (userEmail) {
      for (const p of memoryStore.participants.values()) {
        if (p.email.toLowerCase() === userEmail.toLowerCase()) {
          participant = p;
          break;
        }
      }
    }

    if (!participant) {
      return NextResponse.json({ error: "Participant record not found." }, { status: 404 });
    }

    // Validation checks
    if (!participant.college || !participant.course || !participant.year_of_study) {
      return NextResponse.json(
        { error: "Please complete personal and college details before submitting." },
        { status: 400 }
      );
    }

    if (!participant.selfie_path) {
      return NextResponse.json(
        { error: "Live identity photograph is required. Please capture your photo." },
        { status: 400 }
      );
    }

    // Check documents
    const participantDocs = Array.from(memoryStore.documents.values()).filter(
      (d) => d.participant_id === participant.id
    );
    const hasStudentId = participantDocs.some((d) => d.document_type === "STUDENT_ID");
    const hasAadhaar = participantDocs.some((d) => d.document_type === "AADHAAR");

    if (!hasStudentId || !hasAadhaar) {
      return NextResponse.json(
        { error: "Both Student ID and Aadhaar documents are required for campus access verification." },
        { status: 400 }
      );
    }

    // Save selected events
    if (Array.isArray(selected_event_ids)) {
      selected_event_ids.forEach((eventId) => {
        const peId = `pe-${participant.id}-${eventId}`;
        memoryStore.participantEvents.set(peId, {
          id: peId,
          participant_id: participant.id,
          event_id: eventId,
          status: "REGISTERED",
          created_at: new Date().toISOString(),
        });
      });
    }

    // Update status to UNDER_REVIEW
    participant.status = "UNDER_REVIEW";
    participant.submitted_at = new Date().toISOString();
    participant.updated_at = new Date().toISOString();
    participant.correction_reason = null; // Clear previous correction request if re-submitting

    // Mark invitation USED if not already
    if (participant.invitation_id && memoryStore.invitations.has(participant.invitation_id)) {
      const inv = memoryStore.invitations.get(participant.invitation_id)!;
      inv.status = "USED";
      inv.used_at = new Date().toISOString();
    }

    await logAuditEvent({
      actorId: userId || participant.user_id,
      action: "PROFILE_SUBMITTED",
      entityType: "PARTICIPANT",
      entityId: participant.id,
      metadata: {
        email: participant.email,
        college: participant.college,
        status: "UNDER_REVIEW",
      },
    });

    return NextResponse.json({
      success: true,
      participant,
      message: "Your registration has been submitted successfully. Kaltarang administration will verify your documents.",
    });
  } catch (error) {
    console.error("Submission error:", error);
    return NextResponse.json({ error: "Failed to submit registration." }, { status: 500 });
  }
}
