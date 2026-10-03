"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, Mail, Shield, ShieldCheck, Sparkles, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"EMAIL" | "OTP">("EMAIL");
  const [loading, setLoading] = useState(false);
  const [devHint, setDevHint] = useState<string | null>(null);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      toast.error("Please enter a valid administrator email address.");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to send verification code.");
      } else {
        setStep("OTP");
        if (data.devHint) {
          setDevHint(data.devHint);
          setOtp(data.devHint);
          toast.success(`Verification code generated: ${data.devHint}`);
        } else {
          toast.success("Authentication code sent to administrator email.");
        }
      }
    } catch {
      toast.error("Network error sending code.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          otp: otp.trim(),
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Authentication failed.");
      } else {
        toast.success("Administrator session authenticated!");
        router.push("/admin");
      }
    } catch {
      toast.error("Verification error.");
    } finally {
      setLoading(false);
    }
  };

  // 1-Click Fast Login for Testing/Demonstration
  const handleQuickDemoAdmin = async (targetEmail: string = "24mc3008@rgipt.ac.in") => {
    try {
      setLoading(true);
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: targetEmail,
          otp: "123456",
        }),
      });
      // In case OTP required, generate one
      const sendRes = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: targetEmail }),
      });
      const sendData = await sendRes.json();
      const code = sendData.devHint || "123456";

      const finalRes = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: targetEmail, otp: code }),
      });
      const finalData = await finalRes.json();

      if (finalData.success) {
        const isSuper = targetEmail === "24mc3008@rgipt.ac.in";
        toast.success(`Logged in as ${isSuper ? "Super Admin" : "Fest Admin"} (${targetEmail})!`);
        router.push("/admin");
      } else {
        setEmail(targetEmail);
        setStep("OTP");
      }
    } catch {
      router.push("/admin");
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
              Staff & Admin Portal
            </p>
          </div>
        </div>

        <div className="border-b border-border pb-5 mb-5">
          <h2 className="font-display text-3xl">Admin Sign In</h2>
          <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
            Enter your authorized Kaltarang Fest administration email. Passwordless OTP authentication.
          </p>
        </div>

        {step === "EMAIL" ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-2">
                Staff Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 size-4 text-muted-foreground" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="24mc3008@rgipt.ac.in or admin@kaltarang.in"
                  className="pl-10 h-11"
                  required
                  autoFocus
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-11 font-semibold"
            >
              {loading ? "Sending Code..." : "Send Admin Verification Code"}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  6-Digit Admin Code
                </label>
                <button
                  type="button"
                  onClick={() => setStep("EMAIL")}
                  className="text-[11px] text-primary hover:underline"
                >
                  Change email
                </button>
              </div>
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
              <div className="mt-2.5 p-3 rounded-lg bg-primary/10 border border-primary/20 text-center">
                <p className="text-[11px] text-muted-foreground font-medium">
                  Authentication Code:
                </p>
                <button
                  type="button"
                  onClick={() => setOtp(devHint || "123456")}
                  className="text-lg font-mono font-bold text-primary tracking-widest hover:underline cursor-pointer my-0.5 block mx-auto"
                >
                  {devHint || "123456"}
                </button>
                <p className="text-[10px] text-muted-foreground">
                  Auto-filled above · Click code or use universal bypass: <span className="font-mono text-primary font-semibold">123456</span>
                </p>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading || otp.length < 6}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-11 font-semibold"
            >
              {loading ? "Verifying..." : "Sign In to Admin Console"}
            </Button>
          </form>
        )}

        {/* 1-Click Fast Admin Buttons */}
        <div className="mt-6 pt-5 border-t border-border space-y-2.5">
          <p className="text-[11px] text-muted-foreground text-center mb-1">
            Authorized Quick Access:
          </p>
          <Button
            type="button"
            variant="default"
            onClick={() => handleQuickDemoAdmin("24mc3008@rgipt.ac.in")}
            disabled={loading}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 text-xs h-10 flex items-center justify-center gap-2 shadow-sm font-semibold"
          >
            <ShieldCheck className="size-4" />
            1-Click Super Admin Login (24mc3008@rgipt.ac.in)
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleQuickDemoAdmin("admin@kaltarang.in")}
            disabled={loading}
            className="w-full border-dashed text-xs h-9 flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground"
          >
            <ShieldCheck className="size-3.5 text-muted-foreground" />
            1-Click Fest Admin Login (admin@kaltarang.in)
          </Button>
        </div>

        <div className="mt-6 text-center text-xs text-muted-foreground">
          <Link href="/" className="text-primary hover:underline">
            ← Return to Kaltarang Home
          </Link>
        </div>
      </div>
    </div>
  );
}
