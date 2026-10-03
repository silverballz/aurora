"use client";

import { useEffect, useState } from "react";
import { ArrowDownRight, ArrowUpRight, RefreshCw, Shield, Users } from "lucide-react";
import { StaffShell } from "@/components/staff-shell";
import { Button } from "@/components/ui/button";

export default function AdminOccupancyPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchOccupancy = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/occupancy");
      const json = await res.json();
      setData(json);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOccupancy();
    const interval = setInterval(fetchOccupancy, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <StaffShell
      title="Live Campus Occupancy"
      subtitle="Real-time headcounts, ingress/egress ratios, and gate movement reconciliation"
      action={
        <Button onClick={fetchOccupancy} variant="outline" size="sm">
          <RefreshCw className={`size-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} /> Refresh Counts
        </Button>
      }
    >
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="surface p-8 text-center border-l-4 border-l-success">
          <span className="section-label">Currently Inside Campus</span>
          <p className="font-display text-6xl mt-2 text-success font-bold">
            {data?.currentlyInside ?? "—"}
          </p>
          <p className="text-xs text-muted-foreground mt-2">Active verified attendees on premises</p>
        </div>

        <div className="surface p-8 text-center border-l-4 border-l-primary">
          <span className="section-label">Currently Outside Campus</span>
          <p className="font-display text-6xl mt-2 text-primary font-bold">
            {data?.currentlyOutside ?? "—"}
          </p>
          <p className="text-xs text-muted-foreground mt-2">Approved participants yet to enter or exited</p>
        </div>

        <div className="surface p-8 text-center border-l-4 border-l-foreground">
          <span className="section-label">Total Verified Roster</span>
          <p className="font-display text-6xl mt-2 font-bold">
            {data?.totalApproved ?? "—"}
          </p>
          <p className="text-xs text-muted-foreground mt-2">All approved external participants</p>
        </div>
      </div>

      <div className="mt-8 surface p-6">
        <h2 className="font-display text-2xl mb-4">Gate-Wise Daily Movement</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {(data?.gateBreakdown || []).map((gate: any) => (
            <div key={gate.gateId} className="border border-border rounded-lg p-5 bg-card">
              <h3 className="font-semibold text-base">{gate.gateName}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{gate.location}</p>
              <div className="mt-4 pt-3 border-t border-border flex justify-between text-xs font-mono">
                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase">Entries</span>
                  <span className="font-bold text-success text-sm flex items-center gap-0.5">
                    <ArrowDownRight className="size-3.5" /> +{gate.entriesToday}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase">Exits</span>
                  <span className="font-bold text-destructive text-sm flex items-center gap-0.5">
                    <ArrowUpRight className="size-3.5" /> -{gate.exitsToday}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </StaffShell>
  );
}
