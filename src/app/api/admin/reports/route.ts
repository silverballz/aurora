import { NextResponse } from "next/server";
import { memoryStore, loadStoreFromDisk } from "@/lib/data/store";

export async function GET(request: Request) {
  loadStoreFromDisk();
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "participants";

  if (type === "participants") {
    // Generate CSV for Participants (NO Aadhaar)
    const headers = ["Registration ID", "Full Name", "College", "Course", "Year", "Email", "Mobile", "Campus Status", "Status"];
    const rows = Array.from(memoryStore.participants.values()).map((p) => [
      p.registration_id || "PENDING",
      `"${p.full_name.replace(/"/g, '""')}"`,
      `"${(p.college || "").replace(/"/g, '""')}"`,
      `"${(p.course || "").replace(/"/g, '""')}"`,
      `"${(p.year_of_study || "").replace(/"/g, '""')}"`,
      p.email,
      p.mobile,
      p.campus_status,
      p.status,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="aurora_participants_${Date.now()}.csv"`,
      },
    });
  }

  if (type === "access_logs") {
    // Generate CSV for Gate Access Logs
    const headers = ["Time", "Date", "Registration ID", "Participant Name", "Gate", "Action", "Result", "Notes"];
    const rows = memoryStore.accessLogs.map((log) => {
      const p = memoryStore.participants.get(log.participant_id);
      const gate = memoryStore.gates.get(log.gate_id || "");
      const d = new Date(log.timestamp);
      return [
        d.toLocaleTimeString("en-IN"),
        d.toLocaleDateString("en-IN"),
        log.registration_id,
        `"${(p?.full_name || "Unknown").replace(/"/g, '""')}"`,
        `"${(gate?.name || "Main Gate").replace(/"/g, '""')}"`,
        log.action,
        log.result,
        `"${(log.notes || "").replace(/"/g, '""')}"`,
      ];
    });

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="aurora_access_logs_${Date.now()}.csv"`,
      },
    });
  }

  if (type === "events") {
    // Generate CSV for Event registrations
    const headers = ["Event Name", "Date", "Venue", "Total Registered"];
    const rows = Array.from(memoryStore.events.values()).map((e) => {
      const count = Array.from(memoryStore.participantEvents.values()).filter((pe) => pe.event_id === e.id).length;
      return [`"${e.name.replace(/"/g, '""')}"`, e.date, `"${e.venue.replace(/"/g, '""')}"`, count];
    });

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="aurora_events_${Date.now()}.csv"`,
      },
    });
  }

  return NextResponse.json({ error: "Invalid report type" }, { status: 400 });
}
