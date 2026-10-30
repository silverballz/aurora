"use client";

import {
  Database,
  Download,
  ExternalLink,
  FileCode2,
  FileSpreadsheet,
  Images,
  Printer,
  Server,
} from "lucide-react";
import { StaffShell } from "@/components/staff-shell";
import { Button } from "@/components/ui/button";

export default function AdminReportsPage() {
  const reports = [
    {
      title: "Complete Export: Aadhaar + Student ID + Live Photos (CSV)",
      desc: "Exports all participant details along with direct clickable & downloadable URLs for their Live Photo (Selfie), College Student ID Card, Aadhaar Card, and Static QR Pass.",
      url: "/api/admin/reports?type=full_with_docs",
      filename: "aurora_full_participants_with_aadhaar_studentid.csv",
      icon: FileSpreadsheet,
      highlight: true,
    },
    {
      title: "Visual Dossier: All Live Pics, Student IDs & Aadhaar Cards (PDF / HTML)",
      desc: "Opens or downloads a complete visual archive with every participant's Live Photo, Student ID Card, and Aadhaar Card side-by-side — ready to Print / Save as PDF in 1 click.",
      url: "/api/admin/reports?type=visual_dossier",
      downloadUrl: "/api/admin/reports?type=visual_dossier&download=1",
      filename: "aurora_complete_visual_archive.html",
      icon: Images,
      highlight: true,
    },
    {
      title: "Full Raw Database Backup (JSON)",
      desc: "Complete JSON snapshot of all participant profiles, document records, QR passes, gate entry/exit logs, and audit history.",
      url: "/api/admin/reports?type=json_backup",
      filename: "aurora_database_backup.json",
      icon: FileCode2,
      highlight: false,
    },
    {
      title: "Standard Participant Registry (CSV — Without Aadhaar)",
      desc: "Clean roster of registration IDs, names, colleges, emails, mobile numbers, and gate status for general event coordinators.",
      url: "/api/admin/reports?type=participants",
      filename: "aurora_participants.csv",
      icon: FileSpreadsheet,
      highlight: false,
    },
    {
      title: "RGIPT Main Gate Ingress & Egress Logs (CSV)",
      desc: "Complete timestamped audit log of every Check-In (ENTRY) and Check-Out (EXIT) recorded at the RGIPT Main Gate.",
      url: "/api/admin/reports?type=access_logs",
      filename: "aurora_access_logs.csv",
      icon: FileSpreadsheet,
      highlight: false,
    },
  ];

  return (
    <StaffShell
      title="Reports, Aadhaar/ID Exports & Database Info"
      subtitle="Export all participant details, Live Photos, Student IDs, Aadhaar cards, and inspect cloud storage architecture"
    >
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {reports.map((r) => {
          const Icon = r.icon;
          return (
            <div
              key={r.title}
              className={`surface p-6 flex flex-col justify-between ${
                r.highlight ? "border-2 border-primary/50 bg-primary/5" : ""
              }`}
            >
              <div>
                <div className="size-12 rounded-lg bg-soft text-primary grid place-items-center mb-4">
                  <Icon className="size-6" />
                </div>
                <h2 className="font-semibold text-base">{r.title}</h2>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{r.desc}</p>
              </div>
              <div className="mt-6 pt-4 border-t border-border flex flex-col gap-2">
                {r.downloadUrl ? (
                  <>
                    <Button asChild className="w-full bg-primary hover:bg-primary/90">
                      <a href={r.url} target="_blank" rel="noreferrer">
                        <Printer className="size-4 mr-2" /> Open &amp; Print / Save as PDF
                      </a>
                    </Button>
                    <Button asChild variant="outline" size="sm" className="w-full text-xs">
                      <a href={r.downloadUrl} download={r.filename}>
                        <Download className="size-3.5 mr-1.5" /> Download HTML Archive File
                      </a>
                    </Button>
                  </>
                ) : (
                  <Button asChild className="w-full bg-primary hover:bg-primary/90">
                    <a href={r.url} download={r.filename}>
                      <Download className="size-4 mr-2" /> Download Export
                    </a>
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Exact Cloud Database & Document Storage Architecture Info */}
      <div className="mt-8 surface p-6 space-y-4">
        <div className="flex items-center gap-2.5 border-b border-border pb-3">
          <Database className="size-5 text-primary" />
          <h3 className="font-display text-2xl font-bold">
            Where Our Database &amp; Photos Are Hosted (Live Architecture)
          </h3>
        </div>

        <div className="grid gap-4 md:grid-cols-3 text-xs">
          <div className="p-4 rounded-lg border border-border bg-card space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-primary uppercase tracking-wider">
              <Server className="size-3.5" /> 1. Primary Cloud State Pointer
            </div>
            <p className="font-mono text-[11px] break-all bg-muted p-2 rounded">
              https://api.restful-api.dev/objects/ff808181a09d98f701a18892dca854f9
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Holds the atomic master pointer (<code>blobKey</code> + timestamp) synchronized across all Vercel serverless instances, with automatic fallback replication on <code>ntfy.sh/aurora_klt26_rgipt_prod_store_v3_7f91c2e4</code>.
            </p>
          </div>

          <div className="p-4 rounded-lg border border-border bg-card space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-primary uppercase tracking-wider">
              <Database className="size-3.5" /> 2. Cloud JSON &amp; Sharded Image Blobs
            </div>
            <p className="font-mono text-[11px] break-all bg-muted p-2 rounded">
              https://bytebin.lucko.me/&lt;blobKey&gt;
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Stores the master JSON database snapshot and each participant&apos;s sharded high-resolution <strong>Live Photo, Student ID, and Aadhaar</strong> image blobs (served via <code>/api/doc?key=...&amp;f=selfie|student_id|aadhaar</code> with immutable CDN caching).
            </p>
          </div>

          <div className="p-4 rounded-lg border border-border bg-card space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-primary uppercase tracking-wider">
              <ExternalLink className="size-3.5" /> 3. Edge Runtime &amp; Local Cache
            </div>
            <p className="font-mono text-[11px] break-all bg-muted p-2 rounded">
              Vercel Serverless (/tmp/aurora-kaltarang-2026-store.json)
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Every API route caches the state in memory + <code>/tmp</code> and merges incoming cloud snapshots using CRDT-style timestamp reconciliation (including permanent tombstones when a profile is deleted).
            </p>
          </div>
        </div>
      </div>
    </StaffShell>
  );
}
