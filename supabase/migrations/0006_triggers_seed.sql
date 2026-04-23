-- ============================================================
-- TRIGGER: auth.users → users
-- ============================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.users (auth_users_id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    'user'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- SEED: sincronizare utilizatori existenți
-- ============================================================

INSERT INTO public.users (auth_users_id, email, name, role)
SELECT
  id,
  email,
  COALESCE(raw_user_meta_data->>'name', split_part(email, '@', 1)),
  'user'
FROM auth.users
ON CONFLICT (auth_users_id) DO NOTHING;

-- Primul utilizator devine admin
UPDATE public.users
SET role = 'admin'
WHERE auth_users_id = (SELECT id FROM auth.users ORDER BY created_at LIMIT 1);

-- ============================================================
-- SEED: 1 ONG aprobat
-- ============================================================

INSERT INTO organizations (name, description, website, owner_id, status)
SELECT
  'Asociația Civică România',
  'ONG dedicat implicării cetățenilor în viața publică.',
  'https://civica.ro',
  u.id,
  'approved'
FROM users u WHERE u.role = 'admin' LIMIT 1;

-- ============================================================
-- SEED: 3 evenimente aprobate
-- ============================================================

-- Protest (gathering)
WITH creator AS (SELECT id FROM users WHERE role = 'admin' LIMIT 1),
     evt AS (
       INSERT INTO events (title, description, category, subcategory, status, creator_id, creator_type)
       SELECT 'Protest pentru Justiție',
              'Adunare publică pentru susținerea independenței justiției.',
              'protest', 'gathering', 'approved', id, 'user'
       FROM creator RETURNING id
     )
INSERT INTO protests (event_id, date, time_start, max_participants)
SELECT evt.id, CURRENT_DATE + 7, '10:00', 500 FROM evt;

WITH protest_row AS (
  SELECT p.id FROM protests p
  JOIN events e ON e.id = p.event_id
  WHERE e.title = 'Protest pentru Justiție'
)
INSERT INTO gatherings (protest_id, location)
SELECT id, ARRAY[44.4268, 26.1025]::float8[] FROM protest_row;

-- Petiție
WITH creator AS (SELECT id FROM users WHERE role = 'admin' LIMIT 1),
     evt AS (
       INSERT INTO events (title, description, category, status, creator_id, creator_type)
       SELECT 'Petiție pentru Spații Verzi',
              'Solicităm autorităților locale să mărească suprafața de spații verzi.',
              'petition', 'approved', id, 'user'
       FROM creator RETURNING id
     )
INSERT INTO petitions (event_id, what_is_requested, requested_from, target_signatures, why_important)
SELECT evt.id,
       'Creșterea suprafețelor verzi cu minim 20% în 2 ani.',
       'Primăria Generală a Municipiului București',
       1000,
       'Spațiile verzi sunt esențiale pentru sănătatea cetățenilor.'
FROM evt;

-- Activitate comunitară — donații
WITH creator AS (SELECT id FROM users WHERE role = 'admin' LIMIT 1),
     evt AS (
       INSERT INTO events (title, description, category, subcategory, status, creator_id, creator_type)
       SELECT 'Colectă pentru Familii Nevoiașe',
              'Strângem alimente neperisabile pentru familiile defavorizate.',
              'community', 'donations', 'approved', id, 'user'
       FROM creator RETURNING id
     ),
     ca AS (
       INSERT INTO community_activities (event_id)
       SELECT evt.id FROM evt RETURNING id
     )
INSERT INTO donations (community_activity_id, donation_type, what_is_needed)
SELECT ca.id, 'material', ARRAY['conserve', 'paste', 'ulei', 'zahăr', 'făină'] FROM ca;
