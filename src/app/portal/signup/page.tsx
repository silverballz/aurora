"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Mail, ShieldCheck, Sparkles, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function ParticipantSignUpPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [college, setCollege] = useState("");
  const [paymentRef, setPaymentRef] = useState(`UPI-${Math.floor(100000 + Math.random() * 900000)}`);
  const [loading, setLoading] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !mobile) {
      toast.error("Please fill in your name, email, and mobile.");
      return;
    }

    try {
      setLoading(true);

      // 1. Create invitation on the fly
      const invRes = await fetch("/api/invitations/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participant_name: name.trim(),
          email: email.trim().toLowerCase(),
          mobile: mobile.trim(),
          payment_reference: paymentRef,
          payment_amount: 500,
        }),
      });

      const invData = await invRes.json();
      if (!invRes.ok) {
        toast.error(invData.error || "Failed to create registration record.");
        return;
      }

      // 2. Direct authenticate session for seamless signup experience
      const otpSendRes = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const otpSendData = await otpSendRes.json();
      const code = otpSendData.devHint || "123456";

      const authRes = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          otp: code,
          inviteToken: invData.inviteToken,
        }),
      });

      if (authRes.ok) {
        // Save initial college details
        await fetch("/api/participant/profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            full_name: name.trim(),
            email: email.trim().toLowerCase(),
            mobile: mobile.trim(),
            college: college.trim(),
          }),
        });

        toast.success("Account created successfully! Opening your registration wizard...");
        router.push("/portal/registration");
      } else {
        router.push(`/portal/invite/${invData.inviteToken}`);
      }
    } catch {
      toast.error("Registration error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-6">
      <div className="max-w-lg w-full surface p-8">
        <div className="flex items-center gap-3 mb-6">
          <img src="/kaltarang-logo.svg" alt="Kaltarang Logo" className="h-9 w-7 object-contain" />
          <div>
            <h1 className="font-display text-2xl leading-none">Aurora</h1>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-0.5">
              External Participant Registration
            </p>
          </div>
        </div>

        <div className="border-b border-border pb-5 mb-5">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-semibold mb-2">
            <Sparkles className="size-3" /> Kaltarang 2026 Registration
          </div>
          <h2 className="font-display text-3xl">Register as Participant</h2>
          <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
            Fill in your details to begin external participant onboarding and generate your campus access credential.
          </p>
        </div>

        <form onSubmit={handleSignUp} className="space-y-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">
              Full Legal Name *
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Anurag Sharma"
              required
              autoFocus
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">
                Email Address *
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@college.edu or gmail"
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">
                Mobile Number *
              </label>
              <Input
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="+91 9876543210"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">
              College / University / Institution *
            </label>
            <Input
              value={college}
              onChange={(e) => setCollege(e.target.value)}
              placeholder="e.g. NIT Bhopal / IIT Kanpur / Delhi University"
              required
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Payment Reference ID
              </label>
              <span className="text-[10px] text-primary">Pre-filled with demo reference</span>
            </div>
            <Input
              value={paymentRef}
              onChange={(e) => setPaymentRef(e.target.value)}
              placeholder="UPI / TXN Ref"
              className="font-mono text-xs"
              required
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-12 font-semibold text-base mt-2"
          >
            {loading ? "Creating Account..." : "Create Account & Start Verification"}
            <ArrowRight className="size-4 ml-2" />
          </Button>
        </form>

        <div className="mt-6 pt-5 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
          <span>Already registered?</span>
          <Link href="/portal/login" className="text-primary font-semibold hover:underline">
            Sign In with Email OTP →
          </Link>
        </div>

        <div className="mt-4 text-center text-xs text-muted-foreground">
          <Link href="/" className="hover:underline">
            ← Return to Kaltarang Home
          </Link>
        </div>
      </div>
    </div>
  );
}
