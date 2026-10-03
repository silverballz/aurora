import Link from "next/link";
import { ArrowRight, CheckCircle2, QrCode, Shield, Sparkles, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Top Bar */}
      <header className="border-b border-border bg-card/60 backdrop-blur-md px-6 py-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/kaltarang-logo.svg" alt="Kaltarang Logo" className="h-10 w-8 object-contain" />
            <div>
              <span className="font-display text-2xl tracking-tight leading-none block">Aurora</span>
              <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-muted-foreground">
                Kaltarang 2026 · RGIPT
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button asChild variant="outline" size="sm">
              <Link href="/portal/login">Participant Login</Link>
            </Button>
            <Button asChild size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <Link href="/admin">Staff Console</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col justify-center max-w-7xl mx-auto px-6 py-12 lg:py-20 w-full">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider mb-6">
            <Sparkles className="size-3.5" /> Official Access & Identity System
          </div>
          <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl leading-[1.08] tracking-tight">
            Digital verified campus access for Kaltarang 2026.
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-muted-foreground leading-relaxed">
            Aurora replaces manual paperwork and physical queues with a centralized, auditable digital identity system.
            External participants verify once before arrival; campus gates scan, visually confirm, and allow instant entry.
          </p>
        </div>

        {/* Portals Grid */}
        <div className="grid md:grid-cols-3 gap-6 mt-16">
          {/* Participant Portal */}
          <div className="surface p-8 flex flex-col justify-between hover:border-primary/50 transition-all duration-200">
            <div>
              <div className="size-12 rounded-xl bg-primary/10 text-primary grid place-items-center mb-6">
                <UserCheck className="size-6" />
              </div>
              <p className="section-label text-primary">External Participant</p>
              <h2 className="font-display text-3xl mt-2">Participant Portal</h2>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                Invited external participants: verify email OTP, complete personal details, take a registered identity photograph, and upload Student ID & Aadhaar to receive your active QR credential.
              </p>
            </div>
            <div className="mt-8 space-y-3">
              <Button asChild className="w-full bg-primary hover:bg-primary/90">
                <Link href="/portal" className="flex items-center justify-center gap-2">
                  Open Participant Portal <ArrowRight className="size-4" />
                </Link>
              </Button>
              <p className="text-[11px] text-center text-muted-foreground">
                Requires an active invitation link or verified participant email.
              </p>
            </div>
          </div>

          {/* Admin Dashboard */}
          <div className="surface p-8 flex flex-col justify-between hover:border-primary/50 transition-all duration-200">
            <div>
              <div className="size-12 rounded-xl bg-sidebar/10 text-sidebar-foreground grid place-items-center mb-6">
                <Shield className="size-6 text-primary" />
              </div>
              <p className="section-label">Operations & Desk</p>
              <h2 className="font-display text-3xl mt-2">Admin Dashboard</h2>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                Fest organizers and document verifiers: generate payment-backed invitation tokens, inspect uploaded identity documents via signed URLs, approve submissions, and track live occupancy.
              </p>
            </div>
            <div className="mt-8 space-y-3">
              <Button asChild variant="outline" className="w-full">
                <Link href="/admin" className="flex items-center justify-center gap-2">
                  Open Admin Dashboard <ArrowRight className="size-4" />
                </Link>
              </Button>
              <p className="text-[11px] text-center text-muted-foreground">
                Role-based access for Fest Admin, Verifier, and Super Admin.
              </p>
            </div>
          </div>

          {/* Security Gate Scanner */}
          <div className="surface p-8 flex flex-col justify-between hover:border-primary/50 transition-all duration-200">
            <div>
              <div className="size-12 rounded-xl bg-security text-security-foreground grid place-items-center mb-6">
                <QrCode className="size-6 text-primary" />
              </div>
              <p className="section-label">Campus Security</p>
              <h2 className="font-display text-3xl mt-2">Gate Console</h2>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                Authorized gate operators: scan participant QR passes, compare the registered identity selfie, and record atomic Entry/Exit state transitions with automatic duplicate scan rejection.
              </p>
            </div>
            <div className="mt-8 space-y-3">
              <Button asChild className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/80">
                <Link href="/security" className="flex items-center justify-center gap-2">
                  Launch Gate Scanner <ArrowRight className="size-4" />
                </Link>
              </Button>
              <p className="text-[11px] text-center text-muted-foreground">
                Optimized for mobile & tablet gate operation.
              </p>
            </div>
          </div>
        </div>

        {/* Operating Principle Feature Strip */}
        <div className="mt-16 border-t border-border pt-12 grid sm:grid-cols-3 gap-6">
          <div className="flex gap-4">
            <CheckCircle2 className="size-5 text-primary shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-sm">Documentation Completed Once</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Participant completes paperwork before leaving home. No paper forms at campus gates.
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <CheckCircle2 className="size-5 text-primary shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-sm">Zero Aadhaar Leakage</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Strict data minimization ensures security operators only see registered selfie and name, never sensitive documents.
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <CheckCircle2 className="size-5 text-primary shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-sm">Atomic Concurrency Locks</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Database-level row locking prevents duplicate pass reuse and concurrent gate entry attempts.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6 px-6 text-center text-xs text-muted-foreground">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>
            Aurora © 2026 Kaltarang · Rajiv Gandhi Institute of Petroleum Technology (RGIPT)
          </p>
          <p className="font-mono text-[11px]">
            Build v1.0.0 · Production Ready
          </p>
        </div>
      </footer>
    </div>
  );
}
