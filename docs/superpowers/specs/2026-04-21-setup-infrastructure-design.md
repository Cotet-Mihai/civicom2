# Design: Setup & Infrastructură (Etapa 0)

**Data:** 2026-04-21
**Branch:** `feat/setup-infrastructure`
**Status:** Aprobat

---

## 1. Obiectiv

Configurarea completă a fundației tehnice a aplicației CIVICOM:
- Schema SQL completă în Supabase (27 tabele + 9 enums + funcții helper + RLS + trigger)
- Clienți Supabase (browser, server, admin)
- Pachete npm necesare
- `proxy.ts` pentru protecția rutelor
- Root `layout.tsx` cu fonturi și metadataBase
- Storage buckets
- Seed data de bază

---

## 2. Pachete de Instalat

```bash
pnpm add @supabase/supabase-js @supabase/ssr
pnpm add sonner lucide-react embla-carousel-react
pnpm add react-leaflet leaflet
pnpm add -D @types/leaflet
```

shadcn/ui este deja configurat (CLI prezent). Componente se adaugă pe măsură ce sunt necesare.

---

## 3. Variabile de Mediu

**`.env.local`** (la rădăcina proiectului, niciodată în git):

```env
NEXT_PUBLIC_SUPABASE_URL=https://bslgppjjtfropjzccetj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon_key>
SUPABASE_SERVICE_ROLE_KEY=<service_role_key>
```

---

## 4. Fișiere Supabase Client

### `lib/supabase/client.ts`
Folosit în Client Components. Instanță singleton prin `createBrowserClient`.

### `lib/supabase/server.ts`
Folosit în Server Components și Server Actions. Folosește `createServerClient` cu cookies din `next/headers`.

### `lib/supabase/admin.ts`
Folosit exclusiv în `completeEvent` și `createNotification`. Folosește `createClient` cu `SUPABASE_SERVICE_ROLE_KEY` — bypass RLS.

---

## 5. Migrații SQL

Toate fișierele în `supabase/migrations/`. Se aplică în ordine prin MCP (`apply_migration`).

**Înainte de prima migrație:** DROP pe schema experimentală existentă (toate tabelele din `public`, fără a atinge `auth`).

### 0001_enums.sql

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

### 0002_tables_core.sql

**`users`**
| Coloană | Tip | Detalii |
|---|---|---|
| `id` | `uuid` | PK, `gen_random_uuid()` |
| `auth_users_id` | `uuid` | FK → `auth.users.id`, UNIQUE |
| `email` | `text` | UNIQUE, NOT NULL |
| `name` | `text` | NOT NULL |
| `role` | `user_role` | default `user` |
| `phone` | `text` | nullable |
| `country` | `text` | nullable |
| `city` | `text` | nullable |
| `avatar_url` | `text` | nullable |
| `created_at` | `timestamptz` | default `now()` |

**`events`**
| Coloană | Tip | Detalii |
|---|---|---|
| `id` | `uuid` | PK, `gen_random_uuid()` |
| `title` | `text` | NOT NULL |
| `description` | `text` | NOT NULL |
| `banner_url` | `text` | nullable |
| `gallery_urls` | `text[]` | default `'{}'` |
| `category` | `event_category` | NOT NULL |
| `subcategory` | `text` | nullable |
| `status` | `event_status` | default `pending` |
| `creator_id` | `uuid` | FK → `users.id` |
| `creator_type` | `creator_type` | NOT NULL |
| `organization_id` | `uuid` | FK → `organizations.id`, nullable |
| `view_count` | `int4` | default `0` |
| `participants_count` | `int4` | default `0` |
| `created_at` | `timestamptz` | default `now()` |
| `updated_at` | `timestamptz` | default `now()` |

**`organizations`**
| Coloană | Tip | Detalii |
|---|---|---|
| `id` | `uuid` | PK |
| `name` | `text` | NOT NULL |
| `description` | `text` | nullable |
| `iban` | `text` | nullable |
| `website` | `text` | nullable |
| `logo_url` | `text` | nullable |
| `owner_id` | `uuid` | FK → `users.id` |
| `status` | `org_status` | default `pending` |
| `rating` | `float4` | default `0` |
| `created_at` | `timestamptz` | default `now()` |

**`organization_members`**
| Coloană | Tip | Detalii |
|---|---|---|
| `id` | `uuid` | PK |
| `organization_id` | `uuid` | FK → `organizations.id`, ON DELETE CASCADE |
| `user_id` | `uuid` | FK → `users.id`, ON DELETE CASCADE |
| `role` | `org_member_role` | NOT NULL |
| `joined_at` | `timestamptz` | default `now()` |

UNIQUE(`organization_id`, `user_id`)

**`organization_ratings`**
| Coloană | Tip | Detalii |
|---|---|---|
| `id` | `uuid` | PK |
| `organization_id` | `uuid` | FK → `organizations.id` |
| `user_id` | `uuid` | FK → `users.id` |
| `rating` | `int2` | 1–5 |
| `created_at` | `timestamptz` | default `now()` |

UNIQUE(`organization_id`, `user_id`)

### 0003_tables_events.sql

Ierarhie:
```
events
├── protests → gatherings / marches / pickets
├── boycotts → boycott_brands → boycott_alternatives
├── petitions
├── community_activities → outdoor_activities / donations / workshops
└── charity_events → charity_concerts / meet_greets / charity_livestreams / sports_activities
```

**Ordine creare în 0002:** `users` → `organizations` → `events` → `organization_members` → `organization_ratings` (respectă dependențele FK).

Toate tabelele de nivel 2 au `event_id uuid FK → events.id ON DELETE CASCADE UNIQUE`.
Toate tabelele de nivel 3 au FK spre tabelul de nivel 2 cu `ON DELETE CASCADE UNIQUE`.

**`protests`**: `date date NOT NULL`, `time_start time NOT NULL`, `time_end time`, `max_participants int4 NOT NULL`, `recommended_equipment text`, `safety_rules text`, `contact_person text`

**`gatherings`**: `protest_id → protests.id`, `location float8[2] NOT NULL` — `[lat, lng]`

**`marches`**: `protest_id → protests.id`, `locations float8[][] NOT NULL` — traseu

**`pickets`**: `protest_id → protests.id`, `location float8[2] NOT NULL`

**`boycotts`**: `reason text NOT NULL`, `method text NOT NULL`

**`boycott_brands`**: `boycott_id → boycotts.id ON DELETE CASCADE` (fără UNIQUE — un boycott poate avea mai multe branduri), `name text NOT NULL`, `link text`

**`boycott_alternatives`**: `brand_id → boycott_brands.id ON DELETE CASCADE`, `name text NOT NULL`, `link text NOT NULL`, `reason text`

**`petitions`**: `what_is_requested text NOT NULL`, `requested_from text NOT NULL`, `target_signatures int4 NOT NULL`, `why_important text NOT NULL`, `contact_person text`

**`community_activities`**: `contact_person text`

**`outdoor_activities`**: `community_activity_id → community_activities.id`, `location float8[2] NOT NULL`, `date date NOT NULL`, `time_start time NOT NULL`, `time_end time`, `recommended_equipment text`, `what_organizer_offers text`, `max_participants int4`

**`donations`**: `community_activity_id → community_activities.id`, `donation_type donation_type NOT NULL`, `what_is_needed text[]`, `target_amount numeric`

**`workshops`**: `community_activity_id → community_activities.id`, `location float8[2] NOT NULL`, `date date NOT NULL`, `time_start time NOT NULL`, `time_end time`, `max_participants int4`, `recommended_equipment text`, `what_organizer_offers text`

**`charity_events`**: `target_amount numeric`, `collected_amount numeric`

**`charity_concerts`**: `charity_event_id → charity_events.id`, `location float8[2] NOT NULL`, `date date NOT NULL`, `time_start time NOT NULL`, `time_end time`, `performers text[] NOT NULL`, `ticket_price numeric`, `ticket_link text`, `max_participants int4`

**`meet_greets`**: `charity_event_id → charity_events.id`, `location float8[2] NOT NULL`, `date date NOT NULL`, `time_start time NOT NULL`, `time_end time`, `guests text[] NOT NULL`, `ticket_price numeric`, `ticket_link text`, `max_participants int4`

**`charity_livestreams`**: `charity_event_id → charity_events.id`, `stream_link text NOT NULL`, `cause text NOT NULL`, `time_start time NOT NULL`, `time_end time`, `guests text[]`

**`sports_activities`**: `charity_event_id → charity_events.id`, `location float8[2] NOT NULL`, `date date NOT NULL`, `time_start time NOT NULL`, `time_end time`, `guests text[]`, `ticket_price numeric`, `ticket_link text`, `max_participants int4`

### 0004_tables_support.sql

**`event_participants`**: `event_id → events.id ON DELETE CASCADE`, `user_id → users.id ON DELETE CASCADE`, `status participant_status default joined`, `joined_at timestamptz default now()` — UNIQUE(`event_id`, `user_id`)

**`petition_signatures`**: `event_id → events.id ON DELETE CASCADE`, `user_id → users.id ON DELETE CASCADE`, `joined_at timestamptz default now()` — UNIQUE(`event_id`, `user_id`)

**`event_feedback`**: `event_id → events.id ON DELETE CASCADE`, `user_id → users.id ON DELETE CASCADE`, `rating int2 NOT NULL (1–5)`, `comment text`, `created_at` — UNIQUE(`event_id`, `user_id`)

**`appeals`**: `event_id → events.id ON DELETE CASCADE`, `user_id → users.id ON DELETE CASCADE`, `reason text NOT NULL`, `status appeal_status default pending`, `admin_note text`, `reviewed_by uuid → users.id`, `created_at`, `reviewed_at`

**`notifications`**: `user_id → users.id ON DELETE CASCADE`, `type text`, `title text NOT NULL`, `message text NOT NULL`, `read boolean default false`, `created_at`

### 0005_functions_rls.sql

**Funcții helper** (SECURITY DEFINER STABLE):
- `current_user_id()` → uuid: `SELECT id FROM users WHERE auth_users_id = auth.uid()`
- `is_admin()` → boolean: verifică `role = 'admin'` în `users`
- `is_org_admin(org_id uuid)` → boolean: verifică `organization_members` cu rol `admin`

**RLS policies** conform Notion RLS Policies (complet):
- `events`: SELECT public (approved/completed) + own + admin; INSERT autentificat; UPDATE creator (∉ approved/completed) + admin; DELETE creator + admin
- Subtabele nivel 2 (`protests`, `boycotts`, `petitions`, `community_activities`, `charity_events`): pattern via JOIN → events
- Subtabele nivel 3 (`gatherings`, `marches`, `pickets`, `outdoor_activities`, `donations`, `workshops`, `charity_concerts`, `meet_greets`, `charity_livestreams`, `sports_activities`, `boycott_brands`, `boycott_alternatives`): pattern via JOIN dublu → events
- `users`: SELECT public; UPDATE own; INSERT blocat (doar trigger)
- `organizations`: SELECT approved + membri + admin; INSERT autentificat; UPDATE admin ONG + admin
- `organization_members`: SELECT membrii același ONG + admin; INSERT/UPDATE admin ONG; DELETE admin ONG (not self) + admin
- `organization_ratings`: SELECT/INSERT/UPDATE/DELETE standard own
- `event_participants`: SELECT public; INSERT autentificat (doar pe `approved`); UPDATE own (cancel)
- `petition_signatures`: SELECT public; INSERT autentificat (doar pe `approved`); DELETE own
- `event_feedback`: SELECT public; INSERT participant (doar pe `completed`, dublu validat); DELETE admin
- `appeals`: SELECT own + admin; INSERT creator (pe `rejected`); UPDATE admin
- `notifications`: SELECT own; INSERT blocat (service_role only); UPDATE own (mark read)

### 0006_triggers_seed.sql

**Trigger `auth.users → users`:**
```sql
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
```

**Seed data:**
- 2 useri (1 `user`, 1 `admin`) inserați direct în `users` (auth.users există deja)
- 1 organizație cu status `approved`
- 3 evenimente cu status `approved`: 1 protest (gathering), 1 petiție, 1 activitate comunitară (donații)

---

## 6. Storage Buckets

Creat prin MCP sau Supabase dashboard:
- `banners` — public, pentru imaginile banner ale evenimentelor
- `logos` — public, pentru logo-urile organizațiilor
- `gallery` — public, pentru galeriile evenimentelor

---

## 7. `proxy.ts`

La rădăcina proiectului. Exportă funcția `proxy` (Next.js 16 convention).

**Logică:**
1. Dacă ruta este `(private)` și nu există sesiune → redirect `/autentificare`
2. Dacă ruta este `(auth)` și există sesiune → redirect `/panou`
3. Altfel → `NextResponse.next()`

**Matcher:** toate rutele cu excepția `_next/static`, `_next/image`, `favicon.ico`, fișiere publice.

Sesiunea se verifică cu `createServerClient` din `@supabase/ssr` folosind cookies din request/response.

---

## 8. Root `layout.tsx`

```tsx
import { Montserrat, Inter } from 'next/font/google'

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
```

**`metadataBase`:** `new URL('https://civicom.ro')`

**CSS variables în `globals.css`:**
- `--font-montserrat`: headings, navbar, butoane, badge-uri
- `--font-inter`: body text, descrieri, tabele, input-uri

---

## 9. Ordine de Execuție

1. Creare branch `feat/setup-infrastructure`
2. Instalare pachete npm
3. Creare `.env.local`
4. Creare `lib/supabase/client.ts`, `server.ts`, `admin.ts`
5. DROP schema experimentală (tabele publice, nu auth)
6. Aplicare migrații `0001` → `0006` prin MCP
7. Creare storage buckets prin MCP
8. Creare `proxy.ts`
9. Actualizare `app/layout.tsx` (fonturi, metadataBase)
10. Actualizare `globals.css` (CSS variables, animații enter)

---

## 10. Criterii de Succes

- [ ] `pnpm dev` pornește fără erori
- [ ] Toate cele 27 tabele există în Supabase cu RLS activat
- [ ] Trigger-ul auth→users funcționează (creare cont nou → rând în `users`)
- [ ] `proxy.ts` redirecționează corect rutele private și auth
- [ ] Storage buckets `banners`, `logos`, `gallery` există și sunt publice
- [ ] Seed data vizibilă în tabele
