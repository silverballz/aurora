import Link from "next/link";
import { ArrowRight, CheckCircle2, Lock, QrCode, Shield, Sparkles, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SponsorsShowcase } from "@/components/aurora-shell";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Top Bar */}
      <header className="border-b border-border bg-card/70 backdrop-blur-md px-6 py-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img
              src="/sponsors/rgipt-logo.jpg"
              alt="RGIPT Logo"
              className="size-11 rounded-full bg-white p-0.5 object-contain border border-border shadow-xs"
            />
            <img src="/kaltarang-logo.svg" alt="Kaltarang Logo" className="h-10 w-8 object-contain" />
            <div>
              <span className="font-display text-2xl tracking-tight leading-none block">Aurora</span>
              <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-muted-foreground">
                Kaltarang 2026 · RGIPT
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-end">
            <div className="hidden lg:flex items-center gap-2 bg-white px-3 py-1 rounded-md border border-primary/30 shadow-2xs mr-1">
              <span className="text-[9px] font-bold uppercase tracking-widest text-primary">
                Platinum Sponsor
              </span>
              <img
                src="/sponsors/gruner-logo.png"
                alt="Gruner Renewable Energy"
                className="h-6 object-contain"
              />
            </div>

            <Button asChild variant="outline" size="sm" className="text-xs border-primary/40 text-primary">
              <Link href="/register">
                <UserPlus className="size-3.5 mr-1.5" /> Participant Registration Form
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="text-xs">
              <Link href="/admin/login">Admin Console</Link>
            </Button>
            <Button asChild size="sm" className="text-xs bg-primary hover:bg-primary/90 text-primary-foreground">
              <Link href="/security/login">Main Gate Scanner</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col justify-center max-w-7xl mx-auto px-6 py-12 lg:py-16 w-full space-y-16">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider mb-6">
            <Sparkles className="size-3.5" /> Official External Participant Access &amp; Identity System · RGIPT
          </div>
          <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl leading-[1.08] tracking-tight">
            Register once. Receive your single static QR pass via email.
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-muted-foreground leading-relaxed">
            External participants complete the registration form with their live selfie and ID documents.
            Once verified by Admin, a single static QR pass for the entire Kaltarang 2026 fest is emailed directly to the participant for instant scanning at the RGIPT Main Gate.
          </p>

          <div className="mt-8 flex flex-wrap gap-4 items-center">
            <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6 h-13 text-base shadow-lg">
              <Link href="/register">
                <UserPlus className="size-5 mr-2" /> Open Participant Registration Form
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-13 px-6 text-base">
              <Link href="/security">
                Open Main Gate QR Scanner <ArrowRight className="size-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Official Institute, Platinum Sponsor & Banking Sponsors Showcase */}
        <SponsorsShowcase />

        {/* Three Core Interfaces */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* 1. Public Registration Form */}
          <div className="surface p-8 flex flex-col justify-between hover:border-primary/50 transition-all duration-200">
            <div>
              <div className="size-12 rounded-xl bg-primary/10 text-primary grid place-items-center mb-6">
                <UserPlus className="size-6" />
              </div>
              <p className="section-label text-primary">Step 1 · External Participant</p>
              <h2 className="font-display text-3xl mt-2">Registration Form</h2>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                Public registration form — no login or OTP required. Submit your college details, live camera selfie, and ID documents. Your single static QR pass will be emailed to you upon approval.
              </p>
            </div>
            <div className="mt-8">
              <Button asChild className="w-full bg-primary hover:bg-primary/90">
                <Link href="/register" className="flex items-center justify-center gap-2">
                  <UserPlus className="size-4" /> Fill Registration Form &rarr;
                </Link>
              </Button>
            </div>
          </div>

          {/* 2. Admin Dashboard */}
          <div className="surface p-8 flex flex-col justify-between hover:border-primary/50 transition-all duration-200">
            <div>
              <div className="size-12 rounded-xl bg-sidebar/10 text-sidebar-foreground grid place-items-center mb-6">
                <Shield className="size-6 text-primary" />
              </div>
              <p className="section-label">Step 2 · Fest Administration</p>
              <h2 className="font-display text-3xl mt-2">Admin Review &amp; CRUD</h2>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                Review submitted participant registrations, manage full CRUD records for 120+ attendees, and click Approve to automatically generate and email their single static QR pass.
              </p>
            </div>
            <div className="mt-8 space-y-2.5">
              <Button asChild className="w-full bg-sidebar text-sidebar-foreground hover:bg-sidebar/90">
                <Link href="/admin/login" className="flex items-center justify-center gap-2">
                  <Lock className="size-4" /> Admin Sign In
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href="/admin/verification">
                  Open Verification Desk &rarr;
                </Link>
              </Button>
            </div>
          </div>

          {/* 3. Security Gate Console */}
          <div className="surface p-8 flex flex-col justify-between hover:border-primary/50 transition-all duration-200">
            <div>
              <div className="size-12 rounded-xl bg-security text-security-foreground grid place-items-center mb-6">
                <QrCode className="size-6 text-primary" />
              </div>
              <p className="section-label">Step 3 · RGIPT Main Gate</p>
              <h2 className="font-display text-3xl mt-2">Security QR Scanner</h2>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                Authorized gate guards scan the participant&apos;s static QR pass at the RGIPT Main Gate, verify their live selfie, approve Entry or Exit, and the scanner auto-restarts for the next QR.
              </p>
            </div>
            <div className="mt-8 space-y-2.5">
              <Button asChild className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/80">
                <Link href="/security/login" className="flex items-center justify-center gap-2">
                  Main Gate Guard Login &rarr;
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href="/security">
                  Direct Scanner Console
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Operating Principle Feature Strip */}
        <div className="border-t border-border pt-12 grid sm:grid-cols-3 gap-6">
          <div className="flex gap-4">
            <CheckCircle2 className="size-5 text-primary shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-sm">No Login or OTP Hassle</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Participants simply open the registration link, submit their form once, and receive their QR pass directly on their email.
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <CheckCircle2 className="size-5 text-primary shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-sm">One Single Static QR Pass</h3>
              <p className="text-xs text-muted-foreground mt-1">
                One static QR code works for the entire event at the RGIPT Main Gate — showing Check-In when outside and Check-Out when inside.
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <CheckCircle2 className="size-5 text-primary shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-sm">120+ Participant Cloud Capacity</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Sharded cloud document storage accommodates 120+ participants with high-resolution IDs and full Admin CRUD controls.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6 px-6 text-center text-xs text-muted-foreground">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>
            Aurora © 2026 Kaltarang · Rajiv Gandhi Institute of Petroleum Technology (RGIPT) · Platinum Sponsor: Gruner Renewable Energy
          </p>
          <p className="font-mono text-[11px]">
            RGIPT Main Gate · Single Static QR · Full Admin CRUD
          </p>
        </div>
      </footer>
    </div>
  );
}
