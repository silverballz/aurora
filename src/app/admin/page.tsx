"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  CheckCircle2,
  Clock,
  LogIn,
  LogOut,
  Mail,
  Shield,
  ShieldCheck,
  Users,
} from "lucide-react";
import { StaffShell } from "@/components/staff-shell";
import { StatusPill } from "@/components/aurora-shell";
import { Button } from "@/components/ui/button";

export default function AdminOverviewPage() {
  const [occupancy, setOccupancy] = useState<any>(null);
  const [pending, setPending] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const [occRes, pendRes] = await Promise.all([
          fetch("/api/admin/occupancy"),
          fetch("/api/admin/pending?status=UNDER_REVIEW"),
        ]);
        const occData = await occRes.json();
        const pendData = await pendRes.json();

        setOccupancy(occData);
        if (pendData.participants) setPending(pendData.participants.slice(0, 4));
      } catch (e) {
        console.error("Admin load error:", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const metrics = [
    {
      label: "Total Approved",
      value: occupancy?.totalApproved ?? "—",
      detail: "Verified participants",
      icon: CheckCircle2,
      color: "text-success",
    },
    {
      label: "Needs Verification",
      value: pending.length,
      detail: "Awaiting document review",
      icon: Clock,
      color: "text-primary",
    },
    {
      label: "Currently Inside",
      value: occupancy?.currentlyInside ?? "—",
      detail: "Across all campus gates",
      icon: Shield,
      color: "text-foreground",
    },
    {
      label: "Entries Today",
      value: occupancy?.entriesToday ?? "—",
      detail: "Successful gate scans",
      icon: LogIn,
      color: "text-foreground",
    },
  ];

  return (
    <StaffShell
      title="Operations Overview"
      subtitle="Kaltarang 2026 Campus Identity & Gate Access System"
      action={
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/invitations">
              <Mail className="size-4 mr-2" /> QR Emails & SMTP Setup
            </Link>
          </Button>
          <Button asChild size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <Link href="/admin/verification">
              <ShieldCheck className="size-4 mr-2" /> Open Verification Desk
            </Link>
          </Button>
        </div>
      }
    >
      {/* Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <div key={m.label} className="surface p-6">
              <div className="flex items-center justify-between">
                <Icon className={`size-5 ${m.color}`} />
                <span className="section-label">{m.label}</span>
              </div>
              <p className="mt-4 font-display text-4xl sm:text-5xl">{m.value}</p>
              <p className="mt-2 text-xs text-muted-foreground">{m.detail}</p>
            </div>
          );
        })}
      </div>

      {/* Main Grid: Verification Queue & Gate Activity */}
      <div className="mt-8 grid gap-8 xl:grid-cols-[1.5fr_1fr]">
        {/* Verification Queue Preview */}
        <section className="surface overflow-hidden">
          <div className="flex items-center justify-between border-b border-border p-6">
            <div>
              <p className="section-label text-primary">Verification Queue</p>
              <h2 className="mt-1 font-display text-2xl">Needs Attention</h2>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/verification">Open Full Queue</Link>
            </Button>
          </div>

          <div className="divide-y divide-border">
            {pending.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                No submissions currently pending verification.
              </div>
            ) : (
              pending.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-5 hover:bg-muted/40 transition-colors">
                  <div>
                    <h3 className="font-semibold text-sm">{p.full_name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {p.college || "College"} · {p.course || "Course"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusPill tone="pending">Under Review</StatusPill>
                    <Button asChild size="sm" variant="ghost">
                      <Link href={`/admin/verification?id=${encodeURIComponent(p.id)}`}>
                        Inspect <ArrowUpRight className="size-3.5 ml-1" />
                      </Link>
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Gate Activity & Live Occupancy Preview */}
        <section className="space-y-6">
          <div className="surface p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="section-label">Live Campus Gates</p>
                <h2 className="mt-1 font-display text-2xl">Gate Breakdown</h2>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href="/admin/occupancy">View Metrics</Link>
              </Button>
            </div>

            <div className="space-y-3.5">
              {(occupancy?.gateBreakdown || []).map((gate: any) => (
                <div key={gate.gateId} className="flex items-center justify-between p-3 rounded-md bg-muted/40 text-sm">
                  <div>
                    <p className="font-semibold text-xs">{gate.gateName}</p>
                    <p className="text-[11px] text-muted-foreground">{gate.location}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-xs font-semibold text-primary">
                      +{gate.entriesToday} / -{gate.exitsToday}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <Button asChild className="mt-6 w-full bg-secondary text-secondary-foreground hover:bg-secondary/80">
              <Link href="/security">Launch Gate Scanner Console</Link>
            </Button>
          </div>
        </section>
      </div>
    </StaffShell>
  );
}
