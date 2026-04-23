# Etapa 2 — Layout & Navigație (COMPLETATĂ)

**Data:** 2026-04-22
**Branch:** `feat/layout-navigation` (creat din `feat/auth`)
**Status:** ✅ Implementare + bug fixes + îmbunătățiri design finalizate

---

## Ce s-a făcut

### 1. `services/organization.service.ts`

```typescript
'use server'
getUserOrgId(userId: string): Promise<string | null>
// SELECT organization_id FROM organization_members WHERE user_id = userId LIMIT 1
// Returnează null dacă utilizatorul nu face parte din niciun ONG
```

Folosit în `DashboardNavbar` pentru a determina dacă link-ul din dropdown e
"Organizația mea" sau "Solicită creare ONG".

---

### 2. `components/layout/PublicNavbar.tsx` — Server Component

Navbar pentru route group `(public)`:
- **Stânga:** Logo `CIVICOM✨` ca `<Link href="/">` cu `font-heading font-extrabold text-primary`
- **Centru (desktop):** Linkuri `/evenimente` + `/organizatii` via `buttonVariants({ variant: 'ghost' })` pe `<Link>`
- **Dreapta (desktop):** Butoane `Autentifică-te` (outline) + `Înregistrează-te` (default)
- **Mobil:** Butonul hamburger → `PublicNavbarMobileClient`
- Sticky top-0, z-50, border-b, bg-background

---

### 3. `components/layout/PublicNavbarMobileClient.tsx` — Client Component

Sheet (drawer) pentru navigare mobile pe public pages:
- `SheetTrigger` fără `<Button>` interior — `buttonVariants` aplicat direct pe trigger (vezi bug fix #2)
- Sheet side="left" cu logo + linkuri + butoane auth
- `text-primary` pe logo, `hover:text-primary` pe linkuri

---

### 4. `components/layout/Footer.tsx` — Server Component

Footer comun pentru `(public)`:
- Logo + tagline + linkuri rapide + social icons (Twitter, Facebook, Instagram, LinkedIn)
- Social icons: `hover:bg-primary hover:text-primary-foreground` pe cercuri
- Linkuri: `hover:text-primary transition-colors`
- Copyright + linkuri Termeni/Confidențialitate

---

### 5. `components/layout/DashboardNavbar.tsx` — Server Component (async)

Navbar pentru route group `(private)`:

```typescript
const session = await getSession()
const user = session?.user
const userName = user?.user_metadata?.display_name ?? user?.user_metadata?.name ?? 'Utilizator'
const userEmail = user?.email ?? ''
const orgId = user ? await getUserOrgId(user.id) : null
```

> **IMPORTANT:** Numele utilizatorului este stocat în `auth.users.raw_user_meta_data.display_name`
> (câmpul `name` din metadata nu este populat de Supabase la signup cu `display_name`).
> Confirmat via SQL: `SELECT raw_user_meta_data FROM auth.users`.

Pasează `userName`, `userEmail`, `orgId` ca props la `DashboardNavbarActionsClient`.

---

### 6. `components/layout/DashboardNavbarActionsClient.tsx` — Client Component

Acțiunile interactive din navbar-ul privat:

**Desktop:**
- Link `+ Creează eveniment` cu `buttonVariants({ size: 'sm' })` (fără override culori)
- Avatar cu inițiala numelui (`bg-primary/10 text-primary`)
- `DropdownMenu` cu:
  - Header: `<div>` simplu (nu `DropdownMenuLabel` — vezi bug fix #1) cu `userName` bold + `userEmail` muted
  - Grup 1: Panou · Evenimentele mele · Participări · Petiții semnate · Contestații
  - Grup 2: Organizația mea / Solicită creare ONG · Creează eveniment
  - Grup 3: Profil · Deconectare (`variant="destructive"`)
  - `DropdownMenuItem` folosește `render={<Link href={href} />}` (pattern base-ui, nu `asChild`)

**Mobil:**
- `SheetTrigger` cu `buttonVariants({ variant: 'ghost', size: 'icon' })` aplicat direct
- Sheet side="left" cu aceleași linkuri ca dropdown + buton Deconectare destructive

---

### 7. Route group layouts

#### `app/(public)/layout.tsx`
```tsx
// PublicNavbar + {children} + Footer
// Fără metadata robots (paginile publice sunt indexabile)
```

#### `app/(private)/layout.tsx`
```tsx
// DashboardNavbar + {children}
// metadata: { robots: { index: false, follow: false } }
```

---

### 8. Pagini placeholder

- `app/(public)/page.tsx` — placeholder `/`
- `app/(private)/panou/page.tsx` — placeholder `/panou`
- `app/page.tsx` — șters (înlocuit de `(public)/page.tsx`)

---

### 9. Design System — actualizări `globals.css` + `CLAUDE.md`

**Temă CIVICOM în `:root`** (toate valorile oklch):
```css
--primary: oklch(0.52 0.18 145)          /* verde civic */
--primary-foreground: oklch(0.985 0 0)
--secondary: oklch(0.78 0.17 80)         /* galben auriu accent */
--background: oklch(0.985 0.005 145)     /* alb cu tentă verde */
--foreground: oklch(0.14 0.02 155)
--muted: oklch(0.963 0.006 145)
--muted-foreground: oklch(0.50 0.015 150)
--accent: oklch(0.933 0.04 145)
--accent-foreground: oklch(0.35 0.12 145)
--border: oklch(0.902 0.008 145)
--input: oklch(0.902 0.008 145)
--ring: var(--primary)
```

> **Regulă adăugată în CLAUDE.md:** Niciodată `bg-green-600` / `text-green-700` hardcodate —
> se folosesc exclusiv variabilele shadcn (`bg-primary`, `text-primary` etc.).

Toate componentele auth rescrise să folosească token-uri în loc de clase Tailwind hardcodate.

---

## Îmbunătățiri pe `feat/auth` (continuate în această sesiune)

### 10. Câmp confirmare parolă la înregistrare

**`app/(auth)/inregistrare/SignUpFormClient.tsx`**
- Adăugat câmp "Confirmă parola" cu `InputPassword` sub `InputPasswordStrength`

**`hooks/useSignUp.ts`**
- `handleSignUp` primește acum `{ name, email, password, confirmPassword }`
- Validare client-side: dacă `password !== confirmPassword` → `setError('Parolele nu coincid.')` fără să bată serverul

---

### 11. `InputPasswordStrength` — redesign complet

**`components/ui/InputPasswordStrength.tsx`**

**Înainte:** 4 bare, ascuns când parola e goală, 4 niveluri.

**După:**
- **Mereu vizibil** — 5 bare goale + text "Periculos de slabă" (gri deschis) chiar înainte de a scrie
- **5 bare, 5 niveluri:**

| Bare colorate | Label | Culoare |
|---|---|---|
| 0 | Periculos de slabă | gri (bg-muted) |
| 1 | Foarte slabă | roșu (bg-destructive) |
| 2 | Slabă | portocaliu (bg-orange-500) |
| 3 | Medie | galben (bg-yellow-500) |
| 4 | Bună | albastru (bg-blue-500) |
| 5 | Puternică | verde (bg-green-500) |

- **5 criterii evaluate** (față de 4 anterior):
  1. Lungime ≥ 8 caractere
  2. Lungime ≥ 12 caractere
  3. Cel puțin o literă mare
  4. Cel puțin o cifră
  5. Cel puțin un caracter special

---

### 12. HoverCard cu cerințe parolă

**`components/ui/hover-card.tsx`** — instalat via `pnpm dlx shadcn@latest add hover-card`
(base-ui `PreviewCard` primitiv, nu Radix)

**`components/ui/InputPasswordStrength.tsx`** — adăugat:
- Icon `<Info>` lângă labelul "Parolă", `text-muted-foreground`, devine `text-foreground` la hover
- HoverCard apare la hover cu lista celor 5 cerințe
- Fiecare cerință are un cerc mic cu:
  - `✓` verde (`bg-green-500/15 text-green-600`) când criteriul e îndeplinit
  - `✕` gri (`bg-muted`) când nu
- Lista se actualizează live pe măsură ce utilizatorul scrie
- `REQUIREMENTS` constant partajat între logica de scor și lista din HoverCard — mereu sincronizate

---

## Structura fișierelor create/modificate

```
services/
  organization.service.ts           ← getUserOrgId()

components/
  ui/
    hover-card.tsx                  ← shadcn (base-ui PreviewCard)
    InputPasswordStrength.tsx       ← redesign: 5 bare + hover card cerințe
  layout/
    PublicNavbar.tsx                ← Server Component
    PublicNavbarMobileClient.tsx    ← Client Component (Sheet mobil)
    Footer.tsx                      ← Server Component
    DashboardNavbar.tsx             ← Server Component (async)
    DashboardNavbarActionsClient.tsx← Client Component (Dropdown + Sheet)

hooks/
  useSignUp.ts                      ← adăugat confirmPassword + validare

app/
  globals.css                       ← tema CIVICOM oklch în :root
  (public)/
    layout.tsx                      ← PublicNavbar + Footer
    page.tsx                        ← placeholder /
  (private)/
    layout.tsx                      ← DashboardNavbar + robots noindex
    panou/
      page.tsx                      ← placeholder /panou
  (auth)/
    inregistrare/
      SignUpFormClient.tsx           ← câmp confirmare parolă adăugat

CLAUDE.md                           ← secțiune Design System adăugată
```

---

## Probleme întâlnite și rezolvate

### Bug #1 — `MenuGroupRootContext is missing`
- **Cauză:** `DropdownMenuLabel` din shadcn (base-ui) folosește `MenuPrimitive.GroupLabel` care necesită un `<Menu.Group>` parent — nu există în structura noastră
- **Fix:** Header-ul cu user info rescris ca `<div>` simplu cu `flex-col gap-0.5 px-2 py-1.5`

### Bug #2 — `<button>` nested în `<SheetTrigger>`
- **Cauză:** `<SheetTrigger>` randează implicit un `<button>`, iar înăuntru era `<Button>` (alt `<button>`) → HTML invalid
- **Fix:** `<Button>` eliminat, `buttonVariants(...)` aplicat direct ca `className` pe `<SheetTrigger>`

### Bug #3 — `middleware.ts` fals pozitiv
- **Cauză:** Subagent a creat `middleware.ts` — Next.js 16 a detectat ambele fișiere și a aruncat eroare: _"Both middleware file and proxy file are detected. Please use proxy.ts only."_
- **Fix:** `middleware.ts` șters imediat. Regula a fost reconfirmată: în Next.js 16 middleware = `proxy.ts`, nu `middleware.ts`.

### Bug #4 — Referință circulară CSS variable
- **Cauză:** `replace_all` pe valoarea `oklch(0.52 0.18 145)` a înlocuit și definiția din `:root`, creând `--primary: var(--primary)` → buclă infinită → `--primary` devenea `undefined` → butoanele deveneau invizibile
- **Fix:** `:root` restaurat cu `--primary: oklch(0.52 0.18 145)` explicit
- **Lecție:** Nu folosi `replace_all` pe valori care apar în propria lor definiție `:root`

### Bug #5 — Dropdown afișa emailul în loc de numele utilizatorului
- **Cauză:** Fallback-ul din `userName` includea `user?.email`, deci utilizatorii fără metadata vedeau emailul de două ori (bold + muted)
- **Investigare:** SQL direct pe Supabase: `SELECT raw_user_meta_data FROM auth.users` → câmpul corect este `display_name`, nu `name` sau `full_name`
- **Fix:** `user?.user_metadata?.display_name ?? user?.user_metadata?.name ?? 'Utilizator'`

---

## Note arhitecturale importante

- **base-ui ≠ Radix UI** — shadcn în acest proiect folosește base-ui primitives. Pattern-ul corect pentru a randa un element custom în `DropdownMenuItem` este `render={<Link href={href} />}` (nu `asChild`)
- **`DropdownMenuTrigger` fără `asChild`** — avatar-ul este direct child al trigger-ului, nu înăuntrul unui `<Button asChild>`
- **`buttonVariants` pe `<Link>`** — în loc de `<Button asChild><Link>`, pentru că `asChild` nu există în base-ui. Pattern: `<Link className={buttonVariants({ variant: 'default' })}>text</Link>`
- **Separarea Server / Client** — `DashboardNavbar` e server (fetch sesiune + orgId), `DashboardNavbarActionsClient` e client (dropdown, sheet, signOut)
- **Animații enter exclusiv CSS** — niciun `useState`/`useEffect` pentru animații de intrare în niciuna din componentele noi

---

## Commits pe branch `feat/layout-navigation`

```
feat(layout): add PublicNavbar, Footer, DashboardNavbar, layouts and placeholders
fix(navbar): replace DropdownMenuLabel with div to avoid MenuGroupRootContext error
fix(navbar): apply buttonVariants directly on SheetTrigger to avoid nested button
feat(design): update globals.css with CIVICOM oklch theme, replace hardcoded green classes
fix(navbar): restore --primary definition after circular variable reference bug
fix(navbar): show display_name in dropdown header instead of email
feat(auth): adaugă câmp confirmare parolă la înregistrare
feat(ui): indicator putere parolă mereu vizibil cu 5 niveluri
feat(ui): hover card cu cerinte parola langa label
```

---

## Ce urmează: Etapa 3 — Homepage

Branch: `feat/homepage` (creat din `feat/layout-navigation`)

Pagini de implementat: `/` (homepage public) cu secțiuni:
- Hero cu CTA
- Statistici
- Tipuri de acțiuni civice
- Evenimente recente
- ONG-uri partenere
- FAQ + CTA final
