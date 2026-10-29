"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { KeyRound, Lock, Mail, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Brand } from "@/components/aurora-shell";
import { toast } from "sonner";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter your administrator email and password.");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: email.trim(),
          password,
          role: "ADMIN",
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Invalid administrator credentials.");
        return;
      }

      toast.success("Administrator authenticated!");
      router.push("/admin/verification");
      router.refresh();
    } catch {
      toast.error("Network error during login.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-sidebar text-sidebar-foreground flex flex-col justify-center items-center p-6">
      <div className="max-w-md w-full surface bg-card text-card-foreground border-border p-8 shadow-2xl">
        <div className="mb-6">
          <Brand />
          <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-primary/15 text-primary text-[10px] font-bold uppercase tracking-widest">
            <ShieldCheck className="size-3.5" /> Restricted Administration Portal
          </div>
        </div>

        <div className="border-b border-border pb-5 mb-6">
          <h1 className="font-display text-3xl">Administrator Sign In</h1>
          <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
            Authorized Kaltarang 2026 verification administrator access only.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">
              Admin Email *
            </label>
            <div className="relative">
              <Mail className="size-4 absolute left-3 top-3 text-muted-foreground" />
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter administrator email"
                className="pl-9 h-10 text-sm"
                autoComplete="username"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">
              Password *
            </label>
            <div className="relative">
              <KeyRound className="size-4 absolute left-3 top-3 text-muted-foreground" />
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter administrator password"
                className="pl-9 h-10 text-sm"
                autoComplete="current-password"
                required
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-11 font-semibold mt-2"
          >
            <Lock className="size-4 mr-2" />
            {loading ? "Signing In..." : "Sign In to Admin Portal"}
          </Button>
        </form>

        <div className="mt-6 pt-5 border-t border-border text-center text-xs text-muted-foreground">
          <Link href="/" className="hover:text-foreground transition-colors">
            ← Return to Kaltarang Home
          </Link>
        </div>
      </div>
    </div>
  );
}
