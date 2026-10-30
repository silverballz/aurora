import { NextResponse } from "next/server";
import {
  memoryStore,
  loadStoreFromDisk,
  saveStoreToDisk,
  getNextRegistrationId,
  offloadParticipantImages,
} from "@/lib/data/store";
import { Participant, QrPass } from "@/lib/types/database";
import { hashToken } from "@/lib/crypto/tokens";
import { generateQrDataUrl } from "@/lib/qr/generator";
import { sendApprovalEmail } from "@/lib/email/service";
import { logAuditEvent } from "@/lib/audit/logger";

export const dynamic = "force-dynamic";

export async function GET() {
  await loadStoreFromDisk();
  const participants = Array.from(memoryStore.participants.values()).sort(
    (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  );
  return NextResponse.json({ participants });
}

// CREATE Participant (Admin CRUD)
export async function POST(request: Request) {
  try {
    await loadStoreFromDisk();
    const body = await request.json();

    const {
      full_name,
      college,
      mobile,
      email,
      status = "APPROVED",
      campus_status = "OUTSIDE",
      selfie_data_url,
      student_id_data_url,
      aadhaar_data_url,
      send_email = true,
    } = body;

    if (!full_name || !email || !mobile || !college) {
      return NextResponse.json(
        { error: "Name, College Name, Mobile Number, and Email are required." },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const participantId = `part-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const isApproved = status === "APPROVED";
    const regId = isApproved ? getNextRegistrationId() : null;
    const qrToken = regId;
    let qrDataUrl: string | null = null;

    if (isApproved && qrToken) {
      qrDataUrl = await generateQrDataUrl(qrToken);
      const tokenHash = hashToken(qrToken);
      const newPass: QrPass = {
        id: `qr-${Date.now()}`,
        participant_id: participantId,
        token_hash: tokenHash,
        status: "ACTIVE",
        issued_at: now,
        revoked_at: null,
        revoked_by: null,
      };
      memoryStore.qrPasses.set(tokenHash, newPass);
    }

    const participant: Participant = {
      id: participantId,
      user_id: `usr-${Date.now()}`,
      invitation_id: null,
      registration_id: regId,
      full_name: String(full_name).trim(),
      college: String(college).trim(),
      mobile: String(mobile).trim(),
      email: String(email).trim().toLowerCase(),
      course: "",
      year_of_study: "",
      address: "",
      city: "",
      state: "",
      pincode: "",
      selfie_path: selfie_data_url || "/assets/participant-avatar.jpg",
      student_id_path: student_id_data_url || null,
      aadhaar_path: aadhaar_data_url || null,
      payment_reference: "N/A",
      qr_token: qrToken,
      qr_data_url: qrDataUrl,
      status: status as any,
      campus_status: campus_status as any,
      correction_reason: null,
      rejection_reason: null,
      created_at: now,
      updated_at: now,
      submitted_at: now,
      approved_at: isApproved ? now : null,
      approved_by: isApproved ? "usr-super-admin-1" : null,
    };

    await offloadParticipantImages(participant);
    memoryStore.participants.set(participantId, participant);

    if (isApproved && send_email && regId && qrDataUrl) {
      try {
        const origin = new URL(request.url).origin;
        await sendApprovalEmail({
          to: participant.email,
          participantName: participant.full_name,
          registrationId: regId,
          college: participant.college || "Participant Institution",
          course: "",
          year: "",
          qrDataUrl,
          qrToken: qrToken!,
          baseUrl: origin,
        });
      } catch (e) {
        console.warn("Email send warning on CRUD create:", e);
      }
    }

    await logAuditEvent({
      actorId: "usr-super-admin-1",
      action: "ADMIN_PARTICIPANT_CREATED",
      entityType: "PARTICIPANT",
      entityId: participantId,
      metadata: { full_name: participant.full_name, registration_id: regId, status },
    });

    await saveStoreToDisk();

    return NextResponse.json({
      success: true,
      participant,
      message: isApproved
        ? `Participant created & approved (${regId})!`
        : "Participant record created!",
    });
  } catch (err) {
    console.error("Create participant error:", err);
    return NextResponse.json({ error: "Failed to create participant." }, { status: 500 });
  }
}

// UPDATE Participant (Admin CRUD)
export async function PUT(request: Request) {
  try {
    await loadStoreFromDisk();
    const body = await request.json();
    const {
      id,
      full_name,
      college,
      mobile,
      email,
      status,
      campus_status,
      selfie_data_url,
      student_id_data_url,
      aadhaar_data_url,
    } = body;

    if (!id) {
      return NextResponse.json({ error: "Participant ID is required." }, { status: 400 });
    }

    const participant = memoryStore.participants.get(id);
    if (!participant) {
      return NextResponse.json({ error: "Participant not found." }, { status: 404 });
    }

    const now = new Date().toISOString();

    if (full_name !== undefined) participant.full_name = String(full_name).trim();
    if (college !== undefined) participant.college = String(college).trim();
    if (mobile !== undefined) participant.mobile = String(mobile).trim();
    if (email !== undefined) participant.email = String(email).trim().toLowerCase();
    if (campus_status !== undefined) participant.campus_status = campus_status;
    if (selfie_data_url) participant.selfie_path = selfie_data_url;
    if (student_id_data_url) participant.student_id_path = student_id_data_url;
    if (aadhaar_data_url) participant.aadhaar_path = aadhaar_data_url;

    if (status !== undefined) {
      participant.status = status;
      if (status === "APPROVED") {
        if (!participant.registration_id) {
          participant.registration_id = getNextRegistrationId();
        }
        const qrToken = participant.registration_id;
        participant.qr_token = qrToken;
        if (!participant.qr_data_url) {
          participant.qr_data_url = await generateQrDataUrl(qrToken);
        }
        participant.approved_at = participant.approved_at || now;
        participant.approved_by = "usr-super-admin-1";

        const tokenHash = hashToken(qrToken);
        memoryStore.qrPasses.set(tokenHash, {
          id: `qr-${Date.now()}`,
          participant_id: participant.id,
          token_hash: tokenHash,
          status: "ACTIVE",
          issued_at: now,
          revoked_at: null,
          revoked_by: null,
        });
      }
    }

    participant.updated_at = now;
    await offloadParticipantImages(participant);
    memoryStore.participants.set(id, participant);

    await logAuditEvent({
      actorId: "usr-super-admin-1",
      action: "ADMIN_PARTICIPANT_UPDATED",
      entityType: "PARTICIPANT",
      entityId: id,
      metadata: {
        full_name: participant.full_name,
        status: participant.status,
        campus_status: participant.campus_status,
      },
    });

    await saveStoreToDisk();

    return NextResponse.json({
      success: true,
      participant,
      message: `Updated ${participant.full_name} successfully.`,
    });
  } catch (err) {
    console.error("Update participant error:", err);
    return NextResponse.json({ error: "Failed to update participant." }, { status: 500 });
  }
}

// DELETE Participant (Admin CRUD)
export async function DELETE(request: Request) {
  try {
    await loadStoreFromDisk();
    const { searchParams } = new URL(request.url);
    let id = searchParams.get("id");

    if (!id) {
      try {
        const body = await request.json();
        id = body.id;
      } catch {}
    }

    if (!id) {
      return NextResponse.json({ error: "Participant ID is required." }, { status: 400 });
    }

    const existing = memoryStore.participants.get(id);
    const name = existing?.full_name || id;

    memoryStore.deletedParticipantIds.add(id);
    memoryStore.participants.delete(id);
    memoryStore.documents.delete(`doc-stu-${id}`);
    memoryStore.documents.delete(`doc-aad-${id}`);

    for (const [k, doc] of memoryStore.documents.entries()) {
      if (doc.participant_id === id) memoryStore.documents.delete(k);
    }
    for (const [k, pass] of memoryStore.qrPasses.entries()) {
      if (pass.participant_id === id) memoryStore.qrPasses.delete(k);
    }
    memoryStore.accessLogs = memoryStore.accessLogs.filter((l) => l.participant_id !== id);

    await logAuditEvent({
      actorId: "usr-super-admin-1",
      action: "ADMIN_PARTICIPANT_DELETED",
      entityType: "PARTICIPANT",
      entityId: id,
      metadata: { deleted_name: name },
    });

    await saveStoreToDisk();

    return NextResponse.json({
      success: true,
      message: `Deleted participant "${name}" permanently.`,
    });
  } catch (err) {
    console.error("Delete participant error:", err);
    return NextResponse.json({ error: "Failed to delete participant." }, { status: 500 });
  }
}
