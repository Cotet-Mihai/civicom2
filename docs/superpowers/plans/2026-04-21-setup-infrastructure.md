# Setup & Infrastructură Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Configurarea completă a fundației tehnice CIVICOM — schema SQL (27 tabele), clienți Supabase, proxy.ts, fonturi și seed data.

**Architecture:** Schema SQL ierarhică în Supabase aplicată prin 6 fișiere de migrație versionabile. Clienții Supabase separați pe 3 contexte (browser/server/admin). `proxy.ts` Next.js 16 gestionează protecția rutelor.

**Tech Stack:** Next.js 16, Supabase (PostgreSQL + Auth + Storage), @supabase/ssr, Tailwind CSS 4, Montserrat + Inter (next/font/google)

---

## File Map

**Create:**
- `supabase/migrations/0001_enums.sql`
- `supabase/migrations/0002_tables_core.sql`
- `supabase/migrations/0003_tables_events.sql`
- `supabase/migrations/0004_tables_support.sql`
- `supabase/migrations/0005_functions_rls.sql`
- `supabase/migrations/0006_triggers_seed.sql`
- `lib/supabase/client.ts`
- `lib/supabase/server.ts`
- `lib/supabase/admin.ts`
- `proxy.ts`
- `.env.local`

**Modify:**
- `app/layout.tsx`
- `app/globals.css`
- `package.json` (via pnpm add)

---

## Task 1: Branch + Pachete

**Files:** `package.json`

- [ ] **Step 1: Creare branch**

```bash
git checkout -b feat/setup-infrastructure
```

- [ ] **Step 2: Instalare pachete Supabase + UI**

```bash
pnpm add @supabase/supabase-js @supabase/ssr
pnpm add sonner lucide-react embla-carousel-react
pnpm add react-leaflet leaflet
pnpm add -D @types/leaflet
```

- [ ] **Step 3: Verificare instalare**

```bash
pnpm list @supabase/supabase-js @supabase/ssr sonner lucide-react embla-carousel-react leaflet
```

Expected: toate pachetele listate cu versiunile lor.

- [ ] **Step 4: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: install supabase, ui and map packages"
```

---

## Task 2: Variabile de Mediu + Clienți Supabase

**Files:** `.env.local`, `lib/supabase/client.ts`, `lib/supabase/server.ts`, `lib/supabase/admin.ts`

- [ ] **Step 1: Creare `.env.local`**

Ia URL-ul și cheile din Supabase Dashboard → Project Settings → API.

```env
NEXT_PUBLIC_SUPABASE_URL=https://bslgppjjtfropjzccetj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon_key_din_dashboard>
SUPABASE_SERVICE_ROLE_KEY=<service_role_key_din_dashboard>
```

> `.env.local` nu se adaugă în git (este deja în `.gitignore` by default Next.js).

- [ ] **Step 2: Creare folder `lib/supabase/`**

```bash
mkdir -p lib/supabase
```

- [ ] **Step 3: Creare `lib/supabase/client.ts`**

```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

- [ ] **Step 4: Creare `lib/supabase/server.ts`**

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Component — cookies read-only, ignorat
          }
        },
      },
    }
  )
}
```

- [ ] **Step 5: Creare `lib/supabase/admin.ts`**

```typescript
import { createClient } from '@supabase/supabase-js'

export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
```

- [ ] **Step 6: Verificare TypeScript**

```bash
pnpm tsc --noEmit
```

Expected: zero erori.

- [ ] **Step 7: Commit**

```bash
git add lib/supabase/
git commit -m "feat: add supabase clients (browser, server, admin)"
```

---

## Task 3: DROP Schema Experimentală

**Files:** niciun fișier — execuție SQL directă prin MCP

Schema experimentală existentă (12 tabele) trebuie ștearsă înainte de a aplica migrațiile corecte. `auth.users` nu este atins.

- [ ] **Step 1: Execuție SQL DROP prin MCP `execute_sql`**

```sql
DROP TABLE IF EXISTS
  event_participants,
  event_contacts,
  event_logistics,
  event_media,
  boycott_alternatives,
  boycott_brands,
  event_boycotts,
  event_location_routes,
  event_location_points,
  event_locations,
  event_basic_info,
  events
CASCADE;
```

- [ ] **Step 2: Verificare via MCP `list_tables`**

Expected: schema `public` este goală (0 tabele).

---

## Task 4: Migrație 0001 — Enums

**Files:** `supabase/migrations/0001_enums.sql`

- [ ] **Step 1: Creare folder migrații**

```bash
mkdir -p supabase/migrations
```

- [ ] **Step 2: Creare `supabase/migrations/0001_enums.sql`**

```sql
CREATE TYPE user_role AS ENUM ('user', 'admin');
CREATE TYPE creator_type AS ENUM ('user', 'ngo');
CREATE TYPE event_category AS ENUM ('protest', 'boycott', 'petition', 'community', 'charity');
CREATE TYPE event_status AS ENUM ('pending', 'approved', 'rejected', 'contested', 'completed');
CREATE TYPE org_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE org_member_role AS ENUM ('admin', 'member');
CREATE TYPE participant_status AS ENUM ('joined', 'cancelled');
CREATE TYPE appeal_status AS ENUM ('pending', 'under_review', 'resolved');
CREATE TYPE donation_type AS ENUM ('material', 'monetary');
```

- [ ] **Step 3: Aplicare prin MCP `apply_migration`**

Name: `0001_enums`
Query: conținutul fișierului de mai sus.

- [ ] **Step 4: Verificare prin MCP `execute_sql`**

```sql
SELECT typname FROM pg_type
WHERE typtype = 'e'
ORDER BY typname;
```

Expected: 9 rânduri — `appeal_status`, `creator_type`, `donation_type`, `event_category`, `event_status`, `org_member_role`, `org_status`, `participant_status`, `user_role`.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/0001_enums.sql
git commit -m "feat(db): add postgresql enums"
```

---

## Task 5: Migrație 0002 — Tabele Core

**Files:** `supabase/migrations/0002_tables_core.sql`

Ordine de creare: `users` → `organizations` → `events` → `organization_members` → `organization_ratings` (respectă dependențele FK).

- [ ] **Step 1: Creare `supabase/migrations/0002_tables_core.sql`**

```sql
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_users_id uuid UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  role user_role NOT NULL DEFAULT 'user',
  phone text,
  country text,
  city text,
  avatar_url text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  iban text,
  website text,
  logo_url text,
  owner_id uuid NOT NULL REFERENCES users(id),
  status org_status NOT NULL DEFAULT 'pending',
  rating float4 NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  banner_url text,
  gallery_urls text[] NOT NULL DEFAULT '{}',
  category event_category NOT NULL,
  subcategory text,
  status event_status NOT NULL DEFAULT 'pending',
  creator_id uuid NOT NULL REFERENCES users(id),
  creator_type creator_type NOT NULL,
  organization_id uuid REFERENCES organizations(id),
  view_count int4 NOT NULL DEFAULT 0,
  participants_count int4 NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE organization_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role org_member_role NOT NULL,
  joined_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, user_id)
);

CREATE TABLE organization_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  user_id uuid NOT NULL REFERENCES users(id),
  rating int2 NOT NULL CHECK (rating BETWEEN 1 AND 5),
  created_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, user_id)
);
```

- [ ] **Step 2: Aplicare prin MCP `apply_migration`**

Name: `0002_tables_core`

- [ ] **Step 3: Verificare prin MCP `execute_sql`**

```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

Expected: `events`, `organization_members`, `organization_ratings`, `organizations`, `users`.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/0002_tables_core.sql
git commit -m "feat(db): add core tables (users, events, organizations)"
```

---

## Task 6: Migrație 0003 — Tabele Evenimente

**Files:** `supabase/migrations/0003_tables_events.sql`

- [ ] **Step 1: Creare `supabase/migrations/0003_tables_events.sql`**

```sql
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

-- BOYCOTT_BRANDS (nivel 3 — fără UNIQUE pe boycott_id: un boycott are mai multe branduri)
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

-- OUTDOOR_ACTIVITIES — Activitate în Aer Liber (nivel 3)
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
```

- [ ] **Step 2: Aplicare prin MCP `apply_migration`**

Name: `0003_tables_events`

- [ ] **Step 3: Verificare prin MCP `execute_sql`**

```sql
SELECT COUNT(*) as total_tables
FROM information_schema.tables
WHERE table_schema = 'public';
```

Expected: `22` tabele (5 core + 17 events).

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/0003_tables_events.sql
git commit -m "feat(db): add event hierarchy tables (protests, boycotts, petitions, community, charity)"
```

---

## Task 7: Migrație 0004 — Tabele Suport

**Files:** `supabase/migrations/0004_tables_support.sql`

- [ ] **Step 1: Creare `supabase/migrations/0004_tables_support.sql`**

```sql
CREATE TABLE event_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status participant_status NOT NULL DEFAULT 'joined',
  joined_at timestamptz DEFAULT now(),
  UNIQUE(event_id, user_id)
);

CREATE TABLE petition_signatures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at timestamptz DEFAULT now(),
  UNIQUE(event_id, user_id)
);

CREATE TABLE event_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating int2 NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(event_id, user_id)
);

CREATE TABLE appeals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason text NOT NULL,
  status appeal_status NOT NULL DEFAULT 'pending',
  admin_note text,
  reviewed_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  reviewed_at timestamptz
);

CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type text,
  title text NOT NULL,
  message text NOT NULL,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);
```

- [ ] **Step 2: Aplicare prin MCP `apply_migration`**

Name: `0004_tables_support`

- [ ] **Step 3: Verificare prin MCP `execute_sql`**

```sql
SELECT COUNT(*) as total_tables
FROM information_schema.tables
WHERE table_schema = 'public';
```

Expected: `27` tabele.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/0004_tables_support.sql
git commit -m "feat(db): add support tables (participants, signatures, feedback, appeals, notifications)"
```

---

## Task 8: Migrație 0005 — Funcții Helper + RLS

**Files:** `supabase/migrations/0005_functions_rls.sql`

- [ ] **Step 1: Creare `supabase/migrations/0005_functions_rls.sql`**

```sql
-- ============================================================
-- FUNCȚII HELPER
-- ============================================================

CREATE OR REPLACE FUNCTION current_user_id()
RETURNS uuid LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT id FROM users WHERE auth_users_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM users WHERE auth_users_id = auth.uid() AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION is_org_admin(org_id uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_id = org_id
      AND user_id = current_user_id()
      AND role = 'admin'
  );
$$;

-- ============================================================
-- RLS: events
-- ============================================================

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "events_select" ON events FOR SELECT USING (
  status IN ('approved', 'completed')
  OR creator_id = current_user_id()
  OR is_admin()
);

CREATE POLICY "events_insert" ON events FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL
  AND creator_id = current_user_id()
);

CREATE POLICY "events_update" ON events FOR UPDATE
USING (
  (creator_id = current_user_id() AND status NOT IN ('approved', 'completed'))
  OR is_admin()
)
WITH CHECK (
  (creator_id = current_user_id() AND status NOT IN ('approved', 'completed'))
  OR is_admin()
);

CREATE POLICY "events_delete" ON events FOR DELETE USING (
  creator_id = current_user_id() OR is_admin()
);

-- ============================================================
-- RLS: tabele nivel 2 (protests, boycotts, petitions,
--      community_activities, charity_events)
-- Pattern comun via JOIN → events
-- ============================================================

ALTER TABLE protests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "protests_select" ON protests FOR SELECT USING (
  EXISTS (SELECT 1 FROM events e WHERE e.id = event_id
    AND (e.status IN ('approved','completed') OR e.creator_id = current_user_id() OR is_admin()))
);
CREATE POLICY "protests_insert" ON protests FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM events e WHERE e.id = event_id AND e.creator_id = current_user_id())
);
CREATE POLICY "protests_update" ON protests FOR UPDATE USING (
  EXISTS (SELECT 1 FROM events e WHERE e.id = event_id
    AND ((e.creator_id = current_user_id() AND e.status NOT IN ('approved','completed')) OR is_admin()))
);
CREATE POLICY "protests_delete" ON protests FOR DELETE USING (
  EXISTS (SELECT 1 FROM events e WHERE e.id = event_id
    AND (e.creator_id = current_user_id() OR is_admin()))
);

ALTER TABLE boycotts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "boycotts_select" ON boycotts FOR SELECT USING (
  EXISTS (SELECT 1 FROM events e WHERE e.id = event_id
    AND (e.status IN ('approved','completed') OR e.creator_id = current_user_id() OR is_admin()))
);
CREATE POLICY "boycotts_insert" ON boycotts FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM events e WHERE e.id = event_id AND e.creator_id = current_user_id())
);
CREATE POLICY "boycotts_update" ON boycotts FOR UPDATE USING (
  EXISTS (SELECT 1 FROM events e WHERE e.id = event_id
    AND ((e.creator_id = current_user_id() AND e.status NOT IN ('approved','completed')) OR is_admin()))
);
CREATE POLICY "boycotts_delete" ON boycotts FOR DELETE USING (
  EXISTS (SELECT 1 FROM events e WHERE e.id = event_id
    AND (e.creator_id = current_user_id() OR is_admin()))
);

ALTER TABLE petitions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "petitions_select" ON petitions FOR SELECT USING (
  EXISTS (SELECT 1 FROM events e WHERE e.id = event_id
    AND (e.status IN ('approved','completed') OR e.creator_id = current_user_id() OR is_admin()))
);
CREATE POLICY "petitions_insert" ON petitions FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM events e WHERE e.id = event_id AND e.creator_id = current_user_id())
);
CREATE POLICY "petitions_update" ON petitions FOR UPDATE USING (
  EXISTS (SELECT 1 FROM events e WHERE e.id = event_id
    AND ((e.creator_id = current_user_id() AND e.status NOT IN ('approved','completed')) OR is_admin()))
);
CREATE POLICY "petitions_delete" ON petitions FOR DELETE USING (
  EXISTS (SELECT 1 FROM events e WHERE e.id = event_id
    AND (e.creator_id = current_user_id() OR is_admin()))
);

ALTER TABLE community_activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "community_activities_select" ON community_activities FOR SELECT USING (
  EXISTS (SELECT 1 FROM events e WHERE e.id = event_id
    AND (e.status IN ('approved','completed') OR e.creator_id = current_user_id() OR is_admin()))
);
CREATE POLICY "community_activities_insert" ON community_activities FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM events e WHERE e.id = event_id AND e.creator_id = current_user_id())
);
CREATE POLICY "community_activities_update" ON community_activities FOR UPDATE USING (
  EXISTS (SELECT 1 FROM events e WHERE e.id = event_id
    AND ((e.creator_id = current_user_id() AND e.status NOT IN ('approved','completed')) OR is_admin()))
);
CREATE POLICY "community_activities_delete" ON community_activities FOR DELETE USING (
  EXISTS (SELECT 1 FROM events e WHERE e.id = event_id
    AND (e.creator_id = current_user_id() OR is_admin()))
);

ALTER TABLE charity_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "charity_events_select" ON charity_events FOR SELECT USING (
  EXISTS (SELECT 1 FROM events e WHERE e.id = event_id
    AND (e.status IN ('approved','completed') OR e.creator_id = current_user_id() OR is_admin()))
);
CREATE POLICY "charity_events_insert" ON charity_events FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM events e WHERE e.id = event_id AND e.creator_id = current_user_id())
);
CREATE POLICY "charity_events_update" ON charity_events FOR UPDATE USING (
  EXISTS (SELECT 1 FROM events e WHERE e.id = event_id
    AND ((e.creator_id = current_user_id() AND e.status NOT IN ('approved','completed')) OR is_admin()))
);
CREATE POLICY "charity_events_delete" ON charity_events FOR DELETE USING (
  EXISTS (SELECT 1 FROM events e WHERE e.id = event_id
    AND (e.creator_id = current_user_id() OR is_admin()))
);

-- ============================================================
-- RLS: tabele nivel 3 — JOIN dublu → events
-- ============================================================

ALTER TABLE gatherings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gatherings_select" ON gatherings FOR SELECT USING (
  EXISTS (SELECT 1 FROM protests p JOIN events e ON e.id = p.event_id WHERE p.id = protest_id
    AND (e.status IN ('approved','completed') OR e.creator_id = current_user_id() OR is_admin()))
);
CREATE POLICY "gatherings_insert" ON gatherings FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM protests p JOIN events e ON e.id = p.event_id
    WHERE p.id = protest_id AND e.creator_id = current_user_id())
);
CREATE POLICY "gatherings_update" ON gatherings FOR UPDATE USING (
  EXISTS (SELECT 1 FROM protests p JOIN events e ON e.id = p.event_id WHERE p.id = protest_id
    AND ((e.creator_id = current_user_id() AND e.status NOT IN ('approved','completed')) OR is_admin()))
);
CREATE POLICY "gatherings_delete" ON gatherings FOR DELETE USING (
  EXISTS (SELECT 1 FROM protests p JOIN events e ON e.id = p.event_id WHERE p.id = protest_id
    AND (e.creator_id = current_user_id() OR is_admin()))
);

ALTER TABLE marches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "marches_select" ON marches FOR SELECT USING (
  EXISTS (SELECT 1 FROM protests p JOIN events e ON e.id = p.event_id WHERE p.id = protest_id
    AND (e.status IN ('approved','completed') OR e.creator_id = current_user_id() OR is_admin()))
);
CREATE POLICY "marches_insert" ON marches FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM protests p JOIN events e ON e.id = p.event_id
    WHERE p.id = protest_id AND e.creator_id = current_user_id())
);
CREATE POLICY "marches_update" ON marches FOR UPDATE USING (
  EXISTS (SELECT 1 FROM protests p JOIN events e ON e.id = p.event_id WHERE p.id = protest_id
    AND ((e.creator_id = current_user_id() AND e.status NOT IN ('approved','completed')) OR is_admin()))
);
CREATE POLICY "marches_delete" ON marches FOR DELETE USING (
  EXISTS (SELECT 1 FROM protests p JOIN events e ON e.id = p.event_id WHERE p.id = protest_id
    AND (e.creator_id = current_user_id() OR is_admin()))
);

ALTER TABLE pickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pickets_select" ON pickets FOR SELECT USING (
  EXISTS (SELECT 1 FROM protests p JOIN events e ON e.id = p.event_id WHERE p.id = protest_id
    AND (e.status IN ('approved','completed') OR e.creator_id = current_user_id() OR is_admin()))
);
CREATE POLICY "pickets_insert" ON pickets FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM protests p JOIN events e ON e.id = p.event_id
    WHERE p.id = protest_id AND e.creator_id = current_user_id())
);
CREATE POLICY "pickets_update" ON pickets FOR UPDATE USING (
  EXISTS (SELECT 1 FROM protests p JOIN events e ON e.id = p.event_id WHERE p.id = protest_id
    AND ((e.creator_id = current_user_id() AND e.status NOT IN ('approved','completed')) OR is_admin()))
);
CREATE POLICY "pickets_delete" ON pickets FOR DELETE USING (
  EXISTS (SELECT 1 FROM protests p JOIN events e ON e.id = p.event_id WHERE p.id = protest_id
    AND (e.creator_id = current_user_id() OR is_admin()))
);

ALTER TABLE boycott_brands ENABLE ROW LEVEL SECURITY;
CREATE POLICY "boycott_brands_select" ON boycott_brands FOR SELECT USING (
  EXISTS (SELECT 1 FROM boycotts b JOIN events e ON e.id = b.event_id WHERE b.id = boycott_id
    AND (e.status IN ('approved','completed') OR e.creator_id = current_user_id() OR is_admin()))
);
CREATE POLICY "boycott_brands_insert" ON boycott_brands FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM boycotts b JOIN events e ON e.id = b.event_id
    WHERE b.id = boycott_id AND e.creator_id = current_user_id())
);
CREATE POLICY "boycott_brands_update" ON boycott_brands FOR UPDATE USING (
  EXISTS (SELECT 1 FROM boycotts b JOIN events e ON e.id = b.event_id WHERE b.id = boycott_id
    AND ((e.creator_id = current_user_id() AND e.status NOT IN ('approved','completed')) OR is_admin()))
);
CREATE POLICY "boycott_brands_delete" ON boycott_brands FOR DELETE USING (
  EXISTS (SELECT 1 FROM boycotts b JOIN events e ON e.id = b.event_id WHERE b.id = boycott_id
    AND (e.creator_id = current_user_id() OR is_admin()))
);

ALTER TABLE boycott_alternatives ENABLE ROW LEVEL SECURITY;
CREATE POLICY "boycott_alternatives_select" ON boycott_alternatives FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM boycott_brands bb
    JOIN boycotts b ON b.id = bb.boycott_id
    JOIN events e ON e.id = b.event_id
    WHERE bb.id = brand_id
    AND (e.status IN ('approved','completed') OR e.creator_id = current_user_id() OR is_admin())
  )
);
CREATE POLICY "boycott_alternatives_insert" ON boycott_alternatives FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM boycott_brands bb
    JOIN boycotts b ON b.id = bb.boycott_id
    JOIN events e ON e.id = b.event_id
    WHERE bb.id = brand_id AND e.creator_id = current_user_id()
  )
);
CREATE POLICY "boycott_alternatives_update" ON boycott_alternatives FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM boycott_brands bb
    JOIN boycotts b ON b.id = bb.boycott_id
    JOIN events e ON e.id = b.event_id
    WHERE bb.id = brand_id
    AND ((e.creator_id = current_user_id() AND e.status NOT IN ('approved','completed')) OR is_admin())
  )
);
CREATE POLICY "boycott_alternatives_delete" ON boycott_alternatives FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM boycott_brands bb
    JOIN boycotts b ON b.id = bb.boycott_id
    JOIN events e ON e.id = b.event_id
    WHERE bb.id = brand_id
    AND (e.creator_id = current_user_id() OR is_admin())
  )
);

ALTER TABLE outdoor_activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "outdoor_activities_select" ON outdoor_activities FOR SELECT USING (
  EXISTS (SELECT 1 FROM community_activities ca JOIN events e ON e.id = ca.event_id
    WHERE ca.id = community_activity_id
    AND (e.status IN ('approved','completed') OR e.creator_id = current_user_id() OR is_admin()))
);
CREATE POLICY "outdoor_activities_insert" ON outdoor_activities FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM community_activities ca JOIN events e ON e.id = ca.event_id
    WHERE ca.id = community_activity_id AND e.creator_id = current_user_id())
);
CREATE POLICY "outdoor_activities_update" ON outdoor_activities FOR UPDATE USING (
  EXISTS (SELECT 1 FROM community_activities ca JOIN events e ON e.id = ca.event_id
    WHERE ca.id = community_activity_id
    AND ((e.creator_id = current_user_id() AND e.status NOT IN ('approved','completed')) OR is_admin()))
);
CREATE POLICY "outdoor_activities_delete" ON outdoor_activities FOR DELETE USING (
  EXISTS (SELECT 1 FROM community_activities ca JOIN events e ON e.id = ca.event_id
    WHERE ca.id = community_activity_id
    AND (e.creator_id = current_user_id() OR is_admin()))
);

ALTER TABLE donations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "donations_select" ON donations FOR SELECT USING (
  EXISTS (SELECT 1 FROM community_activities ca JOIN events e ON e.id = ca.event_id
    WHERE ca.id = community_activity_id
    AND (e.status IN ('approved','completed') OR e.creator_id = current_user_id() OR is_admin()))
);
CREATE POLICY "donations_insert" ON donations FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM community_activities ca JOIN events e ON e.id = ca.event_id
    WHERE ca.id = community_activity_id AND e.creator_id = current_user_id())
);
CREATE POLICY "donations_update" ON donations FOR UPDATE USING (
  EXISTS (SELECT 1 FROM community_activities ca JOIN events e ON e.id = ca.event_id
    WHERE ca.id = community_activity_id
    AND ((e.creator_id = current_user_id() AND e.status NOT IN ('approved','completed')) OR is_admin()))
);
CREATE POLICY "donations_delete" ON donations FOR DELETE USING (
  EXISTS (SELECT 1 FROM community_activities ca JOIN events e ON e.id = ca.event_id
    WHERE ca.id = community_activity_id
    AND (e.creator_id = current_user_id() OR is_admin()))
);

ALTER TABLE workshops ENABLE ROW LEVEL SECURITY;
CREATE POLICY "workshops_select" ON workshops FOR SELECT USING (
  EXISTS (SELECT 1 FROM community_activities ca JOIN events e ON e.id = ca.event_id
    WHERE ca.id = community_activity_id
    AND (e.status IN ('approved','completed') OR e.creator_id = current_user_id() OR is_admin()))
);
CREATE POLICY "workshops_insert" ON workshops FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM community_activities ca JOIN events e ON e.id = ca.event_id
    WHERE ca.id = community_activity_id AND e.creator_id = current_user_id())
);
CREATE POLICY "workshops_update" ON workshops FOR UPDATE USING (
  EXISTS (SELECT 1 FROM community_activities ca JOIN events e ON e.id = ca.event_id
    WHERE ca.id = community_activity_id
    AND ((e.creator_id = current_user_id() AND e.status NOT IN ('approved','completed')) OR is_admin()))
);
CREATE POLICY "workshops_delete" ON workshops FOR DELETE USING (
  EXISTS (SELECT 1 FROM community_activities ca JOIN events e ON e.id = ca.event_id
    WHERE ca.id = community_activity_id
    AND (e.creator_id = current_user_id() OR is_admin()))
);

ALTER TABLE charity_concerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "charity_concerts_select" ON charity_concerts FOR SELECT USING (
  EXISTS (SELECT 1 FROM charity_events ce JOIN events e ON e.id = ce.event_id
    WHERE ce.id = charity_event_id
    AND (e.status IN ('approved','completed') OR e.creator_id = current_user_id() OR is_admin()))
);
CREATE POLICY "charity_concerts_insert" ON charity_concerts FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM charity_events ce JOIN events e ON e.id = ce.event_id
    WHERE ce.id = charity_event_id AND e.creator_id = current_user_id())
);
CREATE POLICY "charity_concerts_update" ON charity_concerts FOR UPDATE USING (
  EXISTS (SELECT 1 FROM charity_events ce JOIN events e ON e.id = ce.event_id
    WHERE ce.id = charity_event_id
    AND ((e.creator_id = current_user_id() AND e.status NOT IN ('approved','completed')) OR is_admin()))
);
CREATE POLICY "charity_concerts_delete" ON charity_concerts FOR DELETE USING (
  EXISTS (SELECT 1 FROM charity_events ce JOIN events e ON e.id = ce.event_id
    WHERE ce.id = charity_event_id
    AND (e.creator_id = current_user_id() OR is_admin()))
);

ALTER TABLE meet_greets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "meet_greets_select" ON meet_greets FOR SELECT USING (
  EXISTS (SELECT 1 FROM charity_events ce JOIN events e ON e.id = ce.event_id
    WHERE ce.id = charity_event_id
    AND (e.status IN ('approved','completed') OR e.creator_id = current_user_id() OR is_admin()))
);
CREATE POLICY "meet_greets_insert" ON meet_greets FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM charity_events ce JOIN events e ON e.id = ce.event_id
    WHERE ce.id = charity_event_id AND e.creator_id = current_user_id())
);
CREATE POLICY "meet_greets_update" ON meet_greets FOR UPDATE USING (
  EXISTS (SELECT 1 FROM charity_events ce JOIN events e ON e.id = ce.event_id
    WHERE ce.id = charity_event_id
    AND ((e.creator_id = current_user_id() AND e.status NOT IN ('approved','completed')) OR is_admin()))
);
CREATE POLICY "meet_greets_delete" ON meet_greets FOR DELETE USING (
  EXISTS (SELECT 1 FROM charity_events ce JOIN events e ON e.id = ce.event_id
    WHERE ce.id = charity_event_id
    AND (e.creator_id = current_user_id() OR is_admin()))
);

ALTER TABLE charity_livestreams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "charity_livestreams_select" ON charity_livestreams FOR SELECT USING (
  EXISTS (SELECT 1 FROM charity_events ce JOIN events e ON e.id = ce.event_id
    WHERE ce.id = charity_event_id
    AND (e.status IN ('approved','completed') OR e.creator_id = current_user_id() OR is_admin()))
);
CREATE POLICY "charity_livestreams_insert" ON charity_livestreams FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM charity_events ce JOIN events e ON e.id = ce.event_id
    WHERE ce.id = charity_event_id AND e.creator_id = current_user_id())
);
CREATE POLICY "charity_livestreams_update" ON charity_livestreams FOR UPDATE USING (
  EXISTS (SELECT 1 FROM charity_events ce JOIN events e ON e.id = ce.event_id
    WHERE ce.id = charity_event_id
    AND ((e.creator_id = current_user_id() AND e.status NOT IN ('approved','completed')) OR is_admin()))
);
CREATE POLICY "charity_livestreams_delete" ON charity_livestreams FOR DELETE USING (
  EXISTS (SELECT 1 FROM charity_events ce JOIN events e ON e.id = ce.event_id
    WHERE ce.id = charity_event_id
    AND (e.creator_id = current_user_id() OR is_admin()))
);

ALTER TABLE sports_activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sports_activities_select" ON sports_activities FOR SELECT USING (
  EXISTS (SELECT 1 FROM charity_events ce JOIN events e ON e.id = ce.event_id
    WHERE ce.id = charity_event_id
    AND (e.status IN ('approved','completed') OR e.creator_id = current_user_id() OR is_admin()))
);
CREATE POLICY "sports_activities_insert" ON sports_activities FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM charity_events ce JOIN events e ON e.id = ce.event_id
    WHERE ce.id = charity_event_id AND e.creator_id = current_user_id())
);
CREATE POLICY "sports_activities_update" ON sports_activities FOR UPDATE USING (
  EXISTS (SELECT 1 FROM charity_events ce JOIN events e ON e.id = ce.event_id
    WHERE ce.id = charity_event_id
    AND ((e.creator_id = current_user_id() AND e.status NOT IN ('approved','completed')) OR is_admin()))
);
CREATE POLICY "sports_activities_delete" ON sports_activities FOR DELETE USING (
  EXISTS (SELECT 1 FROM charity_events ce JOIN events e ON e.id = ce.event_id
    WHERE ce.id = charity_event_id
    AND (e.creator_id = current_user_id() OR is_admin()))
);

-- ============================================================
-- RLS: users
-- ============================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select" ON users FOR SELECT USING (true);

CREATE POLICY "users_update" ON users FOR UPDATE
USING (auth_users_id = auth.uid())
WITH CHECK (auth_users_id = auth.uid());

-- ============================================================
-- RLS: organizations
-- ============================================================

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "organizations_select" ON organizations FOR SELECT USING (
  status = 'approved'
  OR owner_id = current_user_id()
  OR EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_id = organizations.id AND user_id = current_user_id()
  )
  OR is_admin()
);

CREATE POLICY "organizations_insert" ON organizations FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL AND owner_id = current_user_id()
);

CREATE POLICY "organizations_update" ON organizations FOR UPDATE
USING (is_org_admin(id) OR is_admin())
WITH CHECK (is_org_admin(id) OR is_admin());

-- ============================================================
-- RLS: organization_members
-- ============================================================

ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_members_select" ON organization_members FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM organization_members om
    WHERE om.organization_id = organization_members.organization_id
      AND om.user_id = current_user_id()
  )
  OR is_admin()
);

CREATE POLICY "org_members_insert" ON organization_members FOR INSERT WITH CHECK (
  is_org_admin(organization_id) OR is_admin()
);

CREATE POLICY "org_members_update" ON organization_members FOR UPDATE
USING (is_org_admin(organization_id) OR is_admin())
WITH CHECK (is_org_admin(organization_id) OR is_admin());

CREATE POLICY "org_members_delete" ON organization_members FOR DELETE USING (
  (is_org_admin(organization_id) AND user_id != current_user_id())
  OR is_admin()
);

-- ============================================================
-- RLS: organization_ratings
-- ============================================================

ALTER TABLE organization_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_ratings_select" ON organization_ratings FOR SELECT USING (true);

CREATE POLICY "org_ratings_insert" ON organization_ratings FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL AND user_id = current_user_id()
);

CREATE POLICY "org_ratings_update" ON organization_ratings FOR UPDATE
USING (user_id = current_user_id())
WITH CHECK (user_id = current_user_id());

CREATE POLICY "org_ratings_delete" ON organization_ratings FOR DELETE USING (
  user_id = current_user_id()
);

-- ============================================================
-- RLS: event_participants
-- ============================================================

ALTER TABLE event_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "participants_select" ON event_participants FOR SELECT USING (true);

CREATE POLICY "participants_insert" ON event_participants FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL
  AND user_id = current_user_id()
  AND EXISTS (
    SELECT 1 FROM events WHERE id = event_id AND status = 'approved'
  )
);

CREATE POLICY "participants_update" ON event_participants FOR UPDATE
USING (user_id = current_user_id())
WITH CHECK (user_id = current_user_id());

-- ============================================================
-- RLS: petition_signatures
-- ============================================================

ALTER TABLE petition_signatures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "signatures_select" ON petition_signatures FOR SELECT USING (true);

CREATE POLICY "signatures_insert" ON petition_signatures FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL
  AND user_id = current_user_id()
  AND EXISTS (
    SELECT 1 FROM events WHERE id = event_id AND status = 'approved'
  )
);

CREATE POLICY "signatures_delete" ON petition_signatures FOR DELETE USING (
  user_id = current_user_id()
);

-- ============================================================
-- RLS: event_feedback
-- ============================================================

ALTER TABLE event_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "feedback_select" ON event_feedback FOR SELECT USING (true);

CREATE POLICY "feedback_insert" ON event_feedback FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL
  AND user_id = current_user_id()
  AND EXISTS (
    SELECT 1 FROM events WHERE id = event_id AND status = 'completed'
  )
  AND EXISTS (
    SELECT 1 FROM event_participants
    WHERE event_id = event_feedback.event_id
      AND user_id = current_user_id()
      AND status = 'joined'
  )
);

CREATE POLICY "feedback_delete_admin" ON event_feedback FOR DELETE USING (is_admin());

-- ============================================================
-- RLS: appeals
-- ============================================================

ALTER TABLE appeals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "appeals_select" ON appeals FOR SELECT USING (
  user_id = current_user_id() OR is_admin()
);

CREATE POLICY "appeals_insert" ON appeals FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL
  AND user_id = current_user_id()
  AND EXISTS (
    SELECT 1 FROM events
    WHERE id = event_id
      AND status = 'rejected'
      AND creator_id = current_user_id()
  )
);

CREATE POLICY "appeals_update" ON appeals FOR UPDATE
USING (is_admin())
WITH CHECK (is_admin());

-- ============================================================
-- RLS: notifications
-- ============================================================

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_select" ON notifications FOR SELECT USING (
  user_id = current_user_id()
);

CREATE POLICY "notifications_update" ON notifications FOR UPDATE
USING (user_id = current_user_id())
WITH CHECK (user_id = current_user_id());
```

- [ ] **Step 2: Aplicare prin MCP `apply_migration`**

Name: `0005_functions_rls`

- [ ] **Step 3: Verificare RLS activat prin MCP `execute_sql`**

```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

Expected: toate tabelele cu `rowsecurity = true`.

- [ ] **Step 4: Verificare funcții helper prin MCP `execute_sql`**

```sql
SELECT proname FROM pg_proc
WHERE proname IN ('current_user_id', 'is_admin', 'is_org_admin');
```

Expected: 3 rânduri.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/0005_functions_rls.sql
git commit -m "feat(db): add helper functions and RLS policies"
```

---

## Task 9: Migrație 0006 — Trigger + Seed

**Files:** `supabase/migrations/0006_triggers_seed.sql`

- [ ] **Step 1: Creare `supabase/migrations/0006_triggers_seed.sql`**

```sql
-- ============================================================
-- TRIGGER: auth.users → users
-- La creare cont nou, inserare automată în public.users
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
-- SEED: sincronizare utilizatori existenți în auth.users
-- (pentru utilizatorii creați înainte de trigger)
-- ============================================================

INSERT INTO public.users (auth_users_id, email, name, role)
SELECT
  id,
  email,
  COALESCE(raw_user_meta_data->>'name', split_part(email, '@', 1)),
  'user'
FROM auth.users
ON CONFLICT (auth_users_id) DO NOTHING;

-- Primul utilizator devine admin (contul de dezvoltare)
UPDATE public.users
SET role = 'admin'
WHERE auth_users_id = (SELECT id FROM auth.users ORDER BY created_at LIMIT 1);

-- ============================================================
-- SEED: ONG aprobat
-- ============================================================

INSERT INTO organizations (name, description, website, owner_id, status)
SELECT
  'Asociația Civică România',
  'ONG dedicat implicării cetățenilor în viața publică.',
  'https://civica.ro',
  u.id,
  'approved'
FROM users u
WHERE u.role = 'admin'
LIMIT 1;

-- ============================================================
-- SEED: 3 evenimente aprobate
-- ============================================================

-- Protest (gathering)
WITH creator AS (SELECT id FROM users WHERE role = 'admin' LIMIT 1),
     evt AS (
       INSERT INTO events (title, description, category, subcategory, status, creator_id, creator_type)
       SELECT
         'Protest pentru Justiție',
         'Adunare publică pentru susținerea independenței justiției.',
         'protest', 'gathering', 'approved', id, 'user'
       FROM creator
       RETURNING id
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
WITH creator AS (SELECT id FROM users WHERE role = 'admin' LIMIT 1)
INSERT INTO events (title, description, category, status, creator_id, creator_type)
SELECT
  'Petiție pentru Spații Verzi',
  'Solicităm autorităților locale să mărească suprafața de spații verzi.',
  'petition', 'approved', id, 'user'
FROM creator;

WITH petition_evt AS (SELECT id FROM events WHERE title = 'Petiție pentru Spații Verzi')
INSERT INTO petitions (event_id, what_is_requested, requested_from, target_signatures, why_important)
SELECT
  id,
  'Creșterea suprafețelor verzi cu minim 20% în 2 ani.',
  'Primăria Generală a Municipiului București',
  1000,
  'Spațiile verzi sunt esențiale pentru sănătatea și calitatea vieții cetățenilor.'
FROM petition_evt;

-- Activitate comunitară — donații
WITH creator AS (SELECT id FROM users WHERE role = 'admin' LIMIT 1)
INSERT INTO events (title, description, category, subcategory, status, creator_id, creator_type)
SELECT
  'Colectă pentru Famiile Nevoiașe',
  'Strângem alimente neperisabile pentru familiile defavorizate din București.',
  'community', 'donations', 'approved', id, 'user'
FROM creator;

WITH comm_evt AS (SELECT id FROM events WHERE title = 'Colectă pentru Famiile Nevoiașe')
INSERT INTO community_activities (event_id)
SELECT id FROM comm_evt;

WITH ca AS (
  SELECT ca.id FROM community_activities ca
  JOIN events e ON e.id = ca.event_id
  WHERE e.title = 'Colectă pentru Famiile Nevoiașe'
)
INSERT INTO donations (community_activity_id, donation_type, what_is_needed)
SELECT id, 'material', ARRAY['conserve', 'paste', 'ulei', 'zahăr', 'făină'] FROM ca;
```

- [ ] **Step 2: Aplicare prin MCP `apply_migration`**

Name: `0006_triggers_seed`

- [ ] **Step 3: Verificare trigger prin MCP `execute_sql`**

```sql
SELECT trigger_name FROM information_schema.triggers
WHERE event_object_schema = 'auth' AND event_object_table = 'users';
```

Expected: `on_auth_user_created`.

- [ ] **Step 4: Verificare seed data prin MCP `execute_sql`**

```sql
SELECT role, COUNT(*) FROM users GROUP BY role;
```

Expected: cel puțin un `admin`.

```sql
SELECT title, status FROM events ORDER BY created_at;
```

Expected: 3 evenimente cu status `approved`.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/0006_triggers_seed.sql
git commit -m "feat(db): add auth trigger and seed data"
```

---

## Task 10: Storage Buckets

**Files:** niciun fișier — creare prin MCP `create_bucket` (dacă disponibil) sau Supabase Dashboard.

- [ ] **Step 1: Verificare buckets existente prin MCP `execute_sql`**

```sql
SELECT name, public FROM storage.buckets ORDER BY name;
```

- [ ] **Step 2: Creare buckets prin MCP `execute_sql`**

Dacă bucket-urile nu există:

```sql
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('banners', 'banners', true),
  ('logos', 'logos', true),
  ('gallery', 'gallery', true)
ON CONFLICT (id) DO NOTHING;
```

- [ ] **Step 3: Verificare**

```sql
SELECT name, public FROM storage.buckets ORDER BY name;
```

Expected: `banners`, `gallery`, `logos` — toate cu `public = true`.

- [ ] **Step 4: Commit**

```bash
git commit -m "feat(db): add storage buckets (banners, logos, gallery)" --allow-empty
```

---

## Task 11: `proxy.ts`

**Files:** `proxy.ts`

- [ ] **Step 1: Creare `proxy.ts` la rădăcina proiectului**

```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  const isPrivateRoute =
    pathname.startsWith('/panou') ||
    pathname.startsWith('/profil') ||
    pathname.startsWith('/creeaza') ||
    pathname.startsWith('/organizatie') ||
    pathname.startsWith('/admin')

  const isAuthRoute =
    pathname.startsWith('/autentificare') ||
    pathname.startsWith('/inregistrare') ||
    pathname.startsWith('/reseteaza-parola')

  if (isPrivateRoute && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/autentificare'
    return NextResponse.redirect(url)
  }

  if (isAuthRoute && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/panou'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

- [ ] **Step 2: Verificare TypeScript**

```bash
pnpm tsc --noEmit
```

Expected: zero erori.

- [ ] **Step 3: Commit**

```bash
git add proxy.ts
git commit -m "feat: add proxy for route protection (Next.js 16)"
```

---

## Task 12: `layout.tsx` + `globals.css`

**Files:** `app/layout.tsx`, `app/globals.css`

- [ ] **Step 1: Actualizare `app/layout.tsx`**

```typescript
import type { Metadata } from 'next'
import { Montserrat, Inter } from 'next/font/google'
import './globals.css'

const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-montserrat',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://civicom.ro'),
  title: {
    default: 'CIVICOM — Implicare Civică',
    template: '%s | CIVICOM',
  },
  description: 'Platforma de implicare civică. Creează și participă la proteste, petiții, boicoturi și activități comunitare.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="ro"
      className={`${montserrat.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  )
}
```

- [ ] **Step 2: Actualizare `app/globals.css`**

```css
@import "tailwindcss";

@theme inline {
  --font-sans: var(--font-inter);
  --font-heading: var(--font-montserrat);
}

/* Enter animations — exclusiv CSS, fără useState/useEffect */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}

.animate-fade-in-up {
  animation: fadeInUp 0.4s ease forwards;
}

.animate-fade-in {
  animation: fadeIn 0.3s ease forwards;
}
```

- [ ] **Step 3: Pornire dev server pentru verificare vizuală**

```bash
pnpm dev
```

Deschide `http://localhost:3000`. Expected: pagina default Next.js se încarcă cu fontul Inter vizibil, fără erori în consolă.

- [ ] **Step 4: Verificare TypeScript final**

```bash
pnpm tsc --noEmit
```

Expected: zero erori.

- [ ] **Step 5: Commit**

```bash
git add app/layout.tsx app/globals.css
git commit -m "feat: configure fonts (Montserrat + Inter) and root layout"
```

---

## Task 13: Verificare Finală

- [ ] **Step 1: Verificare completă tabele + RLS prin MCP `execute_sql`**

```sql
SELECT
  t.table_name,
  CASE WHEN c.relrowsecurity THEN 'RLS ✓' ELSE 'NO RLS ✗' END as rls_status
FROM information_schema.tables t
JOIN pg_class c ON c.relname = t.table_name
WHERE t.table_schema = 'public'
ORDER BY t.table_name;
```

Expected: 27 tabele, toate cu `RLS ✓`.

- [ ] **Step 2: Verificare trigger activ**

```sql
SELECT tgname, tgenabled FROM pg_trigger
WHERE tgname = 'on_auth_user_created';
```

Expected: `on_auth_user_created` cu `tgenabled = 'O'` (enabled).

- [ ] **Step 3: Verificare migrații înregistrate**

Prin MCP `list_migrations`. Expected: `0001_enums` → `0006_triggers_seed` listate.

- [ ] **Step 4: Verificare dev server fără erori**

```bash
pnpm dev
```

Vizitează `http://localhost:3000/panou` fără a fi autentificat.
Expected: redirect automat spre `/autentificare`.

- [ ] **Step 5: Commit final + push branch**

```bash
git add -A
git status  # verifică că nu rămâne nimic nestaged
git push -u origin feat/setup-infrastructure
```

---

## Criterii de Succes

- [ ] `pnpm dev` pornește fără erori TypeScript sau runtime
- [ ] 29 tabele în Supabase, toate cu RLS activat
- [ ] Trigger `on_auth_user_created` activ
- [ ] 3 evenimente seed cu status `approved` vizibile
- [ ] Storage buckets `banners`, `logos`, `gallery` create și publice
- [ ] `/panou` redirecționează spre `/autentificare` fără sesiune activă
- [ ] Fonturi Montserrat + Inter încarcate corect
