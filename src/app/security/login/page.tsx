"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Camera, KeyRound, Lock, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function SecurityLoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [gate, setGate] = useState("gate-main");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !password) {
      toast.error("Please enter the security account ID and password.");
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
          gate,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Invalid security guard credentials.");
        return;
      }

      try {
        localStorage.setItem("aurora_gate_id", gate);
        localStorage.setItem("aurora_operator_code", identifier.trim());
      } catch {}

      toast.success(`Authenticated at ${gate.toUpperCase()}!`);
      router.push("/security");
      router.refresh();
    } catch {
      toast.error("Network error during login.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-security text-security-foreground flex flex-col justify-center items-center p-6">
      <div className="max-w-md w-full surface bg-security-panel border-security-border p-8">
        <div className="flex items-center gap-3 mb-6">
          <img src="/kaltarang-logo.svg" alt="Kaltarang Logo" className="h-9 w-7 object-contain" />
          <div>
            <h1 className="font-display text-2xl leading-none text-white">Aurora Gate</h1>
            <p className="text-[10px] uppercase tracking-widest text-security-muted mt-0.5">
              Campus Security Console
            </p>
          </div>
        </div>

        <div className="border-b border-security-border pb-5 mb-5">
          <h2 className="font-display text-3xl text-white">Security Guard Login</h2>
          <p className="text-xs text-security-muted mt-1.5 leading-relaxed">
            Authorized RGIPT gate security personnel only. Select your assigned entrance and sign in.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-security-muted block mb-1.5">
              Assigned Campus Gate
            </label>
            <select
              value={gate}
              onChange={(e) => setGate(e.target.value)}
              className="w-full h-11 px-3 rounded-md bg-security border border-security-border text-white text-sm outline-none cursor-pointer"
            >
              <option value="gate-main">MAIN GATE (North / Admin Entrance)</option>
              <option value="gate-hostel">HOSTEL GATE (South / Residence Entrance)</option>
              <option value="gate-arena">OAT / ARENA GATE (Festival Ground)</option>
              <option value="gate-back">BACK GATE (East Service)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-security-muted block mb-1.5">
              Guard Account ID / Email *
            </label>
            <div className="relative">
              <UserCheck className="size-4 absolute left-3 top-3.5 text-security-muted" />
              <Input
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Enter guard ID or email"
                className="bg-security border-security-border text-white pl-9 h-11"
                autoComplete="username"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-security-muted block mb-1.5">
              Guard Password *
            </label>
            <div className="relative">
              <KeyRound className="size-4 absolute left-3 top-3.5 text-security-muted" />
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter guard password"
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
            {loading ? "Signing In..." : "Sign In & Launch Scanner"}
          </Button>
        </form>

        <div className="mt-6 pt-5 border-t border-security-border text-center text-xs text-security-muted">
          <Link href="/" className="hover:text-white transition-colors">
            ← Return to Kaltarang Home
          </Link>
        </div>
      </div>
    </div>
  );
}
