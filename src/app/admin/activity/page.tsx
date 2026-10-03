"use client";

import { useEffect, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, CheckCircle2, Download, RefreshCw, XCircle } from "lucide-react";
import { StaffShell } from "@/components/staff-shell";
import { Button } from "@/components/ui/button";

export default function AdminActivityPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/activity?limit=50");
      const data = await res.json();
      setLogs(data.logs || []);
    } catch (e) {
      console.error("Activity load error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 5000); // 5-second live refresh
    return () => clearInterval(interval);
  }, []);

  return (
    <StaffShell
      title="Access Activity Stream"
      subtitle="Real-time gate scan feed across RGIPT campus entrances with 5-second live polling"
      action={
        <div className="flex gap-2">
          <Button onClick={fetchLogs} variant="outline" size="sm">
            <RefreshCw className={`size-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
          <Button asChild variant="outline" size="sm">
            <a href="/api/admin/reports?type=access_logs" download>
              <Download className="size-3.5 mr-1.5" /> Export Logs CSV
            </a>
          </Button>
        </div>
      }
    >
      <div className="surface overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-muted/50 border-b border-border uppercase tracking-wider text-[10px] text-muted-foreground">
            <tr>
              <th className="py-3.5 px-4 font-semibold">Time</th>
              <th className="py-3.5 px-4 font-semibold">Registration ID</th>
              <th className="py-3.5 px-4 font-semibold">Participant</th>
              <th className="py-3.5 px-4 font-semibold">Gate Location</th>
              <th className="py-3.5 px-4 font-semibold">Action</th>
              <th className="py-3.5 px-4 font-semibold">Result</th>
              <th className="py-3.5 px-4 font-semibold">Operator / Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border font-mono text-[11px]">
            {logs.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-muted-foreground font-sans text-xs">
                  No gate scan activity recorded yet today.
                </td>
              </tr>
            ) : (
              logs.map((log) => {
                const isEntry = log.action === "ENTRY";
                const isAllowed = log.result === "ALLOWED";

                return (
                  <tr key={log.id} className="hover:bg-muted/20 transition-colors">
                    <td className="py-3 px-4 text-muted-foreground">
                      {new Date(log.timestamp).toLocaleTimeString("en-IN")}
                    </td>
                    <td className="py-3 px-4 font-bold text-foreground">{log.registration_id}</td>
                    <td className="py-3 px-4 font-sans font-medium text-foreground">{log.participant_name}</td>
                    <td className="py-3 px-4 font-sans text-muted-foreground">{log.gate_name}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 font-semibold ${
                          isEntry ? "text-primary" : "text-foreground"
                        }`}
                      >
                        {isEntry ? <ArrowDownLeft className="size-3.5" /> : <ArrowUpRight className="size-3.5" />}
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 font-semibold ${
                          isAllowed
                            ? "text-success"
                            : log.result === "OVERRIDDEN"
                            ? "text-warning"
                            : "text-destructive"
                        }`}
                      >
                        {isAllowed ? <CheckCircle2 className="size-3.5" /> : <XCircle className="size-3.5" />}
                        {log.result}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-sans text-muted-foreground text-[11px]">
                      {log.notes || log.operator_name}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </StaffShell>
  );
}
