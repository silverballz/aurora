"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { KeyRound, Mail, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("24mc3008@rgipt.ac.in");
  const [passcode, setPasscode] = useState("2026");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter admin email.");
      return;
    }
    if (passcode !== "2026" && passcode !== "kaltarang2026" && passcode !== "admin") {
      toast.error("Invalid admin passcode. Default passcode is 2026.");
      return;
    }

    try {
      setLoading(true);
      await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          otp: "123456",
        }),
      });
      toast.success(`Signed in as ${email.trim().toLowerCase()}`);
      router.push("/admin/verification");
    } catch {
      router.push("/admin/verification");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (targetEmail: string) => {
    try {
      setLoading(true);
      await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: targetEmail,
          otp: "123456",
        }),
      });
      toast.success(`Signed in as ${targetEmail}`);
      router.push("/admin/verification");
    } catch {
      router.push("/admin/verification");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-6">
      <div className="max-w-md w-full surface p-8">
        <div className="flex items-center gap-3 mb-6">
          <img src="/kaltarang-logo.svg" alt="Kaltarang Logo" className="h-9 w-7 object-contain" />
          <div>
            <h1 className="font-display text-2xl leading-none">Aurora</h1>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-0.5">
              Admin Console
            </p>
          </div>
        </div>

        <div className="border-b border-border pb-5 mb-5">
          <h2 className="font-display text-3xl">Admin Sign In</h2>
          <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
            Direct administrator sign-in (No OTP required). Review participant registrations and issue single static QR passes.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-2">
              Admin Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 size-4 text-muted-foreground" />
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="24mc3008@rgipt.ac.in"
                className="pl-10 h-11"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-2">
              Admin Passcode (Default: 2026)
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-3 size-4 text-muted-foreground" />
              <Input
                type="password"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="2026"
                className="pl-10 h-11 font-mono"
                required
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-11 font-semibold"
          >
            {loading ? "Signing In..." : "Sign In to Admin Console"}
          </Button>
        </form>

        {/* 1-Click Fast Admin Buttons */}
        <div className="mt-6 pt-5 border-t border-border space-y-2.5">
          <p className="text-[11px] text-muted-foreground text-center mb-1">
            Instant 1-Click Access:
          </p>
          <Button
            type="button"
            variant="default"
            onClick={() => handleQuickLogin("24mc3008@rgipt.ac.in")}
            disabled={loading}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 text-xs h-10 flex items-center justify-center gap-2 shadow-sm font-semibold"
          >
            <ShieldCheck className="size-4" />
            1-Click Super Admin (24mc3008@rgipt.ac.in)
          </Button>
        </div>

        <div className="mt-6 text-center text-xs text-muted-foreground">
          <Link href="/" className="text-primary hover:underline">
            ← Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
