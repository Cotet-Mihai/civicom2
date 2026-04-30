ALTER TABLE organizations
  ADD COLUMN banner_url text;

INSERT INTO storage.buckets (id, name, public)
VALUES ('org-banners', 'org-banners', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Org banners are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'org-banners');

CREATE POLICY "Authenticated users can upload org banners"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'org-banners' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update org banners"
ON storage.objects FOR UPDATE
USING (bucket_id = 'org-banners' AND auth.uid() IS NOT NULL);
