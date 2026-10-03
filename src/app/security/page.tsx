"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  Camera,
  Check,
  CheckCircle2,
  KeyRound,
  LogIn,
  LogOut,
  QrCode,
  RefreshCw,
  Shield,
  ShieldAlert,
  UserCheck,
  X,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function SecurityGatePage() {
  const [selectedGate, setSelectedGate] = useState("gate-main");
  const [operatorCode] = useState("SEC-014 (Operator 04)");
  const [occupancy, setOccupancy] = useState<any>(null);

  // Scanner State
  const [scanning, setScanning] = useState(false);
  const [manualToken, setManualToken] = useState("");
  const [evaluating, setEvaluating] = useState(false);

  // Active Scanned Participant
  const [scannedResult, setScannedResult] = useState<any>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Supervisor Override Modal
  const [overrideModalOpen, setOverrideModalOpen] = useState(false);
  const [overrideAction, setOverrideAction] = useState<"ENTRY" | "EXIT">("ENTRY");
  const [overridePin, setOverridePin] = useState("");
  const [overrideReason, setOverrideReason] = useState("");

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/admin/occupancy");
      const data = await res.json();
      setOccupancy(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 6000);
    return () => clearInterval(interval);
  }, []);

  // WebRTC Camera for QR Scanner
  const startCamera = async () => {
    try {
      setScanError(null);
      setScannedResult(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 640 }, height: { ideal: 480 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setScanning(true);
    } catch {
      toast.error("Camera access failed. You can use manual QR pass validation below.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setScanning(false);
  };

  // Evaluate scanned QR token
  const evaluateToken = async (tokenString: string) => {
    if (!tokenString) return;
    try {
      setEvaluating(true);
      setScanError(null);
      stopCamera();

      const res = await fetch("/api/security/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: tokenString.trim(), gate_id: selectedGate }),
      });
      const data = await res.json();

      if (!res.ok || !data.valid) {
        setScanError(data.message || "Invalid or unverified QR pass.");
        setScannedResult(null);
      } else {
        setScannedResult(data);
        toast.success(`Verified: ${data.participant.full_name}`);
      }
    } catch {
      setScanError("Network error validating pass. Please reconnect.");
    } finally {
      setEvaluating(false);
    }
  };

  // ALLOW ENTRY
  const handleAllowEntry = async () => {
    if (!scannedResult?.participant) return;
    try {
      setActionLoading(true);
      const res = await fetch("/api/security/entry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participant_id: scannedResult.participant.id,
          gate_id: selectedGate,
          operator_id: "usr-sec-1",
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Entry blocked!");
        if (data.blocked) {
          setScanError(data.message);
          setScannedResult((prev: any) => ({
            ...prev,
            participant: { ...prev.participant, campus_status: "INSIDE" },
          }));
        }
      } else {
        toast.success(data.message);
        setScannedResult((prev: any) => ({
          ...prev,
          participant: { ...prev.participant, campus_status: "INSIDE" },
        }));
        fetchStats();
      }
    } catch {
      toast.error("Network error executing entry.");
    } finally {
      setActionLoading(false);
    }
  };

  // ALLOW EXIT
  const handleAllowExit = async () => {
    if (!scannedResult?.participant) return;
    try {
      setActionLoading(true);
      const res = await fetch("/api/security/exit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participant_id: scannedResult.participant.id,
          gate_id: selectedGate,
          operator_id: "usr-sec-1",
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Exit blocked!");
        if (data.blocked) {
          setScanError(data.message);
        }
      } else {
        toast.success(data.message);
        setScannedResult((prev: any) => ({
          ...prev,
          participant: { ...prev.participant, campus_status: "OUTSIDE" },
        }));
        fetchStats();
      }
    } catch {
      toast.error("Network error executing exit.");
    } finally {
      setActionLoading(false);
    }
  };

  // SUPERVISOR OVERRIDE SUBMIT
  const handleOverrideSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scannedResult?.participant || !overridePin || !overrideReason) return;

    try {
      setActionLoading(true);
      const res = await fetch("/api/security/override", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participant_id: scannedResult.participant.id,
          action: overrideAction,
          reason: overrideReason,
          supervisor_pin: overridePin,
          gate_id: selectedGate,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Override authorization rejected.");
      } else {
        toast.success(data.message);
        setOverrideModalOpen(false);
        setOverridePin("");
        setOverrideReason("");
        setScannedResult((prev: any) => ({
          ...prev,
          participant: { ...prev.participant, campus_status: data.campus_status },
        }));
        setScanError(null);
        fetchStats();
      }
    } catch {
      toast.error("Override network error.");
    } finally {
      setActionLoading(false);
    }
  };

  const isInside = scannedResult?.participant?.campus_status === "INSIDE";

  return (
    <div className="min-h-screen bg-security text-security-foreground flex flex-col">
      {/* High-Contrast Gate Header */}
      <header className="flex items-center justify-between border-b border-security-border px-5 py-4 sm:px-8 bg-security-panel">
        <div className="flex items-center gap-3">
          <img src="/kaltarang-logo.svg" alt="Kaltarang Logo" className="h-10 w-8 object-contain" />
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight">Aurora Gate Access</h1>
            <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-security-muted">
              {operatorCode} · Kaltarang 2026
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedGate}
            onChange={(e) => setSelectedGate(e.target.value)}
            className="bg-security border border-security-border text-xs rounded px-2.5 py-1.5 font-semibold text-security-foreground outline-none cursor-pointer"
          >
            <option value="gate-main">MAIN GATE (North / Admin)</option>
            <option value="gate-hostel">HOSTEL GATE (South)</option>
            <option value="gate-arena">OAT / ARENA GATE</option>
            <option value="gate-back">BACK GATE (East Service)</option>
          </select>
          <span className="hidden sm:inline-block px-2.5 py-1 rounded-full bg-success/20 text-success text-xs font-bold uppercase tracking-wider">
            ● Online
          </span>
          <Button asChild size="sm" variant="ghost" className="text-security-muted hover:text-white text-xs">
            <Link href="/admin">Staff Dashboard</Link>
          </Button>
        </div>
      </header>

      {/* Main Console Split */}
      <main className="flex-1 mx-auto grid max-w-6xl w-full gap-8 p-5 sm:p-8 lg:grid-cols-[1.4fr_1fr] lg:py-10">
        {/* Left Column: Scanner or Verified Participant View */}
        <section className="space-y-6">
          {/* SCANNER VIEW */}
          {!scannedResult && (
            <div className="surface bg-security-panel border-security-border p-6 sm:p-8">
              <p className="section-label text-security-muted">Gate Verification</p>
              <h2 className="mt-2 font-display text-4xl sm:text-5xl text-white">Scan. Identify. Verify.</h2>
              <p className="mt-2 text-xs text-security-muted">
                Point the device camera at the participant's QR code pass.
              </p>

              {/* Camera Frame */}
              <div className="mt-6 aspect-[16/10] relative rounded-lg overflow-hidden border border-security-border bg-black flex items-center justify-center">
                {scanning ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="size-full object-cover"
                  />
                ) : (
                  <div className="text-center p-6">
                    <QrCode className="size-20 text-security-muted mx-auto mb-3" />
                    <p className="text-sm font-semibold text-white">Camera Scanner Idle</p>
                    <p className="text-xs text-security-muted mt-1">Tap below to activate camera scanner</p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-5 space-y-3">
                {scanning ? (
                  <Button
                    size="lg"
                    onClick={stopCamera}
                    variant="outline"
                    className="w-full h-14 text-base font-semibold border-security-border text-white hover:bg-white/10"
                  >
                    Stop Camera
                  </Button>
                ) : (
                  <Button
                    size="lg"
                    onClick={startCamera}
                    className="w-full h-14 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"
                  >
                    <Camera className="size-5 mr-2" /> Start QR Scanner
                  </Button>
                )}
              </div>

              {/* Demo / Manual Token Evaluation Input */}
              <div className="mt-8 pt-6 border-t border-security-border">
                <p className="text-xs text-security-muted mb-2 font-semibold uppercase tracking-wider">
                  Test / Manual QR Token Validation:
                </p>
                <div className="flex gap-2">
                  <Input
                    value={manualToken}
                    onChange={(e) => setManualToken(e.target.value)}
                    placeholder="Paste QR secret or use demo: demo-approved-qr-token-secret-123456"
                    className="text-xs bg-security border-security-border text-white font-mono"
                  />
                  <Button
                    size="sm"
                    disabled={evaluating}
                    onClick={() => evaluateToken(manualToken || "demo-approved-qr-token-secret-123456")}
                    className="bg-primary hover:bg-primary/90"
                  >
                    {evaluating ? "Checking..." : "Verify"}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* SCAN ERROR CARD */}
          {scanError && (
            <div className="surface bg-destructive/15 border-destructive p-6 rounded-lg text-destructive-foreground">
              <div className="flex items-start gap-3">
                <ShieldAlert className="size-6 text-destructive shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-display text-2xl font-bold text-destructive">Admission Blocked</h3>
                  <p className="text-sm mt-1 leading-relaxed text-destructive">{scanError}</p>
                  <div className="mt-4 flex gap-3">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setScanError(null);
                        setScannedResult(null);
                      }}
                      className="border-destructive/40 text-xs"
                    >
                      Clear & Scan Next
                    </Button>
                    {scannedResult?.participant && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setOverrideModalOpen(true)}
                        className="text-xs font-semibold"
                      >
                        <KeyRound className="size-3.5 mr-1" /> Supervisor Override
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VERIFIED PARTICIPANT EVALUATION SCREEN */}
          {scannedResult && (
            <div className="surface bg-security-panel border-security-border p-6 sm:p-8 space-y-6 animate-in fade-in duration-200">
              {/* Top Status */}
              <div className="flex items-center justify-between border-b border-security-border pb-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-5 text-success" />
                  <span className="font-semibold text-sm tracking-wider uppercase text-success">
                    Verified Participant
                  </span>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                    isInside ? "bg-success/20 text-success" : "bg-primary/20 text-primary"
                  }`}
                >
                  Current State: {scannedResult.participant.campus_status}
                </span>
              </div>

              {/* Selfie Visual Inspection (Crucial Section 37) */}
              <div className="grid sm:grid-cols-[180px_1fr] gap-6 items-center bg-black/40 p-5 rounded-lg border border-security-border">
                <div className="size-44 mx-auto rounded-lg overflow-hidden border-2 border-primary shadow-xl bg-card">
                  <img
                    src={scannedResult.participant.selfie_path || "/assets/participant-avatar.jpg"}
                    alt={scannedResult.participant.full_name}
                    className="size-full object-cover"
                  />
                </div>

                <div className="space-y-2 text-center sm:text-left">
                  <p className="text-[11px] font-bold text-security-muted uppercase tracking-widest">
                    Visually Match Attendee With Photo
                  </p>
                  <h2 className="font-display text-4xl text-white font-bold">
                    {scannedResult.participant.full_name}
                  </h2>
                  <p className="text-sm font-semibold text-primary">
                    {scannedResult.participant.college || "External Institution"}
                  </p>
                  <p className="text-xs text-security-muted">
                    {scannedResult.participant.course} ({scannedResult.participant.year_of_study})
                  </p>
                  <p className="font-mono text-xs text-white font-bold pt-1">
                    Registration ID: {scannedResult.participant.registration_id}
                  </p>
                </div>
              </div>

              {/* Data Minimization Note */}
              <div className="text-[11px] text-security-muted bg-white/5 p-3 rounded flex items-center justify-between">
                <span>Data minimization active: Aadhaar, full address, and payment records hidden.</span>
                <span className="text-success font-semibold">✓ Verified</span>
              </div>

              {/* BIG HIGH-CONTRAST ACTION BUTTONS */}
              <div className="grid sm:grid-cols-2 gap-4 pt-2">
                <Button
                  size="lg"
                  disabled={actionLoading || isInside}
                  onClick={handleAllowEntry}
                  className={`h-16 text-lg font-bold shadow-xl ${
                    isInside
                      ? "opacity-40 cursor-not-allowed bg-muted text-muted-foreground"
                      : "bg-success hover:bg-success/90 text-white"
                  }`}
                >
                  <LogIn className="size-6 mr-2" /> ALLOW ENTRY
                </Button>

                <Button
                  size="lg"
                  disabled={actionLoading || !isInside}
                  onClick={handleAllowExit}
                  className={`h-16 text-lg font-bold shadow-xl ${
                    !isInside
                      ? "opacity-40 cursor-not-allowed bg-muted text-muted-foreground"
                      : "bg-primary hover:bg-primary/90 text-white"
                  }`}
                >
                  <LogOut className="size-6 mr-2" /> ALLOW EXIT
                </Button>
              </div>

              {/* Clear / Next Button */}
              <div className="flex justify-between items-center pt-4 border-t border-security-border">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setScannedResult(null);
                    setScanError(null);
                  }}
                  className="border-security-border text-xs"
                >
                  Scan Next Participant
                </Button>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setOverrideModalOpen(true)}
                  className="text-security-muted hover:text-white text-xs"
                >
                  <KeyRound className="size-3.5 mr-1" /> Supervisor Override
                </Button>
              </div>
            </div>
          )}
        </section>

        {/* Right Column: Live Gate Status & Recent Movement */}
        <aside className="space-y-6">
          <div className="surface bg-security-panel border-security-border p-6 rounded-lg">
            <p className="section-label text-security-muted">Campus Occupancy</p>
            <div className="mt-4 flex items-end justify-between">
              <strong className="font-display text-6xl text-white">
                {occupancy?.currentlyInside ?? "—"}
              </strong>
              <span className="pb-2 text-xs text-security-muted uppercase tracking-wider font-semibold">
                verified attendees inside
              </span>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="gate-stat">
                <LogIn className="size-4 text-success" />
                <span className="text-white font-mono">+{occupancy?.entriesToday ?? "—"} entries</span>
              </div>
              <div className="gate-stat">
                <LogOut className="size-4 text-primary" />
                <span className="text-white font-mono">-{occupancy?.exitsToday ?? "—"} exits</span>
              </div>
            </div>
          </div>

          <div className="surface bg-security-panel border-security-border p-6 rounded-lg">
            <h3 className="section-label text-security-muted mb-4">Security Protocol</h3>
            <ul className="space-y-2.5 text-xs text-security-muted leading-relaxed">
              <li>1. Verify the front-facing registered photograph matches the person standing at the gate.</li>
              <li>2. Check that the participant status indicates <strong>VERIFIED</strong>.</li>
              <li>3. If participant is already INSIDE, system will strictly block duplicate entry.</li>
              <li>4. For scanner or pass issues, notify Gate Supervisor for manual PIN override.</li>
            </ul>
          </div>
        </aside>
      </main>

      {/* Supervisor Manual Override Modal */}
      {overrideModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="surface bg-security-panel border-warning max-w-md w-full p-6 text-white space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-security-border pb-3">
              <h3 className="font-display text-2xl font-bold flex items-center gap-2 text-warning">
                <AlertTriangle className="size-6 text-warning" /> Supervisor Manual Override
              </h3>
              <Button size="icon" variant="ghost" onClick={() => setOverrideModalOpen(false)}>
                <X className="size-5" />
              </Button>
            </div>

            <p className="text-xs text-security-muted leading-relaxed">
              This action bypasses the automated state machine and creates an auditable administrative event.
            </p>

            <form onSubmit={handleOverrideSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-security-muted block mb-1">Target Action</label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={overrideAction === "ENTRY" ? "default" : "outline"}
                    onClick={() => setOverrideAction("ENTRY")}
                    className={overrideAction === "ENTRY" ? "bg-success text-white" : "border-security-border"}
                  >
                    Force ENTRY
                  </Button>
                  <Button
                    type="button"
                    variant={overrideAction === "EXIT" ? "default" : "outline"}
                    onClick={() => setOverrideAction("EXIT")}
                    className={overrideAction === "EXIT" ? "bg-primary text-white" : "border-security-border"}
                  >
                    Force EXIT
                  </Button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-security-muted block mb-1">
                  Supervisor PIN (Default: 2026) *
                </label>
                <Input
                  type="password"
                  value={overridePin}
                  onChange={(e) => setOverridePin(e.target.value)}
                  placeholder="Enter 4-digit PIN"
                  className="bg-security border-security-border text-white text-center font-mono text-xl h-11"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-security-muted block mb-1">
                  Reason for Override *
                </label>
                <Input
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  placeholder="e.g. Scanner malfunction / Verified manually by supervisor"
                  className="bg-security border-security-border text-white text-xs"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-security-border">
                <Button type="button" variant="outline" onClick={() => setOverrideModalOpen(false)} className="border-security-border">
                  Cancel
                </Button>
                <Button type="submit" disabled={actionLoading} className="bg-warning text-warning-foreground font-semibold">
                  Confirm Manual Override
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
