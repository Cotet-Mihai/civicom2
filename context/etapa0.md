# Etapa 0 — Setup & Infrastructură (COMPLETATĂ)

**Data:** 2026-04-21 / 2026-04-22
**Branch:** `feat/setup-infrastructure`
**Status:** 100% completă, merge în `main` după aprobare

---

## Ce s-a făcut

### 1. Proiect Supabase + `.env.local`

Proiectul Supabase exista deja: `https://bslgppjjtfropjzccetj.supabase.co`

Fișierul `.env.local` la rădăcina proiectului (nu este în git):
```
NEXT_PUBLIC_SUPABASE_URL=https://bslgppjjtfropjzccetj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

> **IMPORTANT:** Anon key este public (prefixat `NEXT_PUBLIC_`). Service role key bypass-ează RLS — folosit EXCLUSIV în `lib/supabase/admin.ts` pentru `completeEvent` și `createNotification`.

---

### 2. Pachete instalate

```bash
pnpm add @supabase/supabase-js @supabase/ssr
pnpm add sonner lucide-react embla-carousel-react
pnpm add react-leaflet leaflet
pnpm add -D @types/leaflet
```

**shadcn/ui** inițializat cu `pnpm dlx shadcn@latest init -d`:
- Tailwind v4 detectat automat
- Creat `components.json` la rădăcină
- Creat `components/ui/button.tsx` (primul component)
- Creat `lib/utils.ts` (cn helper)
- Actualizat `app/globals.css` cu tema shadcn completă (CSS variables oklch)

**Versiuni relevante:**
- `@supabase/supabase-js`: 2.104.0
- `@supabase/ssr`: 0.10.2
- `leaflet`: 1.9.4
- `react-leaflet`: 5.0.0
- `embla-carousel-react`: 8.6.0
- `sonner`: 2.0.7
- `lucide-react`: 1.8.0

---

### 3. Clienți Supabase (`lib/supabase/`)

#### `lib/supabase/client.ts`
- Folosit în **Client Components** (`"use client"`)
- `createBrowserClient` din `@supabase/ssr`
- Singleton automat în browser

#### `lib/supabase/server.ts`
- Folosit în **Server Components** și **Server Actions**
- `createServerClient` din `@supabase/ssr`
- Async — face `await cookies()` din `next/headers`
- `setAll` wrapped în try/catch (Server Components nu pot seta cookies)

#### `lib/supabase/admin.ts`
- Folosit EXCLUSIV în `completeEvent` și `createNotification`
- `createClient` din `@supabase/supabase-js` cu `SUPABASE_SERVICE_ROLE_KEY`
- Bypass complet RLS — a nu se folosi în altă parte
- `autoRefreshToken: false`, `persistSession: false`

---

### 4–7. Schema SQL — 6 migrații în `supabase/migrations/`

Schema experimentală anterioară (12 tabele) a fost ștearsă cu DROP CASCADE înainte de aplicarea migrațiilor noi. `auth.users` nu a fost atins.

#### `0001_enums.sql` — 9 enum-uri PostgreSQL
```sql
user_role: 'user' | 'admin'
creator_type: 'user' | 'ngo'
event_category: 'protest' | 'boycott' | 'petition' | 'community' | 'charity'
event_status: 'pending' | 'approved' | 'rejected' | 'contested' | 'completed'
org_status: 'pending' | 'approved' | 'rejected'
org_member_role: 'admin' | 'member'
participant_status: 'joined' | 'cancelled'
appeal_status: 'pending' | 'under_review' | 'resolved'
donation_type: 'material' | 'monetary'
```

#### `0002_tables_core.sql` — 5 tabele de bază

**`users`**: `id`, `auth_users_id` (FK→auth.users UNIQUE), `email` (UNIQUE), `name`, `role` (default 'user'), `phone`, `country`, `city`, `avatar_url`, `created_at`

**`organizations`**: `id`, `name`, `description`, `iban`, `website`, `logo_url`, `owner_id` (FK→users), `status` (default 'pending'), `rating` (default 0), `created_at`

**`events`**: `id`, `title`, `description`, `banner_url`, `gallery_urls` (text[], default '{}'), `category`, `subcategory`, `status` (default 'pending'), `creator_id` (FK→users), `creator_type`, `organization_id` (FK→organizations, nullable), `view_count` (default 0), `participants_count` (default 0), `created_at`, `updated_at`

**`organization_members`**: `id`, `organization_id` (FK→organizations CASCADE), `user_id` (FK→users CASCADE), `role`, `joined_at` — UNIQUE(organization_id, user_id)

**`organization_ratings`**: `id`, `organization_id` (FK→organizations), `user_id` (FK→users), `rating` int2 CHECK(1-5), `created_at` — UNIQUE(organization_id, user_id)

> Ordine de creare în fișier: users → organizations → events → organization_members → organization_ratings (respectă FK-urile)

#### `0003_tables_events.sql` — 17 tabele ierarhice

Ierarhia completă:
```
events
├── protests (event_id FK→events UNIQUE)
│   ├── gatherings (protest_id FK→protests UNIQUE) — location float8[2]
│   ├── marches (protest_id FK→protests UNIQUE) — locations float8[][]
│   └── pickets (protest_id FK→protests UNIQUE) — location float8[2]
├── boycotts (event_id FK→events UNIQUE)
│   └── boycott_brands (boycott_id FK→boycotts) — fără UNIQUE, un boycott are mai multe branduri
│       └── boycott_alternatives (brand_id FK→boycott_brands)
├── petitions (event_id FK→events UNIQUE)
├── community_activities (event_id FK→events UNIQUE)
│   ├── outdoor_activities (community_activity_id FK→community_activities UNIQUE) — location float8[2]
│   ├── donations (community_activity_id FK→community_activities UNIQUE) — donation_type enum
│   └── workshops (community_activity_id FK→community_activities UNIQUE) — location float8[2]
└── charity_events (event_id FK→events UNIQUE)
    ├── charity_concerts (charity_event_id FK→charity_events UNIQUE) — location float8[2], performers text[]
    ├── meet_greets (charity_event_id FK→charity_events UNIQUE) — location float8[2], guests text[]
    ├── charity_livestreams (charity_event_id FK→charity_events UNIQUE) — stream_link, cause
    └── sports_activities (charity_event_id FK→charity_events UNIQUE) — location float8[2]
```

**Notă locații:** `location float8[2]` = `[lat, lng]` · `locations float8[][]` = traseu marș

Toate FK-urile spre tabelul părinte au `ON DELETE CASCADE`.

#### `0004_tables_support.sql` — 5 tabele de suport

**`event_participants`**: `event_id` (FK→events CASCADE), `user_id` (FK→users CASCADE), `status` (default 'joined'), `joined_at` — UNIQUE(event_id, user_id)

**`petition_signatures`**: `event_id` (FK→events CASCADE), `user_id` (FK→users CASCADE), `joined_at` — UNIQUE(event_id, user_id)

**`event_feedback`**: `event_id` (FK→events CASCADE), `user_id` (FK→users CASCADE), `rating` int2 CHECK(1-5), `comment`, `created_at` — UNIQUE(event_id, user_id)

**`appeals`**: `event_id` (FK→events CASCADE), `user_id` (FK→users CASCADE), `reason`, `status` (default 'pending'), `admin_note`, `reviewed_by` (FK→users nullable), `created_at`, `reviewed_at`

**`notifications`**: `user_id` (FK→users CASCADE), `type`, `title`, `message`, `read` (default false), `created_at`

**Total: 27 tabele, toate cu RLS activat.**

#### `0005_functions_rls.sql` — Funcții helper + toate policies RLS

**Funcții helper (SECURITY DEFINER STABLE):**

```sql
current_user_id() → uuid
-- SELECT id FROM users WHERE auth_users_id = auth.uid()

is_admin() → boolean
-- EXISTS(SELECT 1 FROM users WHERE auth_users_id = auth.uid() AND role = 'admin')

is_org_admin(org_id uuid) → boolean
-- EXISTS(SELECT 1 FROM organization_members WHERE organization_id = org_id AND user_id = current_user_id() AND role = 'admin')
```

**Logica RLS pe scurt:**
- `events`: SELECT public (approved/completed) + own + admin; INSERT autentificat; UPDATE creator (∉ approved/completed) + admin; DELETE creator + admin
- **Tabele nivel 2** (protests, boycotts, petitions, community_activities, charity_events): acces via JOIN direct → events
- **Tabele nivel 3** (gatherings, marches, pickets, boycott_brands, outdoor_activities etc.): acces via JOIN dublu → events
- **boycott_alternatives**: JOIN triplu (brand → boycott → event)
- `users`: SELECT public (necesar pentru afișarea numelui organizatorului); UPDATE own; INSERT blocat (doar trigger)
- `organizations`: SELECT approved + membri + admin; INSERT autentificat; UPDATE admin ONG + admin
- `organization_members`: SELECT membrii aceluiași ONG + admin; DELETE — admin ONG nu se poate șterge singur
- `event_participants`: SELECT public; INSERT doar pe evenimente `approved`; UPDATE own (cancel)
- `petition_signatures`: SELECT public; INSERT doar pe `approved`; DELETE own
- `event_feedback`: INSERT dublu validat — eveniment `completed` + participant cu status `joined`
- `appeals`: INSERT doar creator pe eveniment `rejected`; UPDATE doar admin
- `notifications`: SELECT/UPDATE own; INSERT blocat (service_role only)

#### `0006_triggers_seed.sql` — Trigger + Seed

**Trigger:**
```sql
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```
Funcția `handle_new_user()` inserează automat în `public.users` cu `role = 'user'`. Folosește `COALESCE(raw_user_meta_data->>'name', split_part(email, '@', 1))` pentru nume.

**Seed:**
- Toți utilizatorii existenți în `auth.users` au fost sincronizați în `public.users` (ON CONFLICT DO NOTHING)
- Primul utilizator (cel mai vechi din `auth.users`) setat ca `admin`
- 1 organizație: `Asociația Civică România` cu status `approved`
- 3 evenimente cu status `approved`:
  - `Protest pentru Justiție` (gathering, locație București 44.4268, 26.1025)
  - `Petiție pentru Spații Verzi` (petition, target 1000 semnături)
  - `Colectă pentru Familii Nevoiașe` (community/donations, material)

---

### 8. Storage Buckets

Creare directă prin `INSERT INTO storage.buckets`:
- `banners` — public: true (imagini banner evenimente)
- `logos` — public: true (logo-uri organizații)
- `gallery` — public: true (galerii evenimente)

---

### 9. `proxy.ts` (Next.js 16)

**Locație:** rădăcina proiectului (același nivel cu `app/`)

**Important:** În Next.js 16, middleware se numește `proxy.ts` (nu `middleware.ts`). Exportă funcția `proxy` (nu `middleware`). Docs: `node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md`

**Logică:**
1. Creează client Supabase cu cookies din request
2. Verifică sesiunea cu `supabase.auth.getUser()`
3. Rute private (`/panou`, `/profil`, `/creeaza`, `/organizatie`, `/admin`) fără sesiune → redirect `/autentificare`
4. Rute auth (`/autentificare`, `/inregistrare`, `/reseteaza-parola`) cu sesiune → redirect `/panou`
5. Altfel → `NextResponse.next()`

**Matcher:** tot, cu excepția `_next/static`, `_next/image`, `favicon.ico`, și fișiere media.

---

### 10. `app/layout.tsx` + `app/globals.css`

**Fonturi:** Montserrat (headings) + Inter (body) via `next/font/google`
- CSS variables: `--font-montserrat`, `--font-inter`
- `@theme inline`: `--font-sans: var(--font-inter)`, `--font-heading: var(--font-montserrat)`
- `<html>` primește ambele variabile ca clase

**`metadataBase`:** `new URL('https://civicom.ro')`

**Title template:** `'%s | CIVICOM'` (paginile individuale setează doar titlul lor, sufixul se adaugă automat)

**`globals.css`** conține:
- Import-uri shadcn: `@import "tw-animate-css"`, `@import "shadcn/tailwind.css"`
- `@custom-variant dark` pentru dark mode
- Toate CSS variables shadcn (oklch color system)
- Animații enter (exclusiv CSS, fără useState): `.animate-fade-in-up`, `.animate-fade-in`

---

## Structura fișierelor create

```
civicom2/
├── .env.local                          ← keys Supabase (nu în git)
├── proxy.ts                            ← protecție rute (Next.js 16 middleware)
├── components.json                     ← config shadcn/ui
├── app/
│   ├── layout.tsx                      ← Montserrat+Inter, metadataBase, lang="ro"
│   └── globals.css                     ← shadcn theme + animații CSS
├── components/
│   └── ui/
│       └── button.tsx                  ← primul component shadcn
├── lib/
│   ├── utils.ts                        ← cn() helper (shadcn)
│   └── supabase/
│       ├── client.ts                   ← createBrowserClient (Client Components)
│       ├── server.ts                   ← createServerClient (Server Components + Actions)
│       └── admin.ts                    ← createAdminClient (service_role, bypass RLS)
└── supabase/
    └── migrations/
        ├── 0001_enums.sql              ← 9 enum-uri PostgreSQL
        ├── 0002_tables_core.sql        ← users, organizations, events, org_members, org_ratings
        ├── 0003_tables_events.sql      ← 17 tabele ierarhice (protests→gatherings etc.)
        ├── 0004_tables_support.sql     ← participants, signatures, feedback, appeals, notifications
        ├── 0005_functions_rls.sql      ← 3 funcții helper + toate policies RLS
        └── 0006_triggers_seed.sql      ← trigger auth→users + seed data
```

---

## Starea Supabase la finalul Etapei 0

- **27 tabele** în schema `public`, toate cu RLS activat
- **9 enum-uri** PostgreSQL
- **3 funcții helper** SECURITY DEFINER: `current_user_id()`, `is_admin()`, `is_org_admin()`
- **Trigger** `on_auth_user_created` activ pe `auth.users`
- **3 storage buckets** publice: `banners`, `logos`, `gallery`
- **Seed:** utilizator admin + 1 ONG aprobat + 3 evenimente aprobate

---

## Commits pe branch `feat/setup-infrastructure`

```
chore: install packages and initialize shadcn/ui
feat: add supabase clients (browser, server, admin)
feat(db): add full schema - enums, 27 tables across 3 migrations
feat(db): add helper functions and RLS policies on all 27 tables
feat(db): add auth trigger and seed data (1 ONG, 3 events)
feat: add proxy.ts, Montserrat+Inter fonts, metadataBase and enter animations
```

---

## Decizii tehnice importante

- **`proxy.ts` nu `middleware.ts`** — Next.js 16 redenumit convenția
- **shadcn/ui folosește Tailwind v4** — sintaxa `@theme inline {}` în loc de `tailwind.config.js`
- **Schema ierarhică, nu EAV** — fiecare subtip are propriul tabel, nu câmpuri generice
- **`boycott_brands` fără UNIQUE pe `boycott_id`** — un boycott poate boicota mai multe branduri
- **`admin.ts` cu `service_role`** — singurul loc unde RLS este bypass-at, exclusiv pentru operații de sistem
- **Animații enter exclusiv CSS** — niciun `useState`/`useEffect` pentru animații de intrare, definite în `globals.css`
- **Fonturi via `next/font/google`** — optimizate automat, fără FOUT, self-hosted de Next.js

---

## Ce urmează: Etapa 1 — Autentificare

Branch: `feat/auth`

Pași conform roadmap Notion:
- `auth.service.ts` (signUp, signIn, signOut, sendPasswordResetEmail, updatePassword, getSession)
- `hooks/useSignIn.ts`, `useSignUp.ts`, `useResetPassword.ts`
- `components/ui/InputPassword.tsx`, `InputPasswordStrength.tsx`
- `/autentificare` — SignInFormClient (email/parolă + Google + GitHub)
- `/inregistrare` — SignUpFormClient (Nume, Prenume, Email, Parolă cu indicator)
- `/reseteaza-parola` — ResetPasswordFormClient
- `/auth/callback` — route handler OAuth Supabase
- `(auth)/layout.tsx` cu `metadata robots: noindex`
