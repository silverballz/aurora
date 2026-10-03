-- ========================================================================
-- AURORA — Kaltarang 2026 External Participant Identity & Access System
-- Core Database Schema, Sequences, Atomic Functions, and Strict RLS
-- ========================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------
-- 1. Sequences & Enum Types
-- ------------------------------------------------------------------------
CREATE SEQUENCE IF NOT EXISTS klt_registration_seq START WITH 1 INCREMENT BY 1;

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM (
    'SUPER_ADMIN',
    'FEST_ADMIN',
    'VERIFICATION_ADMIN',
    'SECURITY_SUPERVISOR',
    'SECURITY_OPERATOR',
    'PARTICIPANT'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE invitation_status AS ENUM ('ACTIVE', 'USED', 'EXPIRED', 'REVOKED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE participant_status AS ENUM (
    'INVITED',
    'IN_PROGRESS',
    'UNDER_REVIEW',
    'CORRECTION',
    'APPROVED',
    'REVOKED'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE campus_status AS ENUM ('OUTSIDE', 'INSIDE');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE document_type AS ENUM ('STUDENT_ID', 'AADHAAR');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE qr_pass_status AS ENUM ('ACTIVE', 'REVOKED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE access_action AS ENUM ('ENTRY', 'EXIT');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE access_result AS ENUM ('ALLOWED', 'BLOCKED', 'OVERRIDDEN');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ------------------------------------------------------------------------
-- 2. Tables
-- ------------------------------------------------------------------------

-- Users table linking Supabase auth.users to Aurora roles
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  mobile TEXT,
  role user_role NOT NULL DEFAULT 'PARTICIPANT',
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  full_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Invitations created by Fest Admins after payment verification
CREATE TABLE IF NOT EXISTS public.invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  mobile TEXT NOT NULL,
  participant_name TEXT NOT NULL,
  payment_reference TEXT NOT NULL,
  payment_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_status TEXT NOT NULL DEFAULT 'VERIFIED',
  status invitation_status NOT NULL DEFAULT 'ACTIVE',
  expires_at TIMESTAMPTZ NOT NULL,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  used_at TIMESTAMPTZ
);

-- Participants table with identity, registration status, and campus status
CREATE TABLE IF NOT EXISTS public.participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  invitation_id UUID UNIQUE REFERENCES public.invitations(id),
  registration_id TEXT UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  mobile TEXT NOT NULL,
  college TEXT,
  course TEXT,
  year_of_study TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  pincode TEXT,
  selfie_path TEXT,
  status participant_status NOT NULL DEFAULT 'INVITED',
  campus_status campus_status NOT NULL DEFAULT 'OUTSIDE',
  correction_reason TEXT,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  submitted_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES public.users(id)
);

-- Events table
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  venue TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Participant registered events
CREATE TABLE IF NOT EXISTS public.participant_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES public.participants(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'REGISTERED',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE(participant_id, event_id)
);

-- Documents table (Stored in private Supabase bucket 'aurora-documents')
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES public.participants(id) ON DELETE CASCADE,
  document_type document_type NOT NULL,
  storage_path TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES public.users(id),
  UNIQUE(participant_id, document_type)
);

-- QR Passes (Opaque random token hash, separate from Registration ID)
CREATE TABLE IF NOT EXISTS public.qr_passes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES public.participants(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  status qr_pass_status NOT NULL DEFAULT 'ACTIVE',
  issued_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  revoked_at TIMESTAMPTZ,
  revoked_by UUID REFERENCES public.users(id)
);

-- Campus Gates
CREATE TABLE IF NOT EXISTS public.gates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  location TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Security Operators Assignment
CREATE TABLE IF NOT EXISTS public.security_operators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  gate_id UUID REFERENCES public.gates(id) ON DELETE SET NULL,
  operator_code TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Access Logs for gate scans
CREATE TABLE IF NOT EXISTS public.access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES public.participants(id) ON DELETE CASCADE,
  registration_id TEXT NOT NULL,
  gate_id UUID REFERENCES public.gates(id),
  operator_id UUID REFERENCES public.users(id),
  action access_action NOT NULL,
  result access_result NOT NULL DEFAULT 'ALLOWED',
  notes TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Audit Logs for administrative accountability
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES public.users(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ------------------------------------------------------------------------
-- 3. Indexes for High-Speed Gate Operations & Lookups
-- ------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_invitations_token_hash ON public.invitations(token_hash);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON public.invitations(email);
CREATE INDEX IF NOT EXISTS idx_participants_registration_id ON public.participants(registration_id);
CREATE INDEX IF NOT EXISTS idx_participants_status ON public.participants(status);
CREATE INDEX IF NOT EXISTS idx_participants_campus_status ON public.participants(campus_status);
CREATE INDEX IF NOT EXISTS idx_participants_user_id ON public.participants(user_id);
CREATE INDEX IF NOT EXISTS idx_qr_passes_token_hash ON public.qr_passes(token_hash);
CREATE INDEX IF NOT EXISTS idx_qr_passes_participant_id ON public.qr_passes(participant_id);
CREATE INDEX IF NOT EXISTS idx_access_logs_participant_id ON public.access_logs(participant_id);
CREATE INDEX IF NOT EXISTS idx_access_logs_timestamp ON public.access_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- ------------------------------------------------------------------------
-- 4. Registration ID Generator Function (KLT26-XXXXXX)
-- ------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.generate_registration_id()
RETURNS TEXT AS $$
DECLARE
  v_seq BIGINT;
  v_reg_id TEXT;
BEGIN
  v_seq := nextval('klt_registration_seq');
  v_reg_id := 'KLT26-' || LPAD(v_seq::TEXT, 6, '0');
  RETURN v_reg_id;
END;
$$ LANGUAGE plpgsql;

-- ------------------------------------------------------------------------
-- 5. Atomic Gate State Transitions (Row-Locking Concurrency Control)
-- ------------------------------------------------------------------------

-- ATOMIC ENTRY FUNCTION
CREATE OR REPLACE FUNCTION public.process_gate_entry(
  p_token_hash TEXT,
  p_gate_id UUID,
  p_operator_id UUID,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_qr RECORD;
  v_participant RECORD;
  v_gate RECORD;
  v_last_entry RECORD;
  v_events JSONB;
BEGIN
  -- 1. Validate QR Pass
  SELECT * INTO v_qr
  FROM public.qr_passes
  WHERE token_hash = p_token_hash;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error_code', 'INVALID_QR',
      'message', 'Invalid QR pass.'
    );
  END IF;

  IF v_qr.status <> 'ACTIVE' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error_code', 'QR_REVOKED',
      'message', 'QR pass has been revoked.'
    );
  END IF;

  -- 2. Lock participant record FOR UPDATE to prevent race conditions
  SELECT * INTO v_participant
  FROM public.participants
  WHERE id = v_qr.participant_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error_code', 'PARTICIPANT_NOT_FOUND',
      'message', 'Participant record not found.'
    );
  END IF;

  -- Check approval status
  IF v_participant.status = 'REVOKED' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error_code', 'ACCESS_REVOKED',
      'message', 'Participant access has been revoked.'
    );
  END IF;

  IF v_participant.status <> 'APPROVED' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error_code', 'NOT_APPROVED',
      'message', 'Participant registration is not yet approved.'
    );
  END IF;

  -- 3. Check State: If already INSIDE, block duplicate entry
  IF v_participant.campus_status = 'INSIDE' THEN
    -- Find last entry details
    SELECT al.timestamp, g.name as gate_name INTO v_last_entry
    FROM public.access_logs al
    LEFT JOIN public.gates g ON al.gate_id = g.id
    WHERE al.participant_id = v_participant.id AND al.action = 'ENTRY' AND al.result = 'ALLOWED'
    ORDER BY al.timestamp DESC
    LIMIT 1;

    -- Record failed entry attempt
    INSERT INTO public.access_logs (
      participant_id, registration_id, gate_id, operator_id, action, result, notes
    ) VALUES (
      v_participant.id, v_participant.registration_id, p_gate_id, p_operator_id, 'ENTRY', 'BLOCKED', 'Already inside'
    );

    RETURN jsonb_build_object(
      'success', false,
      'error_code', 'ALREADY_INSIDE',
      'message', 'Participant is already inside campus.',
      'last_entry_time', v_last_entry.timestamp,
      'last_entry_gate', COALESCE(v_last_entry.gate_name, 'Unknown Gate')
    );
  END IF;

  -- 4. Atomically update status to INSIDE
  UPDATE public.participants
  SET campus_status = 'INSIDE',
      updated_at = timezone('utc'::text, now())
  WHERE id = v_participant.id;

  -- 5. Record ALLOWED access log
  INSERT INTO public.access_logs (
    participant_id, registration_id, gate_id, operator_id, action, result, notes
  ) VALUES (
    v_participant.id, v_participant.registration_id, p_gate_id, p_operator_id, 'ENTRY', 'ALLOWED', p_notes
  );

  -- Fetch minimal event list for display
  SELECT jsonb_agg(e.name) INTO v_events
  FROM public.participant_events pe
  JOIN public.events e ON pe.event_id = e.id
  WHERE pe.participant_id = v_participant.id;

  -- Return minimal verification information (No Aadhaar or sensitive PII)
  RETURN jsonb_build_object(
    'success', true,
    'action', 'ENTRY',
    'registration_id', v_participant.registration_id,
    'full_name', v_participant.full_name,
    'college', v_participant.college,
    'course', v_participant.course,
    'year_of_study', v_participant.year_of_study,
    'selfie_path', v_participant.selfie_path,
    'campus_status', 'INSIDE',
    'events', COALESCE(v_events, '[]'::jsonb)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ATOMIC EXIT FUNCTION
CREATE OR REPLACE FUNCTION public.process_gate_exit(
  p_token_hash TEXT,
  p_gate_id UUID,
  p_operator_id UUID,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_qr RECORD;
  v_participant RECORD;
  v_events JSONB;
BEGIN
  -- 1. Validate QR Pass
  SELECT * INTO v_qr
  FROM public.qr_passes
  WHERE token_hash = p_token_hash;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error_code', 'INVALID_QR',
      'message', 'Invalid QR pass.'
    );
  END IF;

  -- 2. Lock participant record FOR UPDATE
  SELECT * INTO v_participant
  FROM public.participants
  WHERE id = v_qr.participant_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error_code', 'PARTICIPANT_NOT_FOUND',
      'message', 'Participant record not found.'
    );
  END IF;

  -- 3. Check State: If already OUTSIDE, block exit
  IF v_participant.campus_status = 'OUTSIDE' THEN
    INSERT INTO public.access_logs (
      participant_id, registration_id, gate_id, operator_id, action, result, notes
    ) VALUES (
      v_participant.id, v_participant.registration_id, p_gate_id, p_operator_id, 'EXIT', 'BLOCKED', 'Participant is not currently inside'
    );

    RETURN jsonb_build_object(
      'success', false,
      'error_code', 'NOT_INSIDE',
      'message', 'Participant is not currently inside campus.'
    );
  END IF;

  -- 4. Atomically update status to OUTSIDE
  UPDATE public.participants
  SET campus_status = 'OUTSIDE',
      updated_at = timezone('utc'::text, now())
  WHERE id = v_participant.id;

  -- 5. Record ALLOWED access log
  INSERT INTO public.access_logs (
    participant_id, registration_id, gate_id, operator_id, action, result, notes
  ) VALUES (
    v_participant.id, v_participant.registration_id, p_gate_id, p_operator_id, 'EXIT', 'ALLOWED', p_notes
  );

  SELECT jsonb_agg(e.name) INTO v_events
  FROM public.participant_events pe
  JOIN public.events e ON pe.event_id = e.id
  WHERE pe.participant_id = v_participant.id;

  RETURN jsonb_build_object(
    'success', true,
    'action', 'EXIT',
    'registration_id', v_participant.registration_id,
    'full_name', v_participant.full_name,
    'college', v_participant.college,
    'campus_status', 'OUTSIDE',
    'events', COALESCE(v_events, '[]'::jsonb)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ------------------------------------------------------------------------
-- 6. Row Level Security (RLS)
-- ------------------------------------------------------------------------
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participant_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qr_passes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_operators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function: get current user role
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS user_role AS $$
  SELECT role FROM public.users WHERE auth_user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Users policies
CREATE POLICY "Users can read own profile" ON public.users
  FOR SELECT USING (auth_user_id = auth.uid());

CREATE POLICY "Admins have full access to users" ON public.users
  FOR ALL USING (public.current_user_role() IN ('SUPER_ADMIN', 'FEST_ADMIN'));

-- Invitations policies (Admins manage, Participants can read valid invitation via service role/API)
CREATE POLICY "Admins manage invitations" ON public.invitations
  FOR ALL USING (public.current_user_role() IN ('SUPER_ADMIN', 'FEST_ADMIN'));

-- Participants policies
CREATE POLICY "Participants can view own profile" ON public.participants
  FOR SELECT USING (user_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Participants can update own profile when not approved" ON public.participants
  FOR UPDATE USING (
    user_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
    AND status IN ('INVITED', 'IN_PROGRESS', 'CORRECTION')
  );

CREATE POLICY "Admins and verifiers have full access to participants" ON public.participants
  FOR ALL USING (public.current_user_role() IN ('SUPER_ADMIN', 'FEST_ADMIN', 'VERIFICATION_ADMIN'));

-- Documents policies: Participant can view/upload own, Verifier/Admin can view, Security has NO access
CREATE POLICY "Participants manage own documents" ON public.documents
  FOR ALL USING (
    participant_id IN (
      SELECT p.id FROM public.participants p
      JOIN public.users u ON p.user_id = u.id
      WHERE u.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Verifiers and Admins view documents" ON public.documents
  FOR SELECT USING (public.current_user_role() IN ('SUPER_ADMIN', 'FEST_ADMIN', 'VERIFICATION_ADMIN'));

-- Events policies: Everyone authenticated can view events
CREATE POLICY "Everyone can read events" ON public.events
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage events" ON public.events
  FOR ALL USING (public.current_user_role() IN ('SUPER_ADMIN', 'FEST_ADMIN'));

-- QR passes policies: Participant can view own active pass, Admins manage
CREATE POLICY "Participant views own qr pass" ON public.qr_passes
  FOR SELECT USING (
    participant_id IN (
      SELECT p.id FROM public.participants p
      JOIN public.users u ON p.user_id = u.id
      WHERE u.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Admins manage qr passes" ON public.qr_passes
  FOR ALL USING (public.current_user_role() IN ('SUPER_ADMIN', 'FEST_ADMIN'));

-- Gates policies
CREATE POLICY "Authenticated users view gates" ON public.gates
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins manage gates" ON public.gates
  FOR ALL USING (public.current_user_role() IN ('SUPER_ADMIN'));

-- Access logs policies
CREATE POLICY "Admins view all access logs" ON public.access_logs
  FOR SELECT USING (public.current_user_role() IN ('SUPER_ADMIN', 'FEST_ADMIN'));

CREATE POLICY "Security operators can insert access logs" ON public.access_logs
  FOR INSERT WITH CHECK (public.current_user_role() IN ('SECURITY_OPERATOR', 'SECURITY_SUPERVISOR', 'SUPER_ADMIN'));

-- Audit logs policies: Append-only
CREATE POLICY "Admins view audit logs" ON public.audit_logs
  FOR SELECT USING (public.current_user_role() IN ('SUPER_ADMIN', 'FEST_ADMIN'));

CREATE POLICY "System can insert audit logs" ON public.audit_logs
  FOR INSERT WITH CHECK (true);
