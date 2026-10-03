"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  FileText,
  Lock,
  RefreshCw,
  ShieldCheck,
  UploadCloud,
  UsersRound,
} from "lucide-react";
import { AuroraShell, PageHeader } from "@/components/aurora-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const steps = [
  "Identity",
  "Personal details",
  "Live selfie",
  "Documents",
  "Events",
  "Review & submit",
];

export default function RegistrationWizardPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [participant, setParticipant] = useState<any>(null);
  const [allEvents, setAllEvents] = useState<any[]>([]);

  // Form State
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
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

  // Document Uploads
  const [studentIdFile, setStudentIdFile] = useState<File | null>(null);
  const [studentIdUploaded, setStudentIdUploaded] = useState(false);
  const [aadhaarFile, setAadhaarFile] = useState<File | null>(null);
  const [aadhaarUploaded, setAadhaarUploaded] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);

  // Events Selection
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);

  // Confirmation Declaration
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const meRes = await fetch("/api/auth/me");
        const meData = await meRes.json();

        if (meData.participant) {
          const p = meData.participant;
          setParticipant(p);
          setFullName(p.full_name || "");
          setEmail(p.email || "");
          setMobile(p.mobile || "");
          setCollege(p.college || "");
          setCourse(p.course || "");
          setYearOfStudy(p.year_of_study || "3rd Year");
          setAddress(p.address || "");
          setCity(p.city || "");
          setStateName(p.state || "");
          setPincode(p.pincode || "");
          if (p.selfie_path) setSelfieDataUrl(p.selfie_path);
        }

        const evRes = await fetch("/api/events");
        const evData = await evRes.json();
        if (evData.events) {
          setAllEvents(evData.events);
          setSelectedEvents(evData.events.map((e: any) => e.id));
        }
      } catch (err) {
        console.error("Load data error:", err);
      }
    }

    loadData();

    return () => {
      stopCamera();
    };
  }, []);

  // WebRTC Live Selfie Controls
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 640 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err) {
      toast.error("Camera access denied or unavailable. Please grant browser camera permissions.");
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
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    setSelfieDataUrl(dataUrl);
    stopCamera();
    toast.success("Live photograph captured successfully.");
  };

  const retakePhoto = () => {
    setSelfieDataUrl(null);
    startCamera();
  };

  // Upload single document
  const handleUploadDocument = async (type: "STUDENT_ID" | "AADHAAR", file: File) => {
    try {
      setUploadingDoc(true);
      const fd = new FormData();
      fd.append("file", file);
      fd.append("document_type", type);
      if (participant?.id) fd.append("participant_id", participant.id);

      const res = await fetch("/api/participant/documents/upload", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || `Failed to upload ${type}.`);
      } else {
        toast.success(`${type === "STUDENT_ID" ? "Student ID" : "Aadhaar Card"} uploaded safely.`);
        if (type === "STUDENT_ID") setStudentIdUploaded(true);
        if (type === "AADHAAR") setAadhaarUploaded(true);
      }
    } catch {
      toast.error("Document upload failed.");
    } finally {
      setUploadingDoc(false);
    }
  };

  // Step 2 & 3 Save Progress
  const saveProfileStep = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/participant/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          college,
          course,
          year_of_study: yearOfStudy,
          address,
          city,
          state: stateName,
          pincode,
          selfie_path: selfieDataUrl,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to save profile progress.");
        return false;
      }
      return true;
    } catch {
      toast.error("Network error saving profile.");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleNext = async () => {
    if (currentStep === 1) {
      if (!college || !course || !address || !city || !stateName || !pincode) {
        toast.error("Please fill in all personal and institution fields.");
        return;
      }
      const ok = await saveProfileStep();
      if (!ok) return;
    }

    if (currentStep === 2) {
      if (!selfieDataUrl) {
        toast.error("Please capture your live identity photograph.");
        return;
      }
      stopCamera();
      await saveProfileStep();
    }

    if (currentStep === 3) {
      if (!studentIdUploaded && !studentIdFile) {
        toast.error("Please upload your institutional Student ID.");
        return;
      }
      if (!aadhaarUploaded && !aadhaarFile) {
        toast.error("Please upload your Aadhaar card.");
        return;
      }
    }

    setCurrentStep((prev) => Math.min(steps.length - 1, prev + 1));
  };

  const handleSubmitRegistration = async () => {
    if (!confirmed) {
      toast.error("Please confirm that the submitted documents belong to you.");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/participant/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          confirmed: true,
          selected_event_ids: selectedEvents,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to submit registration.");
      } else {
        toast.success("Registration submitted! Kaltarang desk will review your documents.");
        router.push("/portal");
      }
    } catch {
      toast.error("Submission error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuroraShell userName={fullName || "Participant"}>
      <PageHeader
        eyebrow="Registration Wizard"
        title="Complete your identity profile."
        description="Your invitation details are locked for security. Complete each step accurately to receive your campus pass."
      />

      <div className="mx-auto max-w-5xl p-5 sm:p-8 lg:p-12">
        {/* Step Indicator */}
        <div className="mb-10 grid grid-cols-3 gap-2 sm:grid-cols-6">
          {steps.map((label, index) => {
            const isCompleted = index < currentStep;
            const isCurrent = index === currentStep;

            return (
              <button
                key={label}
                onClick={() => {
                  if (index < currentStep) setCurrentStep(index);
                }}
                className={`step-button ${isCurrent ? "step-current" : isCompleted ? "step-done" : ""}`}
              >
                <span>
                  {isCompleted ? <Check className="size-4 text-success" /> : index + 1}
                </span>
                <small className="truncate max-w-[80px]">{label}</small>
              </button>
            );
          })}
        </div>

        {/* Wizard Main Step Container */}
        <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
          <section className="surface p-6 sm:p-8">
            <p className="section-label text-primary">Step {currentStep + 1} of 6</p>
            <h2 className="mt-2 font-display text-3xl sm:text-4xl">{steps[currentStep]}</h2>

            {/* STEP 1: IDENTITY */}
            {currentStep === 0 && (
              <div className="mt-8 space-y-5">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  These verified identity details are tied to your fest payment invitation and are locked for security:
                </p>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-semibold uppercase text-muted-foreground block mb-1.5">
                      Full Name
                    </label>
                    <div className="relative">
                      <Input value={fullName} disabled className="bg-muted text-foreground pr-8" />
                      <Lock className="size-4 text-muted-foreground absolute right-3 top-3" />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold uppercase text-muted-foreground block mb-1.5">
                      Email Address
                    </label>
                    <div className="relative">
                      <Input value={email} disabled className="bg-muted text-foreground pr-8" />
                      <Lock className="size-4 text-muted-foreground absolute right-3 top-3" />
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-xs font-semibold uppercase text-muted-foreground block mb-1.5">
                      Mobile Number
                    </label>
                    <div className="relative">
                      <Input value={mobile} disabled className="bg-muted text-foreground pr-8" />
                      <Lock className="size-4 text-muted-foreground absolute right-3 top-3" />
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-muted/50 rounded-lg text-xs text-muted-foreground flex items-center gap-2">
                  <ShieldCheck className="size-4 text-primary shrink-0" />
                  <span>
                    If an identity correction is required, contact Kaltarang administration rather than changing it here.
                  </span>
                </div>
              </div>
            )}

            {/* STEP 2: PERSONAL & COLLEGE DETAILS */}
            {currentStep === 1 && (
              <div className="mt-8 space-y-4">
                <p className="text-sm text-muted-foreground">
                  Provide your official institutional enrolment information and permanent address:
                </p>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="text-xs font-semibold uppercase text-muted-foreground block mb-1.5">
                      College / University / Institution *
                    </label>
                    <Input
                      value={college}
                      onChange={(e) => setCollege(e.target.value)}
                      placeholder="e.g. NIT Bhopal / IIT Patna / Delhi University"
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
                      placeholder="e.g. B.Tech Computer Science"
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
                      placeholder="Street, Hostel / Room number"
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
                      placeholder="e.g. Bhopal"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold uppercase text-muted-foreground block mb-1.5">
                      State *
                    </label>
                    <Input
                      value={stateName}
                      onChange={(e) => setStateName(e.target.value)}
                      placeholder="e.g. Madhya Pradesh"
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
                      placeholder="e.g. 462003"
                      maxLength={6}
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: LIVE CAMERA SELFIE */}
            {currentStep === 2 && (
              <div className="mt-8 space-y-6">
                <p className="text-sm text-muted-foreground">
                  Capture a clear front-facing photograph using your device camera. Security operators will visually compare this photograph at campus entry gates.
                </p>

                <div className="aspect-[4/3] max-w-md mx-auto relative rounded-lg overflow-hidden border-2 border-dashed border-border bg-card flex items-center justify-center">
                  {selfieDataUrl ? (
                    <div className="relative size-full">
                      <img
                        src={selfieDataUrl}
                        alt="Captured identity photo"
                        className="size-full object-cover"
                      />
                      <div className="absolute bottom-3 left-3 right-3 flex justify-between bg-black/60 backdrop-blur-md p-2 rounded text-white text-xs">
                        <span className="flex items-center gap-1.5 text-success">
                          <Check className="size-4" /> Photograph captured
                        </span>
                        <button
                          onClick={retakePhoto}
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
                      <div className="absolute inset-0 border-2 border-primary/50 pointer-events-none rounded-lg m-6" />
                      <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
                        <Button
                          onClick={capturePhoto}
                          className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6 shadow-lg"
                        >
                          <Camera className="size-4 mr-2" /> Capture Photo
                        </Button>
                        <Button variant="secondary" onClick={stopCamera}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center p-6">
                      <UsersRound className="size-12 text-primary mx-auto mb-3" />
                      <p className="text-sm font-semibold">Camera Access Required</p>
                      <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                        Device camera ensures real-time identity capture for gate security.
                      </p>
                      <Button onClick={startCamera} className="mt-5 bg-primary hover:bg-primary/90">
                        <Camera className="size-4 mr-2" /> Start Device Camera
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* STEP 4: DOCUMENTS UPLOAD */}
            {currentStep === 3 && (
              <div className="mt-8 space-y-6">
                <p className="text-sm text-muted-foreground">
                  Upload PDF or image scans of your identity documents. These are stored securely in private storage and accessible only to verification admins.
                </p>

                {/* Student ID */}
                <div className="surface p-5 border border-border">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-base">Institutional Student ID Card *</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        Current college identity card showing name and roll number.
                      </p>
                    </div>
                    {studentIdUploaded && (
                      <span className="text-xs text-success font-semibold flex items-center gap-1 bg-success/10 px-2.5 py-1 rounded-full">
                        <Check className="size-3.5" /> Uploaded
                      </span>
                    )}
                  </div>
                  <div className="mt-4">
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setStudentIdFile(file);
                          handleUploadDocument("STUDENT_ID", file);
                        }
                      }}
                      className="text-xs file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Aadhaar Card */}
                <div className="surface p-5 border border-border">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-base">Government ID (Aadhaar Card) *</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        Government identification for gate security verification.
                      </p>
                    </div>
                    {aadhaarUploaded && (
                      <span className="text-xs text-success font-semibold flex items-center gap-1 bg-success/10 px-2.5 py-1 rounded-full">
                        <Check className="size-3.5" /> Uploaded
                      </span>
                    )}
                  </div>
                  <div className="mt-4">
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setAadhaarFile(file);
                          handleUploadDocument("AADHAAR", file);
                        }
                      }}
                      className="text-xs file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 5: EVENTS */}
            {currentStep === 4 && (
              <div className="mt-8 space-y-4">
                <p className="text-sm text-muted-foreground">
                  Select the Kaltarang 2026 events and competitions you are participating in:
                </p>

                <div className="space-y-3">
                  {allEvents.map((evt) => {
                    const isSelected = selectedEvents.includes(evt.id);
                    return (
                      <div
                        key={evt.id}
                        onClick={() => {
                          setSelectedEvents((prev) =>
                            isSelected ? prev.filter((id) => id !== evt.id) : [...prev, evt.id]
                          );
                        }}
                        className={`p-4 rounded-lg border transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? "border-primary bg-primary/5 shadow-sm"
                            : "border-border hover:bg-muted/50"
                        }`}
                      >
                        <div>
                          <h4 className="font-semibold text-sm">{evt.name}</h4>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {evt.date} · {evt.venue} · {evt.start_time}
                          </p>
                        </div>
                        <div
                          className={`size-6 rounded-md border grid place-items-center ${
                            isSelected
                              ? "bg-primary text-primary-foreground border-primary"
                              : "border-muted-foreground/30"
                          }`}
                        >
                          {isSelected && <Check className="size-4" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STEP 6: REVIEW & DECLARATION */}
            {currentStep === 5 && (
              <div className="mt-8 space-y-6">
                <div className="bg-card/50 border border-border rounded-lg p-5 divide-y divide-border text-sm">
                  <div className="pb-3">
                    <p className="section-label">Personal Information</p>
                    <p className="font-semibold mt-1">{fullName}</p>
                    <p className="text-xs text-muted-foreground">{college} · {course} ({yearOfStudy})</p>
                    <p className="text-xs text-muted-foreground">{address}, {city}, {stateName} - {pincode}</p>
                  </div>
                  <div className="py-3">
                    <p className="section-label">Selected Events</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {selectedEvents.length} event(s) selected
                    </p>
                  </div>
                  <div className="pt-3 flex items-center justify-between">
                    <div>
                      <p className="section-label">Documents & Photograph</p>
                      <p className="text-xs text-success font-medium mt-0.5">
                        ✓ Live Photo captured · ✓ Student ID · ✓ Aadhaar Card
                      </p>
                    </div>
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
                      I confirm that the information and documents submitted through Aurora are accurate and belong to me.
                      I understand that false declarations will result in revocation of campus access.
                    </span>
                  </label>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="mt-10 flex items-center justify-between border-t border-border pt-6">
              <Button
                variant="outline"
                disabled={currentStep === 0 || loading}
                onClick={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
              >
                <ChevronLeft className="size-4 mr-1" /> Back
              </Button>

              {currentStep < steps.length - 1 ? (
                <Button onClick={handleNext} disabled={loading} className="bg-primary hover:bg-primary/90">
                  Save & Continue <ChevronRight className="size-4 ml-1" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmitRegistration}
                  disabled={loading || !confirmed}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8"
                >
                  {loading ? "Submitting..." : "Submit Registration"}
                </Button>
              )}
            </div>
          </section>

          {/* Right Guidance Sidebar */}
          <aside className="border-l border-border pl-6 space-y-6">
            <div>
              <h3 className="section-label">Identity Guidelines</h3>
              <ul className="mt-3 space-y-3 text-xs leading-5 text-muted-foreground">
                <li>• Use clear lighting for the front-facing photograph.</li>
                <li>• Ensure your college roll number on your Student ID is readable.</li>
                <li>• Do not upload cropped or distorted ID cards.</li>
                <li>• Keep your registered mobile active for gate alerts.</li>
              </ul>
            </div>

            <div className="border-t border-border pt-6 text-xs text-muted-foreground">
              <ShieldCheck className="size-5 text-primary mb-2" />
              <p className="font-semibold text-foreground">Privacy Protection</p>
              <p className="mt-1 leading-relaxed">
                Aadhaar card data is strictly protected under institutional data privacy policy.
                Gate security personnel never receive your government documents.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </AuroraShell>
  );
}
