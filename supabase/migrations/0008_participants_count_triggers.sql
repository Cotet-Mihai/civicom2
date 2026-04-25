-- Keeps events.participants_count in sync with event_participants and petition_signatures

CREATE OR REPLACE FUNCTION update_event_participants_count()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE events SET participants_count = participants_count + 1 WHERE id = NEW.event_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE events SET participants_count = GREATEST(0, participants_count - 1) WHERE id = OLD.event_id;
  END IF;
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION update_petition_signatures_count()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE events SET participants_count = participants_count + 1 WHERE id = NEW.event_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE events SET participants_count = GREATEST(0, participants_count - 1) WHERE id = OLD.event_id;
  END IF;
  RETURN NULL;
END;
$$;

CREATE OR REPLACE TRIGGER trg_event_participants_count
  AFTER INSERT OR DELETE ON event_participants
  FOR EACH ROW EXECUTE FUNCTION update_event_participants_count();

CREATE OR REPLACE TRIGGER trg_petition_signatures_count
  AFTER INSERT OR DELETE ON petition_signatures
  FOR EACH ROW EXECUTE FUNCTION update_petition_signatures_count();
