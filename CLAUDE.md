@AGENTS.md

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Despre Proiect

**CIVICOM** este o platformă de implicare civică ce centralizează acțiunile civice. Utilizatorii și ONG-urile pot crea, administra și participa la: proteste, boicoturi, petiții, activități comunitare și evenimente caritabile.

> Principiu de bază: „Toate acțiunile civice sunt evenimente unificate, nu sisteme separate."

**Status:** În planificare (MVP). Codul nu există încă.

## Stack Tehnologic

- **Framework:** Next.js 15+ (App Router)
- **Backend:** Supabase (Auth + PostgreSQL + Storage)
- **Logică server:** Server Actions (exclusiv în `/services`)
- **UI:** shadcn/ui + Tailwind CSS
- **Hărți:** Leaflet
- **Analytics:** Vercel Analytics + PostHog
- **Deploy:** Vercel

## Arhitectura Proiectului

### Route Groups (stricte, fără excepție)

```
app/
  (auth)/          → autentificare: /autentificare, /inregistrare, /resetare-parola, /auth/callback
  (public)/        → pagini fără auth: /, /evenimente, /evenimente/[id], /organizatii, /organizatii/[id]
  (private)/       → pagini cu auth obligatorie (protejate prin middleware + Supabase session)
    panou/         → dashboard user
    profil/
    creeaza/       → creare evenimente (toate tipurile/subtipurile)
    organizatie/
    admin/         → exclusiv role=admin
```

Middleware (`proxy.ts`): verifică sesiunea, protejează rutele private, redirecționează neautorizații.

### Structura de Foldere

```
components/
  ui/          → design system: buttons, inputs, modals, badges
  shared/      → componente reutilizabile business: EventCard, UserCard, PetitionCard
  layout/      → Navbar, Sidebar, Footer, layouts

services/      → Server Actions + interacțiuni Supabase (NU conține JSX)
  event.service.ts · auth.service.ts · protest.service.ts
  petition.service.ts · organization.service.ts · etc.

lib/           → funcții pure, fără side effects: utils.ts, formatters.ts, constants.ts
hooks/         → logică React reutilizabilă: useEventParticipation, usePetitionSign
```

### Reguli Arhitecturale Obligatorii

- **UI (components) este complet separat de Business Logic (services)**
- Componentele NU accesează Supabase direct — primesc date prin props sau hooks
- Server Actions → exclusiv în `/services`
- Componentele locale stau în folderul paginii; dacă sunt necesare pe altă pagină se mută în `/components/shared` (nu se duplică)
- Înainte de a crea o componentă nouă, se verifică obligatoriu `/components/ui`, `/components/shared` și toate componentele locale existente

## Modelul de Date

Baza de date: Supabase PostgreSQL cu RLS activat.

### Ierarhia tabelelor de evenimente

```
events (tabel de bază — câmpuri comune tuturor tipurilor)
├── protests ──────── gatherings (adunare — location)
│                 ├── marches (marș — locations[])
│                 └── pickets (pichet — location)
├── boycotts ──────── boycott_brands → boycott_alternatives
├── petitions
├── community_activities ── outdoor_activities
│                       ├── donations
│                       └── workshops
└── charity_events ──── charity_concerts
                    ├── meet_greets
                    ├── charity_livestreams
                    └── sports_activities
```

Orice câmp specific unui tip/subtip stă în tabelul propriu, nu în `events`.

### Statusuri evenimente

`pending` → `approved` | `rejected` → (dacă rejected) `contested` → reanaliză → `approved` | `rejected`

Doar evenimentele cu `status = approved` sunt vizibile public.

### Roluri utilizatori

- `user` — rol default; creează evenimente, participă, semnează petiții, contestă decizii
- `admin` — validează/respinge evenimente, aprobă ONG-uri, gestionează contestații
- Membrul ONG nu este un rol — apartenența la organizație se gestionează prin `organization_members` (roluri: `admin` | `member`)

### Tabele principale de suport

- `users` (FK → auth.users)
- `organizations` + `organization_members` + `organization_ratings`
- `event_participants` — UNIQUE(event_id, user_id)
- `petition_signatures` — UNIQUE(event_id, user_id)
- `appeals` (contestații) — statusuri: `pending` | `under_review` | `resolved`
- `notifications`

### Enums PostgreSQL

```sql
user_role: user | admin
creator_type: user | ngo
event_category: protest | boycott | petition | community | charity
event_status: pending | approved | rejected | contested
org_status: pending | approved | rejected
org_member_role: admin | member
participant_status: joined | cancelled
appeal_status: pending | under_review | resolved
donation_type: material | monetary
```

## Rute Complete

### (auth) — redirecționează autentificații spre /panou
- `/autentificare` · `/inregistrare` · `/resetare-parola` · `/resetare-parola/confirmare` · `/auth/callback`

### (public) — Navbar + Footer global
- `/` · `/evenimente` · `/evenimente/[id]` · `/organizatii` · `/organizatii/[id]`

### (private) — Navbar + Sidebar global; redirect la /autentificare dacă lipsește sesiunea
- Panou: `/panou` · `/panou/evenimente` · `/panou/participari` · `/panou/petitii` · `/panou/contestatii`
- Profil: `/profil` · `/profil/editare`
- Creare: `/creeaza` → selector tip → pagini individuale per subtip (15 rute de creare)
- Editare/Contestație: `/evenimente/[id]/editare` · `/evenimente/[id]/contestatie`
- ONG: `/organizatie/creeaza` · `/organizatie/[id]/panou` · `/organizatie/[id]/evenimente` · `/organizatie/[id]/membri` · `/organizatie/[id]/setari`
- Admin (👑): `/admin` · `/admin/evenimente` · `/admin/evenimente/[id]` · `/admin/organizatii` · `/admin/contestatii`

## Workflow Git

- Orice feature nou → branch dedicat din `main`: `feat/creare-protest`, `feat/dashboard-ong`
- Push-urile se fac exclusiv pe branch, nu direct pe `main`
- Merge în `main` doar după finalizarea completă a feature-ului și cu aprobare explicită

## Notion (Planificare)

Documentația completă a proiectului se află în Notion (conectat prin MCP):
- **Software Planning (MVP)** — arhitectură, fluxuri, roluri, MVP scope
- **Data Models** — schema completă a bazei de date
- **Pagini & Rute** — toate rutele cu componente specifice
- **RLS Policies** · **User Stories** · **Server Actions** · **SEO & Metadata** — în curs de completare
