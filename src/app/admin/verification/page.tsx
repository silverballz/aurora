"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  ChevronRight,
  Eye,
  FileSearch,
  FileText,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { StaffShell } from "@/components/staff-shell";
import { StatusPill } from "@/components/aurora-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function AdminVerificationPage() {
  const [participants, setParticipants] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("UNDER_REVIEW");
  const [search, setSearch] = useState("");

  // Correction Modal
  const [correctionModalOpen, setCorrectionModalOpen] = useState(false);
  const [correctionReason, setCorrectionReason] = useState("");

  // Reject Modal
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const fetchQueue = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `/api/admin/pending?status=${statusFilter}&query=${encodeURIComponent(search)}`
      );
      const data = await res.json();
      setParticipants(data.participants || []);
      if (data.participants?.length > 0 && !selectedId) {
        setSelectedId(data.participants[0].id);
      }
    } catch {
      toast.error("Failed to fetch verification queue");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, [statusFilter, search]);

  const selectedParticipant = participants.find((p) => p.id === selectedId) || participants[0];

  const handleApprove = async () => {
    if (!selectedParticipant) return;
    try {
      setActionLoading(true);
      const res = await fetch("/api/admin/verify/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participant_id: selectedParticipant.id }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Approval failed.");
      } else {
        toast.success(`Participant Approved! Issued ID: ${data.registration_id}`);
        fetchQueue();
      }
    } catch {
      toast.error("Network error during approval.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCorrectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedParticipant || !correctionReason) return;

    try {
      setActionLoading(true);
      const res = await fetch("/api/admin/verify/correction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participant_id: selectedParticipant.id,
          reason: correctionReason,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Correction request failed.");
      } else {
        toast.success("Correction request dispatched to participant.");
        setCorrectionModalOpen(false);
        setCorrectionReason("");
        fetchQueue();
      }
    } catch {
      toast.error("Network error requesting correction.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedParticipant || !rejectReason) return;

    try {
      setActionLoading(true);
      const res = await fetch("/api/admin/verify/reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participant_id: selectedParticipant.id,
          reason: rejectReason,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Rejection failed.");
      } else {
        toast.error("Participant registration rejected.");
        setRejectModalOpen(false);
        setRejectReason("");
        fetchQueue();
      }
    } catch {
      toast.error("Network error.");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <StaffShell
      title="Participant Verification Desk"
      subtitle="Examine submitted credentials, compare live identity photograph, and issue active QR passes"
    >
      {/* Top Filter */}
      <div className="surface p-4 mb-6 flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search candidate, college, or reg ID..."
            className="pl-9 h-9 text-xs"
          />
        </div>

        <div className="flex gap-2">
          {["UNDER_REVIEW", "CORRECTION", "APPROVED", "ALL"].map((s) => (
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

      {/* Split View: List on left, Inspector on right */}
      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        {/* Left: Queue List */}
        <section className="surface divide-y divide-border overflow-hidden max-h-[750px] overflow-y-auto">
          {participants.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground">
              No participants found in this category.
            </div>
          ) : (
            participants.map((p) => {
              const isSelected = p.id === selectedParticipant?.id;
              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedId(p.id)}
                  className={`p-4 cursor-pointer transition-colors ${
                    isSelected ? "bg-soft/40 border-l-4 border-l-primary" : "hover:bg-muted/30"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-sm truncate">{p.full_name}</h3>
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
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 truncate">
                    {p.college || "College not set"}
                  </p>
                  <div className="flex justify-between items-center mt-2 text-[11px] text-muted-foreground font-mono">
                    <span>{p.registration_id || "REG PENDING"}</span>
                    <span>{p.payment_reference || "PAID"}</span>
                  </div>
                </div>
              );
            })
          )}
        </section>

        {/* Right: Detailed Inspector Panel */}
        {selectedParticipant ? (
          <section className="surface overflow-hidden flex flex-col justify-between">
            {/* Header */}
            <div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border p-6 bg-card/60">
                <div className="flex items-center gap-4">
                  <div className="size-16 rounded-lg overflow-hidden border border-border bg-muted shrink-0">
                    <img
                      src={selectedParticipant.selfie_path || "/assets/participant-avatar.jpg"}
                      alt={selectedParticipant.full_name}
                      className="size-full object-cover"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-display text-2xl font-bold">{selectedParticipant.full_name}</h2>
                      <StatusPill tone={selectedParticipant.status === "APPROVED" ? "success" : "pending"}>
                        {selectedParticipant.status.replace("_", " ")}
                      </StatusPill>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {selectedParticipant.email} · {selectedParticipant.mobile}
                    </p>
                    <p className="text-xs font-mono text-primary font-semibold mt-1">
                      {selectedParticipant.registration_id || "Awaiting Verification"}
                    </p>
                  </div>
                </div>

                <div className="text-right text-xs bg-muted/50 p-2.5 rounded-md border border-border">
                  <span className="text-muted-foreground block text-[10px] uppercase tracking-wider">Payment Ref</span>
                  <span className="font-mono font-bold">{selectedParticipant.payment_reference || "VERIFIED"}</span>
                </div>
              </div>

              {/* Document Review Cards */}
              <div className="grid sm:grid-cols-2 gap-4 p-6 border-b border-border bg-muted/20">
                {/* Student ID Card */}
                <div className="surface p-4 border border-border">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Student Identity Card
                    </span>
                    <span className="text-[10px] text-success font-semibold flex items-center gap-1">
                      <CheckCircle2 className="size-3" /> Attached
                    </span>
                  </div>
                  <div className="aspect-[16/10] bg-muted rounded border border-dashed border-border grid place-items-center text-center p-3">
                    <FileSearch className="size-8 text-primary mb-1" />
                    <p className="text-xs font-medium">Student Card File</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Valid student proof</p>
                  </div>
                </div>

                {/* Aadhaar Card */}
                <div className="surface p-4 border border-border">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Government ID (Aadhaar)
                    </span>
                    <span className="text-[10px] text-success font-semibold flex items-center gap-1">
                      <CheckCircle2 className="size-3" /> Encrypted
                    </span>
                  </div>
                  <div className="aspect-[16/10] bg-muted rounded border border-dashed border-border grid place-items-center text-center p-3">
                    <ShieldCheck className="size-8 text-primary mb-1" />
                    <p className="text-xs font-medium">Aadhaar Card Record</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Short-lived signed URL</p>
                  </div>
                </div>
              </div>

              {/* Details List */}
              <div className="p-6">
                <p className="section-label text-primary">Candidate Dossier</p>
                <dl className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <dt className="text-muted-foreground">College / University</dt>
                    <dd className="font-semibold text-sm mt-0.5">{selectedParticipant.college || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Course & Year</dt>
                    <dd className="font-semibold text-sm mt-0.5">
                      {selectedParticipant.course || "—"} ({selectedParticipant.year_of_study || "—"})
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Campus State</dt>
                    <dd className="font-semibold text-sm mt-0.5 uppercase tracking-wider text-primary">
                      {selectedParticipant.campus_status}
                    </dd>
                  </div>
                  <div className="sm:col-span-3">
                    <dt className="text-muted-foreground">Permanent Address</dt>
                    <dd className="font-medium mt-0.5">
                      {selectedParticipant.address || "—"}, {selectedParticipant.city} ({selectedParticipant.state} - {selectedParticipant.pincode})
                    </dd>
                  </div>
                </dl>
              </div>
            </div>

            {/* Bottom Actions Bar */}
            <div className="p-6 border-t border-border bg-card/60 flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs text-muted-foreground">
                All decisions are logged in the immutable audit trail.
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCorrectionModalOpen(true)}
                  disabled={actionLoading}
                >
                  <AlertCircle className="size-4 mr-1 text-warning" /> Request Correction
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setRejectModalOpen(true)}
                  disabled={actionLoading}
                >
                  <XCircle className="size-4 mr-1" /> Reject
                </Button>
                <Button
                  size="sm"
                  onClick={handleApprove}
                  disabled={actionLoading || selectedParticipant.status === "APPROVED"}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                >
                  <Check className="size-4 mr-1" /> Approve & Issue QR Pass
                </Button>
              </div>
            </div>
          </section>
        ) : (
          <div className="surface p-12 text-center text-muted-foreground">
            Select a participant to review.
          </div>
        )}
      </div>

      {/* Correction Modal */}
      {correctionModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="surface max-w-md w-full p-6 space-y-4">
            <h3 className="font-display text-2xl font-bold">Request Document Correction</h3>
            <p className="text-xs text-muted-foreground">
              The participant will receive an email explaining what needs to be fixed.
            </p>
            <form onSubmit={handleCorrectionSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Reason for Correction *
                </label>
                <textarea
                  value={correctionReason}
                  onChange={(e) => setCorrectionReason(e.target.value)}
                  placeholder="e.g. Student ID card image is blurry or roll number is unreadable..."
                  className="w-full min-h-24 rounded-md border border-input p-3 text-xs focus:ring-1 focus:ring-ring outline-none"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setCorrectionModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={actionLoading} className="bg-warning text-warning-foreground hover:bg-warning/90">
                  Send Correction Request
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="surface max-w-md w-full p-6 space-y-4">
            <h3 className="font-display text-2xl font-bold text-destructive">Reject Participant</h3>
            <p className="text-xs text-muted-foreground">
              Provide the administrative reason for rejecting this registration. Access will be revoked.
            </p>
            <form onSubmit={handleRejectSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Rejection Reason *
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="e.g. Fraudulent documentation / duplicate registration..."
                  className="w-full min-h-24 rounded-md border border-input p-3 text-xs focus:ring-1 focus:ring-ring outline-none"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setRejectModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={actionLoading} variant="destructive">
                  Confirm Rejection
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </StaffShell>
  );
}
