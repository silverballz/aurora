"use client";

import { useEffect, useState } from "react";
import {
  Check,
  Copy,
  Mail,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";
import { StaffShell } from "@/components/staff-shell";
import { StatusPill } from "@/components/aurora-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function AdminInvitationsPage() {
  const [invitations, setInvitations] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [paymentRef, setPaymentRef] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("500");
  const [creating, setCreating] = useState(false);
  const [createdInvite, setCreatedInvite] = useState<any>(null);

  const fetchInvitations = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/invitations/list?status=${filter}&query=${encodeURIComponent(search)}`);
      const data = await res.json();
      setInvitations(data.invitations || []);
      setMetrics(data.metrics || null);
    } catch (err) {
      toast.error("Failed to load invitations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvitations();
  }, [filter, search]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !mobile || !paymentRef) {
      toast.error("Please fill in all mandatory fields.");
      return;
    }

    try {
      setCreating(true);
      const res = await fetch("/api/invitations/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participant_name: name,
          email,
          mobile,
          payment_reference: paymentRef,
          payment_amount: paymentAmount,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to create invitation.");
      } else {
        toast.success("Invitation generated & dispatched successfully!");
        setCreatedInvite(data);
        fetchInvitations();
      }
    } catch {
      toast.error("Network error creating invitation.");
    } finally {
      setCreating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Invitation link copied to clipboard!");
  };

  return (
    <StaffShell
      title="Invitations Management"
      subtitle="Issue and audit payment-verified registration invitations"
      action={
        <Button onClick={() => { setCreatedInvite(null); setModalOpen(true); }} className="bg-primary hover:bg-primary/90 text-primary-foreground">
          <Plus className="size-4 mr-1.5" /> Issue New Invitation
        </Button>
      }
    >
      {/* Metric Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="surface p-4 text-center">
          <span className="section-label">Total Issued</span>
          <p className="font-display text-3xl mt-1">{metrics?.total ?? "—"}</p>
        </div>
        <div className="surface p-4 text-center">
          <span className="section-label">Active / Pending</span>
          <p className="font-display text-3xl mt-1 text-primary">{metrics?.active ?? "—"}</p>
        </div>
        <div className="surface p-4 text-center">
          <span className="section-label">Redeemed / Used</span>
          <p className="font-display text-3xl mt-1 text-success">{metrics?.used ?? "—"}</p>
        </div>
        <div className="surface p-4 text-center">
          <span className="section-label">Expired / Revoked</span>
          <p className="font-display text-3xl mt-1 text-muted-foreground">{metrics?.expired ?? "—"}</p>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="surface p-4 mb-6 flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search participant or payment ref..."
            className="pl-9 h-9 text-xs"
          />
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          {["ALL", "ACTIVE", "USED", "EXPIRED"].map((status) => (
            <Button
              key={status}
              size="sm"
              variant={filter === status ? "default" : "outline"}
              onClick={() => setFilter(status)}
              className="text-xs"
            >
              {status}
            </Button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="surface overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-muted/50 border-b border-border uppercase tracking-wider text-[10px] text-muted-foreground">
            <tr>
              <th className="py-3.5 px-4 font-semibold">Participant</th>
              <th className="py-3.5 px-4 font-semibold">Email & Phone</th>
              <th className="py-3.5 px-4 font-semibold">Payment Ref</th>
              <th className="py-3.5 px-4 font-semibold">Status</th>
              <th className="py-3.5 px-4 font-semibold">Created / Expiry</th>
              <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {invitations.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-muted-foreground">
                  No invitations matching criteria found.
                </td>
              </tr>
            ) : (
              invitations.map((inv) => (
                <tr key={inv.id} className="hover:bg-muted/20 transition-colors">
                  <td className="py-3.5 px-4 font-semibold text-foreground">
                    {inv.participant_name}
                  </td>
                  <td className="py-3.5 px-4">
                    <p>{inv.email}</p>
                    <p className="text-muted-foreground text-[11px]">{inv.mobile}</p>
                  </td>
                  <td className="py-3.5 px-4 font-mono font-medium text-primary">
                    {inv.payment_reference}
                  </td>
                  <td className="py-3.5 px-4">
                    <StatusPill
                      tone={
                        inv.status === "ACTIVE"
                          ? "pending"
                          : inv.status === "USED"
                          ? "success"
                          : "neutral"
                      }
                    >
                      {inv.status}
                    </StatusPill>
                  </td>
                  <td className="py-3.5 px-4 text-[11px] text-muted-foreground">
                    <p>{new Date(inv.created_at).toLocaleDateString()}</p>
                    <p>Exp: {new Date(inv.expires_at).toLocaleDateString()}</p>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        copyToClipboard(`${window.location.origin}/portal/invite/${inv.token_hash}`)
                      }
                      title="Copy invitation link"
                    >
                      <Copy className="size-3.5" />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create Invitation Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="surface max-w-lg w-full p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-border pb-4 mb-5">
              <div>
                <h2 className="font-display text-2xl font-bold">Create Participant Invitation</h2>
                <p className="text-xs text-muted-foreground">Only create invitations after verifying payment.</p>
              </div>
              <Button size="icon" variant="ghost" onClick={() => setModalOpen(false)}>
                <X className="size-5" />
              </Button>
            </div>

            {createdInvite ? (
              <div className="space-y-4">
                <div className="p-4 bg-success/10 border border-success/20 rounded-lg text-sm">
                  <p className="font-semibold text-success flex items-center gap-1.5">
                    <Check className="size-4" /> Invitation Generated Successfully
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    An email was dispatched to <strong>{createdInvite.invitation.email}</strong>.
                  </p>
                </div>

                <div className="bg-muted p-4 rounded-lg">
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">
                    Direct Invitation URL (for manual sharing):
                  </label>
                  <div className="flex gap-2">
                    <Input
                      readOnly
                      value={`${window.location.origin}/portal/invite/${createdInvite.inviteToken}`}
                      className="font-mono text-xs bg-background"
                    />
                    <Button
                      size="sm"
                      onClick={() =>
                        copyToClipboard(`${window.location.origin}/portal/invite/${createdInvite.inviteToken}`)
                      }
                    >
                      <Copy className="size-4" />
                    </Button>
                  </div>
                </div>

                <Button className="w-full mt-4" onClick={() => setModalOpen(false)}>
                  Done
                </Button>
              </div>
            ) : (
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold uppercase text-muted-foreground block mb-1">
                    Participant Full Name *
                  </label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full Name" required />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold uppercase text-muted-foreground block mb-1">
                      Email Address *
                    </label>
                    <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@college.edu" required />
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase text-muted-foreground block mb-1">
                      Mobile Number *
                    </label>
                    <Input value={mobile} onChange={(e) => setMobile(e.target.value)} placeholder="+919876543210" required />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold uppercase text-muted-foreground block mb-1">
                      Payment Reference ID *
                    </label>
                    <Input value={paymentRef} onChange={(e) => setPaymentRef(e.target.value)} placeholder="e.g. UPI / TXN-99420" required />
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase text-muted-foreground block mb-1">
                      Amount (INR)
                    </label>
                    <Input type="number" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} />
                  </div>
                </div>

                <div className="pt-4 border-t border-border flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={creating} className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
                    {creating ? "Generating..." : "Generate Invitation"}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </StaffShell>
  );
}
