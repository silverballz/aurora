# Aurora — Database & Storage Architecture
## Kaltarang 2026 External Participant Identity & Access System

---

## 1. Database Schema Overview

PostgreSQL 15+ hosted on Supabase (Free Tier).

### Key Entities

```text
users
  ├── id (UUID, PK)
  ├── auth_user_id (UUID, FK -> auth.users)
  ├── email (TEXT, Unique)
  ├── mobile (TEXT)
  ├── role (user_role: SUPER_ADMIN, FEST_ADMIN, VERIFICATION_ADMIN, SECURITY_SUPERVISOR, SECURITY_OPERATOR, PARTICIPANT)
  └── status (TEXT)

invitations
  ├── id (UUID, PK)
  ├── token_hash (TEXT, Unique, SHA-256)
  ├── email (TEXT)
  ├── mobile (TEXT)
  ├── participant_name (TEXT)
  ├── payment_reference (TEXT)
  ├── payment_amount (NUMERIC)
  ├── payment_date (DATE)
  ├── status (invitation_status: ACTIVE, USED, EXPIRED, REVOKED)
  ├── expires_at (TIMESTAMPTZ)
  └── used_at (TIMESTAMPTZ)

participants
  ├── id (UUID, PK)
  ├── user_id (UUID, FK -> users)
  ├── invitation_id (UUID, FK -> invitations)
  ├── registration_id (TEXT, Unique, format: KLT26-000001)
  ├── full_name (TEXT)
  ├── email (TEXT, Unique)
  ├── mobile (TEXT)
  ├── college (TEXT)
  ├── course (TEXT)
  ├── year_of_study (TEXT)
  ├── address, city, state, pincode
  ├── selfie_path (TEXT)
  ├── status (participant_status: INVITED, IN_PROGRESS, UNDER_REVIEW, CORRECTION, APPROVED, REVOKED)
  ├── campus_status (campus_status: OUTSIDE, INSIDE)
  ├── correction_reason (TEXT)
  └── approved_at, approved_by

events
  ├── id (UUID, PK)
  ├── name, description, date, start_time, end_time, venue, status

participant_events
  ├── participant_id, event_id, status

documents
  ├── id (UUID, PK)
  ├── participant_id (UUID, FK -> participants)
  ├── document_type (document_type: STUDENT_ID, AADHAAR)
  ├── storage_path (TEXT)
  ├── original_filename (TEXT)
  ├── mime_type (TEXT)
  ├── file_size (BIGINT)
  └── status (TEXT)

qr_passes
  ├── id (UUID, PK)
  ├── participant_id (UUID, FK -> participants)
  ├── token_hash (TEXT, Unique)
  ├── status (qr_pass_status: ACTIVE, REVOKED)
  └── issued_at, revoked_at

gates
  ├── id (UUID, PK)
  ├── name (TEXT: MAIN GATE, HOSTEL GATE, OAT / ARENA GATE, BACK GATE)
  └── location (TEXT)

access_logs
  ├── id (UUID, PK)
  ├── participant_id (UUID, FK -> participants)
  ├── registration_id (TEXT)
  ├── gate_id (UUID, FK -> gates)
  ├── operator_id (UUID, FK -> users)
  ├── action (access_action: ENTRY, EXIT)
  ├── result (access_result: ALLOWED, BLOCKED, OVERRIDDEN)
  ├── notes (TEXT)
  └── timestamp (TIMESTAMPTZ)

audit_logs
  ├── id (UUID, PK)
  ├── actor_id (UUID, FK -> users)
  ├── action (TEXT)
  ├── entity_type (TEXT)
  ├── entity_id (TEXT)
  ├── metadata (JSONB)
  └── created_at (TIMESTAMPTZ)
```

---

## 2. Atomic Row-Locking Functions

### `process_gate_entry(p_token_hash, p_gate_id, p_operator_id, p_notes)`
1. Looks up QR pass by `token_hash`.
2. Locks participant record: `SELECT * FROM participants WHERE id = ... FOR UPDATE`.
3. Validates participant `status = 'APPROVED'`.
4. Checks `campus_status`:
   - If `campus_status = 'INSIDE'`: Inserts access log with `result = 'BLOCKED'`, `notes = 'Already inside'`. Returns blocked response with last entry details.
   - If `campus_status = 'OUTSIDE'`: Updates `campus_status = 'INSIDE'`, inserts access log with `result = 'ALLOWED'`.

### `process_gate_exit(p_token_hash, p_gate_id, p_operator_id, p_notes)`
1. Locks participant record `FOR UPDATE`.
2. Validates `campus_status`:
   - If `campus_status = 'OUTSIDE'`: Inserts access log with `result = 'BLOCKED'`, `notes = 'Not currently inside'`. Returns blocked response.
   - If `campus_status = 'INSIDE'`: Updates `campus_status = 'OUTSIDE'`, inserts access log with `result = 'ALLOWED'`.

---

## 3. Storage Buckets & Policies

- `aurora-documents` (Private, 5MB limit, PDF/PNG/JPEG)
- `aurora-selfies` (Private, 3MB limit, JPEG/PNG)
- Security operators never receive direct URLs to `aurora-documents`.
