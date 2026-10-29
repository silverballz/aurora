"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Camera,
  Check,
  CheckCircle2,
  FileText,
  Mail,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Upload,
  UserCheck,
  UsersRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function PublicRegistrationPage() {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [allEvents, setAllEvents] = useState<any[]>([]);

  // Form Fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [paymentRef, setPaymentRef] = useState("");
  const [college, setCollege] = useState("");
  const [course, setCourse] = useState("");
  const [yearOfStudy, setYearOfStudy] = useState("3rd Year");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [stateName, setStateName] = useState("");
  const [pincode, setPincode] = useState("");

  // Selfie State
  const [cameraActive, setCameraActive] = useState(false);
  const [selfieDataUrl, setSelfieDataUrl] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Documents State
  const [studentIdName, setStudentIdName] = useState("");
  const [studentIdDataUrl, setStudentIdDataUrl] = useState<string | null>(null);
  const [aadhaarName, setAadhaarName] = useState("");
  const [aadhaarDataUrl, setAadhaarDataUrl] = useState<string | null>(null);

  // Events Selection
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    fetch("/api/events")
      .then((r) => r.json())
      .then((data) => {
        if (data.events) {
          setAllEvents(data.events);
          setSelectedEvents(data.events.map((e: any) => e.id));
        }
      })
      .catch(console.error);

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
      toast.error("Camera permission unavailable. You can also upload a clear photo using the button below.");
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
    toast.success("Photograph captured!");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName || !email || !mobile || !college || !course) {
      toast.error("Please fill in all required personal and college fields.");
      return;
    }
    if (!selfieDataUrl) {
      toast.error("Please capture or upload your front-facing photograph for gate verification.");
      return;
    }
    if (!studentIdDataUrl || !aadhaarDataUrl) {
      toast.error("Please upload both your Student ID Card and Government ID (Aadhaar).");
      return;
    }
    if (!confirmed) {
      toast.error("Please check the declaration box before submitting.");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName,
          email,
          mobile,
          payment_reference: paymentRef || "VERIFIED-FEE",
          college,
          course,
          year_of_study: yearOfStudy,
          address,
          city,
          state: stateName,
          pincode,
          selfie_data_url: selfieDataUrl,
          student_id_data_url: studentIdDataUrl,
          student_id_filename: studentIdName,
          aadhaar_data_url: aadhaarDataUrl,
          aadhaar_filename: aadhaarName,
          selected_event_ids: selectedEvents,
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
        <div className="max-w-5xl mx-auto flex items-center justify-between">
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
            <Link href="/">← Back to Home</Link>
          </Button>
        </div>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto px-5 py-10 sm:py-12">
        {submitted ? (
          <div className="surface p-8 sm:p-12 text-center space-y-6 animate-in fade-in duration-300">
            <div className="size-16 rounded-full bg-success/15 text-success grid place-items-center mx-auto">
              <CheckCircle2 className="size-9" />
            </div>

            <div className="space-y-2">
              <p className="section-label text-success">Submission Received</p>
              <h1 className="font-display text-4xl sm:text-5xl">Registration Under Admin Review</h1>
              <p className="text-sm text-muted-foreground max-w-xl mx-auto leading-relaxed pt-2">
                Thank you, <strong>{fullName}</strong>. Your registration details, live photograph, and identity documents have been sent to the Kaltarang 2026 Verification Desk.
              </p>
            </div>

            <div className="max-w-md mx-auto bg-primary/5 border border-primary/20 rounded-xl p-5 text-left space-y-2.5 text-xs">
              <div className="flex items-center gap-2 text-primary font-semibold text-sm">
                <Mail className="size-4" /> Single Static QR Pass via Email
              </div>
              <p className="text-muted-foreground leading-relaxed">
                Once an administrator verifies and approves your registration, your <strong>single static QR Access Pass</strong> for the entire fest will be emailed directly to:
              </p>
              <p className="font-mono font-bold text-sm text-foreground bg-background px-3 py-2 rounded border border-border">
                {email}
              </p>
              <p className="text-[11px] text-muted-foreground">
                You do not need to log into any portal. Simply show the QR code from your email at any RGIPT campus gate for entry and exit.
              </p>
            </div>

            <div className="pt-4 flex flex-wrap justify-center gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setSubmitted(false);
                  setFullName("");
                  setEmail("");
                  setMobile("");
                  setPaymentRef("");
                  setSelfieDataUrl(null);
                  setStudentIdDataUrl(null);
                  setAadhaarDataUrl(null);
                  setConfirmed(false);
                }}
              >
                Register Another Participant
              </Button>
              <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <Link href="/">Return to Home</Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider mb-3">
                <Sparkles className="size-3.5" /> Official External Participant Registration Form
              </div>
              <h1 className="font-display text-4xl sm:text-5xl">Kaltarang 2026 Campus Pass Registration</h1>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                Fill out this form once before arriving at RGIPT. After our admin team reviews your submission, your <strong>single static QR code pass</strong> for the entire fest will be emailed directly to you.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* 1. Identity & Payment */}
              <section className="surface p-6 sm:p-8 space-y-5">
                <div className="border-b border-border pb-3">
                  <p className="section-label text-primary">Section 1 of 5</p>
                  <h2 className="font-display text-2xl mt-1">Participant & Fee Details</h2>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-semibold uppercase text-muted-foreground block mb-1.5">
                      Full Name (As on ID Card) *
                    </label>
                    <Input
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Aarav Sharma"
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
                      placeholder="you@college.edu or gmail.com"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold uppercase text-muted-foreground block mb-1.5">
                      Mobile Number (WhatsApp active) *
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
                      Fee Payment Reference / UTR Number *
                    </label>
                    <Input
                      value={paymentRef}
                      onChange={(e) => setPaymentRef(e.target.value)}
                      placeholder="e.g. UTR-4289103842"
                      required
                    />
                  </div>
                </div>
              </section>

              {/* 2. College & Personal Details */}
              <section className="surface p-6 sm:p-8 space-y-5">
                <div className="border-b border-border pb-3">
                  <p className="section-label text-primary">Section 2 of 5</p>
                  <h2 className="font-display text-2xl mt-1">Institution & Address Details</h2>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="text-xs font-semibold uppercase text-muted-foreground block mb-1.5">
                      College / University / Institution Name *
                    </label>
                    <Input
                      value={college}
                      onChange={(e) => setCollege(e.target.value)}
                      placeholder="e.g. IIT Kanpur / NIT Allahabad / DU"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold uppercase text-muted-foreground block mb-1.5">
                      Degree / Course *
                    </label>
                    <Input
                      value={course}
                      onChange={(e) => setCourse(e.target.value)}
                      placeholder="e.g. B.Tech CSE / B.A. Economics"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold uppercase text-muted-foreground block mb-1.5">
                      Year of Study *
                    </label>
                    <select
                      value={yearOfStudy}
                      onChange={(e) => setYearOfStudy(e.target.value)}
                      className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                    >
                      <option value="1st Year">1st Year</option>
                      <option value="2nd Year">2nd Year</option>
                      <option value="3rd Year">3rd Year</option>
                      <option value="4th Year">4th Year</option>
                      <option value="Postgraduate / PhD">Postgraduate / PhD</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-xs font-semibold uppercase text-muted-foreground block mb-1.5">
                      Residential / Hostel Address *
                    </label>
                    <Input
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Hostel / Room No. or Street Address"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold uppercase text-muted-foreground block mb-1.5">
                      City *
                    </label>
                    <Input
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g. Lucknow"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold uppercase text-muted-foreground block mb-1.5">
                        State *
                      </label>
                      <Input
                        value={stateName}
                        onChange={(e) => setStateName(e.target.value)}
                        placeholder="e.g. UP"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold uppercase text-muted-foreground block mb-1.5">
                        PIN Code *
                      </label>
                      <Input
                        value={pincode}
                        onChange={(e) => setPincode(e.target.value)}
                        placeholder="226001"
                        maxLength={6}
                        required
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* 3. Live Selfie Capture */}
              <section className="surface p-6 sm:p-8 space-y-5">
                <div className="border-b border-border pb-3">
                  <p className="section-label text-primary">Section 3 of 5</p>
                  <h2 className="font-display text-2xl mt-1">Identity Photograph (Selfie) *</h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    Security personnel at RGIPT gates will visually match your face with this photo when scanning your QR code.
                  </p>
                </div>

                <div className="aspect-[4/3] max-w-md mx-auto relative rounded-lg overflow-hidden border-2 border-dashed border-border bg-card flex items-center justify-center">
                  {selfieDataUrl ? (
                    <div className="relative size-full">
                      <img src={selfieDataUrl} alt="Captured selfie" className="size-full object-cover" />
                      <div className="absolute bottom-3 left-3 right-3 flex justify-between bg-black/70 backdrop-blur-md p-2.5 rounded text-white text-xs">
                        <span className="flex items-center gap-1.5 text-success font-semibold">
                          <Check className="size-4" /> Photo Ready
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
                          <Camera className="size-4 mr-2" /> Capture Photo
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
                        <p className="text-sm font-semibold">Take Live Selfie or Upload Clear Photo</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Ensure your face is clearly visible without sunglasses or masks.
                        </p>
                      </div>
                      <div className="flex flex-wrap justify-center gap-3">
                        <Button type="button" onClick={startCamera} className="bg-primary hover:bg-primary/90">
                          <Camera className="size-4 mr-2" /> Open Camera
                        </Button>
                        <label className="inline-flex items-center justify-center px-4 py-2 rounded-md border border-input bg-background hover:bg-accent text-xs font-semibold cursor-pointer">
                          <Upload className="size-3.5 mr-1.5" /> Upload Photo
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const url = await fileToDataUrl(file);
                                setSelfieDataUrl(url);
                                toast.success("Photograph attached!");
                              }
                            }}
                          />
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              </section>

              {/* 4. Identity Documents */}
              <section className="surface p-6 sm:p-8 space-y-5">
                <div className="border-b border-border pb-3">
                  <p className="section-label text-primary">Section 4 of 5</p>
                  <h2 className="font-display text-2xl mt-1">Identity Documents Upload *</h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    Reviewed strictly by Kaltarang Verification Admins. Never shown to gate security guards.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  {/* Student ID */}
                  <div className="p-5 rounded-lg border border-border bg-card/50 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-sm">College Student ID Card *</h3>
                        {studentIdDataUrl && (
                          <span className="text-xs text-success font-semibold flex items-center gap-1">
                            <Check className="size-3.5" /> Attached
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Clear image or PDF of your valid college ID card.
                      </p>
                    </div>
                    <div className="mt-4">
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setStudentIdName(file.name);
                            const url = await fileToDataUrl(file);
                            setStudentIdDataUrl(url);
                            toast.success("Student ID attached.");
                          }
                        }}
                        className="text-xs w-full file:mr-3 file:py-2 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Aadhaar Card */}
                  <div className="p-5 rounded-lg border border-border bg-card/50 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-sm">Government ID (Aadhaar Card) *</h3>
                        {aadhaarDataUrl && (
                          <span className="text-xs text-success font-semibold flex items-center gap-1">
                            <Check className="size-3.5" /> Attached
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Clear image or PDF of your Aadhaar / Government ID.
                      </p>
                    </div>
                    <div className="mt-4">
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setAadhaarName(file.name);
                            const url = await fileToDataUrl(file);
                            setAadhaarDataUrl(url);
                            toast.success("Aadhaar / Govt ID attached.");
                          }
                        }}
                        className="text-xs w-full file:mr-3 file:py-2 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* 5. Events & Submit */}
              <section className="surface p-6 sm:p-8 space-y-6">
                <div className="border-b border-border pb-3">
                  <p className="section-label text-primary">Section 5 of 5</p>
                  <h2 className="font-display text-2xl mt-1">Events & Final Submission</h2>
                </div>

                <div className="space-y-2.5">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">
                    Select Events You Are Participating In / Attending:
                  </p>
                  <div className="grid gap-2.5 sm:grid-cols-2">
                    {allEvents.map((evt) => {
                      const isSelected = selectedEvents.includes(evt.id);
                      return (
                        <div
                          key={evt.id}
                          onClick={() =>
                            setSelectedEvents((prev) =>
                              isSelected ? prev.filter((id) => id !== evt.id) : [...prev, evt.id]
                            )
                          }
                          className={`p-3.5 rounded-lg border transition-all cursor-pointer flex items-center justify-between ${
                            isSelected ? "border-primary bg-primary/5" : "border-border hover:bg-muted/40"
                          }`}
                        >
                          <div>
                            <h4 className="font-semibold text-xs">{evt.name}</h4>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                              {evt.date} · {evt.venue}
                            </p>
                          </div>
                          <div
                            className={`size-5 rounded border grid place-items-center shrink-0 ${
                              isSelected ? "bg-primary text-primary-foreground border-primary" : "border-muted-foreground/30"
                            }`}
                          >
                            {isSelected && <Check className="size-3.5" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="p-4 bg-muted/40 border border-border rounded-lg">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={confirmed}
                      onChange={(e) => setConfirmed(e.target.checked)}
                      className="size-4 mt-0.5 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <span className="text-xs text-muted-foreground leading-relaxed">
                      I confirm that the identity details, live photograph, and documents submitted above are authentic and belong to me. I understand that upon admin approval, a single static QR pass will be sent to my email for campus gate access.
                    </span>
                  </label>
                </div>

                <Button
                  type="submit"
                  size="lg"
                  disabled={loading}
                  className="w-full h-13 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"
                >
                  {loading ? "Submitting Registration..." : "Submit Registration for Admin Review"}
                </Button>
              </section>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
