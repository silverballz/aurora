"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Download,
  Edit3,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  UserPlus,
} from "lucide-react";
import { StaffShell } from "@/components/staff-shell";
import { StatusPill } from "@/components/aurora-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function AdminParticipantsPage() {
  const [participants, setParticipants] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Create / Edit Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingParticipant, setEditingParticipant] = useState<any | null>(null);
  const [fullName, setFullName] = useState("");
  const [college, setCollege] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("APPROVED");
  const [campusStatus, setCampusStatus] = useState("OUTSIDE");
  const [sendEmail, setSendEmail] = useState(true);

  const loadParticipants = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `/api/admin/pending?status=${statusFilter}&query=${encodeURIComponent(search)}`
      );
      const data = await res.json();
      setParticipants(data.participants || []);
    } catch (e) {
      console.error("Load error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadParticipants();
  }, [search, statusFilter]);

  const openCreateModal = () => {
    setEditingParticipant(null);
    setFullName("");
    setCollege("");
    setMobile("");
    setEmail("");
    setStatus("APPROVED");
    setCampusStatus("OUTSIDE");
    setSendEmail(true);
    setModalOpen(true);
  };

  const openEditModal = (p: any) => {
    setEditingParticipant(p);
    setFullName(p.full_name || "");
    setCollege(p.college || "");
    setMobile(p.mobile || "");
    setEmail(p.email || "");
    setStatus(p.status || "UNDER_REVIEW");
    setCampusStatus(p.campus_status || "OUTSIDE");
    setModalOpen(true);
  };

  const handleSaveParticipant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !college || !mobile || !email) {
      toast.error("Please fill all required fields.");
      return;
    }

    try {
      setSaving(true);
      const isEdit = Boolean(editingParticipant);
      const res = await fetch("/api/admin/participants", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingParticipant?.id,
          full_name: fullName,
          college,
          mobile,
          email,
          status,
          campus_status: campusStatus,
          send_email: sendEmail,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to save participant.");
      } else {
        toast.success(data.message || "Participant saved!");
        setModalOpen(false);
        await loadParticipants();
      }
    } catch {
      toast.error("Network error saving participant.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteParticipant = async (p: any) => {
    if (!window.confirm(`Delete participant "${p.full_name}" (${p.registration_id || p.email}) permanently?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/admin/participants?id=${encodeURIComponent(p.id)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to delete participant.");
      } else {
        toast.success(data.message || "Deleted participant.");
        await loadParticipants();
      }
    } catch {
      toast.error("Network error deleting participant.");
    }
  };

  return (
    <StaffShell
      title="Participant Directory (CRUD)"
      subtitle="Create, view, edit, and delete external participants (scaled for 120+ attendees)"
      action={
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" onClick={openCreateModal} className="bg-primary hover:bg-primary/90 text-xs">
            <Plus className="size-3.5 mr-1.5" /> Add Participant
          </Button>
          <Button size="sm" variant="outline" onClick={loadParticipants} className="text-xs">
            <RefreshCw className="size-3.5 mr-1.5" /> Refresh
          </Button>
          <Button asChild variant="outline" size="sm" className="text-xs">
            <a href="/api/admin/reports?type=full_with_docs" download>
              <Download className="size-3.5 mr-1.5" /> Export CSV (With Aadhaar/ID Links)
            </a>
          </Button>
          <Button asChild variant="outline" size="sm" className="text-xs">
            <a href="/api/admin/reports?type=visual_dossier" target="_blank" rel="noreferrer">
              <Download className="size-3.5 mr-1.5" /> Visual Aadhaar & ID Archive
            </a>
          </Button>
        </div>
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

        <div className="flex flex-wrap gap-2">
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
              <th className="py-3.5 px-4 font-semibold">Participant</th>
              <th className="py-3.5 px-4 font-semibold">College / Contact</th>
              <th className="py-3.5 px-4 font-semibold">Campus State</th>
              <th className="py-3.5 px-4 font-semibold">Status</th>
              <th className="py-3.5 px-4 font-semibold text-right">CRUD Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {participants.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-muted-foreground">
                  {loading ? "Loading participants..." : "No participant records found."}
                </td>
              </tr>
            ) : (
              participants.map((p) => (
                <tr key={p.id} className="hover:bg-muted/20 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-primary">
                    {p.registration_id || "Awaiting Verification"}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={p.selfie_path || "/assets/participant-avatar.jpg"}
                        alt={p.full_name}
                        className="size-8 rounded-full object-cover border border-border shrink-0"
                      />
                      <span className="font-semibold">{p.full_name}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <p className="text-foreground font-medium">{p.college || "—"}</p>
                    <p className="text-muted-foreground text-[11px]">
                      {p.email} · {p.mobile}
                    </p>
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
                          : p.status === "CORRECTION" || p.status === "REVOKED"
                          ? "danger"
                          : "pending"
                      }
                    >
                      {p.status.replace("_", " ")}
                    </StatusPill>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="inline-flex items-center justify-end gap-1.5">
                      <Button asChild size="sm" variant="outline" className="h-7 px-2.5 text-xs">
                        <Link href={`/admin/verification?id=${encodeURIComponent(p.id)}`}>
                          Inspect
                        </Link>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditModal(p)}
                        className="h-7 px-2.5 text-xs"
                      >
                        <Edit3 className="size-3 mr-1" /> Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteParticipant(p)}
                        className="h-7 px-2.5 text-xs"
                      >
                        <Trash2 className="size-3 mr-1" /> Delete Profile
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create / Edit Participant CRUD Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="surface max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-display text-2xl font-bold flex items-center gap-2">
                <UserPlus className="size-5 text-primary" />
                {editingParticipant ? `Edit Participant (${editingParticipant.full_name})` : "Add New Participant"}
              </h3>
              <Button size="sm" variant="ghost" onClick={() => setModalOpen(false)}>
                Close
              </Button>
            </div>

            <form onSubmit={handleSaveParticipant} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">
                    Full Name *
                  </label>
                  <Input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Participant full name"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">
                    College Name *
                  </label>
                  <Input
                    value={college}
                    onChange={(e) => setCollege(e.target.value)}
                    placeholder="College / University"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">
                    Mobile Number *
                  </label>
                  <Input
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="+91 98765 43210"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">
                    Email Address *
                  </label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="participant@example.com"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">
                    Verification Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
                  >
                    <option value="APPROVED">APPROVED (Issues Static QR Pass)</option>
                    <option value="UNDER_REVIEW">UNDER REVIEW</option>
                    <option value="CORRECTION">CORRECTION REQUIRED</option>
                    <option value="REVOKED">REVOKED / REJECTED</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">
                    Campus State (Gate Presence)
                  </label>
                  <select
                    value={campusStatus}
                    onChange={(e) => setCampusStatus(e.target.value)}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
                  >
                    <option value="OUTSIDE">OUTSIDE CAMPUS</option>
                    <option value="INSIDE">INSIDE CAMPUS</option>
                  </select>
                </div>
              </div>

              {!editingParticipant && status === "APPROVED" && (
                <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={sendEmail}
                    onChange={(e) => setSendEmail(e.target.checked)}
                    className="rounded border-input"
                  />
                  Automatically email the generated static QR pass to this participant
                </label>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  {saving ? "Saving..." : editingParticipant ? "Save Changes" : "Create Participant"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </StaffShell>
  );
}
