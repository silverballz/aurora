import { NextResponse } from "next/server";
import { memoryStore } from "@/lib/data/store";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const statusFilter = searchParams.get("status");
  const query = searchParams.get("query")?.toLowerCase();

  let invitations = Array.from(memoryStore.invitations.values());

  if (statusFilter && statusFilter !== "ALL") {
    invitations = invitations.filter((inv) => inv.status === statusFilter);
  }

  if (query) {
    invitations = invitations.filter(
      (inv) =>
        inv.participant_name.toLowerCase().includes(query) ||
        inv.email.toLowerCase().includes(query) ||
        inv.payment_reference.toLowerCase().includes(query)
    );
  }

  invitations.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  // Metrics
  const total = memoryStore.invitations.size;
  const active = Array.from(memoryStore.invitations.values()).filter((i) => i.status === "ACTIVE").length;
  const used = Array.from(memoryStore.invitations.values()).filter((i) => i.status === "USED").length;
  const expired = Array.from(memoryStore.invitations.values()).filter((i) => i.status === "EXPIRED").length;
  const revoked = Array.from(memoryStore.invitations.values()).filter((i) => i.status === "REVOKED").length;

  return NextResponse.json({
    invitations,
    metrics: {
      total,
      active,
      used,
      expired,
      revoked,
    },
  });
}
