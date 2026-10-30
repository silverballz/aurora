"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Copy,
  Download,
  Edit3,
  ExternalLink,
  FileSearch,
  Mail,
  Plus,
  QrCode,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  XCircle,
} from "lucide-react";
import { StaffShell } from "@/components/staff-shell";
import { StatusPill } from "@/components/aurora-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function AdminVerificationPage() {
  const [participants, setParticipants] = useState<any[]>([]);
  const [counts, setCounts] = useState<any>({ under_review: 0, correction: 0, approved: 0, all: 0 });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [previewImage, setPreviewImage] = useState<{ title: string; url: string } | null>(null);

  // Correction Modal
  const [correctionModalOpen, setCorrectionModalOpen] = useState(false);
  const [correctionReason, setCorrectionReason] = useState("");

  // Reject Modal
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  // CRUD Edit / Create Modal
  const [crudModalOpen, setCrudModalOpen] = useState(false);
  const [crudMode, setCrudMode] = useState<"CREATE" | "EDIT">("EDIT");
  const [editFullName, setEditFullName] = useState("");
  const [editCollege, setEditCollege] = useState("");
  const [editMobile, setEditMobile] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editStatus, setEditStatus] = useState("APPROVED");
  const [editCampusStatus, setEditCampusStatus] = useState("OUTSIDE");

  // Inline SMTP Quick-Setup Modal
  const [smtpModalOpen, setSmtpModalOpen] = useState(false);
  const [smtpReady, setSmtpReady] = useState(false);
  const [smtpUser, setSmtpUser] = useState("");
  const [smtpPass, setSmtpPass] = useState("");
  const [savingSmtp, setSavingSmtp] = useState(false);

  const fetchEmailConfig = async () => {
    try {
      const res = await fetch("/api/admin/emails");
      const data = await res.json();
      if (data.config) {
        setSmtpUser(data.config.smtpUser || "");
        setSmtpReady(Boolean(data.config.hasSmtpPass || data.config.hasResendKey));
      }
    } catch {}
  };

  const handleSaveSmtp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingSmtp(true);
      const res = await fetch("/api/admin/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          smtpHost: "smtp.gmail.com",
          smtpPort: 465,
          smtpUser,
          smtpPass,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Gmail SMTP connected!");
        setSmtpReady(true);
        setSmtpModalOpen(false);
      } else {
        toast.error(data.error || "Failed to save SMTP config.");
      }
    } catch {
      toast.error("Failed to save SMTP config.");
    } finally {
      setSavingSmtp(false);
    }
  };

  const fetchQueue = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `/api/admin/pending?status=${statusFilter}&query=${encodeURIComponent(search)}`
      );
      const data = await res.json();
      setParticipants(data.participants || []);
      if (data.counts) setCounts(data.counts);

      const urlId =
        typeof window !== "undefined"
          ? new URLSearchParams(window.location.search).get("id")
          : null;
      if (urlId && data.participants?.some((p: any) => p.id === urlId)) {
        setSelectedId(urlId);
      } else if (data.participants?.length > 0 && !selectedId) {
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
    fetchEmailConfig();
  }, [statusFilter, search]);

  const selectedParticipant = participants.find((p) => p.id === selectedId) || participants[0];

  const openCreateModal = () => {
    setCrudMode("CREATE");
    setEditFullName("");
    setEditCollege("");
    setEditMobile("");
    setEditEmail("");
    setEditStatus("APPROVED");
    setEditCampusStatus("OUTSIDE");
    setCrudModalOpen(true);
  };

  const openEditModal = () => {
    if (!selectedParticipant) return;
    setCrudMode("EDIT");
    setEditFullName(selectedParticipant.full_name || "");
    setEditCollege(selectedParticipant.college || "");
    setEditMobile(selectedParticipant.mobile || "");
    setEditEmail(selectedParticipant.email || "");
    setEditStatus(selectedParticipant.status || "UNDER_REVIEW");
    setEditCampusStatus(selectedParticipant.campus_status || "OUTSIDE");
    setCrudModalOpen(true);
  };

  const handleSaveCrud = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      const isEdit = crudMode === "EDIT";
      const res = await fetch("/api/admin/participants", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: isEdit ? selectedParticipant?.id : undefined,
          full_name: editFullName,
          college: editCollege,
          mobile: editMobile,
          email: editEmail,
          status: editStatus,
          campus_status: editCampusStatus,
          send_email: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to save participant.");
      } else {
        toast.success(data.message || "Participant saved!");
        setCrudModalOpen(false);
        await fetchQueue();
        if (data.participant?.id) setSelectedId(data.participant.id);
      }
    } catch {
      toast.error("Network error saving participant.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteSelected = async () => {
    if (!selectedParticipant) return;
    if (
      !window.confirm(
        `Delete participant "${selectedParticipant.full_name}" (${
          selectedParticipant.registration_id || selectedParticipant.email
        }) permanently?`
      )
    ) {
      return;
    }

    try {
      setActionLoading(true);
      const res = await fetch(
        `/api/admin/participants?id=${encodeURIComponent(selectedParticipant.id)}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Delete failed.");
      } else {
        toast.success(data.message || "Deleted participant.");
        setSelectedId(null);
        await fetchQueue();
      }
    } catch {
      toast.error("Network error deleting participant.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async (resend = false) => {
    if (!selectedParticipant) return;
    try {
      setActionLoading(true);
      const res = await fetch("/api/admin/verify/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participant_id: selectedParticipant.id, resend }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Approval failed.");
      } else {
        toast.success(
          data.message ||
            `Approved! QR Pass (${data.registration_id}) emailed to ${selectedParticipant.email}`
        );
        await fetchQueue();
        setSelectedId(selectedParticipant.id);
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
        toast.success("Correction request emailed to participant.");
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
      title="Participant Verification & QR Issuance"
      subtitle="Review submitted registrations, inspect documents, manage CRUD records, and email static QR passes"
      action={
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            onClick={openCreateModal}
            className="bg-primary hover:bg-primary/90 text-xs"
          >
            <Plus className="size-3.5 mr-1.5" /> Add Participant
          </Button>
          <Button
            size="sm"
            variant={smtpReady ? "outline" : "default"}
            onClick={() => setSmtpModalOpen(true)}
            className="text-xs"
          >
            <Mail className="size-3.5 mr-1.5" />
            {smtpReady ? "SMTP Connected ✓" : "Connect Gmail SMTP"}
          </Button>
          <Button size="sm" variant="outline" onClick={fetchQueue} className="text-xs">
            <RefreshCw className="size-3.5 mr-1.5" /> Refresh Queue
          </Button>
        </div>
      }
    >
      {/* Top Filter */}
      <div className="surface p-4 mb-6 flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search candidate, college, email, or reg ID..."
            className="pl-9 h-9 text-xs"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {[
            { key: "ALL", label: `ALL (${counts.all || 0})` },
            { key: "UNDER_REVIEW", label: `UNDER REVIEW (${counts.under_review || 0})` },
            { key: "APPROVED", label: `APPROVED (${counts.approved || 0})` },
            { key: "CORRECTION", label: `CORRECTION (${counts.correction || 0})` },
          ].map((s) => (
            <Button
              key={s.key}
              size="sm"
              variant={statusFilter === s.key ? "default" : "outline"}
              onClick={() => setStatusFilter(s.key)}
              className="text-xs"
            >
              {s.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Split View: List on left, Inspector on right */}
      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        {/* Left: Queue List */}
        <section className="surface divide-y divide-border overflow-hidden max-h-[800px] overflow-y-auto">
          {participants.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground">
              {loading ? "Loading queue..." : "No participants found in this category."}
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
                          : p.status === "CORRECTION" || p.status === "REVOKED"
                          ? "danger"
                          : "pending"
                      }
                    >
                      {p.status.replace("_", " ")}
                    </StatusPill>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 truncate">
                    {p.college || "College not set"} · {p.email}
                  </p>
                  <div className="flex justify-between items-center mt-2 text-[11px] text-muted-foreground font-mono">
                    <span className={p.registration_id ? "text-primary font-bold" : ""}>
                      {p.registration_id || "PENDING REVIEW"}
                    </span>
                    <span>{p.mobile}</span>
                  </div>
                </div>
              );
            })
          )}
        </section>

        {/* Right: Detailed Inspector Panel */}
        {selectedParticipant ? (
          <section className="surface overflow-hidden flex flex-col justify-between">
            <div>
              {/* Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border p-6 bg-card/60">
                <div className="flex items-center gap-4">
                  <div
                    onClick={() =>
                      setPreviewImage({
                        title: `${selectedParticipant.full_name} — Live Photograph`,
                        url: selectedParticipant.selfie_path || "/assets/participant-avatar.jpg",
                      })
                    }
                    className="size-16 rounded-lg overflow-hidden border border-border bg-muted shrink-0 cursor-pointer hover:ring-2 hover:ring-primary"
                  >
                    <img
                      src={selectedParticipant.selfie_path || "/assets/participant-avatar.jpg"}
                      alt={selectedParticipant.full_name}
                      className="size-full object-cover"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="font-display text-2xl font-bold">{selectedParticipant.full_name}</h2>
                      <StatusPill tone={selectedParticipant.status === "APPROVED" ? "success" : "pending"}>
                        {selectedParticipant.status.replace("_", " ")}
                      </StatusPill>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {selectedParticipant.email} · {selectedParticipant.mobile}
                    </p>
                    <p className="text-xs font-mono text-primary font-semibold mt-1">
                      {selectedParticipant.registration_id || "Awaiting Approval & Static QR Generation"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={openEditModal} className="text-xs">
                    <Edit3 className="size-3.5 mr-1" /> Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={handleDeleteSelected}
                    className="text-xs"
                  >
                    <Trash2 className="size-3.5 mr-1" /> Delete
                  </Button>
                </div>
              </div>

              {/* Single Static QR Pass Card (Shown once Approved) */}
              {selectedParticipant.status === "APPROVED" && selectedParticipant.qr_data_url && (
                <div className="p-6 border-b border-border bg-primary/5 flex flex-col sm:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-5">
                    <div className="p-2.5 bg-white rounded-xl border-2 border-primary shadow-sm shrink-0">
                      <img
                        src={selectedParticipant.qr_data_url}
                        alt="Single Static QR Pass"
                        className="size-28 object-contain"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-success/15 text-success text-[11px] font-bold uppercase tracking-wider">
                        <QrCode className="size-3.5" /> Active Static QR Pass Issued
                      </div>
                      <h3 className="font-mono text-xl font-bold text-primary">
                        {selectedParticipant.registration_id}
                      </h3>
                      <p className="text-xs text-muted-foreground max-w-md leading-relaxed">
                        This single static QR code works for all campus entries and exits throughout Kaltarang 2026 and has been dispatched to <strong>{selectedParticipant.email}</strong>.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 w-full sm:w-auto shrink-0">
                    <a
                      href={selectedParticipant.qr_data_url}
                      download={`${selectedParticipant.registration_id}-QR-Pass.png`}
                      className="inline-flex items-center justify-center h-9 px-3 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold"
                    >
                      <Download className="size-3.5 mr-1.5" /> Download QR PNG
                    </a>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={actionLoading}
                      onClick={() => handleApprove(true)}
                      className="text-xs"
                    >
                      <Mail className="size-3.5 mr-1.5" /> Resend QR Email
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        navigator.clipboard.writeText(
                          selectedParticipant.qr_token || selectedParticipant.registration_id
                        );
                        toast.success("Copied QR token/ID for Gate Scanner!");
                      }}
                      className="text-xs"
                    >
                      <Copy className="size-3.5 mr-1.5" /> Copy QR Token
                    </Button>
                    <a
                      href={`https://wa.me/${String(selectedParticipant.mobile || "").replace(/\D/g, "")}?text=${encodeURIComponent(
                        `Kaltarang 2026 (RGIPT) — Your Registration (${selectedParticipant.registration_id}) is APPROVED! Your single static QR Pass: ${window.location.origin}/api/qr?data=${encodeURIComponent(selectedParticipant.qr_token || selectedParticipant.registration_id)}`
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center h-8 px-3 rounded-md border border-border hover:bg-muted text-xs font-medium"
                    >
                      <ExternalLink className="size-3.5 mr-1.5" /> Share via WhatsApp
                    </a>
                  </div>
                </div>
              )}

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
                  {selectedParticipant.student_id_path ? (
                    <div
                      onClick={() =>
                        setPreviewImage({
                          title: `${selectedParticipant.full_name} — Student ID Card`,
                          url: selectedParticipant.student_id_path,
                        })
                      }
                      className="aspect-[16/10] bg-black/5 rounded border border-border overflow-hidden cursor-pointer relative group"
                    >
                      <img
                        src={selectedParticipant.student_id_path}
                        alt="Student ID"
                        className="size-full object-contain"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity grid place-items-center text-white text-xs font-semibold">
                        <span className="flex items-center gap-1">
                          <ExternalLink className="size-4" /> Click to Enlarge
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="aspect-[16/10] bg-muted rounded border border-dashed border-border grid place-items-center text-center p-3">
                      <FileSearch className="size-8 text-primary mb-1" />
                      <p className="text-xs font-medium">Student ID Document</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Verified institutional upload</p>
                    </div>
                  )}
                </div>

                {/* Aadhaar Card */}
                <div className="surface p-4 border border-border">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Government ID (Aadhaar)
                    </span>
                    <span className="text-[10px] text-success font-semibold flex items-center gap-1">
                      <CheckCircle2 className="size-3" /> Attached
                    </span>
                  </div>
                  {selectedParticipant.aadhaar_path ? (
                    <div
                      onClick={() =>
                        setPreviewImage({
                          title: `${selectedParticipant.full_name} — Government ID (Aadhaar)`,
                          url: selectedParticipant.aadhaar_path,
                        })
                      }
                      className="aspect-[16/10] bg-black/5 rounded border border-border overflow-hidden cursor-pointer relative group"
                    >
                      <img
                        src={selectedParticipant.aadhaar_path}
                        alt="Aadhaar ID"
                        className="size-full object-contain"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity grid place-items-center text-white text-xs font-semibold">
                        <span className="flex items-center gap-1">
                          <ExternalLink className="size-4" /> Click to Enlarge
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="aspect-[16/10] bg-muted rounded border border-dashed border-border grid place-items-center text-center p-3">
                      <ShieldCheck className="size-8 text-primary mb-1" />
                      <p className="text-xs font-medium">Aadhaar Card Record</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Private admin-only access</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Details List */}
              <div className="p-6">
                <p className="section-label text-primary">Participant Details</p>
                <dl className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div>
                    <dt className="text-muted-foreground">Full Name</dt>
                    <dd className="font-semibold text-sm mt-0.5">{selectedParticipant.full_name}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">College Name</dt>
                    <dd className="font-semibold text-sm mt-0.5">{selectedParticipant.college || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Mobile Number</dt>
                    <dd className="font-semibold text-sm mt-0.5">{selectedParticipant.mobile || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Email Address</dt>
                    <dd className="font-semibold text-sm mt-0.5 break-all">{selectedParticipant.email}</dd>
                  </div>
                </dl>
              </div>
            </div>

            {/* Bottom Actions Bar */}
            <div className="p-6 border-t border-border bg-card/60 flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs text-muted-foreground">
                Approving generates 1 static QR pass for the entire event and emails it to the participant.
              </div>
              <div className="flex flex-wrap gap-2">
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
                  onClick={() => handleApprove(false)}
                  disabled={actionLoading}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                >
                  <Check className="size-4 mr-1" />
                  {selectedParticipant.status === "APPROVED"
                    ? "Re-Send Static QR Pass Email"
                    : "Approve & Email Static QR Pass"}
                </Button>
              </div>
            </div>
          </section>
        ) : (
          <div className="surface p-12 text-center text-muted-foreground">
            Select a participant from the left queue to review and issue their QR pass.
          </div>
        )}
      </div>

      {/* Image Enlarge Modal */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="surface max-w-2xl w-full p-4 space-y-3"
          >
            <div className="flex items-center justify-between border-b border-border pb-2">
              <h3 className="font-semibold text-sm">{previewImage.title}</h3>
              <Button size="sm" variant="ghost" onClick={() => setPreviewImage(null)}>
                Close
              </Button>
            </div>
            <div className="max-h-[75vh] overflow-auto grid place-items-center bg-black/10 rounded p-2">
              <img src={previewImage.url} alt={previewImage.title} className="max-h-[70vh] object-contain" />
            </div>
          </div>
        </div>
      )}

      {/* CRUD Edit / Create Modal */}
      {crudModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="surface max-w-lg w-full p-6 space-y-4">
            <h3 className="font-display text-2xl font-bold">
              {crudMode === "EDIT" ? "Edit Participant Record" : "Add New Participant"}
            </h3>
            <form onSubmit={handleSaveCrud} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">
                    Full Name *
                  </label>
                  <Input
                    value={editFullName}
                    onChange={(e) => setEditFullName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">
                    College Name *
                  </label>
                  <Input
                    value={editCollege}
                    onChange={(e) => setEditCollege(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">
                    Mobile Number *
                  </label>
                  <Input
                    value={editMobile}
                    onChange={(e) => setEditMobile(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">
                    Email Address *
                  </label>
                  <Input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">
                    Status
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
                  >
                    <option value="APPROVED">APPROVED</option>
                    <option value="UNDER_REVIEW">UNDER REVIEW</option>
                    <option value="CORRECTION">CORRECTION</option>
                    <option value="REVOKED">REVOKED</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">
                    Campus State
                  </label>
                  <select
                    value={editCampusStatus}
                    onChange={(e) => setEditCampusStatus(e.target.value)}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
                  >
                    <option value="OUTSIDE">OUTSIDE CAMPUS</option>
                    <option value="INSIDE">INSIDE CAMPUS</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setCrudModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={actionLoading} className="bg-primary text-primary-foreground">
                  {actionLoading ? "Saving..." : "Save Participant"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

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

      {/* Inline SMTP Setup Modal */}
      {smtpModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="surface max-w-md w-full p-6 space-y-4">
            <h3 className="font-display text-2xl font-bold">Connect Free Gmail SMTP</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Enter a Gmail address and 16-character Google App Password (from{" "}
              <a
                href="https://myaccount.google.com/apppasswords"
                target="_blank"
                rel="noreferrer"
                className="text-primary underline font-semibold"
              >
                myaccount.google.com/apppasswords
              </a>
              ) so approved QR passes are delivered directly to participants&apos; real email inboxes.
            </p>
            <form onSubmit={handleSaveSmtp} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Sender Gmail Address *
                </label>
                <Input
                  type="email"
                  value={smtpUser}
                  onChange={(e) => setSmtpUser(e.target.value)}
                  placeholder="your.email@gmail.com or 24mc3008@rgipt.ac.in"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  16-Character Google App Password *
                </label>
                <Input
                  type="password"
                  value={smtpPass}
                  onChange={(e) => setSmtpPass(e.target.value)}
                  placeholder="xxxx xxxx xxxx xxxx"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setSmtpModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={savingSmtp} className="bg-primary text-primary-foreground">
                  {savingSmtp ? "Saving..." : "Save & Enable Real Emails"}
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
                  placeholder="e.g. Unverified payment / invalid documentation..."
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
