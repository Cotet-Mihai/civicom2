@AGENTS.md

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Despre Proiect

**CIVICOM** este o platformă de implicare civică ce centralizează acțiunile civice. Utilizatorii și ONG-urile pot crea, administra și participa la: proteste, boicoturi, petiții, activități comunitare și evenimente caritabile.

> Principiu de bază: „Toate acțiunile civice sunt evenimente unificate, nu sisteme separate."

> **Design:** Aplicația este **mobile-first**. Orice componentă sau pagină se proiectează și se testează întâi pe mobil, apoi se adaptează pentru desktop. Versiunea desktop trebuie să arate bine, dar prioritatea absolută este experiența pe mobil.

> **Brand:** Oriunde apare **CIVICOM** ca nume de brand vizibil în UI (logo, subtitluri, texte promoționale), se scrie întotdeauna **CIVICOM✨**. Excepție: metadata SEO (title, description, og:title etc.) unde emoji-ul nu se include.

> **Pagini noi — obligatoriu:** Înainte de a crea sau implementa orice pagină nouă, consultă **Notion → Pagini & Rute** pentru indicațiile de design specifice acelei pagini (structură, componente, layout, date necesare). Nu începe implementarea fără să fi verificat mai întâi această sursă.

**Status:** În implementare. Vezi secțiunea [Roadmap](#roadmap--progres-etape) de mai jos pentru starea curentă.

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

> **CRITICĂ — SECURITY DEFINER pe funcții helper RLS:** Orice funcție helper (`is_org_admin`, `is_org_member` etc.) care interogă un tabel protejat de RLS **trebuie** să fie `SECURITY DEFINER`. Fără ea, apelul funcției declanșează propriile politici ale tabelului, ceea ce poate produce recursivitate infinită (`infinite recursion detected in policy`). Exemplu confirmat: `is_org_admin()` fără `SECURITY DEFINER` → politica `org_members_select` se auto-apela → crash la `getApprovedOrgs`.

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

## Roadmap — Progres Etape

> Actualizează manual această secțiune la finalul fiecărei etape (marchează ✅ / 🟡 / ⬜).

| Simbol | Semnificație |
|---|---|
| ✅ | Finalizat complet |
| 🟡 | În progres (branch activ) |
| ⬜ | Neînceput |

### ✅ Etapa 0 — Setup & Infrastructură (`feat/setup-infrastructure`)
Supabase · `.env.local` · shadcn/ui · Tailwind · Embla · Sonner · Lucide · Schema SQL completă · Enums · Helper SQL · RLS + Policies · Storage buckets · Trigger auth.users→users · `proxy.ts` · Root `layout.tsx` · Seed

### ✅ Etapa 1 — Autentificare (`feat/auth`)
`auth.service.ts` · `useSignIn` · `useSignUp` · `useResetPassword` · `InputPassword` · `InputPasswordStrength` · `/autentificare` · `/inregistrare` · `/reseteaza-parola` · `/auth/callback`

### ✅ Etapa 2 — Layout & Navigație (`feat/layout-navigation`)
`Footer` · `PublicNavbar` · `DashboardNavbar` (cu Sheet pe mobil) · `getUserOrganization` · `(public)/layout.tsx` · `(private)/layout.tsx`

### ✅ Etapa 3 — Homepage `/` (`feat/homepage`)
`HeroSection` · `OrganizationsSection` + `NgoCarouselClient` · `ActionTypesSection` · `StatsSection` + `StatsCounterClient` · `EventsSection` + `EventsCarouselClient` · `FaqSection` + `FaqAccordionClient` · `CtaSection` · JSON-LD `WebSite` + Sitelinks Searchbox (`cauta=`)

### ✅ Etapa 4 — Lista Evenimente `/evenimente` (`feat/events-list`)
`event.service.ts` + `getEvents` · `EventCard` (shared) · `FilterPanel` + `FilterPanelClient` · `ActiveFiltersBarClient` · `ResultsCount` · `EmptyState` · `EventsGridSkeleton` · `EventsListClient` · `InfiniteScrollTrigger` · metadata + canonical

### ✅ Etapa 5 — Pagina Eveniment `/evenimente/[id]` (`feat/event-detail`)
**Rute distincte per tip** — `/evenimente/protest/[id]` ✅, `/evenimente/petitie/[id]` ✅, `/evenimente/boycott/[id]` ✅, `/evenimente/comunitar/[id]` ✅, `/evenimente/caritabil/[id]` ✅

Componente shared gata: `EventBanner` · `ActionButtons` · `ParticipationCardClient` (date/time opționale) · `SignatureCardClient` · `FeedbackSection` · `LocationMapClient` · `feedback.service.ts` · `petition.service.ts` · `ProtestDetail` + `getProtestById` · `PetitionDetail` + `getPetitionById` · `BoycottDetail` + `getBoycottById` · `CommunityDetail` + `getCommunityById` · `CharityDetail` + `getCharityById` · `incrementViewCount` · `EventCard` actualizat cu linkuri tip-specific · trigger `participants_count` pentru `event_participants` + `petition_signatures`

### ✅ Etapa 6 — Creare Evenimente `(private)/creeaza/` (`feat/create-events`)
Grid selector 5 tipuri · `StepperUI` reutilizabil · `LocationPickerClient` + `RoutePickerClient` (Leaflet) · `ImageUploadClient` (Supabase Storage) · 5 stepper-uri individuale (protest/boycott/petitie/comunitar/caritabil) · `lib/upload.ts` · `createProtest` · `createBoycott` · `createPetition` · `createCommunityActivity` · `createCharityEvent` · `radio-group` shadcn · Toast + redirect · `useEffect` pentru userId init

### ✅ Etapa 7 — Participare & Semnare (`feat/participation`)
`participation.service.ts` (joinEvent/leaveEvent/signPetition/getParticipationStatus/getSignatureStatus) · `useEventParticipation` · `usePetitionSign` · `ParticipationCardClient` funcțional (Participă/Renunță/Complet) · `SignatureCardClient` funcțional (Semnează/Ai semnat) · `router.refresh()` după mutații · toate 5 pagini eveniment wire-uite cu `eventId`

### ✅ Etapa 8 — Dashboard Utilizator & Profil (`feat/user-dashboard`)
`getUserDashboardStats` · `getUserProfile` · `updateUserProfile` · `getUserCreatedEvents` · `getUserParticipations` · `/panou` + sub-rute · `/profil` · `/profil/editare` · `AvatarUpload`

### ✅ Etapa 9 — Moderare Admin (`feat/admin-moderation`)
`admin.service.ts` (approve/reject events + orgs) · `notification.service.ts` · `/admin` + sub-rute · Notificări creator la aprobare/respingere

### ✅ Etapa 10 — Contestații (`feat/appeals`)
`createAppeal` · `getAllAppeals` · `resolveAppeal` · `/evenimente/[id]/contestatie` · `/panou/contestatii` · `/admin/contestatii` · Notificări decizie (appeal_approved / appeal_rejected)

### ⬜ Etapa 11 — ONG-uri (`feat/organizations`)
`organization.service.ts` complet · `/organizatii` + `/organizatii/[id]` · `/organizatie/creeaza` · Panou ONG + membri + setari · `generateMetadata` + JSON-LD `Organization` · Notificări aprobare ONG

### ⬜ Etapa 12 — Finalizare Evenimente & Feedback (`feat/event-completion-feedback`)
`completeEvent` (service_role) · Cron job pg_cron (auto-complete la expirare) · Buton "Marchează ca finalizat" în dashboard · `FeedbackSection` + `FeedbackFormClient` · Notificări la completion → participanți

### ⬜ Etapa 13 — SEO & Performance (`feat/seo-performance`)
`robots.ts` · `sitemap.ts` · JSON-LD pe toate paginile · Optimizare `next/image` · Lazy loading Leaflet/carusele · Vercel Analytics + PostHog

---

## Notion (Planificare — toate paginile complete)

Documentația completă a proiectului se află în Notion (conectat prin MCP):
- **Software Planning (MVP)** — arhitectură, fluxuri, roluri, MVP scope, reguli arhitecturale
- **Data Models** — schema completă a bazei de date (toate tabelele + enums)
- **Pagini & Rute** — toate rutele cu componente specifice per zonă
- **Server Actions** — toate cele 13 servicii cu funcțiile lor
- **User Stories** — 60+ stories pe 14 domenii funcționale
- **RLS Policies** — politici SQL complete + funcții helper
- **SEO & Metadata** — metadata, generateMetadata, JSON-LD, robots.ts, sitemap.ts

## Design System — Identitate Vizuală CIVICOM

> **Regulă:** Orice componentă nouă trebuie să respecte aceste convenții. Nu inventa stiluri ad-hoc — ancorează-te în tokens-urile și pattern-urile de mai jos.

### Culori — Sistem de token-uri (shadcn CSS variables)

**Regula de aur: folosește exclusiv variabilele CSS shadcn (`bg-primary`, `text-primary`, etc.) — niciodată clase Tailwind hardcodate precum `bg-green-600` sau `text-green-700`.**

Token-urile sunt definite în `app/globals.css` → `:root`. Dacă o componentă nouă necesită o culoare care nu are token, adaugă token-ul în `:root`, nu hardcoda culoarea în componentă.

#### Token-urile CIVICOM (`app/globals.css`)

| Token CSS | Valoare | Utilizare |
|---|---|---|
| `--primary` | `oklch(0.52 0.18 145)` — verde civic | Butoane principale, logo, linkuri active, iconuri decorative, ring focus |
| `--primary-foreground` | alb | Text pe fundal `bg-primary` |
| `--secondary` | `oklch(0.78 0.17 80)` — galben auriu | Accent tipografic în headings mari, badge-uri subtipe |
| `--secondary-foreground` | dark | Text pe `bg-secondary` |
| `--background` | `oklch(0.985 0.005 145)` — alb cu tentă verde | Pagini publice, suprafețe principale |
| `--foreground` | dark green-tinted | Text principal |
| `--muted` | `oklch(0.963 0.006 145)` | Secțiuni alternante (`bg-muted/50`) |
| `--muted-foreground` | medium gray | Descrieri, metadate, subtitluri |
| `--accent` | light green | Hover states, accent soft |
| `--accent-foreground` | dark green | Text pe `bg-accent` |
| `--border` | subtle green-tinted | Borduri card, separator |
| `--destructive` | roșu | Erori, butoane distructive |

#### Utilizare corectă

```tsx
// ✅ CORECT — token shadcn
<Link className="text-primary hover:text-primary/80">...</Link>
<Button>Acțiune</Button>                    // default = bg-primary automat
<div className="bg-primary/10 text-primary"> // soft accent

// ❌ GREȘIT — culori hardcodate
<Link className="text-green-700 hover:text-green-600">...</Link>
<Button className="bg-green-600 hover:bg-green-700">...</Button>
```

#### Opacitate și variante
- `bg-primary/10` → verde foarte deschis (avatar bg, icon bg)
- `bg-primary/5` → verde aproape invizibil (decorații ambient)
- `hover:text-primary/80` → verde mai închis la hover
- `text-muted-foreground` → text secundar (nu `text-gray-500`)

**Excepție permisă:** `InputPasswordStrength` folosește `bg-green-500` ca indicator semantic de forță parolă (verde = puternic) — este UI logic, nu identitate vizuală.

---

### Tipografie

#### Fonturi
- **`font-heading`** (Montserrat ExtraBold/Black) — logo, titluri de secțiune, numere statistice
- **`font-sans`** (Inter) — tot restul: body, labels, metadate

#### Titluri de secțiune — stilul editorial
Titlurile de secțiune mari folosesc un stil **editorial fragmentat** — cuvinte de mărimi diferite, aliniate pe linii separate, alternând weight-uri și culori:

```tsx
<h2 className="flex flex-col">
  <div>
    <span className="text-4xl lg:text-7xl font-black text-green-700">✨EVENIMENTE</span>
    <span className="text-xl lg:text-3xl font-bold text-muted-foreground">CARE</span>
  </div>
  <div>
    <span className="text-2xl lg:text-5xl font-black text-foreground">SCHIMBĂ</span>
    <span className="text-4xl lg:text-7xl font-black text-green-700">COMUNITATEA✨</span>
  </div>
</h2>
```

Reguli:
- Cuvintele-cheie: `font-black text-green-700` la dimensiune maximă (`lg:text-7xl`)
- Cuvintele de legătură: `font-bold text-muted-foreground` la dimensiune medie (`lg:text-3xl`)
- `✨` inline la capătul sau începutul textului de brand (nu separat)
- Pe mobile: dimensiunile se înjumătățesc (`text-4xl` → `text-2xl`)

#### Titluri de pagini eveniment
```tsx
<h1 className="text-2xl md:text-4xl font-black tracking-tighter leading-tight uppercase text-green-700 italic">
```
Caracteristic: `font-black`, `uppercase`, `italic`, `tracking-tighter` — agresiv și civic.

#### Labels de secțiune internă (sub-headings)
```tsx
<h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
  <IconComponent size={14} /> Titlu Secțiune
</h3>
```

#### Metadate eveniment (dată, ore, views)
```tsx
<span className="flex items-center gap-1.5 text-sm text-muted-foreground font-medium">
  <Calendar size={14} className="text-green-600" />
  {data}
</span>
```
Views: badge distinct cu `bg-muted px-2.5 py-1 rounded-md text-xs font-bold border border-border/50`.

---

### Layout

#### Container standard
```tsx
<div className="mx-auto max-w-7xl px-4 lg:px-8">
```

#### Secțiuni publice
```tsx
<section className="py-20 lg:py-28">          // secțiune normală
<section className="min-h-screen py-20 ...">  // secțiune full-height
<section className="bg-muted/50 ...">         // secțiune alternantă (muted bg)
<section className="bg-foreground py-16 ..."> // secțiune dark (stats, CTA dark)
```
Secțiunile alternează: `bg-background` → `bg-muted/50` → `bg-background` — niciodată două `bg-muted/50` consecutive.

#### Pagini eveniment — grid 8/4
```tsx
<div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
  <div className="lg:col-span-8 space-y-8">   {/* conținut principal */}
  <aside className="lg:col-span-4 space-y-6"> {/* sidebar */}
```

#### Decorații de fundal (ambient circles)
Pe secțiunile hero și FAQ, background-ul are cercuri blurred subtile:
```tsx
<div className="pointer-events-none absolute inset-0">
  <div className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-green-600/5" />
  <div className="absolute -bottom-20 -left-20 h-[300px] w-[300px] rounded-full bg-green-600/10" />
</div>
```
Opacitate maximă: `/10`. Nu pe fiecare secțiune — doar hero și secțiuni full-screen.

---

### Componente — Pattern-uri

#### Banner eveniment
```tsx
<div className="relative w-full aspect-[21/9] group rounded-3xl overflow-hidden border border-border shadow-xl">
  <Image fill className="object-cover transition-transform duration-700 group-hover:scale-[1.02]" />
  {/* Badge tip eveniment */}
  <div className="absolute top-4 left-4 z-20"><Badge>Protest: Marș</Badge></div>
  {/* Overlay interior shadow */}
  <div className="absolute inset-0 shadow-[inset_0_0_40px_rgba(0,0,0,0.1)] pointer-events-none z-10" />
</div>
```
Zoom hover subtil: `scale-[1.02]` (nu `scale-110` ca pe carduri).

#### Card eveniment
```tsx
<Card className="group relative flex flex-col overflow-hidden pt-0 transition-shadow duration-300 hover:shadow-lg">
  {/* Banner cu zoom agresiv la hover */}
  <div className="relative aspect-video overflow-hidden">
    <Image className="object-cover transition-transform duration-500 group-hover:scale-110" />
    <div className="absolute inset-0 bg-gradient-to-t from-foreground/30 to-transparent" />
    {/* Badge tip — stânga sus */}
    <div className="absolute left-3 top-3"><Badge variant="secondary">{tip}</Badge></div>
    {/* Badge dată — dreapta sus */}
    <div className="absolute right-3 top-3">
      <div className="flex items-center gap-1 rounded-full bg-background/90 px-2 py-1 backdrop-blur-sm">
        <Calendar className="text-green-600 h-4 w-4" /><span>{data}</span>
      </div>
    </div>
  </div>
```

#### Card sidebar (participare, info)
```tsx
<Card className="p-6 space-y-2 shadow-lg bg-white shadow-black/5 border-border">
```

#### Avatar cu inițiale (organizator, contact)
```tsx
<div className="size-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-black text-xs text-primary shrink-0">
  {initials}
</div>
```

#### Numere mari / statistici
```tsx
<span className="text-3xl font-black italic tracking-tighter text-primary">
  {count} / {max}
</span>
```

#### Butoane — convenții
| Tip | Pattern |
|---|---|
| CTA principal | `<Button>` sau `buttonVariants({ variant: 'default' })` — automat `bg-primary` |
| Outline | `<Button variant="outline">` sau `buttonVariants({ variant: 'outline' })` |
| Ghost nav | `buttonVariants({ variant: 'ghost' })` pe `<Link>` |
| Destructive | `<Button variant="destructive">` |
| Link cu stil buton | `<Link className={buttonVariants({ variant: 'default' })}>` — fără override culori |

#### Progress bars
```tsx
<Progress value={pct} className="h-2 bg-muted" />
```
Textul deasupra: `flex items-center justify-between text-sm` cu icon verde stânga și `font-semibold text-foreground` dreapta.

---

### Animații scroll-triggered

Pe secțiunile publice (homepage, liste), elementele apar la scroll cu `opacity-0` inițial și tranziție la `opacity-100` via intersection observer sau CSS. Pattern-ul din `globals.css`:

```css
/* Elementele animate încep invizibile */
[data-animate] { opacity: 0; transform: translateY(12px); transition: opacity 0.5s ease, transform 0.5s ease; }
[data-animate].in-view { opacity: 1; transform: none; }
```

Pe componente server (fără `useEffect`), folosim exclusiv clase CSS ca `animate-fade-in-up` — niciodată state React pentru animații de intrare.

---

### Tonul vizual general

CIVICOM are un caracter **civic, bold și autentic** — nu corporate, nu startup-ish. Câteva principii:
- Titlurile sunt mari, agresive, cu uppercase și font-black — transmit energie și urgență civică
- Verde `green-600/700` e culoarea principală, nu albastrul sau mov-ul generic
- Cardurile au umbre subtile și zoom la hover — se simte fluid, nu static
- Secțiunile alternează fundal muted/white pentru ritm vizual
- Iconuri lucide-react mereu cu `text-primary` când sunt decorative, `text-muted-foreground` când sunt informative
- Emoji ✨ apare strategic în titluri de brand — nu suprasaturat

---

## Instrucțiuni pentru Claude

> **Salvare automată în CLAUDE.md:** Ori de câte ori userul spune că ceva este important sau că trebuie reținut, acel lucru se salvează automat și în acest fișier (CLAUDE.md), nu doar în memorie sau context. Nu mai e nevoie de o cerere separată.

> **Fișiere de context per etapă:** La finalul fiecărei etape se creează `context/etapaN.md` cu tot ce s-a implementat — componente, tipuri, bug-uri rezolvate, decizii arhitecturale.
