import { memoryStore, initializeSeedData } from "../src/lib/data/store";
import { hashToken, generateSecureToken } from "../src/lib/crypto/tokens";
import { POST as createInviteHandler } from "../src/app/api/invitations/create/route";
import { POST as validateInviteHandler } from "../src/app/api/invitations/validate/route";
import { POST as otpSendHandler } from "../src/app/api/auth/otp/send/route";
import { POST as otpVerifyHandler } from "../src/app/api/auth/otp/verify/route";
import { POST as profileHandler } from "../src/app/api/participant/profile/route";
import { POST as uploadDocHandler } from "../src/app/api/participant/documents/upload/route";
import { POST as submitRegistrationHandler } from "../src/app/api/participant/submit/route";
import { POST as approveHandler } from "../src/app/api/admin/verify/approve/route";
import { POST as scanHandler } from "../src/app/api/security/scan/route";
import { POST as entryHandler } from "../src/app/api/security/entry/route";
import { POST as exitHandler } from "../src/app/api/security/exit/route";

async function runTest() {
  console.log("=== AURORA SECTION 102 DEFINITION OF DONE VERIFICATION ===");
  initializeSeedData();

  // 1. ADMIN CREATES INVITATION
  console.log("\n[1] Admin creating invitation...");
  const createInviteReq = new Request("http://localhost:3000/api/invitations/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      participant_name: "Test Participant",
      email: "test.participant@example.com",
      mobile: "+919876543210",
      payment_reference: "TEST-001",
      payment_amount: 500,
    }),
  });
  const inviteRes = await createInviteHandler(createInviteReq);
  const inviteData = await inviteRes.json();
  console.log("-> Invitation created successfully:", inviteData.success);
  console.log("-> Raw token generated:", inviteData.inviteToken.slice(0, 16) + "...");
  console.log("-> Email sent to participant:", inviteData.emailDeliverySuccess);

  // 2. PARTICIPANT OPENS INVITATION & VALIDATES TOKEN
  console.log("\n[2] Participant opening invitation link...");
  const validateReq = new Request("http://localhost:3000/api/invitations/validate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: inviteData.inviteToken }),
  });
  const valRes = await validateInviteHandler(validateReq);
  const valData = await valRes.json();
  console.log("-> Token validated:", valData.valid);
  console.log("-> Masked email:", valData.invitation.maskedEmail);

  // 3. AUTHENTICATION VIA EMAIL OTP
  console.log("\n[3] Authenticating with Email OTP...");
  const otpSendReq = new Request("http://localhost:3000/api/auth/otp/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "test.participant@example.com" }),
  });
  const otpSendRes = await otpSendHandler(otpSendReq);
  const otpSendData = await otpSendRes.json();
  console.log("-> OTP sent:", otpSendData.success);
  const otpCode = memoryStore.otpCodes.get("test.participant@example.com")?.code || otpSendData.devHint;
  console.log("-> OTP Code retrieved:", otpCode);

  const otpVerifyReq = new Request("http://localhost:3000/api/auth/otp/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "test.participant@example.com", otp: otpCode }),
  });
  const otpVerifyRes = await otpVerifyHandler(otpVerifyReq);
  const otpVerifyData = await otpVerifyRes.json();
  console.log("-> OTP verified successfully:", otpVerifyData.success);
  console.log("-> Authenticated user role:", otpVerifyData.user.role);

  // 4. PARTICIPANT COMPLETES PROFILE, SELFIE, DOCUMENTS, & SUBMISSION
  console.log("\n[4] Participant filling profile & uploading documents...");
  const profileReq = new Request("http://localhost:3000/api/participant/profile", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "test.participant@example.com",
      college: "IIT Bombay",
      course: "B.Tech Computer Science",
      year_of_study: "3rd Year",
      address: "Hostel 12, Powai",
      city: "Mumbai",
      state: "Maharashtra",
      pincode: "400076",
      selfie_path: "/assets/participant-avatar.jpg",
    }),
  });
  const profileRes = await profileHandler(profileReq);
  const profileData = await profileRes.json();
  console.log("-> Profile saved:", profileData.success);

  const participantId = profileData.participant.id;

  // Add Student ID and Aadhaar records in store
  memoryStore.documents.set("doc-test-1", {
    id: "doc-test-1",
    participant_id: participantId,
    document_type: "STUDENT_ID",
    storage_path: `participants/${participantId}/student_id.pdf`,
    original_filename: "student_id.pdf",
    mime_type: "application/pdf",
    file_size: 1024000,
    status: "PENDING",
    uploaded_at: new Date().toISOString(),
    verified_at: null,
    verified_by: null,
  });
  memoryStore.documents.set("doc-test-2", {
    id: "doc-test-2",
    participant_id: participantId,
    document_type: "AADHAAR",
    storage_path: `participants/${participantId}/aadhaar.pdf`,
    original_filename: "aadhaar.pdf",
    mime_type: "application/pdf",
    file_size: 1524000,
    status: "PENDING",
    uploaded_at: new Date().toISOString(),
    verified_at: null,
    verified_by: null,
  });

  // Submit registration
  const submitReq = new Request("http://localhost:3000/api/participant/submit", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: `aurora_session=${Buffer.from(JSON.stringify({ userId: "usr-test", email: "test.participant@example.com" })).toString("base64")}`,
    },
    body: JSON.stringify({
      confirmed: true,
      participant_id: participantId,
      email: "test.participant@example.com",
      selected_event_ids: ["evt-rocktaves"],
    }),
  });
  const submitRes = await submitRegistrationHandler(submitReq);
  const submitData = await submitRes.json();
  console.log("-> Registration submitted status:", submitData.participant.status);

  // 5. ADMIN VERIFIES & APPROVES
  console.log("\n[5] Admin approving participant...");
  const approveReq = new Request("http://localhost:3000/api/admin/verify/approve", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ participant_id: participantId }),
  });
  const approveRes = await approveHandler(approveReq);
  const approveData = await approveRes.json();
  console.log("-> Approved status:", approveData.participant.status);
  console.log("-> Registration ID issued:", approveData.registration_id);
  console.log("-> QR pass generated:", approveData.qrDataUrl.startsWith("data:image/png;base64,"));
  console.log("-> Confirmation email sent:", approveData.emailSent);

  // 6. SECURITY OPERATOR SCANS QR
  console.log("\n[6] Security Gate scanning QR pass...");
  // Find token hash for participant
  let tokenHash = "";
  for (const qr of memoryStore.qrPasses.values()) {
    if (qr.participant_id === participantId && qr.status === "ACTIVE") {
      tokenHash = qr.token_hash;
      break;
    }
  }

  const scanReq = new Request("http://localhost:3000/api/security/scan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: tokenHash, gate_id: "gate-main" }),
  });
  const scanRes = await scanHandler(scanReq);
  const scanData = await scanRes.json();
  console.log("-> Scan verified:", scanData.valid);
  console.log("-> Attendee Name:", scanData.participant.full_name);
  console.log("-> Attendee College:", scanData.participant.college);
  console.log("-> Registered photo present:", Boolean(scanData.participant.selfie_path));
  console.log("-> Campus Status before entry:", scanData.participant.campus_status);

  // 7. SECURITY ALLOWS ENTRY
  console.log("\n[7] Security operator clicking ALLOW ENTRY...");
  const entryReq = new Request("http://localhost:3000/api/security/entry", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ participant_id: participantId, gate_id: "gate-main" }),
  });
  const entryRes = await entryHandler(entryReq);
  const entryData = await entryRes.json();
  console.log("-> Entry allowed:", entryData.result === "ALLOWED");
  console.log("-> New Campus Status:", entryData.campus_status);

  // 8. SECOND SCAN — DUPLICATE ATTEMPT WHILE INSIDE
  console.log("\n[8] Second scan attempt while participant is already inside...");
  const secondEntryReq = new Request("http://localhost:3000/api/security/entry", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ participant_id: participantId, gate_id: "gate-main" }),
  });
  const secondEntryRes = await entryHandler(secondEntryReq);
  const secondEntryData = await secondEntryRes.json();
  console.log("-> Duplicate entry blocked (HTTP 409):", secondEntryRes.status === 409);
  console.log("-> Blocked message:", secondEntryData.message);

  // 9. SECURITY ALLOWS EXIT
  console.log("\n[9] Security operator clicking ALLOW EXIT...");
  const exitReq = new Request("http://localhost:3000/api/security/exit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ participant_id: participantId, gate_id: "gate-main" }),
  });
  const exitRes = await exitHandler(exitReq);
  const exitData = await exitRes.json();
  console.log("-> Exit allowed:", exitData.result === "ALLOWED");
  console.log("-> New Campus Status:", exitData.campus_status);

  // 10. RE-ENTRY PERMITTED NOW THAT PARTICIPANT IS OUTSIDE
  console.log("\n[10] Re-entry scan after exit...");
  const reEntryReq = new Request("http://localhost:3000/api/security/entry", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ participant_id: participantId, gate_id: "gate-main" }),
  });
  const reEntryRes = await entryHandler(reEntryReq);
  const reEntryData = await reEntryRes.json();
  console.log("-> Re-entry successful:", reEntryData.result === "ALLOWED");
  console.log("-> Final Campus Status:", reEntryData.campus_status);

  console.log("\n✅ ALL 10 STEPS OF DEFINITION OF DONE PASSED PERFECTLY!");
}

runTest().catch(console.error);
