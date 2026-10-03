"use client";

import { useEffect, useState } from "react";
import { FileText, Shield } from "lucide-react";
import { StaffShell } from "@/components/staff-shell";

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await fetch("/api/admin/audit");
        const data = await res.json();
        setLogs(data.logs || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <StaffShell
      title="Administrative Audit Trail"
      subtitle="Immutable, append-only record of sensitive operations (approvals, invitations, overrides, rejections)"
    >
      <div className="surface overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-muted/50 border-b border-border uppercase tracking-wider text-[10px] text-muted-foreground">
            <tr>
              <th className="py-3.5 px-4 font-semibold">Timestamp</th>
              <th className="py-3.5 px-4 font-semibold">Action</th>
              <th className="py-3.5 px-4 font-semibold">Target Entity</th>
              <th className="py-3.5 px-4 font-semibold">Details / Metadata</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border font-mono text-[11px]">
            {logs.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-muted-foreground font-sans text-xs">
                  No administrative audit records logged yet.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="hover:bg-muted/20">
                  <td className="py-3 px-4 text-muted-foreground">
                    {new Date(log.created_at).toLocaleString("en-IN")}
                  </td>
                  <td className="py-3 px-4 font-bold text-primary">{log.action}</td>
                  <td className="py-3 px-4 text-foreground">
                    {log.entity_type} {log.entity_id ? `(${log.entity_id})` : ""}
                  </td>
                  <td className="py-3 px-4 text-muted-foreground text-[10px]">
                    {JSON.stringify(log.metadata)}
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
