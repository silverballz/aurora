"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Download, Search, UserCheck } from "lucide-react";
import { StaffShell } from "@/components/staff-shell";
import { StatusPill } from "@/components/aurora-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AdminParticipantsPage() {
  const [participants, setParticipants] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await fetch(`/api/admin/pending?status=${statusFilter}&query=${encodeURIComponent(search)}`);
        const data = await res.json();
        setParticipants(data.participants || []);
      } catch (e) {
        console.error("Load error:", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [search, statusFilter]);

  return (
    <StaffShell
      title="Participant Directory"
      subtitle="Complete database of invited, verified, and active campus attendees"
      action={
        <Button asChild variant="outline" size="sm">
          <a href="/api/admin/reports?type=participants" download>
            <Download className="size-4 mr-1.5" /> Export CSV (No Aadhaar)
          </a>
        </Button>
      }
    >
      <div className="surface p-4 mb-6 flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, college, email, or reg ID..."
            className="pl-9 h-9 text-xs"
          />
        </div>

        <div className="flex gap-2">
          {["ALL", "APPROVED", "UNDER_REVIEW", "CORRECTION", "REVOKED"].map((s) => (
            <Button
              key={s}
              size="sm"
              variant={statusFilter === s ? "default" : "outline"}
              onClick={() => setStatusFilter(s)}
              className="text-xs"
            >
              {s.replace("_", " ")}
            </Button>
          ))}
        </div>
      </div>

      <div className="surface overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-muted/50 border-b border-border uppercase tracking-wider text-[10px] text-muted-foreground">
            <tr>
              <th className="py-3.5 px-4 font-semibold">Registration ID</th>
              <th className="py-3.5 px-4 font-semibold">Participant Name</th>
              <th className="py-3.5 px-4 font-semibold">Institution / Degree</th>
              <th className="py-3.5 px-4 font-semibold">Campus State</th>
              <th className="py-3.5 px-4 font-semibold">Status</th>
              <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {participants.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-muted-foreground">
                  No participant records found.
                </td>
              </tr>
            ) : (
              participants.map((p) => (
                <tr key={p.id} className="hover:bg-muted/20 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-primary">
                    {p.registration_id || "Awaiting Verification"}
                  </td>
                  <td className="py-3.5 px-4 font-semibold">{p.full_name}</td>
                  <td className="py-3.5 px-4">
                    <p className="text-foreground">{p.college || "—"}</p>
                    <p className="text-muted-foreground text-[11px]">{p.course} ({p.year_of_study})</p>
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`font-semibold uppercase tracking-wider text-[11px] ${
                        p.campus_status === "INSIDE" ? "text-success" : "text-muted-foreground"
                      }`}
                    >
                      {p.campus_status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <StatusPill
                      tone={
                        p.status === "APPROVED"
                          ? "success"
                          : p.status === "CORRECTION"
                          ? "danger"
                          : "pending"
                      }
                    >
                      {p.status.replace("_", " ")}
                    </StatusPill>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <Button asChild size="sm" variant="ghost">
                      <Link href={`/admin/verification?id=${encodeURIComponent(p.id)}`}>Inspect</Link>
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </StaffShell>
  );
}
