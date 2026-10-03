"use client";

import { Download, FileSpreadsheet, ShieldAlert } from "lucide-react";
import { StaffShell } from "@/components/staff-shell";
import { Button } from "@/components/ui/button";

export default function AdminReportsPage() {
  const reports = [
    {
      title: "Full Participant Registry",
      desc: "Exports all participant registration IDs, names, colleges, courses, emails, and statuses. Aadhaar numbers are excluded to ensure privacy compliance.",
      url: "/api/admin/reports?type=participants",
      filename: "aurora_participants.csv",
    },
    {
      title: "Gate Ingress & Egress Logs",
      desc: "Complete audit record of every scan, timestamp, gate location, action (ENTRY/EXIT), result, and security operator.",
      url: "/api/admin/reports?type=access_logs",
      filename: "aurora_access_logs.csv",
    },
    {
      title: "Event Registration Counts",
      desc: "Aggregate metrics of registered participants across all Kaltarang 2026 competitions and workshops.",
      url: "/api/admin/reports?type=events",
      filename: "aurora_events.csv",
    },
  ];

  return (
    <StaffShell
      title="Reports & Data Export"
      subtitle="Generate and download privacy-compliant CSV datasets for fest administration and security audits"
    >
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {reports.map((r) => (
          <div key={r.title} className="surface p-6 flex flex-col justify-between">
            <div>
              <div className="size-12 rounded-lg bg-soft text-primary grid place-items-center mb-4">
                <FileSpreadsheet className="size-6" />
              </div>
              <h2 className="font-semibold text-base">{r.title}</h2>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{r.desc}</p>
            </div>
            <div className="mt-6 pt-4 border-t border-border">
              <Button asChild className="w-full bg-primary hover:bg-primary/90">
                <a href={r.url} download={r.filename}>
                  <Download className="size-4 mr-2" /> Download CSV
                </a>
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 p-5 bg-card/60 border border-border rounded-lg flex items-start gap-3">
        <ShieldAlert className="size-5 text-primary shrink-0 mt-0.5" />
        <div className="text-xs text-muted-foreground leading-relaxed">
          <strong>Institutional Privacy Guard:</strong> In compliance with section 50 & 62 of the master engineering specification, Aadhaar numbers and private document contents are strictly stripped from all normal exported reports.
        </div>
      </div>
    </StaffShell>
  );
}
