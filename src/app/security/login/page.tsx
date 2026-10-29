"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Camera, KeyRound, QrCode, Shield, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function SecurityLoginPage() {
  const router = useRouter();
  const [operatorCode, setOperatorCode] = useState("SEC-014");
  const [gate, setGate] = useState("gate-main");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin) {
      toast.error("Please enter the operator gate PIN.");
      return;
    }

    if (pin !== "2026" && pin !== "1234") {
      toast.error("Invalid gate PIN. Default test PIN is 2026.");
      return;
    }

    setLoading(true);
    try {
      localStorage.setItem("aurora_gate_id", gate);
      localStorage.setItem("aurora_operator_code", operatorCode);
    } catch {}
    toast.success(`Operator ${operatorCode} authenticated at ${gate.toUpperCase()}!`);
    setTimeout(() => {
      router.push("/security");
    }, 400);
  };

  const handleQuickDemoOperator = () => {
    try {
      localStorage.setItem("aurora_gate_id", gate);
      localStorage.setItem("aurora_operator_code", operatorCode || "SEC-014");
    } catch {}
    toast.success("Logged in as Security Operator (SEC-014)!");
    router.push("/security");
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
          <h2 className="font-display text-3xl text-white">Gate Operator Login</h2>
          <p className="text-xs text-security-muted mt-1.5 leading-relaxed">
            Authorized gate personnel only. Select your assigned entrance and authenticate.
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
              Operator Badge Code
            </label>
            <Input
              value={operatorCode}
              onChange={(e) => setOperatorCode(e.target.value)}
              placeholder="SEC-014"
              className="bg-security border-security-border text-white font-mono h-11"
              required
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-security-muted">
                Gate Passcode / PIN
              </label>
              <span className="text-[11px] text-primary">Default PIN: 2026</span>
            </div>
            <Input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="Enter PIN (2026)"
              className="bg-security border-security-border text-white font-mono text-center tracking-widest text-lg h-11"
              required
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-12 font-semibold text-base mt-2"
          >
            <Camera className="size-4 mr-2" /> Launch Gate Scanner
          </Button>
        </form>

        {/* 1-Click Test Operator */}
        <div className="mt-6 pt-5 border-t border-security-border">
          <Button
            type="button"
            variant="outline"
            onClick={handleQuickDemoOperator}
            className="w-full border-security-border text-security-muted hover:text-white hover:bg-white/10 text-xs h-10"
          >
            1-Click Demo Security Operator Login
          </Button>
        </div>

        <div className="mt-6 text-center text-xs text-security-muted">
          <Link href="/" className="hover:text-white transition-colors">
            ← Return to Kaltarang Home
          </Link>
        </div>
      </div>
    </div>
  );
}
