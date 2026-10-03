"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Download, Lock, QrCode, RefreshCw, ShieldCheck } from "lucide-react";
import { AuroraShell, PageHeader, StatusPill } from "@/components/aurora-shell";
import { Button } from "@/components/ui/button";
import { generateQrDataUrl } from "@/lib/qr/generator";

export default function AccessPassPage() {
  const [loading, setLoading] = useState(true);
  const [participant, setParticipant] = useState<any>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const meRes = await fetch("/api/auth/me");
        const meData = await meRes.json();

        if (meData.participant) {
          setParticipant(meData.participant);
          if (meData.participant.status === "APPROVED") {
            // Generate QR representation
            const qr = await generateQrDataUrl(
              `https://security.kaltarang.in/verify?token=demo-approved-qr-token-secret-123456`
            );
            setQrDataUrl(qr);
          }
        } else {
          // Demo fallback
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
          const qr = await generateQrDataUrl(
            `https://security.kaltarang.in/verify?token=demo-approved-qr-token-secret-123456`
          );
          setQrDataUrl(qr);
        }
      } catch (e) {
        console.error("Pass load error:", e);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const isApproved = participant?.status === "APPROVED";

  return (
    <AuroraShell
      userName={participant?.full_name || "Participant"}
      registrationId={participant?.registration_id || undefined}
    >
      <PageHeader
        eyebrow="Campus Credential"
        title="Official Access Pass"
        description="Present this digital credential to authorized security operators at RGIPT entry and exit gates."
      />

      <div className="mx-auto max-w-4xl p-5 sm:p-8 lg:p-12">
        <div className="grid gap-8 lg:grid-cols-[380px_1fr]">
          {/* Digital Pass Card */}
          <div className="surface p-3 shadow-xl">
            <div className="pass-panel flex flex-col p-6 min-h-[460px] justify-between">
              {/* Header */}
              <div className="flex items-start justify-between border-b border-pass-border pb-4">
                <div>
                  <span className="font-display text-2xl tracking-tight leading-none block">Aurora</span>
                  <p className="text-[10px] uppercase font-bold tracking-[0.18em] text-pass-muted mt-1">
                    Kaltarang 2026 · RGIPT
                  </p>
                </div>
                <StatusPill tone={isApproved ? "success" : "pending"}>
                  {isApproved ? "VERIFIED" : "PENDING"}
                </StatusPill>
              </div>

              {/* QR Code Body */}
              <div className="my-auto text-center py-6">
                {isApproved && qrDataUrl ? (
                  <div className="inline-block bg-white p-3.5 rounded-xl shadow-lg ring-4 ring-black/10">
                    <img
                      src={qrDataUrl}
                      alt="Kaltarang 2026 QR Pass"
                      className="size-52 object-contain"
                    />
                  </div>
                ) : (
                  <div className="size-52 mx-auto rounded-xl border-2 border-dashed border-pass-border grid place-items-center bg-black/10">
                    <Lock className="size-12 text-pass-muted" />
                    <p className="text-xs uppercase tracking-wider text-pass-muted">
                      Locked until approval
                    </p>
                  </div>
                )}
                <p className="mt-3 font-mono text-xs tracking-widest text-pass-muted">
                  {participant?.registration_id || "KLT26-PENDING"}
                </p>
              </div>

              {/* Participant Profile Footer */}
              <div className="border-t border-pass-border pt-4 flex items-center gap-3">
                <div className="size-12 rounded-lg bg-white/10 ring-1 ring-white/20 grid place-items-center font-display text-xl font-bold">
                  {participant?.full_name?.charAt(0) || "P"}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-display text-2xl truncate">{participant?.full_name}</h3>
                  <p className="text-xs text-pass-muted truncate">{participant?.college}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Details & Gate Guidance */}
          <section className="space-y-6 py-2">
            <div className="surface p-6">
              <h2 className="section-label text-primary">Identity Details</h2>
              <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-muted-foreground text-xs">Registration ID</dt>
                  <dd className="font-mono font-bold text-base mt-0.5">
                    {participant?.registration_id || "Under Verification"}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground text-xs">Campus Access State</dt>
                  <dd
                    className={`font-semibold uppercase tracking-wider text-base mt-0.5 ${
                      participant?.campus_status === "INSIDE" ? "text-success" : "text-primary"
                    }`}
                  >
                    {participant?.campus_status || "OUTSIDE"}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground text-xs">Institution</dt>
                  <dd className="font-medium mt-0.5">{participant?.college || "—"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground text-xs">Course / Year</dt>
                  <dd className="font-medium mt-0.5">
                    {participant?.course} ({participant?.year_of_study})
                  </dd>
                </div>
              </dl>
            </div>

            <div className="surface p-6 border-l-4 border-l-primary">
              <h3 className="font-semibold text-sm">Gate Security Instructions</h3>
              <ul className="mt-3 space-y-2 text-xs leading-5 text-muted-foreground">
                <li>• Display this QR pass directly on your mobile screen at full brightness.</li>
                <li>• Authorized campus gates: <strong>Main Gate</strong>, <strong>Hostel Gate</strong>, <strong>Arena Gate</strong>.</li>
                <li>• Gate security operators will visually match you with your registered identity photograph.</li>
                <li>• This credential is strictly non-transferable. Duplication or sharing is recorded and blocked.</li>
              </ul>
            </div>
          </section>
        </div>
      </div>
    </AuroraShell>
  );
}
