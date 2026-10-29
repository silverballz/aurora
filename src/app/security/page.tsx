"use client";

import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  KeyRound,
  LogIn,
  LogOut,
  QrCode,
  RefreshCw,
  Search,
  ShieldAlert,
  Upload,
  UserCheck,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function SecurityGatePage() {
  const [selectedGate, setSelectedGate] = useState("gate-main");
  const [operatorCode, setOperatorCode] = useState("SEC-014 (Gate Guard)");
  const [occupancy, setOccupancy] = useState<any>(null);
  const [approvedList, setApprovedList] = useState<any[]>([]);
  const [rosterSearch, setRosterSearch] = useState("");

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

  const html5QrCodeRef = useRef<any>(null);
  const scanLockRef = useRef(false);

  const fetchStatsAndRoster = async () => {
    try {
      const [occRes, rosterRes] = await Promise.all([
        fetch("/api/admin/occupancy"),
        fetch("/api/admin/pending?status=APPROVED"),
      ]);
      if (occRes.ok) {
        setOccupancy(await occRes.json());
      }
      if (rosterRes.ok) {
        const rData = await rosterRes.json();
        setApprovedList(rData.participants || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    try {
      const savedGate = localStorage.getItem("aurora_gate_id");
      const savedOp = localStorage.getItem("aurora_operator_code");
      if (savedGate) setSelectedGate(savedGate);
      if (savedOp) setOperatorCode(`${savedOp} (Gate Guard)`);
    } catch {}

    fetchStatsAndRoster();
    const interval = setInterval(fetchStatsAndRoster, 15000);
    return () => {
      clearInterval(interval);
      stopCamera();
    };
  }, []);

  const stopCamera = async () => {
    try {
      if (html5QrCodeRef.current) {
        const scanner = html5QrCodeRef.current;
        html5QrCodeRef.current = null;
        try {
          if (scanner.isScanning) {
            await scanner.stop();
          }
        } catch {}
        try {
          scanner.clear();
        } catch {}
      }
    } catch {}
    setScanning(false);
  };

  // Real Live QR Scanner using html5-qrcode with automatic camera fallback
  const startCamera = async () => {
    try {
      setScanError(null);
      setScannedResult(null);
      scanLockRef.current = false;
      setScanning(true);

      const { Html5Qrcode } = await import("html5-qrcode");
      setTimeout(async () => {
        const container = document.getElementById("aurora-qr-reader");
        if (!container) {
          setScanning(false);
          return;
        }

        const scanner = new Html5Qrcode("aurora-qr-reader");
        html5QrCodeRef.current = scanner;

        const onScanSuccess = async (decodedText: string) => {
          if (scanLockRef.current || !decodedText) return;
          scanLockRef.current = true;
          await stopCamera();
          await evaluateToken(decodedText);
        };

        const config = { fps: 12, qrbox: { width: 250, height: 250 } };

        try {
          await scanner.start({ facingMode: "environment" }, config, onScanSuccess, () => {});
        } catch {
          try {
            // Fallback for laptops/front webcams
            await scanner.start({ facingMode: "user" }, config, onScanSuccess, () => {});
          } catch {
            try {
              const cams = await Html5Qrcode.getCameras();
              if (cams && cams.length > 0) {
                await scanner.start(cams[0].id, config, onScanSuccess, () => {});
              } else {
                throw new Error("No camera found");
              }
            } catch {
              toast.error(
                "Camera unavailable or permission denied. You can upload a QR image or use the Approved Roster below."
              );
              setScanning(false);
            }
          }
        }
      }, 150);
    } catch {
      toast.error("Failed to initialize scanner.");
      setScanning(false);
    }
  };

  const handleScanImageFile = async (file: File) => {
    try {
      setEvaluating(true);
      setScanError(null);

      // 1. Try native BarcodeDetector first if supported (instant on Chrome/Android/macOS)
      if (typeof window !== "undefined" && "BarcodeDetector" in window) {
        try {
          const BarcodeDetectorClass = (window as any).BarcodeDetector;
          const detector = new BarcodeDetectorClass({ formats: ["qr_code"] });
          const bitmap = await createImageBitmap(file);
          const barcodes = await detector.detect(bitmap);
          if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
            await evaluateToken(barcodes[0].rawValue);
            return;
          }
        } catch {}
      }

      // 2. Fallback to html5-qrcode inside offscreen sized container
      const { Html5Qrcode } = await import("html5-qrcode");
      const tempScanner = new Html5Qrcode("aurora-qr-file-reader");
      const decodedText = await tempScanner.scanFile(file, false);
      try {
        tempScanner.clear();
      } catch {}
      await evaluateToken(decodedText);
    } catch {
      toast.error(
        "Could not read QR from that image. You can also enter the Registration ID (e.g. 425) or tap the participant in the Approved Roster below!"
      );
      setEvaluating(false);
    }
  };

  // Evaluate scanned QR token, Registration ID, or Email
  const evaluateToken = async (tokenString: string) => {
    const clean = tokenString.trim();
    if (!clean) {
      toast.error("Please enter a Registration ID, Name, or Email, or scan a QR pass.");
      return;
    }
    try {
      setEvaluating(true);
      setScanError(null);
      await stopCamera();

      const res = await fetch("/api/security/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: clean, gate_id: selectedGate }),
      });
      const data = await res.json();

      if (!res.ok || !data.valid) {
        setScanError(data.message || data.error || "Invalid or unverified QR pass.");
        setScannedResult(null);
      } else {
        setScannedResult(data);
        toast.success(`Verified: ${data.participant.full_name} (${data.participant.registration_id})`);
      }
    } catch {
      setScanError("Network error validating pass. Please try again.");
    } finally {
      setEvaluating(false);
    }
  };

  // ALLOW ENTRY (Check-In)
  const handleAllowEntry = async (force = false) => {
    if (!scannedResult?.participant) return;
    try {
      setActionLoading(true);
      const res = await fetch("/api/security/entry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participant_id: scannedResult.participant.id,
          participant_snapshot: scannedResult.participant,
          gate_id: selectedGate,
          operator_id: "usr-sec-1",
          force,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || data.error || "Entry blocked!");
        if (data.blocked) {
          setScanError(data.message);
          setScannedResult((prev: any) =>
            prev
              ? {
                  ...prev,
                  participant: { ...prev.participant, campus_status: "INSIDE" },
                }
              : prev
          );
        }
      } else {
        setScanError(null);
        toast.success(data.message);
        setScannedResult((prev: any) =>
          prev
            ? {
                ...prev,
                participant: { ...prev.participant, campus_status: "INSIDE" },
              }
            : prev
        );
        fetchStatsAndRoster();
      }
    } catch {
      toast.error("Network error executing entry.");
    } finally {
      setActionLoading(false);
    }
  };

  // ALLOW EXIT (Check-Out)
  const handleAllowExit = async (force = false) => {
    if (!scannedResult?.participant) return;
    try {
      setActionLoading(true);
      const res = await fetch("/api/security/exit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participant_id: scannedResult.participant.id,
          participant_snapshot: scannedResult.participant,
          gate_id: selectedGate,
          operator_id: "usr-sec-1",
          force,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || data.error || "Exit blocked!");
        if (data.blocked) {
          setScanError(data.message);
          setScannedResult((prev: any) =>
            prev
              ? {
                  ...prev,
                  participant: { ...prev.participant, campus_status: "OUTSIDE" },
                }
              : prev
          );
        }
      } else {
        setScanError(null);
        toast.success(data.message);
        setScannedResult((prev: any) =>
          prev
            ? {
                ...prev,
                participant: { ...prev.participant, campus_status: "OUTSIDE" },
              }
            : prev
        );
        fetchStatsAndRoster();
      }
    } catch {
      toast.error("Network error executing exit.");
    } finally {
      setActionLoading(false);
    }
  };

  // Direct 1-Tap Check-In / Check-Out from Approved Roster
  const handleQuickRosterAction = async (p: any, action: "ENTRY" | "EXIT") => {
    try {
      setActionLoading(true);
      const endpoint = action === "ENTRY" ? "/api/security/entry" : "/api/security/exit";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participant_id: p.id,
          participant_snapshot: p,
          gate_id: selectedGate,
          operator_id: "usr-sec-1",
          force: true,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        setScannedResult({
          valid: true,
          participant: {
            ...p,
            campus_status: data.campus_status,
          },
        });
        fetchStatsAndRoster();
      } else {
        toast.error(data.message || data.error || "Action failed");
      }
    } catch {
      toast.error("Network error.");
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
        fetchStatsAndRoster();
      }
    } catch {
      toast.error("Override network error.");
    } finally {
      setActionLoading(false);
    }
  };

  const isInside = scannedResult?.participant?.campus_status === "INSIDE";

  const filteredRoster = approvedList.filter((p) => {
    if (!rosterSearch.trim()) return true;
    const q = rosterSearch.toLowerCase();
    return (
      p.full_name?.toLowerCase().includes(q) ||
      p.registration_id?.toLowerCase().includes(q) ||
      p.email?.toLowerCase().includes(q) ||
      p.college?.toLowerCase().includes(q) ||
      p.mobile?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-security text-security-foreground flex flex-col">
      {/* Offscreen sized container for reliable image QR decoding */}
      <div
        id="aurora-qr-file-reader"
        className="fixed -left-[9999px] top-0 w-[360px] h-[360px] overflow-hidden opacity-0 pointer-events-none"
      />

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
          <Button
            size="sm"
            variant="ghost"
            onClick={async () => {
              await fetch("/api/auth/logout", { method: "POST" });
              window.location.href = "/security/login";
            }}
            className="text-security-muted hover:text-white text-xs"
          >
            Sign Out
          </Button>
        </div>
      </header>

      {/* Main Console Split */}
      <main className="flex-1 mx-auto grid max-w-6xl w-full gap-8 p-5 sm:p-8 lg:grid-cols-[1.4fr_1fr] lg:py-10">
        {/* Left Column: Scanner, Active Participant Card, and Live Check-In Roster */}
        <section className="space-y-6">
          {/* SCANNER VIEW */}
          {!scannedResult && (
            <div className="surface bg-security-panel border-security-border p-6 sm:p-8">
              <p className="section-label text-security-muted">Gate Verification</p>
              <h2 className="mt-2 font-display text-4xl sm:text-5xl text-white">Scan. Identify. Check-In.</h2>
              <p className="mt-2 text-xs text-security-muted">
                Scan the participant&apos;s QR code via camera, upload a QR screenshot, or enter their Registration ID (e.g. 424 or KLT26-000424) below.
              </p>

              {/* Camera Frame */}
              <div className="mt-6 min-h-[280px] relative rounded-lg overflow-hidden border border-security-border bg-black flex items-center justify-center">
                {scanning ? (
                  <div id="aurora-qr-reader" className="w-full" />
                ) : (
                  <div className="text-center p-6">
                    <QrCode className="size-20 text-security-muted mx-auto mb-3" />
                    <p className="text-sm font-semibold text-white">QR Camera Scanner Ready</p>
                    <p className="text-xs text-security-muted mt-1">
                      Tap Start Camera QR Scanner or select a participant from the Approved Roster below
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-5 grid sm:grid-cols-2 gap-3">
                {scanning ? (
                  <Button
                    size="lg"
                    onClick={stopCamera}
                    variant="outline"
                    className="sm:col-span-2 w-full h-13 text-base font-semibold border-security-border text-white hover:bg-white/10"
                  >
                    Stop Camera
                  </Button>
                ) : (
                  <>
                    <Button
                      size="lg"
                      onClick={startCamera}
                      className="w-full h-13 text-sm font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"
                    >
                      <Camera className="size-4 mr-2" /> Start Camera QR Scanner
                    </Button>
                    <label className="inline-flex items-center justify-center h-13 px-4 rounded-md border border-security-border bg-security hover:bg-white/5 text-white text-sm font-semibold cursor-pointer">
                      <Upload className="size-4 mr-2" /> Scan QR Image File
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleScanImageFile(file);
                          }
                          e.target.value = "";
                        }}
                      />
                    </label>
                  </>
                )}
              </div>

              {/* Registration ID / Name / Email Input */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  evaluateToken(manualToken);
                }}
                className="mt-8 pt-6 border-t border-security-border"
              >
                <p className="text-xs text-security-muted mb-2 font-semibold uppercase tracking-wider">
                  Quick Verify by Registration ID (e.g. 424 or KLT26-000424), Name, or Email:
                </p>
                <div className="flex gap-2">
                  <Input
                    value={manualToken}
                    onChange={(e) => setManualToken(e.target.value)}
                    placeholder="Type 424, KLT26-000424, name, or email..."
                    className="text-xs bg-security border-security-border text-white font-mono"
                  />
                  <Button
                    type="submit"
                    size="sm"
                    disabled={evaluating}
                    className="bg-primary hover:bg-primary/90 shrink-0 px-4"
                  >
                    {evaluating ? "Checking..." : "Verify Pass"}
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* SCAN ERROR CARD */}
          {scanError && (
            <div className="surface bg-destructive/15 border-destructive p-6 rounded-lg text-destructive-foreground">
              <div className="flex items-start gap-3">
                <ShieldAlert className="size-6 text-destructive shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-display text-2xl font-bold text-destructive">Gate Notice</h3>
                  <p className="text-sm mt-1 leading-relaxed text-destructive">{scanError}</p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setScanError(null);
                      }}
                      className="border-destructive/40 text-xs"
                    >
                      Dismiss Notice
                    </Button>
                    {scannedResult?.participant && (
                      <Button
                        size="sm"
                        onClick={() => handleAllowEntry(true)}
                        className="bg-success hover:bg-success/90 text-white text-xs font-semibold"
                      >
                        <CheckCircle2 className="size-3.5 mr-1" /> Re-Confirm Check-In (ENTRY)
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
                    Verified Campus Pass
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

              {/* Selfie Visual Inspection */}
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
                    Match Attendee Face With Registered Live Photo
                  </p>
                  <h2 className="font-display text-4xl text-white font-bold">
                    {scannedResult.participant.full_name}
                  </h2>
                  <p className="text-sm font-semibold text-primary">
                    {scannedResult.participant.college || "External Institution"}
                  </p>
                  {scannedResult.participant.mobile && (
                    <p className="text-xs text-security-muted">{scannedResult.participant.mobile}</p>
                  )}
                  <p className="font-mono text-sm text-white font-bold pt-1">
                    ID: {scannedResult.participant.registration_id}
                  </p>
                </div>
              </div>

              {/* BIG HIGH-CONTRAST CHECK-IN / CHECK-OUT BUTTONS */}
              <div className="grid sm:grid-cols-2 gap-4 pt-2">
                <Button
                  size="lg"
                  disabled={actionLoading}
                  onClick={() => handleAllowEntry(true)}
                  className={`h-16 text-lg font-bold shadow-xl ${
                    isInside
                      ? "bg-success/30 hover:bg-success/50 text-white border border-success/50"
                      : "bg-success hover:bg-success/90 text-white"
                  }`}
                >
                  <LogIn className="size-6 mr-2" />
                  {isInside ? "ALREADY INSIDE (RE-LOG)" : "CHECK IN (ALLOW ENTRY)"}
                </Button>

                <Button
                  size="lg"
                  disabled={actionLoading}
                  onClick={() => handleAllowExit(true)}
                  className={`h-16 text-lg font-bold shadow-xl ${
                    !isInside
                      ? "bg-primary/30 hover:bg-primary/50 text-white border border-primary/50"
                      : "bg-primary hover:bg-primary/90 text-white"
                  }`}
                >
                  <LogOut className="size-6 mr-2" />
                  {!isInside ? "ALREADY OUTSIDE (RE-LOG)" : "CHECK OUT (ALLOW EXIT)"}
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
                    setManualToken("");
                  }}
                  className="border-security-border text-white hover:bg-white/10 text-xs"
                >
                  ← Scan / Verify Next Participant
                </Button>
              </div>
            </div>
          )}

          {/* LIVE APPROVED PARTICIPANTS ROSTER (1-TAP CHECK-IN / CHECK-OUT) */}
          <div className="surface bg-security-panel border-security-border p-6 rounded-lg space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-security-border pb-4">
              <div>
                <p className="section-label text-security-muted">Approved Attendees Roster</p>
                <h3 className="font-display text-2xl text-white mt-0.5">
                  1-Tap Gate Check-In / Check-Out ({approvedList.length})
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative w-full sm:w-56">
                  <Search className="size-3.5 absolute left-3 top-2.5 text-security-muted" />
                  <Input
                    value={rosterSearch}
                    onChange={(e) => setRosterSearch(e.target.value)}
                    placeholder="Filter by name, ID, college..."
                    className="pl-8 h-8 text-xs bg-security border-security-border text-white"
                  />
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={fetchStatsAndRoster}
                  className="h-8 border-security-border text-white hover:bg-white/10 text-xs shrink-0"
                >
                  <RefreshCw className="size-3.5" />
                </Button>
              </div>
            </div>

            {filteredRoster.length === 0 ? (
              <p className="text-xs text-security-muted py-4 text-center">
                No approved participants matching filter.
              </p>
            ) : (
              <div className="divide-y divide-security-border max-h-[360px] overflow-y-auto">
                {filteredRoster.map((p) => {
                  const pInside = p.campus_status === "INSIDE";
                  return (
                    <div
                      key={p.id}
                      className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div
                        onClick={() => {
                          setScannedResult({ valid: true, participant: p });
                          setScanError(null);
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                        className="flex items-center gap-3 cursor-pointer hover:opacity-90"
                      >
                        <img
                          src={p.selfie_path || "/assets/participant-avatar.jpg"}
                          alt={p.full_name}
                          className="size-11 rounded-md object-cover border border-security-border shrink-0"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-white">{p.full_name}</span>
                            <span className="font-mono text-xs text-primary font-bold">
                              {p.registration_id}
                            </span>
                          </div>
                          <p className="text-xs text-security-muted">
                            {p.college || "College"} · {p.mobile || p.email}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            pInside ? "bg-success/20 text-success" : "bg-white/10 text-security-muted"
                          }`}
                        >
                          {p.campus_status}
                        </span>

                        {!pInside ? (
                          <Button
                            size="sm"
                            disabled={actionLoading}
                            onClick={() => handleQuickRosterAction(p, "ENTRY")}
                            className="h-8 bg-success hover:bg-success/90 text-white text-xs font-semibold"
                          >
                            <LogIn className="size-3.5 mr-1" /> Check In
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            disabled={actionLoading}
                            onClick={() => handleQuickRosterAction(p, "EXIT")}
                            className="h-8 bg-primary hover:bg-primary/90 text-white text-xs font-semibold"
                          >
                            <LogOut className="size-3.5 mr-1" /> Check Out
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
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
            <h3 className="section-label text-security-muted mb-4">Guard Check-In Protocol</h3>
            <ul className="space-y-2.5 text-xs text-security-muted leading-relaxed">
              <li>1. Scan the participant&apos;s QR code, enter their ID (e.g. 425), or tap their name in the Approved Roster.</li>
              <li>2. Visually match the person at the gate with their registered Live Photo.</li>
              <li>3. Tap CHECK IN (ALLOW ENTRY) when entering campus and CHECK OUT (ALLOW EXIT) when leaving.</li>
            </ul>
          </div>
        </aside>
      </main>
    </div>
  );
}
