import { NextResponse } from "next/server";
import { memoryStore, loadStoreFromDisk } from "@/lib/data/store";
import { generateQrDataUrl } from "@/lib/qr/generator";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  await loadStoreFromDisk();
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
        (p.mobile && p.mobile.toLowerCase().includes(query)) ||
        (p.registration_id && p.registration_id.toLowerCase().includes(query)) ||
        (p.college && p.college.toLowerCase().includes(query))
    );
  }

  participants.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

  const populated = await Promise.all(
    participants.map(async (p) => {
      const docs = Array.from(memoryStore.documents.values()).filter((d) => d.participant_id === p.id);
      const pes = Array.from(memoryStore.participantEvents.values()).filter((pe) => pe.participant_id === p.id);
      const events = pes.map((pe) => memoryStore.events.get(pe.event_id)).filter(Boolean);

      let qrDataUrl = p.qr_data_url || null;
      if (p.status === "APPROVED" && p.registration_id) {
        if (!qrDataUrl || (p.qr_token && p.qr_token.startsWith("KLT26."))) {
          p.qr_token = p.registration_id;
          qrDataUrl = await generateQrDataUrl(p.registration_id);
          p.qr_data_url = qrDataUrl;
        }
      }

      return {
        ...p,
        documents: docs,
        events,
        qr_data_url: qrDataUrl,
      };
    })
  );

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
