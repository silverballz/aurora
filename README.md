# Aurora — Kaltarang 2026 Identity & Campus Access System

> **Aurora is Kaltarang 2026's official external participant identity and campus access system. It enables verified participants to complete their registration digitally, receive a secure QR access pass, and enter or exit the RGIPT campus through fast QR-based identity verification — replacing repetitive manual documentation at the gates with a centralized, auditable digital system.**

---

## Interfaces

| Interface | Route / Subdomain | Target Users & Purpose |
| :--- | :--- | :--- |
| **Participant Portal** | `/portal` or `portal.<domain>` | External participants: Email OTP login, 6-step registration wizard (Identity, Details, Live Camera Selfie, Student ID & Aadhaar uploads), registered schedule, and active QR pass. |
| **Admin Dashboard** | `/admin` or `admin.<domain>` | Kaltarang Fest Administration & Verifiers: Issue payment-verified invitations, side-by-side document review, approve/reject/request correction, live occupancy tracker, CSV reports, and audit trail. |
| **Gate Security Console** | `/security` or `security.<domain>` | Gate operators: Mobile-optimized live camera QR scanner, attendee photograph comparison, atomic ENTRY/EXIT state machine, duplicate scan rejection, supervisor PIN override. |

---

## Free-Tier & Zero-Cost Architecture

In accordance with system specifications, Aurora operates with **zero mandatory paid services**:

1. **Email Service Provider**:
   - **Resend (Free Tier)**: 3,000 emails/month free.
   - **Gmail SMTP (Free Tier via Nodemailer)**: 500 emails/day free with Google App Password.
   - **Console / Dev Outbox**: Automatically active when external keys are not provided; outputs formatted email notifications and OTP codes directly to terminal.
2. **Database & Storage**:
   - **Supabase (Free Tier)**: PostgreSQL with Row-Level Security, Auth, and private encrypted document storage buckets (`aurora-documents`, `aurora-selfies`).
3. **Frontend & Backend Hosting**:
   - **Next.js 15 (App Router)**: Deployable to **Vercel** hobby free tier.

---

## Quickstart

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env.local

# 3. Start development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000).

---

## Production Build & Verification

```bash
npm run build
npm start
```
