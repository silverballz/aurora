import { NextResponse } from "next/server";
import { memoryStore, loadStoreFromDisk } from "@/lib/data/store";

export const dynamic = "force-dynamic";

export async function GET() {
  await loadStoreFromDisk();
  const participants = Array.from(memoryStore.participants.values());
  const approved = participants.filter((p) => p.status === "APPROVED");

  const currentlyInside = approved.filter((p) => p.campus_status === "INSIDE").length;
  const currentlyOutside = approved.filter((p) => p.campus_status === "OUTSIDE").length;

  const todayStr = new Date().toISOString().split("T")[0];
  const todayLogs = memoryStore.accessLogs.filter((log) => log.timestamp.startsWith(todayStr));

  const entriesToday = todayLogs.filter(
    (log) => log.action === "ENTRY" && log.result === "ALLOWED"
  ).length;
  const exitsToday = todayLogs.filter(
    (log) => log.action === "EXIT" && log.result === "ALLOWED"
  ).length;

  // Single Gate breakdown (RGIPT Main Gate)
  const gateBreakdown = [
    {
      gateId: "gate-main",
      gateName: "RGIPT MAIN GATE",
      location: "Rajiv Gandhi Institute of Petroleum Technology · Main Campus Entrance",
      entriesToday,
      exitsToday,
      netMovement: entriesToday - exitsToday,
    },
  ];

  return NextResponse.json({
    currentlyInside,
    currentlyOutside,
    totalApproved: approved.length,
    entriesToday,
    exitsToday,
    gateBreakdown,
  });
}
