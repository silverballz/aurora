"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2, Lock, ShieldAlert, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function InviteRedemptionPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const token = resolvedParams.token;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [invitation, setInvitation] = useState<{
    id: string;
    participantName: string;
    email: string;
    maskedEmail: string;
    mobile: string;
    paymentReference: string;
    expiresAt: string;
  } | null>(null);

  // OTP State
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [devHint, setDevHint] = useState<string | null>(null);

  useEffect(() => {
    async function validateToken() {
      try {
        setLoading(true);
        const res = await fetch("/api/invitations/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const data = await res.json();

        if (!res.ok || !data.valid) {
          setError(data.error || "Invitation unavailable. This registration link is invalid or expired.");
        } else {
          setInvitation(data.invitation);
        }
      } catch (err) {
        setError("Network error validating invitation. Please check your connection.");
      } finally {
        setLoading(false);
      }
    }

    if (token) {
      validateToken();
    }
  }, [token]);

  const handleSendOtp = async () => {
    if (!invitation) return;
    try {
      setSendingOtp(true);
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: invitation.email }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to send verification code.");
      } else {
        setOtpSent(true);
        if (data.devHint) {
          setDevHint(data.devHint);
          setOtp(data.devHint);
          toast.success(`Verification code generated: ${data.devHint}`);
        } else {
          toast.success(`Verification code sent to ${invitation.maskedEmail}`);
        }
      }
    } catch {
      toast.error("Network error sending code.");
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invitation || !otp) return;

    try {
      setVerifying(true);
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: invitation.email,
          otp: otp.trim(),
          inviteToken: token,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Invalid code. Please check and try again.");
      } else {
        toast.success("Identity authenticated! Redirecting to registration wizard...");
        router.push("/portal/registration");
      }
    } catch {
      toast.error("Verification error.");
    } finally {
      setVerifying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <div className="size-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="mt-4 text-sm text-muted-foreground font-mono">Verifying invitation credential...</p>
      </div>
    );
  }

  if (error || !invitation) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full surface p-8 text-center border-destructive/30">
          <div className="size-12 rounded-full bg-destructive/10 text-destructive grid place-items-center mx-auto mb-4">
            <ShieldAlert className="size-6" />
          </div>
          <h1 className="font-display text-2xl font-bold">Invitation Unavailable</h1>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
            {error || "This registration invitation is invalid, expired, or has already been used."}
          </p>
          <div className="mt-8 pt-6 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Please contact the Kaltarang Fest Administration at <strong>support@kaltarang.in</strong>.
            </p>
            <Button asChild variant="outline" className="mt-4 w-full">
              <a href="/">Return to Home</a>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full surface p-8">
        <div className="flex items-center gap-3 mb-6">
          <img src="/kaltarang-logo.svg" alt="Kaltarang" className="h-9 w-7 object-contain" />
          <div>
            <h1 className="font-display text-2xl leading-none">Aurora</h1>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-0.5">
              Kaltarang 2026 · RGIPT
            </p>
          </div>
        </div>

        <div className="border-b border-border pb-5 mb-5">
          <p className="section-label text-primary">Invitation Confirmed</p>
          <h2 className="font-display text-3xl mt-1">Welcome, {invitation.participantName}</h2>
          <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
            Your participation fee payment has been verified. Complete your profile and identity verification to activate your campus pass.
          </p>
        </div>

        <div className="bg-card/50 border border-border rounded-lg p-4 space-y-2 text-xs mb-6">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Issued to:</span>
            <span className="font-mono font-medium">{invitation.maskedEmail}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Mobile:</span>
            <span className="font-mono font-medium">{invitation.mobile}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Payment Ref:</span>
            <span className="font-mono font-semibold text-primary">{invitation.paymentReference}</span>
          </div>
        </div>

        {!otpSent ? (
          <div>
            <p className="text-xs text-muted-foreground mb-4">
              To guarantee account security, we will deliver a single-use verification code to your invited email address.
            </p>
            <Button
              onClick={handleSendOtp}
              disabled={sendingOtp}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-11"
            >
              {sendingOtp ? "Sending Code..." : "Send Verification Code"}
            </Button>
          </div>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-2">
                Enter 6-Digit Code
              </label>
              <Input
                type="text"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="123456"
                className="text-center text-2xl tracking-[0.3em] font-mono h-12"
                required
                autoFocus
              />
              {devHint && (
                <p className="text-[11px] text-primary mt-1.5 text-center font-mono">
                  Dev auto-fill: {devHint}
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={verifying || otp.length < 6}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-11"
            >
              {verifying ? "Authenticating..." : "Verify & Continue"}
            </Button>

            <button
              type="button"
              onClick={handleSendOtp}
              disabled={sendingOtp}
              className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors pt-2"
            >
              Didn't receive code? Resend
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
