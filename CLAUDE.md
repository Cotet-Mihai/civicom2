@AGENTS.md

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Despre Proiect

**CIVICOM** este o platformă de implicare civică ce centralizează acțiunile civice. Utilizatorii și ONG-urile pot crea, administra și participa la: proteste, boicoturi, petiții, activități comunitare și evenimente caritabile.

> Principiu de bază: „Toate acțiunile civice sunt evenimente unificate, nu sisteme separate."

> **Design:** Aplicația este **mobile-first**. Orice componentă sau pagină se proiectează și se testează întâi pe mobil, apoi se adaptează pentru desktop. Versiunea desktop trebuie să arate bine, dar prioritatea absolută este experiența pe mobil.

> **Brand:** Oriunde apare **CIVICOM** ca nume de brand vizibil în UI (logo, subtitluri, texte promoționale), se scrie întotdeauna **CIVICOM✨**. Excepție: metadata SEO (title, description, og:title etc.) unde emoji-ul nu se include.

> **Pagini noi — obligatoriu:** Înainte de a crea sau implementa orice pagină nouă, consultă **Notion → Pagini & Rute** pentru indicațiile de design specifice acelei pagini (structură, componente, layout, date necesare). Nu începe implementarea fără să fi verificat mai întâi această sursă.

**Status:** Planificat complet, pregătit pentru implementare. Vezi Notion (Roadmap & Structură Proiect) pentru etape și ordine.

## Stack Tehnologic

- **Framework:** Next.js 15+ (App Router)
- **Backend:** Supabase (Auth + PostgreSQL + Storage)
- **Logică server:** Server Actions (exclusiv în `/services`)
- **UI:** shadcn/ui + Tailwind CSS
- **Hărți:** shadcn-map (built on Leaflet + React Leaflet) — instalare: `pnpm dlx shadcn@latest add @shadcn-map/map` · componente: `Map`, `MapMarker`, `MapPopup`, `MapTileLayer`, `MapZoomControl`
- **Carusele:** Embla Carousel
- **Notificări UI:** Sonner
- **Analytics:** Vercel Analytics + PostHog
- **Deploy:** Vercel

## Arhitectura Proiectului

### Route Groups (stricte, fără excepție)

```
app/
  (auth)/          → /autentificare · /inregistrare · /reseteaza-parola · /auth/callback
  (public)/        → / · /evenimente · /evenimente/[id] · /organizatii · /organizatii/[id]
  (private)/       → pagini cu auth obligatorie (protejate prin middleware + Supabase session)
    panou/         → dashboard user + sub-rute
    profil/
    creeaza/       → selector tip + 5 stepper-uri (protest/boycott/petitie/comunitar/caritabil)
    organizatie/
    admin/         → exclusiv role=admin
```

`proxy.ts`: verifică sesiunea, protejează rutele private, redirecționează neautorizații spre `/autentificare`. Dacă sesiunea există și userul accesează o rută `(auth)`, redirect spre `/panou`.

### Structura de Foldere

```
components/
  ui/          → design system: buttons, inputs, modals, badges, InputPassword, InputPasswordStrength
  shared/      → componente reutilizabile business:
                 EventCard · ActionButtons · ParticipationCardClient · FeedbackSection
  layout/      → PublicNavbar · DashboardNavbar · Footer

services/      → Server Actions + interacțiuni Supabase (NU conține JSX)
  auth.service.ts · event.service.ts · protest.service.ts · boycott.service.ts
  petition.service.ts · community.service.ts · charity.service.ts
  organization.service.ts · appeal.service.ts · notification.service.ts
  feedback.service.ts · admin.service.ts · user.service.ts

lib/
  supabase/
    client.ts    → createBrowserClient (componente client)
    server.ts    → createServerClient (Server Components + Actions)
    admin.ts     → createAdminClient cu service_role (bypass RLS — completeEvent, createNotification)
  utils.ts · formatters.ts · constants.ts

hooks/         → logică React reutilizabilă
  useSignIn.ts · useSignUp.ts · useResetPassword.ts
  useEventParticipation.ts · usePetitionSign.ts
```

### Reguli Arhitecturale Obligatorii

- **UI (components) este complet separat de Business Logic (services)**
- Componentele NU accesează Supabase direct — primesc date prin props sau hooks
- Server Actions → exclusiv în `/services`
- Componentele locale stau în folderul paginii; dacă sunt necesare pe altă pagină se mută în `/components/shared` (nu se duplică)
- Înainte de a crea o componentă nouă, se verifică obligatoriu `/components/ui`, `/components/shared` și toate componentele locale existente

### Regula `"use client"` — Granularitate Maximă

**Default: Server Component.** `"use client"` se adaugă doar când componenta folosește hooks, event handlers sau browser APIs.

**Regula de aur:** Nu marca o întreagă secțiune ca `"use client"` doar pentru o bucată interactivă. Extrage acea bucată într-o componentă separată dedicată și marchează doar ea ca client.

```
// GREȘIT — toată secțiunea devine client doar pentru carousel
"use client"
export function NgoSection() { ... <Carousel> ... }

// CORECT — secțiunea rămâne server, doar carousel-ul e client
export function NgoSection() {        // Server Component
  return <section>
    <h2>...</h2>                       // server
    <NgoCarouselClient ngos={ngos} />  // Client Component dedicat
  </section>
}
```

Componente client dedicate se numesc cu sufixul `Client` (ex: `NgoCarouselClient`, `FaqAccordionClient`, `StatsCounterClient`, `ParticipationCardClient`) și primesc datele ca props de la părintele server.

### Navigație — Două Navbars Separate

Aplicația folosește **două componente distincte**, nu una condiționată:

- **`PublicNavbar`** — pentru `(public)`: Logo + /evenimente + /organizatii + butoane Autentificare/Înregistrare
- **`DashboardNavbar`** — pentru `(private)`:
  - Stânga: Logo + "CIVICOM" → redirect `/`
  - Dreapta: buton `+ Creează eveniment` (verde) + Avatar icon → Dropdown
  - Dropdown: Panou · Evenimentele mele · Participări · Petiții semnate · Contestații · Organizația mea (sau Solicită creare ONG dacă nu e în niciun ONG) · Creează eveniment · Profil · Deconectare
  - Mobil: dropdown devine Sheet (drawer)

## Modelul de Date

Baza de date: Supabase PostgreSQL cu RLS activat.

### Ierarhia tabelelor de evenimente

```
events (tabel de bază — câmpuri comune tuturor tipurilor)
├── protests ──────── gatherings  (adunare — location: float8[2])
│                 ├── marches     (marș — locations: float8[][])
│                 └── pickets     (pichet — location: float8[2])
├── boycotts ──────── boycott_brands → boycott_alternatives
├── petitions
├── community_activities ── outdoor_activities  (location: float8[2])
│                       ├── donations
│                       └── workshops           (location: float8[2])
└── charity_events ──── charity_concerts        (location: float8[2])
                    ├── meet_greets             (location: float8[2])
                    ├── charity_livestreams
                    └── sports_activities       (location: float8[2])
```

`location: float8[2]` = `[lat, lng]`. `locations: float8[][]` = `[[lat, lng], [lat, lng], ...]` (traseu marș).
Orice câmp specific unui tip/subtip stă în tabelul propriu, nu în `events`.

### Statusuri evenimente

```
pending → approved | rejected → (dacă rejected) contested → reanaliză → approved | rejected
approved → completed
```

- **Auto-completed** (cron la expirare `date + time_end`): protests · outdoor_activities · workshops · charity_concerts · meet_greets · sports_activities
- **Manual-completed** (de creator din dashboard): boycotts · petitions · donations · charity_livestreams

Evenimentele cu `status = approved` sau `completed` sunt vizibile public. Celelalte sunt vizibile doar creatorului și adminului.

### Roluri utilizatori

- `user` — rol default; creează evenimente, participă, semnează petiții, contestă decizii, evaluează evenimente finalizate
- `admin` — validează/respinge evenimente, aprobă ONG-uri, gestionează contestații
- Membrul ONG nu este un rol — apartenența la organizație se gestionează prin `organization_members` (roluri: `admin` | `member`)

### Tabele principale de suport

- `users` (FK → auth.users)
- `organizations` + `organization_members` + `organization_ratings`
- `event_participants` — UNIQUE(event_id, user_id)
- `petition_signatures` — UNIQUE(event_id, user_id)
- `event_feedback` — UNIQUE(event_id, user_id) · doar participanți · doar pe `completed`
- `appeals` (contestații) — statusuri: `pending` | `under_review` | `resolved`
- `notifications`

### Enums PostgreSQL

```sql
user_role:         user | admin
creator_type:      user | ngo
event_category:    protest | boycott | petition | community | charity
event_status:      pending | approved | rejected | contested | completed
org_status:        pending | approved | rejected
org_member_role:   admin | member
participant_status: joined | cancelled
appeal_status:     pending | under_review | resolved
donation_type:     material | monetary
```

## Rute Complete

### (auth) — redirecționează autentificații spre /panou
- `/autentificare` · `/inregistrare` · `/reseteaza-parola` · `/auth/callback`

### (public) — PublicNavbar + Footer
- `/` · `/evenimente` · `/evenimente/[id]` · `/organizatii` · `/organizatii/[id]`

### (private) — DashboardNavbar; redirect la /autentificare dacă lipsește sesiunea
- Panou: `/panou` · `/panou/evenimente` · `/panou/participari` · `/panou/petitii` · `/panou/contestatii`
- Profil: `/profil` · `/profil/editare`
- Creare: `/creeaza` → selector tip → 5 stepper-uri individuale:
  - `/creeaza/protest` · `/creeaza/boycott` · `/creeaza/petitie` · `/creeaza/comunitar` · `/creeaza/caritabil`
- Editare/Contestație: `/evenimente/[id]/editare` · `/evenimente/[id]/contestatie`
- ONG: `/organizatie/creeaza` · `/organizatie/[id]/panou` · `/organizatie/[id]/evenimente` · `/organizatie/[id]/membri` · `/organizatie/[id]/setari`
- Admin (👑): `/admin` · `/admin/evenimente` · `/admin/evenimente/[id]` · `/admin/organizatii` · `/admin/contestatii`

## Pagini Eveniment `/evenimente/[id]` — Structură

Layout comun: **coloana stângă (8/12) + sidebar dreapta (4/12)**. `ActionButtons` (Share/Calendar/Print) prezent în stânga la toate tipurile.

| Tip | Stânga | Sidebar |
|---|---|---|
| Protest | Banner · badge subtip · view count · titlu · descriere · reguli · echipament · galerie | ParticipationCardClient · hartă shadcn-map · contact |
| Petiție | Banner · badge "Petiție" · view count · titlu · descriere · why_important · what_is_requested · galerie | SignatureCardClient (progress auto-scale) · requested_from · RecentSignersClient · contact |
| Boycott | Banner · badge "Boycott" · view count · reason+method badges · titlu · descriere · Branduri & Alternative · galerie | ParticipationCardClient · info organizator |
| Activitate comunitară (aer liber/workshop) | Banner · badge subtip · view count · titlu · descriere · what_organizer_offers · equipment · galerie | ParticipationCardClient · hartă shadcn-map · contact |
| Donații | Banner · badge "Donații" · view count · titlu · descriere · what_is_needed (material=listă / monetar=progress bar) · galerie | ParticipationCardClient · contact |
| Caritabil (concert/meet&greet/sport) | Banner · badge subtip · view count · titlu · descriere · performers/guests · galerie | Progress bar donații · Cumpără bilet · ParticipationCardClient · hartă shadcn-map |
| Caritabil (livestream) | Banner · badge "Livestream" · view count · titlu · descriere · cause · guests · galerie | Progress bar donații · Urmărește live |

**Stare `completed`** (comună tuturor): ParticipationCardClient → contor final fără buton Participă · buton „Evaluează evenimentul" (doar participant fără feedback) · `FeedbackSection` cu rating mediu + lista feedback-uri · badge `completed` pe banner.

## Flux Creare Evenimente — Stepper per Tip

| Rută | Pași |
|---|---|
| `/creeaza/protest` | 1. Info + subtip (adunare/marș/pichet) → 2. Locație Leaflet → 3. Logistică → 4. Media |
| `/creeaza/boycott` | 1. Info → 2. Branduri (min 1) + Alternative opț. → 3. Media |
| `/creeaza/petitie` | 1. Info → 2. Detalii (target, contact) → 3. Media |
| `/creeaza/comunitar` | 1. Info + subtip → 2. Locație (aer liber/workshop) sau Detalii (donații) → 3. Detalii / Media → 4. Media |
| `/creeaza/caritabil` | 1. Info + subtip → 2. Locație (concert/meet&greet/sport) sau Detalii (livestream) → 3. Detalii → 4. Media |

Layout comun: **imagine stânga sticky (30%) + stepper dreapta (70%)**.

## RLS — Reguli Cheie

- `completeEvent` și `createNotification` rulează cu `service_role` (admin client) → bypass RLS
- Helper functions: `current_user_id()` · `is_admin()` · `is_org_admin(org_id)` — definite ca `SECURITY DEFINER STABLE`
- Subtabelele de nivel 2 verifică accesul prin JOIN la `events`
- Subtabelele de nivel 3 verifică prin JOIN dublu (ex: `gatherings → protests → events`)
- `event_feedback`: INSERT validat dublu — eveniment `completed` + user participant cu `status = joined`

## SEO

- **Static** (`/`, `/evenimente`, `/organizatii`): `export const metadata` în `page.tsx`
- **Dynamic** (`/evenimente/[id]`, `/organizatii/[id]`): `generateMetadata` cu date din DB
- **Auth + Private**: `robots: noindex` în `layout.tsx` al fiecărui route group — moștenit automat
- `app/robots.ts` + `app/sitemap.ts` (include events `approved`/`completed` + orgs `approved`)
- JSON-LD: `WebSite` pe homepage · `Event` pe pagini eveniment · `Organization` pe pagini ONG

## Animații

### Enter Animations — exclusiv CSS

Animațiile de intrare (care pornesc când apare prima dată o componentă pe pagină) se implementează **exclusiv din CSS** definit în `globals.css` sau într-un fișier separat importat în `globals.css`.

**Interzis:** crearea de state React (`useState`, `useEffect`) pentru a urmări prima apariție a unei componente — consumă resurse inutil și forțează componenta să devină `"use client"`.

```css
/* CORECT — în globals.css */
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}
.animate-fade-in-up {
  animation: fadeInUp 0.4s ease forwards;
}
```

```tsx
/* GREȘIT — state doar pentru animație de intrare */
const [visible, setVisible] = useState(false);
useEffect(() => setVisible(true), []);
```

## Workflow Git

- Orice feature nou → branch dedicat din `main`
- Push-urile se fac exclusiv pe branch, nu direct pe `main`
- Merge în `main` doar după finalizarea completă a feature-ului și cu aprobare explicită
- Ordinea branch-urilor:
  1. `feat/setup-infrastructure`
  2. `feat/auth`
  3. `feat/layout-navigation`
  4. `feat/homepage`
  5. `feat/events-list`
  6. `feat/event-detail`
  7. `feat/create-events`
  8. `feat/participation`
  9. `feat/user-dashboard`
  10. `feat/admin-moderation`
  11. `feat/appeals`
  12. `feat/organizations`
  13. `feat/event-completion-feedback`
  14. `feat/seo-performance`

## Notion (Planificare — toate paginile complete)

Documentația completă a proiectului se află în Notion (conectat prin MCP):
- **Software Planning (MVP)** — arhitectură, fluxuri, roluri, MVP scope, reguli arhitecturale
- **Data Models** — schema completă a bazei de date (toate tabelele + enums)
- **Pagini & Rute** — toate rutele cu componente specifice per zonă
- **Server Actions** — toate cele 13 servicii cu funcțiile lor
- **User Stories** — 60+ stories pe 14 domenii funcționale
- **RLS Policies** — politici SQL complete + funcții helper
- **SEO & Metadata** — metadata, generateMetadata, JSON-LD, robots.ts, sitemap.ts
