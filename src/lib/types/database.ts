export type UserRole =
  | 'SUPER_ADMIN'
  | 'FEST_ADMIN'
  | 'VERIFICATION_ADMIN'
  | 'SECURITY_SUPERVISOR'
  | 'SECURITY_OPERATOR'
  | 'PARTICIPANT';

export type InvitationStatus = 'ACTIVE' | 'USED' | 'EXPIRED' | 'REVOKED';

export type ParticipantStatus =
  | 'INVITED'
  | 'IN_PROGRESS'
  | 'UNDER_REVIEW'
  | 'CORRECTION'
  | 'APPROVED'
  | 'REVOKED';

export type CampusStatus = 'OUTSIDE' | 'INSIDE';

export type DocumentType = 'STUDENT_ID' | 'AADHAAR';

export type AccessAction = 'ENTRY' | 'EXIT';

export type AccessResult = 'ALLOWED' | 'BLOCKED' | 'OVERRIDDEN';

export interface User {
  id: string;
  auth_user_id: string;
  email: string;
  mobile: string | null;
  role: UserRole;
  status: string;
  full_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface Invitation {
  id: string;
  token_hash: string;
  email: string;
  mobile: string;
  participant_name: string;
  payment_reference: string;
  payment_amount: number;
  payment_date: string;
  payment_status: string;
  status: InvitationStatus;
  expires_at: string;
  created_by: string | null;
  created_at: string;
  used_at: string | null;
}

export interface Participant {
  id: string;
  user_id: string | null;
  invitation_id: string | null;
  registration_id: string | null;
  full_name: string;
  email: string;
  mobile: string;
  college: string | null;
  course: string | null;
  year_of_study: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  selfie_path: string | null;
  status: ParticipantStatus;
  campus_status: CampusStatus;
  correction_reason: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
  submitted_at: string | null;
  approved_at: string | null;
  approved_by: string | null;
}

export interface Event {
  id: string;
  name: string;
  description: string | null;
  date: string;
  start_time: string;
  end_time: string;
  venue: string;
  status: string;
  created_at: string;
}

export interface ParticipantEvent {
  id: string;
  participant_id: string;
  event_id: string;
  status: string;
  created_at: string;
  event?: Event;
}

export interface Document {
  id: string;
  participant_id: string;
  document_type: DocumentType;
  storage_path: string;
  original_filename: string;
  mime_type: string;
  file_size: number;
  status: string;
  uploaded_at: string;
  verified_at: string | null;
  verified_by: string | null;
}

export interface QrPass {
  id: string;
  participant_id: string;
  token_hash: string;
  status: 'ACTIVE' | 'REVOKED';
  issued_at: string;
  revoked_at: string | null;
  revoked_by: string | null;
}

export interface Gate {
  id: string;
  name: string;
  location: string;
  status: string;
  created_at: string;
}

export interface SecurityOperator {
  id: string;
  user_id: string;
  gate_id: string | null;
  operator_code: string;
  status: string;
  created_at: string;
  gate?: Gate;
  user?: User;
}

export interface AccessLog {
  id: string;
  participant_id: string;
  registration_id: string;
  gate_id: string | null;
  operator_id: string | null;
  action: AccessAction;
  result: AccessResult;
  notes: string | null;
  timestamp: string;
  participant?: Participant;
  gate?: Gate;
  operator?: User;
}

export interface AuditLog {
  id: string;
  actor_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  actor?: User;
}
