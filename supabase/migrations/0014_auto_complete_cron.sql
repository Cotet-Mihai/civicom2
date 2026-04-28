-- supabase/migrations/0014_auto_complete_cron.sql

-- Enable pg_cron (safe to run if already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Function: mark expired events as completed + notify participants
CREATE OR REPLACE FUNCTION complete_expired_events()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rec record;
BEGIN
  FOR rec IN
    SELECT DISTINCT e.id, e.title
    FROM events e
    WHERE e.status = 'approved'
    AND (
      -- protests
      EXISTS (
        SELECT 1 FROM protests p
        WHERE p.event_id = e.id
          AND p.time_end IS NOT NULL
          AND (p.date + p.time_end) < (NOW() AT TIME ZONE 'Europe/Bucharest')
      )
      OR
      -- outdoor_activities
      EXISTS (
        SELECT 1 FROM community_activities ca
        JOIN outdoor_activities oa ON oa.community_activity_id = ca.id
        WHERE ca.event_id = e.id
          AND oa.time_end IS NOT NULL
          AND (oa.date + oa.time_end) < (NOW() AT TIME ZONE 'Europe/Bucharest')
      )
      OR
      -- workshops
      EXISTS (
        SELECT 1 FROM community_activities ca
        JOIN workshops w ON w.community_activity_id = ca.id
        WHERE ca.event_id = e.id
          AND w.time_end IS NOT NULL
          AND (w.date + w.time_end) < (NOW() AT TIME ZONE 'Europe/Bucharest')
      )
      OR
      -- charity_concerts
      EXISTS (
        SELECT 1 FROM charity_events ce
        JOIN charity_concerts cc ON cc.charity_event_id = ce.id
        WHERE ce.event_id = e.id
          AND cc.time_end IS NOT NULL
          AND (cc.date + cc.time_end) < (NOW() AT TIME ZONE 'Europe/Bucharest')
      )
      OR
      -- meet_greets
      EXISTS (
        SELECT 1 FROM charity_events ce
        JOIN meet_greets mg ON mg.charity_event_id = ce.id
        WHERE ce.event_id = e.id
          AND mg.time_end IS NOT NULL
          AND (mg.date + mg.time_end) < (NOW() AT TIME ZONE 'Europe/Bucharest')
      )
      OR
      -- sports_activities
      EXISTS (
        SELECT 1 FROM charity_events ce
        JOIN sports_activities sa ON sa.charity_event_id = ce.id
        WHERE ce.event_id = e.id
          AND sa.time_end IS NOT NULL
          AND (sa.date + sa.time_end) < (NOW() AT TIME ZONE 'Europe/Bucharest')
      )
    )
  LOOP
    UPDATE events SET status = 'completed', updated_at = NOW() WHERE id = rec.id;

    BEGIN
      INSERT INTO notifications (user_id, title, message, type)
      SELECT
        ep.user_id,
        'Eveniment finalizat',
        'Evenimentul "' || rec.title || '" s-a finalizat. Lasă-ne feedback!',
        'event_completed'
      FROM event_participants ep
      WHERE ep.event_id = rec.id
        AND ep.status = 'joined';
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'complete_expired_events: failed to insert notifications for event %: %', rec.id, SQLERRM;
    END;
  END LOOP;
END;
$$;

-- Remove existing cron job if present (idempotent)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'complete-expired-events') THEN
    PERFORM cron.unschedule('complete-expired-events');
  END IF;
END $$;

-- Schedule: run every 15 minutes
SELECT cron.schedule(
  'complete-expired-events',
  '*/15 * * * *',
  $$ SELECT complete_expired_events() $$
);
