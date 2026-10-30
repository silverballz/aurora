"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { KeyRound, Lock, ShieldCheck, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PwaInstallBanner, SponsorsShowcase } from "@/components/aurora-shell";
import { toast } from "sonner";

export default function SecurityLoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !password) {
      toast.error("Please enter the security guard or Co-Head login ID and password.");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: identifier.trim(),
          password,
          role: "GUARD",
          gate: "gate-main",
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Invalid security guard or Co-Head credentials.");
        return;
      }

      try {
        localStorage.setItem("aurora_gate_id", "gate-main");
        localStorage.setItem("aurora_operator_code", identifier.trim());
      } catch {}

      toast.success("Authenticated at RGIPT Main Gate!");
      router.push("/security");
      router.refresh();
    } catch {
      toast.error("Network error during login.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-security text-security-foreground flex flex-col">
      <PwaInstallBanner appTitle="Aurora Gate Scanner Web App" dark />

      <div className="flex-1 flex flex-col justify-center items-center p-6 space-y-10">
        <div className="max-w-md w-full surface bg-security-panel border-security-border p-8 mt-4">
          <div className="flex items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-2.5">
              <img
                src="/sponsors/rgipt-logo.jpg"
                alt="RGIPT Logo"
                className="size-10 rounded-full bg-white p-0.5 object-contain"
              />
              <img src="/kaltarang-logo.svg" alt="Kaltarang Logo" className="h-9 w-7 object-contain" />
              <div>
                <h1 className="font-display text-2xl leading-none text-white">Aurora Gate</h1>
                <p className="text-[10px] uppercase tracking-widest text-security-muted mt-0.5">
                  RGIPT Main Security Gate
                </p>
              </div>
            </div>
            <div className="h-8 px-2.5 rounded bg-white flex items-center">
              <img
                src="/sponsors/gruner-logo.png"
                alt="Gruner Renewable Energy"
                className="h-5 object-contain"
              />
            </div>
          </div>

          <div className="border-b border-security-border pb-5 mb-5">
            <h2 className="font-display text-3xl text-white">Main Gate Scanner Login</h2>
            <p className="text-xs text-security-muted mt-1.5 leading-relaxed">
              Authorized RGIPT Main Gate security personnel, Coordinator, and Technical Co-Heads can sign in here to launch the QR scanner.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="p-3 rounded-md bg-security border border-security-border flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-security-muted">
                Campus Checkpoint
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-primary">
                <ShieldCheck className="size-4" /> RGIPT MAIN GATE
              </span>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-security-muted block mb-1.5">
                Guard / Technical Co-Head Account ID *
              </label>
              <div className="relative">
                <UserCheck className="size-4 absolute left-3 top-3.5 text-security-muted" />
                <Input
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="security@rgipt.ac.in or cohead@rgipt.ac.in"
                  className="bg-security border-security-border text-white pl-9 h-11"
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-security-muted block mb-1.5">
                Password *
              </label>
              <div className="relative">
                <KeyRound className="size-4 absolute left-3 top-3.5 text-security-muted" />
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="bg-security border-security-border text-white pl-9 h-11"
                  autoComplete="current-password"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-12 font-semibold text-base mt-2"
            >
              <Lock className="size-4 mr-2" />
              {loading ? "Signing In..." : "Sign In & Launch Main Gate Scanner"}
            </Button>
          </form>

          <div className="mt-6 pt-5 border-t border-security-border flex items-center justify-between text-xs text-security-muted">
            <Link href="/" className="hover:text-white transition-colors">
              ← Kaltarang Home
            </Link>
            <Link href="/admin/login" className="text-primary font-semibold hover:underline">
              Admin Portal Login →
            </Link>
          </div>
        </div>

        <div className="max-w-5xl w-full pb-8">
          <SponsorsShowcase dark />
        </div>
      </div>
    </div>
  );
}
