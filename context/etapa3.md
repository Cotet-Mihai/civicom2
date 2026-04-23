# Etapa 3 — Homepage (COMPLETATĂ)

**Data:** 2026-04-22
**Branch:** `feat/homepage` (creat din `feat/layout-navigation`)
**Status:** ✅ Implementare completă + bug fix RLS + build ✅

---

## Ce s-a făcut

### 1. `services/homepage.service.ts`

Server Actions cu 3 funcții și 3 tipuri exportate:

```typescript
'use server'

export type HomepageStats = {
  eventsCount: number       // COUNT(*) events WHERE status IN ('approved','completed')
  volunteersCount: number   // COUNT(*) users
  orgsCount: number         // COUNT(*) organizations WHERE status = 'approved'
  citiesCount: number       // hardcodat: 12
}

export type EventPreview = {
  id: string
  title: string
  banner_url: string | null
  category: string          // 'protest' | 'boycott' | 'petition' | 'community' | 'charity'
  subcategory: string | null
  status: string
  created_at: string
  creator_id: string
  organization_id: string | null
  participants_count: number
  view_count: number
}

export type OrgPreview = {
  id: string
  name: string
  logo_url: string | null
}

getHomepageStats(): Promise<HomepageStats>
// Promise.all paralel: 3 COUNT queries — events, users, organizations

getRecentEvents(limit: number): Promise<EventPreview[]>
// SELECT ... FROM events WHERE status IN ('approved','completed') ORDER BY created_at DESC LIMIT limit

getApprovedOrgs(): Promise<OrgPreview[]>
// SELECT id, name, logo_url FROM organizations WHERE status = 'approved' ORDER BY created_at ASC
```

> **Notă:** `citiesCount` returnează static `12` — tabelul `events` nu are câmp `city` normalizat.

---

### 2. `app/(public)/page.tsx` — Server Component

```tsx
export const metadata: Metadata = {
  title: 'Acasă',
  description: 'CIVICOM — platforma civică unde găsești și creezi proteste, petiții, boicoturi și acțiuni comunitare din România.',
}

export default async function HomePage() {
  const [stats, events, orgs] = await Promise.all([
    getHomepageStats(),
    getRecentEvents(6),
    getApprovedOrgs(),
  ])
  return (
    <main>
      <HeroSection />
      <StatsSection stats={stats} />
      <ActionTypesSection />
      <EventsSection events={events} />
      <OrganizationsSection orgs={orgs} />
      <FaqSection />
      <CtaSection />
    </main>
  )
}
```

Ruta `/` se buildează ca `ƒ` (Dynamic) — corect deoarece face fetch din Supabase.

---

### 3. `_components/HeroSection.tsx` — Server Component

- Grid 2 coloane pe desktop, stivuit pe mobil
- Titlu editorial cu 3 linii: `Acționează.` (foreground) + `Implică-te.` (primary) + `Schimbă comunitatea.` (muted-foreground)
- Subtitle `text-muted-foreground max-w-md`
- 2 CTA: `Descoperă evenimente` (default) + `Creează un eveniment` (outline) — ambele `buttonVariants` pe `<Link>`
- Imagine `/auth_panel.webp` cu `next/image fill`, `priority`, ascunsă pe mobil (`hidden lg:block`)
- Cercuri ambient `bg-primary/5` și `bg-primary/10` în background (pointer-events-none)
- Animație intrare: clasa CSS `animate-fade-in-up` pe div-ul text (fără useState)

---

### 4. `_components/StatsSection.tsx` + `_components/StatsCounterClient.tsx`

**StatsSection** — Server Component, secțiune dark `bg-foreground`:
- Grid 2 coloane mobil / 4 coloane desktop
- Pasează fiecare `value` la `StatsCounterClient`
- Icoane Lucide: `CalendarDays`, `Users`, `Building2`, `MapPin` cu `text-primary`
- Numere: `text-4xl font-black italic tracking-tighter text-primary lg:text-6xl`

**StatsCounterClient** — Client Component:
- Intersection Observer cu `threshold: 0.3` — animația pornește la scroll-in
- `requestAnimationFrame` cu easing cubic `1 - (1 - t)³` pe durata de 1500ms
- `started` ref previne re-triggerarea la re-intrare în viewport
- Afișează numărul formatat: `count.toLocaleString('ro-RO')`

---

### 5. `_components/ActionTypesSection.tsx` — Server Component (static)

- 5 carduri într-un grid `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`
- Fiecare card: `<Link>` cu `hover:scale-105 hover:shadow-lg hover:border-primary/30`
- Iconuri în cerc `bg-primary/10 group-hover:bg-primary/20`
- Categorii: Protest (Megaphone) · Boycott (Ban) · Petiție (FileText) · Comunitar (Heart) · Caritabil (HandHeart)
- Link-uri: `/evenimente?categorie={slug}`

---

### 6. `_components/EventCard.tsx` + `_components/EventsCarouselClient.tsx` + `_components/EventsSection.tsx`

**EventCard** — Server Component:
- `aspect-video` banner cu `group-hover:scale-110 duration-500`
- Gradient overlay `from-foreground/30 to-transparent`
- Badge categorie stânga-sus + badge dată dreapta-sus (ambele `bg-background/90 backdrop-blur-sm`)
- Metadate: `participants_count` (Users icon) + `view_count` (Eye icon)
- Fallback banner: `bg-muted` dacă `banner_url` e null

**EventsCarouselClient** — Client Component:
- `useEmblaCarousel({ loop: true, align: 'start' }, [Autoplay({ delay: 5000, stopOnInteraction: true })])`
- Slides: `basis-full md:basis-1/2 lg:basis-1/3`

**EventsSection** — Server Component:
- `if (events.length === 0) return null`
- Titlu editorial: `✨Evenimente` (primary) + `care schimbă` (muted) + `comunitatea✨` (foreground)
- Buton `Vezi toate evenimentele` (outline) aliniat dreapta pe desktop
- Background `bg-muted/50`

---

### 7. `_components/OrgsCarouselClient.tsx` + `_components/OrganizationsSection.tsx`

**OrgsCarouselClient** — Client Component:
- Dacă `orgs.length < 4` → items duplicate (`[...orgs, ...orgs]`) pentru a umple carousel-ul
- `useEmblaCarousel({ loop: true, align: 'start', dragFree: true }, [Autoplay({ delay: 3000, stopOnInteraction: false })])`
- Fiecare item: logo rotund 64px sau cerc cu inițiala (`bg-primary/10 text-primary font-black`)
- `opacity-60 hover:opacity-100 transition-opacity`

**OrganizationsSection** — Server Component:
- `if (orgs.length === 0) return null`
- Titlu centrat simplu: "ONG-uri partenere"

---

### 8. `_components/FaqAccordionClient.tsx` + `_components/FaqSection.tsx`

**FaqAccordionClient** — Client Component:
- shadcn Accordion (base-ui) cu `value` + `onValueChange` pentru multiple items deschise simultan
- 5 întrebări statice:
  1. Ce este CIVICOM?
  2. Cine poate crea un eveniment?
  3. Cum sunt validate evenimentele?
  4. Pot participa fără cont?
  5. Cum funcționează ONG-urile pe platformă?

**FaqSection** — Server Component wrapper:
- Background `bg-muted/50`, `max-w-2xl` centrat

---

### 9. `_components/CtaSection.tsx` — Server Component (static)

```tsx
<section className="bg-foreground py-20 lg:py-28">
  <h2>Fii vocea schimbării.</h2>           {/* text-background */}
  <p>Alătură-te comunității CIVICOM✨...</p> {/* text-background/70 */}
  <Link href="/inregistrare"               {/* bg-background text-foreground */}
  <Link href="/evenimente"                 {/* border-background/30 text-background */}
```

Culori inversate față de hero — secțiune dark cu text alb.

---

## Componente shadcn instalate

- `accordion` — `pnpm dlx shadcn@latest add accordion` (base-ui `Collapsible` primitiv)

---

## Bug Fix RLS — Infinite Recursion pe `organization_members`

### Eroarea

```
[getApprovedOrgs] infinite recursion detected in policy for relation "organization_members"
```

### Cauza

Politica `organizations_select` interoga `organization_members` → declanșa politica
`org_members_select` → care interoga din nou `organization_members` cu un EXISTS self-referențial
→ recursivitate infinită.

În plus, `is_org_admin()` nu era `SECURITY DEFINER`, deci fiecare apel al ei era supus RLS,
amplificând recursia.

### Fix aplicat (migration `fix_org_members_rls_infinite_recursion`)

```sql
-- 1. Rebuild is_org_admin() ca SECURITY DEFINER → bypass RLS la interogarea organization_members
CREATE OR REPLACE FUNCTION is_org_admin(org_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_id = org_id
      AND user_id = current_user_id()
      AND role = 'admin'
  );
$$;

-- 2. Drop politica auto-referențială
DROP POLICY IF EXISTS org_members_select ON organization_members;

-- 3. Politică nouă fără subquery pe același tabel
CREATE POLICY org_members_select ON organization_members
FOR SELECT USING (
  user_id = current_user_id()
  OR is_org_admin(organization_id)
  OR is_admin()
);
```

### Principiu reținut

Orice funcție helper RLS (`is_org_admin`, `is_org_member`) care interogă un tabel protejat
trebuie să fie `SECURITY DEFINER` — altfel declanșează propriile politici și poate genera recursivitate.

---

## Structura fișierelor create/modificate

```
services/
  homepage.service.ts              ← getHomepageStats, getRecentEvents, getApprovedOrgs

app/(public)/
  page.tsx                         ← Promise.all + 7 secțiuni
  _components/
    HeroSection.tsx                ← Server Component
    StatsSection.tsx               ← Server Component
    StatsCounterClient.tsx         ← Client Component — Intersection Observer + rAF counting
    ActionTypesSection.tsx         ← Server Component
    EventCard.tsx                  ← Server Component (folosit în carousel)
    EventsCarouselClient.tsx       ← Client Component — Embla + Autoplay 5s
    EventsSection.tsx              ← Server Component
    OrgsCarouselClient.tsx         ← Client Component — Embla + Autoplay 3s + dragFree
    OrganizationsSection.tsx       ← Server Component
    FaqAccordionClient.tsx         ← Client Component — shadcn Accordion
    FaqSection.tsx                 ← Server Component
    CtaSection.tsx                 ← Server Component

components/ui/
  accordion.tsx                    ← instalat via shadcn
```

---

## Alternarea secțiunilor (bg pattern)

```
HeroSection          → bg-background (default)
StatsSection         → bg-foreground (dark inverted)
ActionTypesSection   → bg-background
EventsSection        → bg-muted/50
OrganizationsSection → bg-background
FaqSection           → bg-muted/50
CtaSection           → bg-foreground (dark inverted)
```

Niciodată două `bg-muted/50` consecutive.

---

## Note arhitecturale importante

- **`EventCard` e local în `_components/`** — dacă va fi folosit și pe `/evenimente`, se mută în `components/shared/EventCard.tsx`
- **`OrgsCarouselClient` duplică items** dacă `orgs.length < 4` — previne vizual goluri în carousel loop
- **`StatsCounterClient`** este singura excepție validă de la regula "no useState for enter animations" — are nevoie de Intersection Observer pentru a declanșa counting-ul, nu pentru a ascunde/afișa
- **`getApprovedOrgs`** folosea anterior o politică RLS care provoca recursivitate — fixed prin migration

---

## Commits pe branch `feat/homepage`

```
docs: adaugă spec homepage (Etapa 3)
docs: adaugă plan implementare homepage (Etapa 3)
feat(homepage): add homepage service — stats, events, orgs queries
fix(homepage): add error logging and comment for hardcoded citiesCount
feat(ui): add shadcn accordion component
feat(homepage): add HeroSection
feat(homepage): add StatsSection with live DB counts and counting animation
feat(homepage): add ActionTypesSection — 5 civic action type cards
feat(homepage): add EventsSection with Embla carousel and live data
feat(homepage): add OrganizationsSection with autoplay logo carousel
feat(homepage): add FaqSection with shadcn accordion
feat(homepage): add CtaSection — dark CTA final
```

---

## Ce urmează: Etapa 4 — Lista Evenimente

Branch: `feat/events-list` (creat din `feat/homepage`)

Pagini de implementat: `/evenimente` cu filtrare pe categorie, status, search.
