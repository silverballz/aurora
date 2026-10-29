import { NextResponse } from "next/server";
import { memoryStore, loadStoreFromDisk } from "@/lib/data/store";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  await loadStoreFromDisk();
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") || "50", 10);

  const logs = [...memoryStore.accessLogs].reverse().slice(0, limit);

  const populatedLogs = logs.map((log) => {
    const participant = memoryStore.participants.get(log.participant_id);
    const gate = memoryStore.gates.get(log.gate_id || "");
    const operator = memoryStore.users.get(log.operator_id || "");

    return {
      id: log.id,
      timestamp: log.timestamp,
      registration_id: log.registration_id,
      participant_name: participant?.full_name || "Unknown Participant",
      college: participant?.college || "—",
      gate_name: gate?.name || "Main Gate",
      action: log.action,
      result: log.result,
      operator_name: operator?.full_name || "Gate Operator",
      notes: log.notes,
    };
  });

  return NextResponse.json({ logs: populatedLogs });
}
