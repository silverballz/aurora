# Aurora — Security Architecture & Data Privacy Guide
## Kaltarang 2026 External Participant Identity & Access System

---

## 1. Core Security Guarantees

Aurora enforces strict institutional security controls:

### 1. Zero Document Leakage (Data Minimization)
- **Security operators at gates NEVER receive Aadhaar cards, Student ID files, payment details, or permanent addresses.**
- Security operators receive exclusively: Full Name, Registered Photo, College, Course, Year, Registration ID, and Campus Status (`INSIDE`/`OUTSIDE`).

### 2. Private Storage Buckets
- Buckets `aurora-documents` and `aurora-selfies` are **strictly private**.
- Direct public URLs are disabled. Documents are accessed only via short-lived authenticated server-side signed URLs.

### 3. Cryptographically Secure Invitation Tokens
- Raw invitation tokens are generated with 256 bits of cryptographic entropy (`crypto.randomBytes(32)`).
- Raw tokens are never stored plaintext in the database; only their **SHA-256 hash** is persisted.
- Single-use: Once redeemed, `invitations.status` becomes `USED`.

### 4. Opaque Signed QR Passes
- QR codes **never encode PII, Aadhaar numbers, phone numbers, or participant records**.
- Each QR pass contains only an opaque, signed random credential validated by the server.
- Registration ID (e.g. `KLT26-000421`) is human-readable and separate from the QR secret.

### 5. Atomic State Transitions & Concurrency Control
- PostgreSQL stored procedures use `SELECT ... FOR UPDATE` row-level locks.
- Prevents concurrent scans across multiple gates (e.g. Gate A and Gate B scanned simultaneously) from creating duplicate entries.
- Valid State Flow: `OUTSIDE` → `ENTRY` → `INSIDE` → `EXIT` → `OUTSIDE`.
- Blocks invalid transitions:
  - `OUTSIDE` → `EXIT` (Blocked)
  - `INSIDE` → `ENTRY` (Blocked: duplicate pass reuse detected)

---

## 2. Free Tier Configuration (No Hostinger Required)

To run Aurora with **zero cost**, configure the following in `.env`:

### Email Delivery Options
1. **Resend (Free Tier)**
   - Sign up free at [resend.com](https://resend.com) (3,000 emails/month free, 100/day).
   - Set `EMAIL_PROVIDER=resend` and `RESEND_API_KEY=re_...`.

2. **Gmail SMTP (Free Tier via Nodemailer)**
   - Use any free Google account with an **App Password** (500 emails/day free).
   - Set:
     ```env
     EMAIL_PROVIDER=smtp
     SMTP_HOST=smtp.gmail.com
     SMTP_PORT=465
     SMTP_SECURE=true
     SMTP_USER=your_email@gmail.com
     SMTP_PASSWORD=your_16_char_app_password
     ```

3. **Console Development Mode (Default)**
   - When `EMAIL_PROVIDER=console` or when external keys are omitted, all OTPs, invitation links, and approval notifications are formatted cleanly in the terminal console and accessible via the in-memory outbox.

### Database & Auth
- **Supabase (Free Tier)**: PostgreSQL database, Auth with Email OTP, and 1GB private storage at [supabase.com](https://supabase.com).

### Deployment
- **Vercel (Free Hobby Tier)**: Instant deployment for Next.js App Router.
