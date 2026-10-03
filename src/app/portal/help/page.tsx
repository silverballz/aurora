"use client";

import { useState } from "react";
import { Mail, MessageSquare, Phone, Send } from "lucide-react";
import { AuroraShell, PageHeader } from "@/components/aurora-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function ParticipantHelpPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [participantId, setParticipantId] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) {
      toast.error("Please fill in your name, email, and message.");
      return;
    }
    toast.success("Help request sent to Kaltarang registration desk.");
    setSubmitted(true);
  };

  return (
    <AuroraShell>
      <PageHeader
        eyebrow="Support & Inquiries"
        title="Help Centre"
        description="Assistance with participant invitations, OTP verification, document review, and gate access."
      />

      <div className="mx-auto max-w-4xl p-5 sm:p-8 lg:p-12 space-y-8">
        <div className="surface p-8">
          <h2 className="font-display text-3xl">Contact the Registration Desk</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Include your full name and registered email for expedited assistance.
          </p>

          {submitted ? (
            <div className="mt-6 p-6 bg-success/10 border border-success/20 rounded-lg text-center">
              <h3 className="font-semibold text-success">Ticket Received</h3>
              <p className="text-xs text-muted-foreground mt-1">
                The Kaltarang administration team has received your inquiry. We typically reply within 2 hours.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Full Name</label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full Name" required />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Email Address</label>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email Address" required />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Registration or Invitation ID (Optional)</label>
                  <Input value={participantId} onChange={(e) => setParticipantId(e.target.value)} placeholder="e.g. KLT26-000421" />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Describe your issue</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Explain any document upload issues, camera issues, or gate inquiries..."
                  className="w-full min-h-28 rounded-md border border-input bg-background p-3 text-sm focus:ring-1 focus:ring-ring outline-none"
                  required
                />
              </div>

              <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <Send className="size-4 mr-2" /> Send Support Request
              </Button>
            </form>
          )}
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <div className="surface p-5 text-center">
            <Mail className="size-6 text-primary mx-auto mb-2" />
            <p className="font-semibold text-sm">Email Support</p>
            <p className="text-xs text-muted-foreground mt-1">support@kaltarang.in</p>
          </div>
          <div className="surface p-5 text-center">
            <Phone className="size-6 text-primary mx-auto mb-2" />
            <p className="font-semibold text-sm">Fest Desk Hotline</p>
            <p className="text-xs text-muted-foreground mt-1">+91 (0535) 270-4200</p>
          </div>
          <div className="surface p-5 text-center">
            <MessageSquare className="size-6 text-primary mx-auto mb-2" />
            <p className="font-semibold text-sm">Campus Gate Control</p>
            <p className="text-xs text-muted-foreground mt-1">Admin Block Main Reception</p>
          </div>
        </div>
      </div>
    </AuroraShell>
  );
}
