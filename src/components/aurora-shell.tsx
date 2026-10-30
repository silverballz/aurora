"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  CircleHelp,
  FileCheck2,
  LayoutDashboard,
  Menu,
  ShieldCheck,
  TicketCheck,
  UserRound,
  X,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const participantNav = [
  { label: "Dashboard", href: "/portal", icon: LayoutDashboard },
  { label: "Profile", href: "/portal/registration", icon: UserRound },
  { label: "Documents", href: "/portal/documents", icon: FileCheck2 },
  { label: "Events", href: "/portal/events", icon: CalendarDays },
  { label: "Access pass", href: "/portal/pass", icon: TicketCheck },
  { label: "Help centre", href: "/portal/help", icon: CircleHelp },
] as const;

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
          <div className="size-20 rounded-xl bg-white p-2 shadow-sm border border-border/40 shrink-0 flex items-center justify-center">
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
          <div className="h-20 w-44 rounded-xl bg-white px-4 py-2 shadow-sm border border-primary/30 shrink-0 flex items-center justify-center">
            <img
              src="/sponsors/gruner-logo.png"
              alt="Gruner Renewable Energy — Platinum Sponsor"
              className="max-h-full max-w-full object-contain"
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

      {/* Bottom Row: Official Banking Sponsors */}
      <div className={cn("pt-6 border-t", dark ? "border-security-border" : "border-border")}>
        <p
          className={cn(
            "text-center text-[11px] font-bold uppercase tracking-[0.22em] mb-5",
            dark ? "text-security-muted" : "text-muted-foreground"
          )}
        >
          Official Sponsors · Kaltarang 2026
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 items-center">
          {bankSponsors.map((sp) => (
            <div
              key={sp.name}
              className="h-20 rounded-xl bg-white p-3 border border-border/60 shadow-xs flex flex-col items-center justify-center gap-1 hover:border-primary/50 transition-all"
            >
              <img
                src={sp.src}
                alt={sp.name}
                className="max-h-11 max-w-[130px] object-contain"
              />
              <span className="text-[10px] font-semibold text-neutral-600 truncate max-w-full">
                {sp.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
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
