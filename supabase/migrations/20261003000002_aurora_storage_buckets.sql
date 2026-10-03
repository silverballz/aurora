-- ========================================================================
-- AURORA — Storage Buckets & Policies
-- Private storage for sensitive participant identity documents & selfies
-- ========================================================================

-- Create Private Buckets in Supabase Storage
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  (
    'aurora-documents',
    'aurora-documents',
    false,
    5242880, -- 5 MB limit
    ARRAY['application/pdf', 'image/jpeg', 'image/png']
  ),
  (
    'aurora-selfies',
    'aurora-selfies',
    false,
    3145728, -- 3 MB limit
    ARRAY['image/jpeg', 'image/png']
  )
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Storage Policies for aurora-documents
CREATE POLICY "Participant can upload own documents"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'aurora-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Participant can read own documents"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'aurora-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Admins and Verifiers can read documents"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'aurora-documents'
  AND EXISTS (
    SELECT 1 FROM public.users
    WHERE auth_user_id = auth.uid()
    AND role IN ('SUPER_ADMIN', 'FEST_ADMIN', 'VERIFICATION_ADMIN')
  )
);

-- Storage Policies for aurora-selfies
CREATE POLICY "Participant can upload own selfie"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'aurora-selfies'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Participant can read own selfie"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'aurora-selfies'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Security and Admins can view selfies for gate visual check"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'aurora-selfies'
  AND EXISTS (
    SELECT 1 FROM public.users
    WHERE auth_user_id = auth.uid()
    AND role IN ('SUPER_ADMIN', 'FEST_ADMIN', 'VERIFICATION_ADMIN', 'SECURITY_SUPERVISOR', 'SECURITY_OPERATOR')
  )
);
