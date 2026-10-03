# Aurora — Operations & Standard Operating Procedures (SOP)
## Kaltarang 2026 External Participant Identity & Access System

---

## 1. Overview & Operational Philosophy

Aurora eliminates manual paperwork, physical document inspection, and queues at the RGIPT campus gates.

**Core Principle:**
> The participant completes all necessary documentation **once, before arriving at campus**.
> At the gate, security operates on:
> **SCAN → IDENTIFY → VERIFY → ALLOW**

---

## 2. Admin SOP — Payment to Invitation Dispatch

### Step 1: Payment Verification
1. External participant pays the participation fee via the official fest payment channel (UPI / Bank Transfer).
2. Accounts desk verifies payment receipt and transaction reference.

### Step 2: Issuing Invitation in Aurora
1. Fest Admin navigates to `/admin/invitations`.
2. Clicks **Issue New Invitation**.
3. Enters:
   - Full Name
   - Email
   - Mobile Number
   - Payment Reference ID (e.g. `TXN-99420`)
   - Amount
4. Clicks **Generate Invitation**.
5. Aurora generates a cryptographically random, single-use, expirable invitation token (`crypto.randomBytes(32)`), stores the SHA-256 hash in the database, and dispatches an email to the participant.

---

## 3. Participant SOP — Registration Journey

1. **Invitation Link**: Participant clicks the secure button in their email (`https://portal.kaltarang.in/invite/<secure-token>`).
2. **Email OTP Authentication**: Participant requests a 6-digit one-time password delivered to their invited email address.
3. **Step 1 — Identity Confirmation**: Verified Name, Email, and Mobile are locked to prevent identity takeover.
4. **Step 2 — Personal Details**: Fills in College/Institution, Degree/Course, Year of Study, and Address.
5. **Step 3 — Live Selfie**: Uses device camera to capture a clear, front-facing photograph.
6. **Step 4 — Documents**: Uploads Student ID and Aadhaar card (PDF/JPEG/PNG).
7. **Step 5 — Events**: Selects registered competitions and cultural events.
8. **Step 6 — Review & Declaration**: Confirms legal ownership and accuracy of documents, then submits.
9. **Status**: Enters `UNDER_REVIEW`.

---

## 4. Admin SOP — Document Verification & Approval

1. Verification Admin opens `/admin/verification`.
2. Inspects candidate dossier:
   - Compares registered front-facing photograph with Student ID.
   - Verifies institution name and course.
   - Checks payment reference.
3. **Actions**:
   - **APPROVE**: Atomically creates sequential Registration ID (`KLT26-XXXXXX`), generates high-entropy opaque QR credential, activates participant, and emails confirmation QR pass.
   - **REQUEST CORRECTION**: Specifies exact reason (e.g. *"Student ID image is blurry"*). Aurora emails the participant with an update link.
   - **REJECT**: If fraudulent, specifies reason and revokes record.

---

## 5. Security Gate Operator SOP — QR Scanning & Gate Check

1. Operator opens `/security` on a mobile device or tablet.
2. Selects assigned campus gate:
   - **MAIN GATE** (North / Admin Block)
   - **HOSTEL GATE** (South Campus / Student Residence)
   - **OAT / ARENA GATE** (Festival Ground)
   - **BACK GATE** (East Service Road)
3. Clicks **Start QR Scanner** and points camera at participant's digital pass.
4. Screen displays:
   - Registered Photograph
   - Participant Name
   - College & Course
   - Registration ID
   - Current Campus Status (`OUTSIDE` or `INSIDE`)
5. Operator visually verifies person standing at the gate matches the registered photo.
6. Clicks **ALLOW ENTRY** (if entering) or **ALLOW EXIT** (if leaving).
7. System atomically switches status and produces an immutable access log.

---

## 6. Exception Handling & Edge Cases

### Participant Scans Again While Already Inside
- System displays: `⚠ PARTICIPANT ALREADY INSIDE (Last recorded entry: MAIN GATE 14:31. No new entry recorded.)`
- Gate entry is strictly blocked to prevent pass sharing.

### Participant Attempts Exit While Outside
- System displays: `⚠ PARTICIPANT IS NOT CURRENTLY INSIDE. Cannot record campus exit.`

### Camera or Scanner Malfunction (Supervisor Override)
- Security operator requests supervisor.
- Supervisor clicks **Supervisor Override**.
- Enters operational PIN (`2026`) and explicit justification.
- State is updated and an `ACCESS_OVERRIDE` audit event is logged.
