import { NextResponse } from "next/server";
import { memoryStore } from "@/lib/data/store";

export async function GET() {
  const participants = Array.from(memoryStore.participants.values());
  const approved = participants.filter((p) => p.status === "APPROVED");

  const currentlyInside = approved.filter((p) => p.campus_status === "INSIDE").length;
  const currentlyOutside = approved.filter((p) => p.campus_status === "OUTSIDE").length;

  const todayStr = new Date().toISOString().split("T")[0];
  const todayLogs = memoryStore.accessLogs.filter((log) => log.timestamp.startsWith(todayStr));

  const entriesToday = todayLogs.filter((log) => log.action === "ENTRY" && log.result === "ALLOWED").length;
  const exitsToday = todayLogs.filter((log) => log.action === "EXIT" && log.result === "ALLOWED").length;

  // Gate breakdown
  const gateBreakdown = Array.from(memoryStore.gates.values()).map((gate) => {
    const gateEntries = todayLogs.filter((log) => log.gate_id === gate.id && log.action === "ENTRY" && log.result === "ALLOWED").length;
    const gateExits = todayLogs.filter((log) => log.gate_id === gate.id && log.action === "EXIT" && log.result === "ALLOWED").length;
    return {
      gateId: gate.id,
      gateName: gate.name,
      location: gate.location,
      entriesToday: gateEntries,
      exitsToday: gateExits,
      netMovement: gateEntries - gateExits,
    };
  });

  return NextResponse.json({
    currentlyInside,
    currentlyOutside,
    totalApproved: approved.length,
    entriesToday,
    exitsToday,
    gateBreakdown,
  });
}
