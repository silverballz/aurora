"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  CheckSquare,
  Clock,
  Download,
  FileText,
  Mail,
  Menu,
  Shield,
  ShieldAlert,
  Users,
  X,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Brand } from "./aurora-shell";

const adminNav = [
  { label: "Overview", href: "/admin", icon: BarChart3 },
  { label: "Verification queue", href: "/admin/verification", icon: Clock },
  { label: "QR emails & SMTP", href: "/admin/invitations", icon: Mail },
  { label: "Participants", href: "/admin/participants", icon: Users },
  { label: "Access activity", href: "/admin/activity", icon: CheckSquare },
  { label: "Live occupancy", href: "/admin/occupancy", icon: Shield },
  { label: "Reports & exports", href: "/admin/reports", icon: Download },
  { label: "Audit logs", href: "/admin/audit", icon: FileText },
] as const;

export function StaffShell({
  title,
  subtitle,
  children,
  action,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  action?: ReactNode;
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

      {/* Drawer Overlay */}
      {open && (
        <button
          className="fixed inset-0 z-40 bg-overlay lg:hidden cursor-default"
          aria-label="Close navigation"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Staff Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-sidebar text-sidebar-foreground transition-transform duration-300 lg:sticky lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between p-7">
          <div>
            <Brand />
            <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-primary/20 text-primary-foreground text-[10px] font-bold uppercase tracking-widest">
              Staff Console
            </div>
          </div>
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

        <nav className="mt-6 flex-1 space-y-1 px-5" aria-label="Admin Navigation">
          {adminNav.map(({ label, href, icon: Icon }) => {
            const active = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-md px-4 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                    : "text-sidebar-muted hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
                )}
              >
                <Icon className="size-4 shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="m-5 border-t border-sidebar-border pt-4 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <Button asChild size="sm" variant="secondary" className="w-full text-xs">
              <Link href="/register">Registration Form</Link>
            </Button>
            <Button asChild size="sm" className="w-full text-xs bg-primary hover:bg-primary/90">
              <Link href="/security">Gate Scanner</Link>
            </Button>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={async () => {
              await fetch("/api/auth/logout", { method: "POST" });
              window.location.href = "/admin/login";
            }}
            className="w-full text-xs text-sidebar-muted hover:text-white hover:bg-sidebar-accent"
          >
            Sign Out (Admin)
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="min-w-0 flex-1">
        <header className="flex flex-col gap-4 border-b border-border bg-card/40 px-6 py-6 sm:px-10 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="section-label text-primary">Kaltarang 2026 · Administration</p>
            <h1 className="mt-1 font-display text-3xl sm:text-4xl">{title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          </div>
          {action && <div className="flex items-center gap-3">{action}</div>}
        </header>

        <div className="p-6 sm:p-8 lg:p-10">{children}</div>
      </main>
    </div>
  );
}
