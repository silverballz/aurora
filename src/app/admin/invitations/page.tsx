"use client";

import { useEffect, useState } from "react";
import { Check, Copy, Download, Eye, Mail, QrCode, RefreshCw, Settings } from "lucide-react";
import { StaffShell } from "@/components/staff-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function AdminEmailsAndSmtpPage() {
  const [emails, setEmails] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmail, setSelectedEmail] = useState<any | null>(null);

  // SMTP / Resend Configuration
  const [smtpUser, setSmtpUser] = useState("");
  const [smtpPass, setSmtpPass] = useState("");
  const [resendApiKey, setResendApiKey] = useState("");
  const [provider, setProvider] = useState("console");
  const [savingConfig, setSavingConfig] = useState(false);

  const fetchEmails = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/emails");
      const data = await res.json();
      setEmails(data.emails || []);
      if (data.config) {
        setSmtpUser(data.config.smtpUser || "");
        setProvider(data.config.provider || "console");
      }
    } catch {
      toast.error("Failed to load email outbox");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmails();
  }, []);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingConfig(true);
      const res = await fetch("/api/admin/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          smtpUser,
          smtpPass,
          resendApiKey,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setProvider(data.provider);
        toast.success("Email delivery settings updated! All future QR passes will use these credentials.");
      } else {
        toast.error(data.error || "Failed to update settings.");
      }
    } catch {
      toast.error("Network error saving settings.");
    } finally {
      setSavingConfig(false);
    }
  };

  const registrationUrl =
    typeof window !== "undefined" ? `${window.location.origin}/register` : "/register";

  return (
    <StaffShell
      title="QR Pass Emails & Registration Link"
      subtitle="Share the public registration form link, inspect sent static QR pass emails, and configure free Gmail SMTP delivery"
      action={
        <Button size="sm" variant="outline" onClick={fetchEmails} className="text-xs">
          <RefreshCw className="size-3.5 mr-1.5" /> Refresh Outbox
        </Button>
      }
    >
      <div className="space-y-8">
        {/* Public Registration Form Share Banner */}
        <section className="surface p-6 border-l-4 border-l-primary flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="section-label text-primary">Public Registration Link (No OTP / No Login)</p>
            <h2 className="font-display text-2xl mt-1">Share with External Participants</h2>
            <p className="text-xs text-muted-foreground mt-1">
              Anyone with this link can fill out the Kaltarang 2026 registration form. Once submitted, their application appears in the Verification Queue for QR issuance.
            </p>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
            <Input value={registrationUrl} readOnly className="text-xs font-mono w-full sm:w-72 bg-muted" />
            <Button
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(registrationUrl);
                toast.success("Public registration link copied!");
              }}
              className="bg-primary text-primary-foreground hover:bg-primary/90 shrink-0"
            >
              <Copy className="size-3.5 mr-1.5" /> Copy Link
            </Button>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          {/* Dispatched QR Pass Emails Outbox */}
          <section className="surface overflow-hidden">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="font-display text-2xl">Dispatched QR Pass Emails ({emails.length})</h3>
                <p className="text-xs text-muted-foreground">
                  Every single static QR pass generated on approval is recorded here with full QR download & preview.
                </p>
              </div>
            </div>

            {emails.length === 0 ? (
              <div className="p-12 text-center text-xs text-muted-foreground">
                No QR emails dispatched yet. Approve a participant in the Verification Queue to generate & email their static QR pass.
              </div>
            ) : (
              <div className="divide-y divide-border">
                {emails.map((item) => (
                  <div key={item.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/20">
                    <div className="flex items-center gap-3.5">
                      {item.qrDataUrl ? (
                        <img
                          src={item.qrDataUrl}
                          alt="QR"
                          className="size-12 rounded border border-border bg-white p-1 shrink-0"
                        />
                      ) : (
                        <div className="size-12 rounded bg-primary/10 text-primary grid place-items-center shrink-0">
                          <Mail className="size-5" />
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">{item.participantName || item.to}</span>
                          {item.registrationId && (
                            <span className="text-[11px] font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                              {item.registrationId}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{item.to} · {item.subject}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5 font-mono">
                          {new Date(item.timestamp).toLocaleString()} · Via: {item.deliveredVia}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {item.qrDataUrl && (
                        <a
                          href={item.qrDataUrl}
                          download={`${item.registrationId || "Pass"}-QR.png`}
                          className="inline-flex items-center h-8 px-2.5 rounded border border-border text-xs font-medium hover:bg-muted"
                        >
                          <Download className="size-3.5 mr-1" /> QR PNG
                        </a>
                      )}
                      <Button size="sm" variant="outline" onClick={() => setSelectedEmail(item)} className="h-8 text-xs">
                        <Eye className="size-3.5 mr-1" /> View Email
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Free SMTP / Resend Configuration Box */}
          <aside className="surface p-6 space-y-4 h-fit">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Settings className="size-4 text-primary" />
                <h3 className="font-semibold text-sm">Real Email Delivery Setup (Free)</h3>
              </div>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-primary/10 text-primary font-bold">
                {provider}
              </span>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Enter a free <strong>Gmail address + 16-char Google App Password</strong> (or Resend API key) to send QR pass emails directly to external participant inboxes.
            </p>

            <form onSubmit={handleSaveConfig} className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold uppercase text-muted-foreground block mb-1">
                  Gmail Address (SMTP User)
                </label>
                <Input
                  type="email"
                  value={smtpUser}
                  onChange={(e) => setSmtpUser(e.target.value)}
                  placeholder="your.email@gmail.com"
                  className="text-xs h-9"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold uppercase text-muted-foreground block mb-1">
                  Gmail 16-Char App Password
                </label>
                <Input
                  type="password"
                  value={smtpPass}
                  onChange={(e) => setSmtpPass(e.target.value)}
                  placeholder="xxxx xxxx xxxx xxxx"
                  className="text-xs h-9 font-mono"
                />
              </div>

              <div className="pt-1 border-t border-border">
                <label className="text-[11px] font-semibold uppercase text-muted-foreground block mb-1">
                  Or Resend API Key (Optional)
                </label>
                <Input
                  type="password"
                  value={resendApiKey}
                  onChange={(e) => setResendApiKey(e.target.value)}
                  placeholder="re_..."
                  className="text-xs h-9 font-mono"
                />
              </div>

              <Button type="submit" disabled={savingConfig} className="w-full bg-primary text-primary-foreground text-xs h-9">
                <Check className="size-3.5 mr-1.5" /> {savingConfig ? "Saving..." : "Save Email Settings"}
              </Button>
            </form>
          </aside>
        </div>
      </div>

      {/* Email HTML Preview Modal */}
      {selectedEmail && (
        <div
          onClick={() => setSelectedEmail(null)}
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="surface max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="font-semibold text-sm">{selectedEmail.subject}</h3>
                <p className="text-xs text-muted-foreground">To: {selectedEmail.to}</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => setSelectedEmail(null)}>
                Close
              </Button>
            </div>
            <div
              className="border border-border rounded-lg overflow-hidden bg-white"
              dangerouslySetInnerHTML={{ __html: selectedEmail.html }}
            />
          </div>
        </div>
      )}
    </StaffShell>
  );
}
