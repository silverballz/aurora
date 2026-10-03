"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, FileText, ShieldCheck, Upload } from "lucide-react";
import { AuroraShell, PageHeader, StatusPill } from "@/components/aurora-shell";
import { Button } from "@/components/ui/button";

export default function ParticipantDocumentsPage() {
  const [participant, setParticipant] = useState<any>(null);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      if (data.participant) setParticipant(data.participant);
    }
    load();
  }, []);

  const isApproved = participant?.status === "APPROVED";
  const isUnderReview = participant?.status === "UNDER_REVIEW";

  const docItems = [
    {
      title: "Government Identification (Aadhaar)",
      desc: "Mandatory official identification verified by fest administration.",
      status: isApproved ? "Approved" : isUnderReview ? "Under Review" : "Pending Upload",
      tone: isApproved ? "success" : "pending",
    },
    {
      title: "Institutional Student ID",
      desc: "Valid college identity card proving student status.",
      status: isApproved ? "Approved" : isUnderReview ? "Under Review" : "Pending Upload",
      tone: isApproved ? "success" : "pending",
    },
    {
      title: "Payment Fee Receipt",
      desc: "Registration participation payment verified by accounts team.",
      status: "Verified",
      tone: "success",
    },
  ];

  return (
    <AuroraShell userName={participant?.full_name || "Participant"}>
      <PageHeader
        eyebrow="Verification Documents"
        title="Identity Records"
        description="Uploaded documents are stored in private encrypted storage and accessible strictly to authorized verifiers."
      />

      <div className="mx-auto max-w-5xl space-y-5 p-5 sm:p-8 lg:p-12">
        {docItems.map((doc, idx) => (
          <div
            key={doc.title}
            className="surface flex flex-col gap-5 p-6 sm:flex-row sm:items-center justify-between"
          >
            <div className="flex items-start gap-4">
              <div className="grid size-12 place-items-center rounded-lg bg-soft text-primary shrink-0">
                {doc.tone === "success" ? <Check className="size-6" /> : <FileText className="size-6" />}
              </div>
              <div>
                <h3 className="font-semibold text-base">{doc.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{doc.desc}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <StatusPill tone={doc.tone as any}>{doc.status}</StatusPill>
              {!isApproved && !isUnderReview && (
                <Button asChild variant="outline" size="sm">
                  <Link href="/portal/registration">
                    <Upload className="size-3.5 mr-1.5" /> Upload
                  </Link>
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </AuroraShell>
  );
}
