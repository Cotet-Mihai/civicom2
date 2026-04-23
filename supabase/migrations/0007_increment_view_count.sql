CREATE OR REPLACE FUNCTION increment_view_count(event_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE events SET view_count = view_count + 1 WHERE id = event_id;
$$;
