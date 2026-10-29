"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Camera,
  Check,
  CheckCircle2,
  Mail,
  RefreshCw,
  Sparkles,
  Upload,
  UsersRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

function compressImageToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const maxDim = 1000;
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(String(ev.target?.result));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.8));
      };
      img.onerror = () => resolve(String(ev.target?.result));
      img.src = String(ev.target?.result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function PublicRegistrationPage() {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Only the 4 required text fields: Name, College Name, Mobile Number, Email Address
  const [fullName, setFullName] = useState("");
  const [college, setCollege] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");

  // Live Pic State
  const [cameraActive, setCameraActive] = useState(false);
  const [selfieDataUrl, setSelfieDataUrl] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Student ID Pic & Aadhaar Pic
  const [studentIdName, setStudentIdName] = useState("");
  const [studentIdDataUrl, setStudentIdDataUrl] = useState<string | null>(null);
  const [aadhaarName, setAadhaarName] = useState("");
  const [aadhaarDataUrl, setAadhaarDataUrl] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 640 } },
        audio: false,
      });
      streamRef.current = stream;
      setCameraActive(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      }, 100);
    } catch {
      toast.error("Camera permission unavailable. Please allow camera access or use the fallback capture input.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 640;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.82);
    setSelfieDataUrl(dataUrl);
    stopCamera();
    toast.success("Live photo captured!");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName || !college || !mobile || !email) {
      toast.error("Please fill in your Name, College Name, Mobile Number, and Email Address.");
      return;
    }
    if (!selfieDataUrl) {
      toast.error("Please take your Live Photo before submitting.");
      return;
    }
    if (!studentIdDataUrl || !aadhaarDataUrl) {
      toast.error("Please upload both your Student ID photo and Aadhaar photo.");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName,
          college,
          mobile,
          email,
          selfie_data_url: selfieDataUrl,
          student_id_data_url: studentIdDataUrl,
          student_id_filename: studentIdName,
          aadhaar_data_url: aadhaarDataUrl,
          aadhaar_filename: aadhaarName,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Submission failed.");
      } else {
        toast.success("Registration submitted for admin review!");
        setSubmitted(true);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch {
      toast.error("Network error submitting form.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card/60 backdrop-blur-md px-6 py-4 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <img src="/kaltarang-logo.svg" alt="Kaltarang Logo" className="h-9 w-7 object-contain" />
            <div>
              <span className="font-display text-2xl tracking-tight leading-none block">Aurora</span>
              <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-muted-foreground">
                Kaltarang 2026 · Participant Registration
              </span>
            </div>
          </Link>

          <Button asChild variant="outline" size="sm" className="text-xs">
            <Link href="/">← Home</Link>
          </Button>
        </div>
      </header>

      <main className="flex-1 max-w-3xl w-full mx-auto px-5 py-10 sm:py-12">
        {submitted ? (
          <div className="surface p-8 sm:p-12 text-center space-y-6 animate-in fade-in duration-300">
            <div className="size-16 rounded-full bg-success/15 text-success grid place-items-center mx-auto">
              <CheckCircle2 className="size-9" />
            </div>

            <div className="space-y-2">
              <p className="section-label text-success">Submission Received</p>
              <h1 className="font-display text-4xl sm:text-5xl">Registration Under Admin Review</h1>
              <p className="text-sm text-muted-foreground max-w-xl mx-auto leading-relaxed pt-2">
                Thank you, <strong>{fullName}</strong>. Your details, live photograph, Student ID, and Aadhaar have been submitted to the Kaltarang 2026 Verification Desk.
              </p>
            </div>

            <div className="max-w-md mx-auto bg-primary/5 border border-primary/20 rounded-xl p-5 text-left space-y-2.5 text-xs">
              <div className="flex items-center gap-2 text-primary font-semibold text-sm">
                <Mail className="size-4" /> Single Static QR Pass via Email
              </div>
              <p className="text-muted-foreground leading-relaxed">
                Once approved by admin, your <strong>single static QR Access Pass</strong> for the entire event will be sent directly to:
              </p>
              <p className="font-mono font-bold text-sm text-foreground bg-background px-3 py-2 rounded border border-border">
                {email}
              </p>
              <p className="text-[11px] text-muted-foreground">
                Show that QR code at any RGIPT campus gate for entry and exit.
              </p>
            </div>

            <div className="pt-4 flex flex-wrap justify-center gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setSubmitted(false);
                  setFullName("");
                  setCollege("");
                  setMobile("");
                  setEmail("");
                  setSelfieDataUrl(null);
                  setStudentIdDataUrl(null);
                  setAadhaarDataUrl(null);
                }}
              >
                Register Another Participant
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider mb-3">
                <Sparkles className="size-3.5" /> Official Participant Registration
              </div>
              <h1 className="font-display text-4xl sm:text-5xl">Kaltarang 2026 Campus Pass Registration</h1>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                Complete your details below. Once verified by admin, your <strong>single static QR pass</strong> for the entire fest will be emailed to you.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* 1. Basic Details (Only Name, College, Mobile, Email) */}
              <section className="surface p-6 sm:p-8 space-y-5">
                <div className="border-b border-border pb-3">
                  <p className="section-label text-primary">Step 1 of 3</p>
                  <h2 className="font-display text-2xl mt-1">Participant Details</h2>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-semibold uppercase text-muted-foreground block mb-1.5">
                      Full Name *
                    </label>
                    <Input
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Enter your full name"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold uppercase text-muted-foreground block mb-1.5">
                      College Name *
                    </label>
                    <Input
                      value={college}
                      onChange={(e) => setCollege(e.target.value)}
                      placeholder="Enter your college / university name"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold uppercase text-muted-foreground block mb-1.5">
                      Mobile Number *
                    </label>
                    <Input
                      type="tel"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      placeholder="+91 98765 43210"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold uppercase text-muted-foreground block mb-1.5">
                      Email Address (QR Pass will be sent here) *
                    </label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                    />
                  </div>
                </div>
              </section>

              {/* 2. Live Pic Capture */}
              <section className="surface p-6 sm:p-8 space-y-5">
                <div className="border-b border-border pb-3">
                  <p className="section-label text-primary">Step 2 of 3</p>
                  <h2 className="font-display text-2xl mt-1">Live Photo (Selfie) *</h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    Security guards at the gate will match your face with this live photo when scanning your QR code.
                  </p>
                </div>

                <div className="aspect-[4/3] max-w-md mx-auto relative rounded-lg overflow-hidden border-2 border-dashed border-border bg-card flex items-center justify-center">
                  {selfieDataUrl ? (
                    <div className="relative size-full">
                      <img src={selfieDataUrl} alt="Captured live photo" className="size-full object-cover" />
                      <div className="absolute bottom-3 left-3 right-3 flex justify-between bg-black/70 backdrop-blur-md p-2.5 rounded text-white text-xs">
                        <span className="flex items-center gap-1.5 text-success font-semibold">
                          <Check className="size-4" /> Live Photo Captured
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setSelfieDataUrl(null);
                            startCamera();
                          }}
                          className="flex items-center gap-1 hover:underline text-white font-medium"
                        >
                          <RefreshCw className="size-3.5" /> Retake
                        </button>
                      </div>
                    </div>
                  ) : cameraActive ? (
                    <div className="relative size-full bg-black">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="size-full object-cover scale-x-[-1]"
                      />
                      <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-3">
                        <Button
                          type="button"
                          onClick={capturePhoto}
                          className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6 shadow-lg"
                        >
                          <Camera className="size-4 mr-2" /> Click Live Photo
                        </Button>
                        <Button type="button" variant="secondary" onClick={stopCamera}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center p-6 space-y-4">
                      <UsersRound className="size-12 text-primary mx-auto" />
                      <div>
                        <p className="text-sm font-semibold">Take Your Live Photo</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Make sure your face is clearly visible in good lighting.
                        </p>
                      </div>
                      <div className="flex flex-wrap justify-center gap-3">
                        <Button type="button" onClick={startCamera} className="bg-primary hover:bg-primary/90">
                          <Camera className="size-4 mr-2" /> Open Camera
                        </Button>
                        <label className="inline-flex items-center justify-center px-4 py-2 rounded-md border border-input bg-background hover:bg-accent text-xs font-semibold cursor-pointer">
                          <Upload className="size-3.5 mr-1.5" /> Camera Fallback
                          <input
                            type="file"
                            accept="image/*"
                            capture="user"
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const url = await compressImageToDataUrl(file);
                                setSelfieDataUrl(url);
                                toast.success("Live photo attached!");
                              }
                            }}
                          />
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              </section>

              {/* 3. Student ID Pic & Aadhaar Pic */}
              <section className="surface p-6 sm:p-8 space-y-5">
                <div className="border-b border-border pb-3">
                  <p className="section-label text-primary">Step 3 of 3</p>
                  <h2 className="font-display text-2xl mt-1">Student ID & Aadhaar Photos *</h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    Upload clear photos of your College Student ID and Aadhaar Card for admin verification.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  {/* Student ID Photo */}
                  <div className="p-5 rounded-lg border border-border bg-card/50 flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-sm">Student ID Photo *</h3>
                        {studentIdDataUrl && (
                          <span className="text-xs text-success font-semibold flex items-center gap-1">
                            <Check className="size-3.5" /> Attached
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Clear photo of your College Student ID Card.
                      </p>
                    </div>
                    {studentIdDataUrl && studentIdDataUrl.startsWith("data:image") && (
                      <div className="h-28 rounded border border-border overflow-hidden bg-black/5">
                        <img src={studentIdDataUrl} alt="Student ID preview" className="size-full object-contain" />
                      </div>
                    )}
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setStudentIdName(file.name);
                            const url = await compressImageToDataUrl(file);
                            setStudentIdDataUrl(url);
                            toast.success("Student ID photo attached.");
                          }
                        }}
                        className="text-xs w-full file:mr-3 file:py-2 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Aadhaar Photo */}
                  <div className="p-5 rounded-lg border border-border bg-card/50 flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-sm">Aadhaar Card Photo *</h3>
                        {aadhaarDataUrl && (
                          <span className="text-xs text-success font-semibold flex items-center gap-1">
                            <Check className="size-3.5" /> Attached
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Clear photo of your Aadhaar Card.
                      </p>
                    </div>
                    {aadhaarDataUrl && aadhaarDataUrl.startsWith("data:image") && (
                      <div className="h-28 rounded border border-border overflow-hidden bg-black/5">
                        <img src={aadhaarDataUrl} alt="Aadhaar preview" className="size-full object-contain" />
                      </div>
                    )}
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setAadhaarName(file.name);
                            const url = await compressImageToDataUrl(file);
                            setAadhaarDataUrl(url);
                            toast.success("Aadhaar photo attached.");
                          }
                        }}
                        className="text-xs w-full file:mr-3 file:py-2 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  size="lg"
                  disabled={loading}
                  className="w-full h-13 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg mt-4"
                >
                  {loading ? "Submitting Registration..." : "Submit Registration"}
                </Button>
              </section>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
