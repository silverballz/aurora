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
};

function createEmptyStore(): AuroraStore {
  return {
    registrationCounter: 420,
    users: new Map<string, User>(),
    invitations: new Map<string, Invitation>(),
    participants: new Map<string, Participant>(),
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

globalForAurora.__AURORA_STORE__ = memoryStore;

export function saveStoreToDisk() {
  try {
    const serialized = {
      registrationCounter: memoryStore.registrationCounter,
      users: Array.from(memoryStore.users.entries()),
      invitations: Array.from(memoryStore.invitations.entries()),
      participants: Array.from(memoryStore.participants.entries()),
      events: Array.from(memoryStore.events.entries()),
      participantEvents: Array.from(memoryStore.participantEvents.entries()),
      documents: Array.from(memoryStore.documents.entries()),
      qrPasses: Array.from(memoryStore.qrPasses.entries()),
      gates: Array.from(memoryStore.gates.entries()),
      accessLogs: memoryStore.accessLogs,
      auditLogs: memoryStore.auditLogs,
      sentEmails: memoryStore.sentEmails,
      emailConfig: memoryStore.emailConfig,
    };
    fs.writeFileSync(STORE_FILE_PATH, JSON.stringify(serialized), "utf-8");
  } catch (err) {
    console.warn("Could not persist store to disk:", err);
  }
}

export function loadStoreFromDisk(): boolean {
  try {
    if (!fs.existsSync(STORE_FILE_PATH)) return false;
    const raw = fs.readFileSync(STORE_FILE_PATH, "utf-8");
    const data = JSON.parse(raw);
    if (!data || !data.gates || data.gates.length === 0) return false;

    memoryStore.registrationCounter = data.registrationCounter || 421;
    memoryStore.users = new Map(data.users || []);
    memoryStore.invitations = new Map(data.invitations || []);
    memoryStore.participants = new Map(data.participants || []);
    memoryStore.events = new Map(data.events || []);
    memoryStore.participantEvents = new Map(data.participantEvents || []);
    memoryStore.documents = new Map(data.documents || []);
    memoryStore.qrPasses = new Map(data.qrPasses || []);
    memoryStore.gates = new Map(data.gates || []);
    memoryStore.accessLogs = data.accessLogs || [];
    memoryStore.auditLogs = data.auditLogs || [];
    memoryStore.sentEmails = data.sentEmails || [];
    if (data.emailConfig) {
      memoryStore.emailConfig = data.emailConfig;
    }
    return true;
  } catch (err) {
    console.warn("Could not load store from disk:", err);
    return false;
  }
}

export function getNextRegistrationId(): string {
  loadStoreFromDisk();
  memoryStore.registrationCounter += 1;
  const regId = `KLT26-${String(memoryStore.registrationCounter).padStart(6, "0")}`;
  saveStoreToDisk();
  return regId;
}

export function initializeSeedData() {
  if (loadStoreFromDisk()) {
    return;
  }
  if (memoryStore.gates.size > 0) return;

  // Campus Gates
  const defaultGates: Gate[] = [
    { id: "gate-main", name: "MAIN GATE", location: "Campus North Entrance / Admin Block", status: "ACTIVE", created_at: new Date().toISOString() },
    { id: "gate-hostel", name: "HOSTEL GATE", location: "South Campus / Student Residence", status: "ACTIVE", created_at: new Date().toISOString() },
    { id: "gate-arena", name: "OAT / ARENA GATE", location: "Open Air Theatre & Sports Complex", status: "ACTIVE", created_at: new Date().toISOString() },
    { id: "gate-back", name: "BACK GATE", location: "East Service Road & Logistics", status: "ACTIVE", created_at: new Date().toISOString() },
  ];
  defaultGates.forEach((g) => memoryStore.gates.set(g.id, g));

  // Kaltarang 2026 Events
  const defaultEvents: Event[] = [
    {
      id: "evt-rocktaves",
      name: "Battle of the Bands (Rocktaves)",
      description: "Flagship western & fusion rock band competition featuring top colleges across India.",
      date: "2026-10-14",
      start_time: "18:00",
      end_time: "22:00",
      venue: "Main Arena (OAT)",
      status: "ACTIVE",
      created_at: new Date().toISOString(),
    },
    {
      id: "evt-stepup",
      name: "Step Up (Western Group Dance)",
      description: "Inter-college group dance competition celebrating street, hip-hop, and contemporary dance.",
      date: "2026-10-15",
      start_time: "14:00",
      end_time: "18:00",
      venue: "Auditorium Hall A",
      status: "ACTIVE",
      created_at: new Date().toISOString(),
    },
    {
      id: "evt-digitalart",
      name: "Digital Arts & Generative Design Showcase",
      description: "Interactive digital media, generative graphics, and algorithmic creative workshop.",
      date: "2026-10-15",
      start_time: "10:30",
      end_time: "13:30",
      venue: "Academic Block 2 - Studio 3",
      status: "ACTIVE",
      created_at: new Date().toISOString(),
    },
    {
      id: "evt-pronite",
      name: "Pronite: Modern Folk & Electronic Fusion",
      description: "Headlining musical festival night with celebrated artists and live production.",
      date: "2026-10-16",
      start_time: "19:30",
      end_time: "23:30",
      venue: "Main Ground Arena",
      status: "ACTIVE",
      created_at: new Date().toISOString(),
    },
  ];
  defaultEvents.forEach((e) => memoryStore.events.set(e.id, e));

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

  // Default Fest Admin User
  const adminUser: User = {
    id: "usr-admin-1",
    auth_user_id: "auth-admin-1",
    email: "admin@kaltarang.in",
    mobile: "+919876543210",
    role: "FEST_ADMIN",
    status: "ACTIVE",
    full_name: "Kaltarang Admin Team",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  memoryStore.users.set(adminUser.id, adminUser);

  // Default Security Operator
  const secUser: User = {
    id: "usr-sec-1",
    auth_user_id: "auth-sec-1",
    email: "security@kaltarang.in",
    mobile: "+919876543211",
    role: "SECURITY_OPERATOR",
    status: "ACTIVE",
    full_name: "Operator 04 (Main Gate)",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  memoryStore.users.set(secUser.id, secUser);

  // Demo Participant 1 (Approved with active single static QR pass)
  const p1Token = "demo-approved-qr-token-secret-123456";
  const p1Hash = hashToken(p1Token);
  const p1RegId = "KLT26-000421";
  const p1Id = "part-1";
  memoryStore.registrationCounter = 421;

  const p1: Participant = {
    id: p1Id,
    user_id: "usr-part-1",
    invitation_id: "inv-demo-1",
    registration_id: p1RegId,
    full_name: "Arjun Mehta",
    email: "arjun.mehta@example.com",
    mobile: "+919876500001",
    college: "NIT Bhopal",
    course: "B.Tech Computer Science",
    year_of_study: "3rd Year",
    address: "Room 304, Hostel 7, MANIT Campus",
    city: "Bhopal",
    state: "Madhya Pradesh",
    pincode: "462003",
    selfie_path: "/assets/participant-avatar.jpg",
    payment_reference: "UTR-9028471204",
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

  // Demo Participant 2 (Under Review)
  const p2: Participant = {
    id: "part-2",
    user_id: "usr-part-2",
    invitation_id: "inv-demo-2",
    registration_id: null,
    full_name: "Kavya Singh",
    email: "kavya.singh@example.com",
    mobile: "+919876500002",
    college: "IIT Patna",
    course: "B.Tech Electrical Engineering",
    year_of_study: "2nd Year",
    address: "Wing B, Girls Hostel, IIT Patna",
    city: "Patna",
    state: "Bihar",
    pincode: "801106",
    selfie_path: "/assets/participant-avatar.jpg",
    payment_reference: "UTR-8839201945",
    status: "UNDER_REVIEW",
    campus_status: "OUTSIDE",
    correction_reason: null,
    rejection_reason: null,
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    submitted_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    approved_at: null,
    approved_by: null,
  };
  memoryStore.participants.set(p2.id, p2);

  // Demo Access Logs
  memoryStore.accessLogs.push(
    {
      id: "log-1",
      participant_id: p1.id,
      registration_id: p1RegId,
      gate_id: "gate-main",
      operator_id: "usr-sec-1",
      action: "ENTRY",
      result: "ALLOWED",
      notes: "Gate check visual match",
      timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
    },
    {
      id: "log-2",
      participant_id: p1.id,
      registration_id: p1RegId,
      gate_id: "gate-arena",
      operator_id: "usr-sec-1",
      action: "EXIT",
      result: "ALLOWED",
      notes: "Normal exit",
      timestamp: new Date(Date.now() - 3600000 * 1).toISOString(),
    }
  );

  saveStoreToDisk();
}

// Auto-seed on load
initializeSeedData();
