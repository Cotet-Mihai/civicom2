# Design Spec — Etapa 2: Layout & Navigație

**Data:** 2026-04-22
**Branch:** `feat/layout-navigation` (din `feat/auth`)
**Status:** Aprobat de utilizator

---

## Obiectiv

Implementarea componentelor globale de layout și navigație pentru route group-urile `(public)` și `(private)`, plus restructurarea `app/page.tsx` în route group-ul corect.

---

## Componente noi

### 1. `components/layout/PublicNavbar.tsx` — Server Component

Header pentru toate paginile din route group-ul `(public)`.

**Structură:**
- `<header>` sticky, `border-b border-border bg-background/80 backdrop-blur-md`
- `max-w-7xl mx-auto px-4 lg:px-8`, `h-16`
- **Stânga:** Logo `CIVICOM✨` ca `<Link href="/">` — Montserrat ExtraBold, text-green-700
- **Desktop (md+):** linkuri de navigație `/evenimente` + `/organizatii` — ghost style
- **Desktop (md+):** butoane auth — "Autentifică-te" (outline, `<Link href="/autentificare">`) + "Înregistrează-te" (verde, `<Link href="/inregistrare">`)
- **Mobil:** redă `<PublicNavbarMobileClient />` (hamburger + Sheet)

**Regulă arhitecturală:** Component Server pur. Extrage toată logica client în `PublicNavbarMobileClient`.

---

### 2. `components/layout/PublicNavbarMobileClient.tsx` — Client Component

Sheet drawer pentru navigația mobilă a paginilor publice.

**Structură:**
- Trigger: buton hamburger `<Menu />` (lucide), vizibil doar `md:hidden`
- Sheet side="left", conține:
  - Header: `CIVICOM✨` + tagline
  - Linkuri: Acasă `/` · Evenimente `/evenimente` · Organizații `/organizatii`
  - Footer sheet: butoane "Autentifică-te" (outline) + "Înregistrează-te" (verde)
- Închide sheet-ul la click pe orice link

---

### 3. `components/layout/DashboardNavbar.tsx` — Server Component

Header pentru toate paginile din route group-ul `(private)`.

**Date fetched:**
- `session` via `getSession()` din `services/auth.service.ts`
- `orgMembership` via query Supabase: `organization_members` WHERE `user_id = session.user.id` LIMIT 1 — pentru a determina dacă userul e în vreun ONG

**Structură:**
- `<header>` sticky, `border-b border-border bg-background`
- **Stânga:** Logo `CIVICOM✨` ca `<Link href="/">` — Montserrat ExtraBold, text-green-700
- **Dreapta:** redă `<DashboardNavbarActionsClient user={user} orgId={orgId} />` cu datele ca props

**Date pasate ca props:**
```typescript
type DashboardNavbarActionsProps = {
  userName: string        // session.user.user_metadata.name
  userEmail: string       // session.user.email
  orgId: string | null    // primul org_id găsit, sau null
}
```

---

### 4. `components/layout/DashboardNavbarActionsClient.tsx` — Client Component

Gestionează toată interactivitatea navbarului de dashboard.

**Desktop (md+):**
- Buton `+ Creează eveniment` verde → `<Link href="/creeaza">` (shadcn Button, `bg-green-600`)
- `<Avatar>` shadcn ca trigger → `<DropdownMenu>`:
  - Avatar fallback: prima literă din `userName` (upload foto — Etapa profil)
  - Label: `userName` + `userEmail` (mai mic, muted)
  - **Grup 1:** Panou `/panou` · Evenimentele mele `/panou/evenimente` · Participări `/panou/participari` · Petiții semnate `/panou/petitii` · Contestații `/panou/contestatii`
  - `<Separator />`
  - **Grup 2:** Organizația mea `/organizatie/[orgId]/panou` (dacă `orgId !== null`) SAU Solicită creare ONG `/organizatie/creeaza` (dacă `orgId === null`) · Creează eveniment `/creeaza`
  - `<Separator />`
  - **Grup 3:** Profil `/profil` · Deconectare (apelează `signOut()` din `services/auth.service.ts`)

**Mobil (sub md):**
- Buton hamburger `<Menu />` → `<Sheet side="left">`:
  - Header: `CIVICOM✨`
  - Secțiune navigație: toate linkurile din dropdown listate vertical
  - Footer sheet: buton "Deconectare" (destructive)

---

### 5. `components/layout/Footer.tsx` — Server Component

Footer pentru toate paginile din route group-ul `(public)`.

**Structură:** Port din proiectul vechi cu rute actualizate.
- `<footer>` cu `bg-foreground` (dark), `border-t border-border`
- Grid 4 coloane pe desktop, 2 pe tablet, 1 pe mobil:
  - **Brand:** Logo `CIVICOM✨` alb + tagline + iconuri social (Facebook, Instagram, Twitter, LinkedIn) — SVG inline
  - **Platformă:** Acasă `/` · Evenimente `/evenimente` · Organizații `/organizatii`
  - **Resurse:** Cum funcționează `#` · Ghid voluntari `#` · Întrebări frecvente `#`
  - **Legal:** Termeni și condiții `#` · Politică confidențialitate `#` · Cookies `#` · Contact `#`
- Bottom bar: copyright `© {year} CIVICOM✨` + „Construit cu încredere pentru comunitate."

---

## Route Group Layouts

### `app/(public)/layout.tsx`

```tsx
// Server Component
<PublicNavbar />
<main className="flex-1">{children}</main>
<Footer />
```

Metadata: fără `robots` (paginile publice sunt indexabile — fiecare page.tsx gestionează propria metadata dacă e nevoie).

### `app/(private)/layout.tsx`

```tsx
// Server Component
<DashboardNavbar />
<main className="flex-1">{children}</main>
```

Metadata: `robots: { index: false, follow: false }` — moștenit de toate paginile private.

---

## Restructurare pagini

### `app/page.tsx` → `app/(public)/page.tsx`

`app/page.tsx` (placeholder Next.js default) se șterge și se înlocuiește cu `app/(public)/page.tsx` — placeholder simplu pentru ruta `/`, care va fi implementat complet în Etapa 4 (feat/homepage).

```tsx
// Placeholder — conținut real în Etapa 4
export default function HomePage() {
  return <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground">Homepage — în curând</div>
}
```

### `app/(private)/panou/page.tsx`

Placeholder pentru `/panou`, care va fi implementat complet în Etapa 9 (feat/user-dashboard).

```tsx
export default function PanouPage() {
  return <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground">Panou — în curând</div>
}
```

---

## Shadcn componente de instalat

```bash
pnpm dlx shadcn@latest add sheet
pnpm dlx shadcn@latest add dropdown-menu
pnpm dlx shadcn@latest add avatar
pnpm dlx shadcn@latest add separator
```

---

## Structura fișierelor finale

```
components/
  layout/
    PublicNavbar.tsx              ← Server
    PublicNavbarMobileClient.tsx  ← Client
    DashboardNavbar.tsx           ← Server
    DashboardNavbarActionsClient.tsx ← Client
    Footer.tsx                    ← Server

app/
  (public)/
    layout.tsx                    ← PublicNavbar + Footer
    page.tsx                      ← placeholder /
  (private)/
    layout.tsx                    ← DashboardNavbar
    panou/
      page.tsx                    ← placeholder /panou
```

`app/page.tsx` — **șters** (înlocuit de `app/(public)/page.tsx`)

---

## Decizii arhitecturale

- **Server-first:** `DashboardNavbar` face fetch-urile pe server și pasează datele ca props la componenta client — nu există `useEffect` pentru fetch sesiune în navbar
- **Granularitate `"use client"`:** Doar componentele cu interactivitate (Sheet, DropdownMenu) sunt client; tot restul e server
- **`signOut` din navbar:** `DashboardNavbarActionsClient` importă direct `signOut` din `services/auth.service.ts` și îl apelează la click pe "Deconectare" — redirect-ul se face din server action
- **ONG membership:** Query simplu `LIMIT 1` — navbarul nu are nevoie de toate org-urile, doar de primul `org_id` pentru a construi link-ul sau a afișa "Solicită"

---

## Ce NU face această etapă

- Conținut real al paginilor `/` și `/panou` — Etapele 4 și 9
- Pagini intermediare (`/evenimente`, `/organizatii`, etc.) — etape ulterioare
- Avatar cu poză reală (upload) — Etapa profil
