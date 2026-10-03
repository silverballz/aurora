"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  Check,
  ChevronRight,
  Clock,
  FileCheck2,
  LockKeyhole,
  QrCode,
  ShieldAlert,
  ShieldCheck,
  Upload,
} from "lucide-react";
import { AuroraShell, PageHeader, StatusPill } from "@/components/aurora-shell";
import { Button } from "@/components/ui/button";

export default function ParticipantDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [participant, setParticipant] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const meRes = await fetch("/api/auth/me");
        const meData = await meRes.json();

        if (meData.participant) {
          setParticipant(meData.participant);
        } else {
          // Fallback to demo participant
          setParticipant({
            full_name: "Arjun Mehta",
            registration_id: "KLT26-000421",
            status: "APPROVED",
            campus_status: "OUTSIDE",
            college: "NIT Bhopal",
            course: "B.Tech Computer Science",
            year_of_study: "3rd Year",
            selfie_path: "/assets/participant-avatar.jpg",
          });
        }

        const evtRes = await fetch("/api/events");
        const evtData = await evtRes.json();
        if (evtData.events) {
          setEvents(evtData.events);
        }
      } catch (err) {
        console.error("Dashboard data load error:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const isApproved = participant?.status === "APPROVED";
  const isUnderReview = participant?.status === "UNDER_REVIEW";
  const isCorrection = participant?.status === "CORRECTION";
  const isInProgress = participant?.status === "IN_PROGRESS" || participant?.status === "INVITED";

  const completionPercent = isApproved ? 100 : isUnderReview ? 90 : isCorrection ? 75 : 40;

  return (
    <AuroraShell
      userName={participant?.full_name || "Participant"}
      registrationId={participant?.registration_id || undefined}
    >
      <PageHeader
        eyebrow="Participant portal"
        title={`Welcome, ${participant?.full_name?.split(" ")[0] || "Participant"}.`}
        description={
          isApproved
            ? "Your identity and documents are verified. Present your QR pass at campus gates for admission."
            : isUnderReview
            ? "Your registration documents have been submitted and are under review by fest administration."
            : isCorrection
            ? "Action required: Verification desk requested an update to your documents."
            : "Complete all verification steps before arriving at RGIPT to receive your digital gate pass."
        }
        action={
          <div className="min-w-52">
            <div className="flex items-end justify-between">
              <span className="section-label">Profile completion</span>
              <span className="font-display text-3xl">{completionPercent}%</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-soft">
              <div
                className="h-full bg-primary transition-all duration-500"
                style={{ width: `${completionPercent}%` }}
              />
            </div>
          </div>
        }
      />

      <div className="mx-auto grid max-w-6xl gap-8 p-5 sm:p-8 lg:grid-cols-[1.45fr_.85fr] lg:p-12">
        <div className="space-y-10">
          {/* Correction Notice Alert if needed */}
          {isCorrection && (
            <div className="surface p-6 border-warning bg-warning/5">
              <div className="flex items-start gap-4">
                <ShieldAlert className="size-6 text-warning shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-warning">Correction Requested</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {participant.correction_reason || "Please update your uploaded documents or profile."}
                  </p>
                  <Button asChild size="sm" className="mt-4 bg-primary hover:bg-primary/90">
                    <Link href="/portal/registration">Update Registration &rarr;</Link>
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Action Prompt */}
          <section>
            <div className="mb-5 flex items-center justify-between">
              <h2 className="section-label text-primary">Registration status</h2>
              <StatusPill tone={isApproved ? "success" : isCorrection ? "danger" : "pending"}>
                {participant?.status?.replace("_", " ") || "IN PROGRESS"}
              </StatusPill>
            </div>

            <div className="surface flex flex-col gap-5 p-6 sm:flex-row sm:p-8">
              <div className="grid size-12 shrink-0 place-items-center rounded-full border-2 border-primary bg-background font-display text-xl text-primary">
                {isApproved ? <Check className="size-6" /> : "!"}
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold">
                  {isApproved
                    ? "Official QR Pass Activated"
                    : isUnderReview
                    ? "Verification in progress"
                    : "Complete identity verification"}
                </h3>
                <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
                  {isApproved
                    ? "Your registration is confirmed. You can now present your active QR credential at the Main Gate, Hostel Gate, or Arena entrance."
                    : isUnderReview
                    ? "Your submitted government ID, student card, and registered selfie are currently being inspected by Kaltarang staff."
                    : "Upload a valid government Aadhaar card, student ID, and live front-facing photo so campus security can verify your entry."}
                </p>
                <div className="mt-6 flex gap-3">
                  {isApproved ? (
                    <Button asChild className="bg-primary hover:bg-primary/90">
                      <Link href="/portal/pass">
                        View Access Pass <ChevronRight className="size-4 ml-1" />
                      </Link>
                    </Button>
                  ) : (
                    <Button asChild className="bg-primary hover:bg-primary/90">
                      <Link href="/portal/registration">
                        {isUnderReview ? "Review Submission" : "Proceed to Registration"}{" "}
                        <ChevronRight className="size-4 ml-1" />
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Schedule */}
          <section>
            <h2 className="section-label mb-5">Kaltarang 2026 Schedule</h2>
            <div className="space-y-3">
              {events.slice(0, 3).map((event) => (
                <div key={event.id} className="event-row">
                  <div className="w-14 text-center shrink-0">
                    <span className="block text-[10px] font-bold text-muted-foreground">OCT</span>
                    <span className="font-display text-2xl">
                      {event.date ? new Date(event.date).getDate() : "14"}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-semibold">{event.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {event.venue} · {event.start_time}
                    </p>
                  </div>
                  <StatusPill tone="success">Active</StatusPill>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right Sidebar: Pass Card & Checklist */}
        <div className="space-y-6">
          {/* Campus Pass Card */}
          <div className="surface p-2">
            <div className="pass-panel flex min-h-[360px] flex-col p-6 justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <span className="section-label text-pass-muted">Kaltarang 2026 Pass</span>
                  <p className="text-xs text-pass-muted mt-0.5">RGIPT Campus Gate</p>
                </div>
                <span
                  className={`size-2.5 rounded-full ${
                    isApproved ? "bg-success shadow-[0_0_8px_rgba(34,197,94,0.6)]" : "bg-warning"
                  }`}
                />
              </div>

              <div className="my-auto text-center py-4">
                {isApproved ? (
                  <Link href="/portal/pass" className="inline-block group">
                    <div className="mx-auto size-32 bg-white rounded-lg p-2.5 shadow-md flex items-center justify-center transition-transform group-hover:scale-105">
                      <QrCode className="size-24 text-black" />
                    </div>
                    <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-pass-muted group-hover:text-white transition-colors">
                      Tap to open live QR
                    </p>
                  </Link>
                ) : (
                  <div>
                    <div className="mx-auto grid size-28 place-items-center border border-dashed border-pass-border rounded-lg">
                      <LockKeyhole className="size-7 text-pass-muted" />
                    </div>
                    <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-pass-muted">
                      {isUnderReview ? "Verification pending" : "Pass locked"}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex items-end gap-3 border-t border-pass-border pt-4">
                <div className="size-12 rounded-md bg-white/10 ring-1 ring-white/20 grid place-items-center text-lg font-bold font-display">
                  {participant?.full_name?.charAt(0) || "P"}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-display text-2xl truncate">{participant?.full_name}</h3>
                  <p className="text-[10px] uppercase tracking-[0.16em] text-pass-muted">
                    {participant?.registration_id || "ID PENDING VERIFICATION"}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Current Campus State:</span>
                <span
                  className={`font-semibold uppercase tracking-wider ${
                    participant?.campus_status === "INSIDE" ? "text-success" : "text-primary"
                  }`}
                >
                  {participant?.campus_status || "OUTSIDE"}
                </span>
              </div>
            </div>
          </div>

          {/* Document Checklist */}
          <div className="border border-soft bg-soft/20 p-6 rounded-lg">
            <h2 className="section-label text-primary">Verification Checklist</h2>
            <div className="mt-5 space-y-3.5 text-sm">
              <div className="flex items-center justify-between">
                <span>Invitation & Payment</span>
                <span className="font-semibold text-success flex items-center gap-1">
                  <Check className="size-3.5" /> Verified
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Email Authentication</span>
                <span className="font-semibold text-success flex items-center gap-1">
                  <Check className="size-3.5" /> Verified
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Live Photograph</span>
                <span
                  className={`font-semibold flex items-center gap-1 ${
                    participant?.selfie_path ? "text-success" : "text-primary"
                  }`}
                >
                  {participant?.selfie_path ? <Check className="size-3.5" /> : null}
                  {participant?.selfie_path ? "Captured" : "Pending"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Government ID (Aadhaar)</span>
                <span
                  className={`font-semibold ${
                    isApproved ? "text-success" : isUnderReview ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {isApproved ? "Approved" : isUnderReview ? "Under Review" : "Pending"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Student ID Card</span>
                <span
                  className={`font-semibold ${
                    isApproved ? "text-success" : isUnderReview ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {isApproved ? "Approved" : isUnderReview ? "Under Review" : "Pending"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuroraShell>
  );
}
