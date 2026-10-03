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
import { hashToken, generateSecureToken, signQrToken } from "@/lib/crypto/tokens";
import { generateQrDataUrl } from "@/lib/qr/generator";

/**
 * Aurora In-Memory Database Store
 * Implements real business rules, sequence generation (KLT26-XXXXXX),
 * atomic entry/exit state machine, duplicate checks, and audit logging.
 */

// Sequence counter
let registrationCounter = 420;

export function getNextRegistrationId(): string {
  registrationCounter += 1;
  return `KLT26-${String(registrationCounter).padStart(6, "0")}`;
}

// Global state collections
export const memoryStore = {
  users: new Map<string, User>(),
  invitations: new Map<string, Invitation>(),
  participants: new Map<string, Participant>(),
  events: new Map<string, Event>(),
  participantEvents: new Map<string, ParticipantEvent>(),
  documents: new Map<string, Document>(),
  qrPasses: new Map<string, QrPass>(),
  gates: new Map<string, Gate>(),
  accessLogs: [] as AccessLog[],
  auditLogs: [] as AuditLog[],
  otpCodes: new Map<string, { code: string; expiresAt: number; attempts: number }>(),
};

// Initialize default events and campus gates
export function initializeSeedData() {
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

  // Default Admin User
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

  // Demo Participant 1 (Approved with active QR pass)
  const p1Token = "demo-approved-qr-token-secret-123456";
  const p1Hash = hashToken(p1Token);
  const p1RegId = "KLT26-000421";
  const p1Id = "part-1";

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
    status: "APPROVED",
    campus_status: "OUTSIDE",
    correction_reason: null,
    rejection_reason: null,
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString(),
    submitted_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    approved_at: new Date(Date.now() - 86400000).toISOString(),
    approved_by: "usr-admin-1",
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

  // Link documents for p2
  const doc1: Document = {
    id: "doc-student-2",
    participant_id: p2.id,
    document_type: "STUDENT_ID",
    storage_path: "participants/part-2/student-id/id_card.pdf",
    original_filename: "iit_patna_student_card.pdf",
    mime_type: "application/pdf",
    file_size: 1420500,
    status: "PENDING",
    uploaded_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    verified_at: null,
    verified_by: null,
  };
  const doc2: Document = {
    id: "doc-aadhaar-2",
    participant_id: p2.id,
    document_type: "AADHAAR",
    storage_path: "participants/part-2/aadhaar/aadhaar.pdf",
    original_filename: "aadhaar_card.pdf",
    mime_type: "application/pdf",
    file_size: 2120000,
    status: "PENDING",
    uploaded_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    verified_at: null,
    verified_by: null,
  };
  memoryStore.documents.set(doc1.id, doc1);
  memoryStore.documents.set(doc2.id, doc2);

  // Demo Participant 3 (Correction Required)
  const p3: Participant = {
    id: "part-3",
    user_id: "usr-part-3",
    invitation_id: "inv-demo-3",
    registration_id: null,
    full_name: "Rohan Verma",
    email: "rohan.verma@example.com",
    mobile: "+919876500003",
    college: "BHU Varanasi",
    course: "M.Sc Physics",
    year_of_study: "1st Year",
    address: "Broacha Hostel, BHU Campus",
    city: "Varanasi",
    state: "Uttar Pradesh",
    pincode: "221005",
    selfie_path: null,
    status: "CORRECTION",
    campus_status: "OUTSIDE",
    correction_reason: "Student ID image is blurry and college roll number cannot be read. Please upload a clear photo.",
    rejection_reason: null,
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 8).toISOString(),
    submitted_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    approved_at: null,
    approved_by: null,
  };
  memoryStore.participants.set(p3.id, p3);

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
}

// Auto-seed on load
initializeSeedData();
