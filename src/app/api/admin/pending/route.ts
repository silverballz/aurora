import { NextResponse } from "next/server";
import { memoryStore } from "@/lib/data/store";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const statusFilter = searchParams.get("status") || "UNDER_REVIEW";
  const query = searchParams.get("query")?.toLowerCase();

  let participants = Array.from(memoryStore.participants.values());

  if (statusFilter !== "ALL") {
    participants = participants.filter((p) => p.status === statusFilter);
  }

  if (query) {
    participants = participants.filter(
      (p) =>
        p.full_name.toLowerCase().includes(query) ||
        p.email.toLowerCase().includes(query) ||
        (p.registration_id && p.registration_id.toLowerCase().includes(query)) ||
        (p.college && p.college.toLowerCase().includes(query))
    );
  }

  participants.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

  // Attach documents and events to each participant
  const populated = participants.map((p) => {
    const docs = Array.from(memoryStore.documents.values()).filter((d) => d.participant_id === p.id);
    const pes = Array.from(memoryStore.participantEvents.values()).filter((pe) => pe.participant_id === p.id);
    const events = pes.map((pe) => memoryStore.events.get(pe.event_id)).filter(Boolean);

    let paymentRef = null;
    if (p.invitation_id && memoryStore.invitations.has(p.invitation_id)) {
      paymentRef = memoryStore.invitations.get(p.invitation_id)?.payment_reference;
    }

    return {
      ...p,
      documents: docs,
      events,
      payment_reference: paymentRef,
    };
  });

  return NextResponse.json({
    participants: populated,
    counts: {
      under_review: Array.from(memoryStore.participants.values()).filter((p) => p.status === "UNDER_REVIEW").length,
      correction: Array.from(memoryStore.participants.values()).filter((p) => p.status === "CORRECTION").length,
      approved: Array.from(memoryStore.participants.values()).filter((p) => p.status === "APPROVED").length,
      all: memoryStore.participants.size,
    },
  });
}
