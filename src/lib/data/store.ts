import fs from "fs";
import {
  User,
  Invitation,
  Participant,
  Event,
  ParticipantEvent,
  Document,
  QrPass,
  Gate,
  AccessLog,
  AuditLog,
} from "@/lib/types/database";
import { hashToken } from "@/lib/crypto/tokens";

const STORE_FILE_PATH = "/tmp/aurora-kaltarang-2026-store.json";
const CLOUD_INDEX_TOPIC =
  process.env.AURORA_CLOUD_TOPIC || "aurora_klt26_rgipt_prod_store_v3_7f91c2e4";
const CLOUD_POINTER_URL =
  "https://api.restful-api.dev/objects/ff808181a09d98f701a18892dca854f9";

export interface SentEmailRecord {
  id: string;
  to: string;
  subject: string;
  html: string;
  registrationId?: string;
  qrDataUrl?: string;
  participantName?: string;
  timestamp: string;
  deliveredVia: string;
}

export interface RuntimeEmailConfig {
  provider: "console" | "smtp" | "resend";
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPass?: string;
  resendApiKey?: string;
  fromEmail?: string;
}

export interface AuroraStore {
  registrationCounter: number;
  users: Map<string, User>;
  invitations: Map<string, Invitation>;
  participants: Map<string, Participant>;
  deletedParticipantIds: Set<string>;
  events: Map<string, Event>;
  participantEvents: Map<string, ParticipantEvent>;
  documents: Map<string, Document>;
  qrPasses: Map<string, QrPass>;
  gates: Map<string, Gate>;
  accessLogs: AccessLog[];
  auditLogs: AuditLog[];
  otpCodes: Map<string, { code: string; expiresAt: number; attempts: number }>;
  sentEmails: SentEmailRecord[];
  emailConfig: RuntimeEmailConfig;
}

const globalForAurora = globalThis as unknown as {
  __AURORA_STORE__?: AuroraStore;
  __AURORA_APPLIED_BLOBS__?: Set<string>;
};

const appliedBlobKeys: Set<string> =
  globalForAurora.__AURORA_APPLIED_BLOBS__ || new Set<string>();
globalForAurora.__AURORA_APPLIED_BLOBS__ = appliedBlobKeys;

function createEmptyStore(): AuroraStore {
  return {
    registrationCounter: 420,
    users: new Map<string, User>(),
    invitations: new Map<string, Invitation>(),
    participants: new Map<string, Participant>(),
    deletedParticipantIds: new Set<string>(),
    events: new Map<string, Event>(),
    participantEvents: new Map<string, ParticipantEvent>(),
    documents: new Map<string, Document>(),
    qrPasses: new Map<string, QrPass>(),
    gates: new Map<string, Gate>(),
    accessLogs: [],
    auditLogs: [],
    otpCodes: new Map(),
    sentEmails: [],
    emailConfig: {
      provider: process.env.RESEND_API_KEY
        ? "resend"
        : process.env.SMTP_USER
        ? "smtp"
        : "console",
      smtpHost: process.env.SMTP_HOST || "smtp.gmail.com",
      smtpPort: parseInt(process.env.SMTP_PORT || "465", 10),
      smtpUser: process.env.SMTP_USER || "",
      smtpPass: process.env.SMTP_PASSWORD || "",
      resendApiKey: process.env.RESEND_API_KEY || "",
      fromEmail: process.env.EMAIL_FROM || "Kaltarang 2026 <no-reply@kaltarang.in>",
    },
  };
}

export const memoryStore: AuroraStore =
  globalForAurora.__AURORA_STORE__ || createEmptyStore();

if (!memoryStore.deletedParticipantIds) {
  memoryStore.deletedParticipantIds = new Set<string>();
}

globalForAurora.__AURORA_STORE__ = memoryStore;

const SINGLE_MAIN_GATE: Gate = {
  id: "gate-main",
  name: "RGIPT MAIN GATE",
  location: "Rajiv Gandhi Institute of Petroleum Technology · Main Campus Entrance",
  status: "ACTIVE",
  created_at: new Date().toISOString(),
};

function enforceSingleGate() {
  memoryStore.gates.clear();
  memoryStore.gates.set(SINGLE_MAIN_GATE.id, SINGLE_MAIN_GATE);
}

/**
 * Offloads heavy base64 images for a participant into an isolated cloud blob
 * so the master store index stays ~350 bytes per participant (supporting 120-500+ participants effortlessly).
 */
export async function offloadParticipantImages(p: Participant): Promise<void> {
  const hasInlineSelfie = Boolean(p.selfie_path && p.selfie_path.startsWith("data:image") && p.selfie_path.length > 500);
  const hasInlineStu = Boolean(p.student_id_path && p.student_id_path.startsWith("data:image") && p.student_id_path.length > 500);
  const hasInlineAad = Boolean(p.aadhaar_path && p.aadhaar_path.startsWith("data:image") && p.aadhaar_path.length > 500);

  if (!hasInlineSelfie && !hasInlineStu && !hasInlineAad) return;

  try {
    const payload = {
      selfie: hasInlineSelfie ? p.selfie_path : undefined,
      student_id: hasInlineStu ? p.student_id_path : undefined,
      aadhaar: hasInlineAad ? p.aadhaar_path : undefined,
    };

    const res = await fetch("https://bytebin.lucko.me/post", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    if (res.ok) {
      const { key } = await res.json();
      if (key) {
        if (hasInlineSelfie) p.selfie_path = `/api/doc?key=${key}&f=selfie`;
        if (hasInlineStu) p.student_id_path = `/api/doc?key=${key}&f=student_id`;
        if (hasInlineAad) p.aadhaar_path = `/api/doc?key=${key}&f=aadhaar`;

        // Also slim down corresponding Document records
        const stuDoc = memoryStore.documents.get(`doc-stu-${p.id}`);
        if (stuDoc && stuDoc.storage_path?.startsWith("data:image")) {
          stuDoc.storage_path = `/api/doc?key=${key}&f=student_id`;
        }
        const aadDoc = memoryStore.documents.get(`doc-aad-${p.id}`);
        if (aadDoc && aadDoc.storage_path?.startsWith("data:image")) {
          aadDoc.storage_path = `/api/doc?key=${key}&f=aadhaar`;
        }
      }
    }
  } catch (err) {
    console.warn("Image offload warning:", err);
  }
}

function serializeStore() {
  enforceSingleGate();
  return {
    registrationCounter: memoryStore.registrationCounter,
    users: Array.from(memoryStore.users.entries()),
    invitations: Array.from(memoryStore.invitations.entries()),
    participants: Array.from(memoryStore.participants.entries()),
    deletedParticipantIds: Array.from(memoryStore.deletedParticipantIds),
    events: Array.from(memoryStore.events.entries()),
    participantEvents: Array.from(memoryStore.participantEvents.entries()),
    documents: Array.from(memoryStore.documents.entries()),
    qrPasses: Array.from(memoryStore.qrPasses.entries()),
    gates: Array.from(memoryStore.gates.entries()),
    accessLogs: memoryStore.accessLogs.slice(-500),
    auditLogs: memoryStore.auditLogs.slice(-300),
    sentEmails: memoryStore.sentEmails.slice(-150).map((e) => ({
      ...e,
      // Keep email log lightweight
      html: e.html && e.html.length > 1500 ? "" : e.html,
    })),
    emailConfig: memoryStore.emailConfig,
  };
}

function mergeSerializedIntoMemory(data: any) {
  if (!data) return;

  if (Array.isArray(data.deletedParticipantIds)) {
    for (const delId of data.deletedParticipantIds) {
      memoryStore.deletedParticipantIds.add(delId);
      memoryStore.participants.delete(delId);
      memoryStore.documents.delete(`doc-stu-${delId}`);
      memoryStore.documents.delete(`doc-aad-${delId}`);
    }
  }

  if (typeof data.registrationCounter === "number") {
    memoryStore.registrationCounter = Math.max(
      memoryStore.registrationCounter,
      data.registrationCounter
    );
  }

  for (const [k, v] of (data.users || []) as [string, User][]) {
    memoryStore.users.set(k, v);
  }
  for (const [k, v] of (data.invitations || []) as [string, Invitation][]) {
    memoryStore.invitations.set(k, v);
  }
  for (const [k, v] of (data.participants || []) as [string, Participant][]) {
    if (memoryStore.deletedParticipantIds.has(k)) continue;
    const existing = memoryStore.participants.get(k);
    if (
      !existing ||
      new Date(v.updated_at || 0).getTime() >= new Date(existing.updated_at || 0).getTime()
    ) {
      memoryStore.participants.set(k, v);
    }
  }
  for (const [k, v] of (data.events || []) as [string, Event][]) {
    memoryStore.events.set(k, v);
  }
  for (const [k, v] of (data.participantEvents || []) as [string, ParticipantEvent][]) {
    memoryStore.participantEvents.set(k, v);
  }
  for (const [k, v] of (data.documents || []) as [string, Document][]) {
    if (v?.participant_id && memoryStore.deletedParticipantIds.has(v.participant_id)) continue;
    memoryStore.documents.set(k, v);
  }
  for (const [k, v] of (data.qrPasses || []) as [string, QrPass][]) {
    if (v?.participant_id && memoryStore.deletedParticipantIds.has(v.participant_id)) continue;
    memoryStore.qrPasses.set(k, v);
  }

  enforceSingleGate();

  if (Array.isArray(data.accessLogs)) {
    const logMap = new Map<string, AccessLog>();
    for (const l of memoryStore.accessLogs) {
      if (!memoryStore.deletedParticipantIds.has(l.participant_id)) logMap.set(l.id, l);
    }
    for (const l of data.accessLogs) {
      if (!memoryStore.deletedParticipantIds.has(l.participant_id)) logMap.set(l.id, l);
    }
    memoryStore.accessLogs = Array.from(logMap.values()).sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }

  if (Array.isArray(data.auditLogs)) {
    const auditMap = new Map<string, AuditLog>();
    for (const l of memoryStore.auditLogs) auditMap.set(l.id, l);
    for (const l of data.auditLogs) auditMap.set(l.id, l);
    memoryStore.auditLogs = Array.from(auditMap.values()).sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
  }

  if (Array.isArray(data.sentEmails)) {
    const emailMap = new Map<string, SentEmailRecord>();
    for (const e of memoryStore.sentEmails) emailMap.set(e.id, e);
    for (const e of data.sentEmails) emailMap.set(e.id, e);
    memoryStore.sentEmails = Array.from(emailMap.values()).sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }

  if (data.emailConfig && (data.emailConfig.smtpPass || data.emailConfig.resendApiKey)) {
    memoryStore.emailConfig = data.emailConfig;
  }
}

export async function saveStoreToDisk(): Promise<void> {
  // Automatically offload any inline base64 images so master store stays tiny even at 120+ participants
  for (const p of memoryStore.participants.values()) {
    await offloadParticipantImages(p);
  }

  const serialized = serializeStore();
  const jsonStr = JSON.stringify(serialized);

  // 1. Write to local disk (/tmp)
  try {
    fs.writeFileSync(STORE_FILE_PATH, jsonStr, "utf-8");
  } catch (err) {
    console.warn("Could not persist store to local disk:", err);
  }

  // 2. Sync to shared serverless cloud store (bytebin + dual pointers)
  try {
    const postRes = await fetch("https://bytebin.lucko.me/post", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: jsonStr,
      cache: "no-store",
    });

    if (postRes.ok) {
      const { key } = await postRes.json();
      if (key) {
        appliedBlobKeys.add(key);
        await Promise.allSettled([
          fetch(CLOUD_POINTER_URL, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: "aurora-klt26-store-pointer",
              data: { blobKey: key, ts: Date.now() },
            }),
            cache: "no-store",
          }),
          fetch(`https://ntfy.sh/${CLOUD_INDEX_TOPIC}`, {
            method: "POST",
            body: JSON.stringify({ blobKey: key, ts: Date.now() }),
            cache: "no-store",
          }),
        ]);
      }
    }
  } catch (err) {
    console.warn("Cloud store sync warning:", err);
  }
}

export async function loadStoreFromDisk(): Promise<boolean> {
  let loaded = false;

  // 1. Load from local /tmp if present
  try {
    if (fs.existsSync(STORE_FILE_PATH)) {
      const raw = fs.readFileSync(STORE_FILE_PATH, "utf-8");
      const data = JSON.parse(raw);
      if (data && data.gates && data.gates.length > 0) {
        mergeSerializedIntoMemory(data);
        loaded = true;
      }
    }
  } catch (err) {
    console.warn("Local disk load warning:", err);
  }

  // 2. Pull latest snapshots from shared serverless cloud store
  try {
    const keysToFetch: string[] = [];

    // Primary fast pointer (no rate limit)
    try {
      const ptrRes = await fetch(CLOUD_POINTER_URL, { cache: "no-store" });
      if (ptrRes.ok) {
        const ptrJson = await ptrRes.json();
        const k = ptrJson?.data?.blobKey;
        if (k && !keysToFetch.includes(k)) {
          keysToFetch.push(k);
        }
      }
    } catch {}

    // Secondary pointer fallback (ntfy) only if primary didn't return a new key
    if (keysToFetch.length === 0) {
      try {
        const res = await fetch(`https://ntfy.sh/${CLOUD_INDEX_TOPIC}/json?poll=1&since=all`, {
          cache: "no-store",
        });
        if (res.ok) {
          const text = (await res.text()).trim();
          if (text) {
            const lines = text.split("\n");
            for (const line of lines.slice(-3)) {
              try {
                const evt = JSON.parse(line);
                if (evt.event === "message" && evt.message) {
                  const msg = JSON.parse(evt.message);
                  if (msg.blobKey && !keysToFetch.includes(msg.blobKey)) {
                    keysToFetch.push(msg.blobKey);
                  }
                }
              } catch {}
            }
          }
        }
      } catch {}
    }

    for (const key of keysToFetch) {
      if (!appliedBlobKeys.has(key)) {
        const blobRes = await fetch(`https://bytebin.lucko.me/${key}`, {
          cache: "no-store",
        });
        if (blobRes.ok) {
          const cloudData = await blobRes.json();
          mergeSerializedIntoMemory(cloudData);
          appliedBlobKeys.add(key);
          loaded = true;
        }
      }
    }
  } catch (err) {
    console.warn("Cloud store pull warning:", err);
  }

  enforceSingleGate();
  return loaded;
}

export function getNextRegistrationId(): string {
  const base = Math.max(memoryStore.registrationCounter, 420 + memoryStore.participants.size);
  memoryStore.registrationCounter = base + 1;
  return `KLT26-${String(memoryStore.registrationCounter).padStart(6, "0")}`;
}

export function initializeSeedData() {
  if (memoryStore.gates.size > 0) return;

  // Single Campus Gate (RGIPT Main Gate)
  enforceSingleGate();

  // Super Admin User (24mc3008@rgipt.ac.in)
  const superAdminUser: User = {
    id: "usr-super-admin-1",
    auth_user_id: "auth-super-admin-1",
    email: "24mc3008@rgipt.ac.in",
    mobile: "+919876543210",
    role: "SUPER_ADMIN",
    status: "ACTIVE",
    full_name: "RGIPT Super Admin (24mc3008)",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  memoryStore.users.set(superAdminUser.id, superAdminUser);

  // Default Security Operator
  const secUser: User = {
    id: "usr-sec-1",
    auth_user_id: "auth-sec-1",
    email: "security@rgipt.ac.in",
    mobile: "+919876543211",
    role: "SECURITY_OPERATOR",
    status: "ACTIVE",
    full_name: "Security Guard (RGIPT Main Gate)",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  memoryStore.users.set(secUser.id, secUser);

  // Demo Participant 1 (Approved with active single static QR pass)
  const p1Token = "KLT26-000421";
  const p1Hash = hashToken(p1Token);
  const p1RegId = "KLT26-000421";
  const p1Id = "part-1";
  memoryStore.registrationCounter = 421;

  const p1: Participant = {
    id: p1Id,
    user_id: "usr-part-1",
    invitation_id: null,
    registration_id: p1RegId,
    full_name: "Arjun Mehta",
    email: "arjun.mehta@example.com",
    mobile: "+919876500001",
    college: "NIT Bhopal",
    course: "",
    year_of_study: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    selfie_path: "/assets/participant-avatar.jpg",
    payment_reference: "N/A",
    qr_token: p1Token,
    status: "APPROVED",
    campus_status: "OUTSIDE",
    correction_reason: null,
    rejection_reason: null,
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString(),
    submitted_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    approved_at: new Date(Date.now() - 86400000).toISOString(),
    approved_by: "usr-super-admin-1",
  };
  memoryStore.participants.set(p1.id, p1);

  const qrPass: QrPass = {
    id: "qr-1",
    participant_id: p1.id,
    token_hash: p1Hash,
    status: "ACTIVE",
    issued_at: new Date(Date.now() - 86400000).toISOString(),
    revoked_at: null,
    revoked_by: null,
  };
  memoryStore.qrPasses.set(p1Hash, qrPass);
}

initializeSeedData();
