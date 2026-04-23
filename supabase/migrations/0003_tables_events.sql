-- PROTESTS (nivel 2)
CREATE TABLE protests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid UNIQUE NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  date date NOT NULL,
  time_start time NOT NULL,
  time_end time,
  max_participants int4 NOT NULL,
  recommended_equipment text,
  safety_rules text,
  contact_person text
);

-- GATHERINGS — Adunare (nivel 3)
CREATE TABLE gatherings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  protest_id uuid UNIQUE NOT NULL REFERENCES protests(id) ON DELETE CASCADE,
  location float8[2] NOT NULL
);

-- MARCHES — Marș (nivel 3)
CREATE TABLE marches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  protest_id uuid UNIQUE NOT NULL REFERENCES protests(id) ON DELETE CASCADE,
  locations float8[][] NOT NULL
);

-- PICKETS — Pichet (nivel 3)
CREATE TABLE pickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  protest_id uuid UNIQUE NOT NULL REFERENCES protests(id) ON DELETE CASCADE,
  location float8[2] NOT NULL
);

-- BOYCOTTS (nivel 2)
CREATE TABLE boycotts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid UNIQUE NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  reason text NOT NULL,
  method text NOT NULL
);

-- BOYCOTT_BRANDS (nivel 3)
CREATE TABLE boycott_brands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  boycott_id uuid NOT NULL REFERENCES boycotts(id) ON DELETE CASCADE,
  name text NOT NULL,
  link text
);

-- BOYCOTT_ALTERNATIVES (nivel 4)
CREATE TABLE boycott_alternatives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES boycott_brands(id) ON DELETE CASCADE,
  name text NOT NULL,
  link text NOT NULL,
  reason text
);

-- PETITIONS (nivel 2)
CREATE TABLE petitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid UNIQUE NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  what_is_requested text NOT NULL,
  requested_from text NOT NULL,
  target_signatures int4 NOT NULL,
  why_important text NOT NULL,
  contact_person text
);

-- COMMUNITY_ACTIVITIES (nivel 2)
CREATE TABLE community_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid UNIQUE NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  contact_person text
);

-- OUTDOOR_ACTIVITIES (nivel 3)
CREATE TABLE outdoor_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_activity_id uuid UNIQUE NOT NULL REFERENCES community_activities(id) ON DELETE CASCADE,
  location float8[2] NOT NULL,
  date date NOT NULL,
  time_start time NOT NULL,
  time_end time,
  recommended_equipment text,
  what_organizer_offers text,
  max_participants int4
);

-- DONATIONS (nivel 3)
CREATE TABLE donations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_activity_id uuid UNIQUE NOT NULL REFERENCES community_activities(id) ON DELETE CASCADE,
  donation_type donation_type NOT NULL,
  what_is_needed text[],
  target_amount numeric
);

-- WORKSHOPS (nivel 3)
CREATE TABLE workshops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_activity_id uuid UNIQUE NOT NULL REFERENCES community_activities(id) ON DELETE CASCADE,
  location float8[2] NOT NULL,
  date date NOT NULL,
  time_start time NOT NULL,
  time_end time,
  max_participants int4,
  recommended_equipment text,
  what_organizer_offers text
);

-- CHARITY_EVENTS (nivel 2)
CREATE TABLE charity_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid UNIQUE NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  target_amount numeric,
  collected_amount numeric
);

-- CHARITY_CONCERTS (nivel 3)
CREATE TABLE charity_concerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  charity_event_id uuid UNIQUE NOT NULL REFERENCES charity_events(id) ON DELETE CASCADE,
  location float8[2] NOT NULL,
  date date NOT NULL,
  time_start time NOT NULL,
  time_end time,
  performers text[] NOT NULL,
  ticket_price numeric,
  ticket_link text,
  max_participants int4
);

-- MEET_GREETS (nivel 3)
CREATE TABLE meet_greets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  charity_event_id uuid UNIQUE NOT NULL REFERENCES charity_events(id) ON DELETE CASCADE,
  location float8[2] NOT NULL,
  date date NOT NULL,
  time_start time NOT NULL,
  time_end time,
  guests text[] NOT NULL,
  ticket_price numeric,
  ticket_link text,
  max_participants int4
);

-- CHARITY_LIVESTREAMS (nivel 3)
CREATE TABLE charity_livestreams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  charity_event_id uuid UNIQUE NOT NULL REFERENCES charity_events(id) ON DELETE CASCADE,
  stream_link text NOT NULL,
  cause text NOT NULL,
  time_start time NOT NULL,
  time_end time,
  guests text[]
);

-- SPORTS_ACTIVITIES (nivel 3)
CREATE TABLE sports_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  charity_event_id uuid UNIQUE NOT NULL REFERENCES charity_events(id) ON DELETE CASCADE,
  location float8[2] NOT NULL,
  date date NOT NULL,
  time_start time NOT NULL,
  time_end time,
  guests text[],
  ticket_price numeric,
  ticket_link text,
  max_participants int4
);
