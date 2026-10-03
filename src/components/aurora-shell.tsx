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
      <img
        src="/kaltarang-logo.svg"
        alt="Kaltarang"
        className={compact ? "h-9 w-7 object-contain" : "h-12 w-9 object-contain"}
      />
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
