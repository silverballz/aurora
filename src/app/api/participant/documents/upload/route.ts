import { NextResponse } from "next/server";
import { memoryStore } from "@/lib/data/store";
import { cookies } from "next/headers";
import { Document, DocumentType } from "@/lib/types/database";

const ALLOWED_MIME_TYPES = ["application/pdf", "image/jpeg", "image/png"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("aurora_session");
    const formData = await request.formData();

    const file = formData.get("file") as File | null;
    const documentType = formData.get("document_type") as DocumentType | null;
    const participantId = formData.get("participant_id") as string | null;

    if (!file || !documentType) {
      return NextResponse.json(
        { error: "File and document_type ('STUDENT_ID' or 'AADHAAR') are required." },
        { status: 400 }
      );
    }

    // MIME type check
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only PDF, JPEG, and PNG files are accepted." },
        { status: 400 }
      );
    }

    // Size check
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File size exceeds the 5MB limit. Please upload a smaller file." },
        { status: 400 }
      );
    }

    // Find participant
    let participant = null;
    if (participantId && memoryStore.participants.has(participantId)) {
      participant = memoryStore.participants.get(participantId);
    } else if (sessionCookie) {
      const session = JSON.parse(Buffer.from(sessionCookie.value, "base64").toString("utf-8"));
      for (const p of memoryStore.participants.values()) {
        if (p.email.toLowerCase() === session.email.toLowerCase()) {
          participant = p;
          break;
        }
      }
    }

    if (!participant) {
      return NextResponse.json({ error: "Participant record not found." }, { status: 404 });
    }

    // Internal sanitized storage path
    const extension = file.name.split(".").pop() || (file.type === "application/pdf" ? "pdf" : "jpg");
    const safeStoragePath = `participants/${participant.id}/${documentType.toLowerCase()}/${Date.now()}.${extension}`;

    // Remove existing document of the same type if updating
    for (const [docId, doc] of memoryStore.documents.entries()) {
      if (doc.participant_id === participant.id && doc.document_type === documentType) {
        memoryStore.documents.delete(docId);
      }
    }

    const docId = `doc-${Date.now()}`;
    const newDoc: Document = {
      id: docId,
      participant_id: participant.id,
      document_type: documentType,
      storage_path: safeStoragePath,
      original_filename: file.name.replace(/[^a-zA-Z0-9._-]/g, "_"),
      mime_type: file.type,
      file_size: file.size,
      status: "PENDING",
      uploaded_at: new Date().toISOString(),
      verified_at: null,
      verified_by: null,
    };

    memoryStore.documents.set(docId, newDoc);

    return NextResponse.json({
      success: true,
      document: newDoc,
    });
  } catch (error) {
    console.error("Document upload error:", error);
    return NextResponse.json({ error: "Failed to upload document" }, { status: 500 });
  }
}
