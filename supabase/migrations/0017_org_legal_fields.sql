-- Enum tip organizatie
CREATE TYPE org_type AS ENUM ('asociatie', 'fundatie', 'federatie', 'cooperativa');

-- Câmpuri noi pe organizations
ALTER TABLE organizations
  ADD COLUMN cui          text,
  ADD COLUMN reg_number   text,
  ADD COLUMN org_type     org_type,
  ADD COLUMN email        text,
  ADD COLUMN phone        text,
  ADD COLUMN address      text,
  ADD COLUMN postal_code  text,
  ADD COLUMN city         text;

-- Tabel documente verificare
CREATE TABLE org_documents (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id       uuid        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  doc_type     text        NOT NULL,
  file_name    text        NOT NULL,
  storage_path text        NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE org_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org admins can view their documents"
ON org_documents FOR SELECT
USING (is_org_admin(org_id));

CREATE POLICY "Org admins can insert documents"
ON org_documents FOR INSERT
WITH CHECK (is_org_admin(org_id));

CREATE POLICY "Org admins can delete documents"
ON org_documents FOR DELETE
USING (is_org_admin(org_id));

CREATE POLICY "Platform admins manage all documents"
ON org_documents FOR ALL
USING (is_admin());

-- Bucket privat pentru documente de verificare
INSERT INTO storage.buckets (id, name, public)
VALUES ('org-documents', 'org-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Doar org admins pot uploada (path: {orgId}/fisier.ext)
CREATE POLICY "Org admins can upload documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'org-documents'
  AND auth.uid() IS NOT NULL
);

-- Doar platform admins pot citi fișierele din storage
CREATE POLICY "Platform admins can read org documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'org-documents'
  AND is_admin()
);
