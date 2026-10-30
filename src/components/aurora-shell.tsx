"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  CircleHelp,
  Download,
  FileCheck2,
  Headset,
  LayoutDashboard,
  Mail,
  Menu,
  Phone,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  TicketCheck,
  UserRound,
  X,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const participantNav = [
  { label: "Dashboard", href: "/portal", icon: LayoutDashboard },
  { label: "Profile", href: "/portal/registration", icon: UserRound },
  { label: "Documents", href: "/portal/documents", icon: FileCheck2 },
  { label: "Events", href: "/portal/events", icon: CalendarDays },
  { label: "Access pass", href: "/portal/pass", icon: TicketCheck },
  { label: "Help centre", href: "/portal/help", icon: CircleHelp },
] as const;

export const TECHNICAL_COHEAD_CONTACTS = [
  {
    name: "Karan Sharma",
    designation: "Website Head & Co-Head · Technical Co-Head",
    phone: "9627379234",
    email: "25cd3014@rgipt.ac.in",
  },
  {
    name: "Yashveer Nenava",
    designation: "Co-Head · Technical Co-Head",
    phone: "8690155034",
    email: "25ec3055@rgipt.ac.in",
  },
  {
    name: "Ayush Sharma",
    designation: "Co-Head · Technical Co-Head",
    phone: "7765932407",
    email: "25ev3009@rgipt.ac.in",
  },
  {
    name: "Samarth Patil",
    designation: "Co-Head · Technical Co-Head",
    phone: "7875711846",
    email: "25cd3041@rgipt.ac.in",
  },
  {
    name: "Harsh Vardhan Tiwari",
    designation: "Co-Head · Technical Co-Head",
    phone: "9530049367",
    email: "25it3022@rgipt.ac.in",
  },
] as const;

export const ESCALATION_CONTACT = {
  name: "Anurag Sharma",
  designation: "Technical and Editorial Coordinator",
  phone: "8905474391",
  email: "24mc3008@rgipt.ac.in",
} as const;

export function PwaInstallBanner({
  appTitle = "Aurora Gate & Admin Web App",
  dark = false,
}: {
  appTitle?: string;
  dark?: boolean;
}) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(standalone);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (isStandalone || dismissed) return null;

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        toast.success("Web App installing to your home screen!");
        setDeferredPrompt(null);
      }
    } else {
      toast.info(
        'In Mobile Chrome: tap the ⋮ menu (top-right) and select "Add to Home screen" or "Install app" to open as a full-screen Web App!'
      );
    }
  };

  return (
    <div
      className={cn(
        "border-b px-4 py-2.5 text-xs flex flex-wrap items-center justify-between gap-3",
        dark
          ? "bg-primary/20 border-primary/40 text-white"
          : "bg-primary/10 border-primary/30 text-foreground"
      )}
    >
      <div className="flex items-center gap-2">
        <Smartphone className="size-4 text-primary shrink-0" />
        <span>
          <strong>Install {appTitle}:</strong> Open directly from your phone home screen like a native app on Mobile Chrome.
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          onClick={handleInstallClick}
          className="h-7 px-3 text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          <Download className="size-3.5 mr-1.5" /> Install Web App
        </Button>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="p-1 opacity-70 hover:opacity-100"
          aria-label="Dismiss install banner"
        >
          <X className="size-3.5" />
        </button>
      </div>
    </div>
  );
}

export function HelpContactsSection({ dark = false }: { dark?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-6 sm:p-8 space-y-6",
        dark
          ? "bg-security-panel border-security-border text-white"
          : "surface border-border bg-card/90 text-foreground"
      )}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-4 border-inherit">
        <div>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
            <Headset className="size-3.5" /> 24×7 Registration &amp; Gate Access Support
          </span>
          <h3 className="font-display text-2xl sm:text-3xl font-bold mt-1">
            Need Help? Contact Technical Co-Heads First
          </h3>
        </div>
        <p className={cn("text-xs", dark ? "text-security-muted" : "text-muted-foreground")}>
          For QR pass, registration, or gate verification assistance
        </p>
      </div>

      {/* First-Line Contacts: 5 Technical Co-Heads */}
      <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
        {TECHNICAL_COHEAD_CONTACTS.map((c) => (
          <div
            key={c.email}
            className={cn(
              "rounded-xl border p-4 flex flex-col justify-between gap-3 transition-colors",
              dark
                ? "border-security-border bg-black/30 hover:border-primary/50"
                : "border-border bg-background hover:border-primary/50"
            )}
          >
            <div>
              <h4 className="font-semibold text-sm">{c.name}</h4>
              <p className="text-[11px] text-primary font-semibold mt-0.5">{c.designation}</p>
            </div>
            <div className="space-y-1.5 pt-2 border-t border-border/40 text-xs">
              <a
                href={`tel:+91${c.phone}`}
                className="flex items-center gap-2 font-mono hover:text-primary transition-colors"
              >
                <Phone className="size-3.5 text-primary shrink-0" /> +91 {c.phone}
              </a>
              <a
                href={`mailto:${c.email}`}
                className="flex items-center gap-2 font-mono hover:text-primary transition-colors break-all"
              >
                <Mail className="size-3.5 text-primary shrink-0" /> {c.email}
              </a>
            </div>
          </div>
        ))}

        {/* Escalation Contact Card */}
        <div
          className={cn(
            "rounded-xl border-2 border-primary/60 p-4 flex flex-col justify-between gap-3",
            dark ? "bg-primary/15" : "bg-primary/5"
          )}
        >
          <div>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider mb-1.5">
              <ShieldAlert className="size-3" /> For Further Escalations
            </span>
            <h4 className="font-semibold text-sm">{ESCALATION_CONTACT.name}</h4>
            <p className="text-[11px] text-primary font-semibold mt-0.5">
              {ESCALATION_CONTACT.designation}
            </p>
          </div>
          <div className="space-y-1.5 pt-2 border-t border-primary/20 text-xs">
            <a
              href={`tel:+91${ESCALATION_CONTACT.phone}`}
              className="flex items-center gap-2 font-mono font-semibold hover:text-primary transition-colors"
            >
              <Phone className="size-3.5 text-primary shrink-0" /> +91 {ESCALATION_CONTACT.phone}
            </a>
            <a
              href={`mailto:${ESCALATION_CONTACT.email}`}
              className="flex items-center gap-2 font-mono font-semibold hover:text-primary transition-colors break-all"
            >
              <Mail className="size-3.5 text-primary shrink-0" /> {ESCALATION_CONTACT.email}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AuroraShell({
  children,
  userName = "External Participant",
  registrationId,
}: {
  children: ReactNode;
  userName?: string;
  registrationId?: string;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-background text-foreground lg:flex">
      {/* Mobile Header */}
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border bg-sidebar px-4 text-sidebar-foreground lg:hidden">
        <Brand compact />
        <Button variant="ghost" size="icon" aria-label="Open navigation" onClick={() => setOpen(true)}>
          <Menu className="size-5" />
        </Button>
      </header>

      {/* Mobile Drawer Overlay */}
      {open && (
        <button
          className="fixed inset-0 z-40 bg-overlay lg:hidden cursor-default"
          aria-label="Close navigation"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-sidebar text-sidebar-foreground transition-transform duration-300 lg:sticky lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between p-7">
          <Brand />
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden text-sidebar-foreground hover:bg-sidebar-accent"
            aria-label="Close navigation"
            onClick={() => setOpen(false)}
          >
            <X className="size-5" />
          </Button>
        </div>

        <div className="mx-6 border-t border-sidebar-border" />

        <nav className="mt-7 flex-1 space-y-1 px-5" aria-label="Participant portal">
          {participantNav.map(({ label, href, icon: Icon }) => {
            const active = href === "/portal" ? pathname === "/portal" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-md px-4 py-3 text-sm font-medium transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                    : "text-sidebar-muted hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
                )}
              >
                <Icon className="size-4" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="m-5 border-t border-sidebar-border pt-5">
          <div className="flex items-center gap-3 rounded-md p-2 bg-sidebar-accent/30">
            <div className="size-10 rounded-full bg-primary/20 text-primary grid place-items-center font-display text-lg font-bold ring-1 ring-sidebar-border">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{userName}</p>
              <p className="truncate text-[10px] uppercase tracking-wider text-sidebar-muted">
                {registrationId || "External participant"}
              </p>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between px-2 text-xs text-sidebar-muted">
            <Link
              href="/admin"
              className="flex items-center gap-1.5 hover:text-sidebar-accent-foreground transition-colors"
            >
              <ShieldCheck className="size-3.5" /> Staff portal
            </Link>
            <Link
              href="/security"
              className="hover:text-sidebar-accent-foreground transition-colors"
            >
              Gate
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
      <div className="flex items-center gap-2">
        <img
          src="/sponsors/rgipt-logo.jpg"
          alt="RGIPT Logo"
          className={cn(
            "rounded-full bg-white p-0.5 object-contain shadow-sm",
            compact ? "size-8" : "size-10"
          )}
        />
        <img
          src="/kaltarang-logo.svg"
          alt="Kaltarang"
          className={compact ? "h-8 w-6 object-contain" : "h-10 w-8 object-contain"}
        />
      </div>
      <div>
        <p className="font-display text-2xl leading-none tracking-tight">Aurora</p>
        {!compact && (
          <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-sidebar-muted">
            Kaltarang 2026 · RGIPT
          </p>
        )}
      </div>
    </Link>
  );
}

export function SponsorsShowcase({ dark = false }: { dark?: boolean }) {
  const bankSponsors = [
    { name: "HDFC Bank", src: "/sponsors/hdfc-bank.png" },
    { name: "Canara Bank", src: "/sponsors/canara-bank.png" },
    { name: "YES Bank", src: "/sponsors/yes-bank.png" },
    { name: "Bank of Baroda", src: "/sponsors/bob.png" },
    { name: "Punjab & Sind Bank", src: "/sponsors/psb.png" },
  ];

  return (
    <div className="space-y-8">
      <section
        className={cn(
          "rounded-2xl border p-6 sm:p-8 space-y-8",
          dark
            ? "bg-security-panel border-security-border text-white"
            : "surface border-border bg-card/80 text-foreground"
        )}
      >
        {/* Top Row: Host Institute RGIPT + Platinum Sponsor Gruner Renewable Energy */}
        <div className="grid gap-6 md:grid-cols-2 items-stretch">
          {/* Host Institute RGIPT */}
          <div
            className={cn(
              "flex flex-col sm:flex-row items-center gap-5 rounded-xl border p-5",
              dark ? "border-security-border bg-black/30" : "border-border bg-background"
            )}
          >
            <div className="size-24 rounded-xl bg-white p-2 shadow-sm border border-border/40 shrink-0 flex items-center justify-center">
              <img
                src="/sponsors/rgipt-logo.jpg"
                alt="Rajiv Gandhi Institute of Petroleum Technology (RGIPT)"
                className="max-h-full max-w-full object-contain"
              />
            </div>
            <div className="text-center sm:text-left">
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-primary/15 text-primary text-[10px] font-bold uppercase tracking-widest">
                Host Institute · An Institute of National Importance
              </span>
              <h3 className="font-display text-xl sm:text-2xl font-bold mt-1.5">
                Rajiv Gandhi Institute of Petroleum Technology
              </h3>
              <p className={cn("text-xs mt-0.5", dark ? "text-security-muted" : "text-muted-foreground")}>
                Jais, Amethi · Host of Kaltarang 2026 Annual Cultural &amp; Sports Fest
              </p>
            </div>
          </div>

          {/* Platinum Sponsor: Gruner Renewable Energy */}
          <div
            className={cn(
              "flex flex-col sm:flex-row items-center gap-5 rounded-xl border-2 border-primary/50 p-5",
              dark ? "bg-primary/10" : "bg-primary/5"
            )}
          >
            <div className="h-24 w-52 rounded-xl bg-white px-4 py-2.5 shadow-sm border border-primary/30 shrink-0 flex items-center justify-center">
              <img
                src="/sponsors/gruner-logo.png"
                alt="Gruner Renewable Energy — Platinum Sponsor"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="text-center sm:text-left">
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-widest shadow-xs">
                ★ Platinum Sponsor · Kaltarang 2026
              </span>
              <h3 className="font-display text-xl sm:text-2xl font-bold mt-1.5">
                Gruner Renewable Energy
              </h3>
              <p className={cn("text-xs mt-0.5", dark ? "text-security-muted" : "text-muted-foreground")}>
                Official Platinum Sponsor of Kaltarang 2026 at RGIPT
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Row: Official Banking Sponsors — Uniform High-Resolution 2:1 Cards */}
        <div className={cn("pt-6 border-t", dark ? "border-security-border" : "border-border")}>
          <p
            className={cn(
              "text-center text-xs font-bold uppercase tracking-[0.22em] mb-5",
              dark ? "text-security-muted" : "text-muted-foreground"
            )}
          >
            Official Sponsors · Kaltarang 2026
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {bankSponsors.map((sp) => (
              <div
                key={sp.name}
                className="rounded-xl bg-white p-4 border border-neutral-200 shadow-sm flex flex-col items-center justify-between gap-2.5 hover:border-primary hover:shadow-md transition-all"
              >
                <div className="w-full h-20 flex items-center justify-center">
                  <img
                    src={sp.src}
                    alt={sp.name}
                    className="max-h-18 w-auto max-w-[165px] object-contain"
                  />
                </div>
                <span className="text-[11px] font-bold text-neutral-800 tracking-wide text-center border-t border-neutral-100 pt-1.5 w-full">
                  {sp.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Help & Escalation Contacts Section (Included on all pages) */}
      <HelpContactsSection dark={dark} />
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-5 border-b border-border px-5 py-7 sm:px-8 lg:flex-row lg:items-end lg:justify-between lg:px-12 lg:py-9">
      <div>
        <p className="section-label">{eyebrow}</p>
        <h1 className="mt-3 font-display text-4xl leading-none sm:text-5xl">{title}</h1>
        {description && (
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </header>
  );
}

export function StatusPill({
  tone = "pending",
  children,
  className,
}: {
  tone?: "pending" | "success" | "neutral" | "danger";
  children: ReactNode;
  className?: string;
}) {
  const tones = {
    pending: "status-pending",
    success: "status-success",
    neutral: "status-neutral",
    danger: "status-danger",
  };

  return <span className={cn("status-pill", tones[tone], className)}>{children}</span>;
}
