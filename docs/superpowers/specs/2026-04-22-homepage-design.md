# Homepage (`/`) Design Spec

**Data:** 2026-04-22
**Branch:** `feat/homepage` (creat din `feat/layout-navigation`)
**Rută:** `app/(public)/page.tsx`

---

## Goal

Implementează pagina principală publică a CIVICOM — prima pagină pe care o vede orice vizitator. Prezintă platforma civic (ce este, câte acțiuni există, ce tipuri de acțiuni civice sunt disponibile), afișează evenimente recente și ONG-uri aprobate cu date live din Supabase.

---

## Arhitectura componentelor

```
app/(public)/
  page.tsx                              ← Server Component — toate fetch-urile
  _components/
    HeroSection.tsx                     ← Server Component (static)
    StatsSection.tsx                    ← Server Component (primește stats ca props)
    StatsCounterClient.tsx              ← "use client" — animație counting la scroll
    ActionTypesSection.tsx              ← Server Component (static)
    EventsSection.tsx                   ← Server Component (primește events ca props)
    EventsCarouselClient.tsx            ← "use client" — Embla carousel
    OrganizationsSection.tsx            ← Server Component (primește orgs ca props)
    OrgsCarouselClient.tsx              ← "use client" — Embla logo carousel autoplay
    FaqSection.tsx                      ← Server Component (wrapper static)
    FaqAccordionClient.tsx              ← "use client" — Shadcn Accordion
    CtaSection.tsx                      ← Server Component (static)

services/
  homepage.service.ts                   ← Server Actions: getHomepageStats, getRecentEvents, getApprovedOrgs
```

**Regulă:** componentele locale rămân în `_components/`. Dacă sunt necesare în altă pagină, se mută în `components/shared/` — nu se duplică.

---

## Date din DB

`page.tsx` face un singur `Promise.all` paralel:

```typescript
const [stats, events, orgs] = await Promise.all([
  getHomepageStats(),
  getRecentEvents(6),
  getApprovedOrgs(),
])
```

### `getHomepageStats()` → `HomepageStats`

```typescript
type HomepageStats = {
  eventsCount: number       // COUNT(*) FROM events WHERE status IN ('approved','completed')
  volunteersCount: number   // COUNT(*) FROM users
  orgsCount: number         // COUNT(*) FROM organizations WHERE status = 'approved'
  citiesCount: number       // valoare statică hardcodată: 12 (tabelul events nu are câmp city direct)
}
```

> **Notă:** `citiesCount` este o valoare statică `12` returnată direct din funcție — nu necesită query. Celelalte 3 valori vin din DB.

### `getRecentEvents(limit: number)` → `EventPreview[]`

```typescript
type EventPreview = {
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
```

Query: `SELECT id, title, banner_url, category, subcategory, status, created_at, creator_id, organization_id, participants_count, view_count FROM events WHERE status IN ('approved','completed') ORDER BY created_at DESC LIMIT limit`

### `getApprovedOrgs()` → `OrgPreview[]`

```typescript
type OrgPreview = {
  id: string
  name: string
  logo_url: string | null
}
```

Query: `SELECT id, name, logo_url FROM organizations WHERE status = 'approved' ORDER BY created_at ASC`

---

## Secțiuni — detalii de implementare

### 1. HeroSection

**Fișier:** `_components/HeroSection.tsx` — Server Component

**Layout:** două coloane pe desktop (`lg:grid-cols-2`), stivuite pe mobil. Coloana stângă: text + CTA. Coloana dreaptă: imagine decorativă (`public/auth_panel.webp` cu `next/image fill`).

**Titlu editorial** (stilul fragmentat din CLAUDE.md):
```tsx
<h1 className="flex flex-col gap-1">
  <span className="text-4xl lg:text-7xl font-black text-foreground uppercase tracking-tighter">Acționează.</span>
  <span className="text-4xl lg:text-7xl font-black text-primary uppercase tracking-tighter">Implică-te.</span>
  <span className="text-2xl lg:text-4xl font-bold text-muted-foreground uppercase tracking-tight">Schimbă comunitatea.</span>
</h1>
```

**Subtitle:** `text-lg text-muted-foreground max-w-md` — "Platforma civică unde găsești proteste, petiții, acțiuni comunitare și caritabile din toată România."

**CTA-uri:**
- `<Link href="/evenimente" className={buttonVariants({ size: 'lg' })}>Descoperă evenimente</Link>`
- `<Link href="/creeaza" className={buttonVariants({ variant: 'outline', size: 'lg' })}>Creează un eveniment</Link>`

**Animație:** clasa `animate-fade-in-up` pe titlu și subtitle (CSS, fără useState).

**Cercuri ambient** în background (pointer-events-none, absolute):
```tsx
<div className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-primary/5" />
<div className="absolute -bottom-20 -left-20 h-[300px] w-[300px] rounded-full bg-primary/10" />
```

---

### 2. StatsSection

**Fișier:** `_components/StatsSection.tsx` — Server Component (wrapper)
**Fișier:** `_components/StatsCounterClient.tsx` — Client Component (animație)

**Layout:** secțiune dark `bg-foreground text-background`, grid 4 coloane pe desktop / 2 pe mobil.

**Props:** `stats: HomepageStats`

Fiecare stat:
```tsx
{ icon: CalendarDays, value: stats.eventsCount, label: 'Evenimente organizate' },
{ icon: Users,        value: stats.volunteersCount, label: 'Utilizatori activi' },
{ icon: Building2,    value: stats.orgsCount, label: 'ONG-uri aprobate' },
{ icon: MapPin,       value: stats.citiesCount, label: 'Orașe acoperite' },
```

**`StatsCounterClient`** primește `value: number` și animează de la 0 la `value` în 1.5s când intră în viewport (Intersection Observer). Numărul afișat: `font-black italic text-4xl lg:text-6xl text-primary` (verde pe dark bg).

---

### 3. ActionTypesSection

**Fișier:** `_components/ActionTypesSection.tsx` — Server Component (static)

**Layout:** `py-20 lg:py-28`, titlu editorial centrat, grid `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6` cu 5 carduri (al 6-lea slot gol pe desktop sau cardul 5 centrat cu `col-span-full lg:col-span-1`).

**Titlu secțiune** (stilul editorial):
```tsx
<h2 className="flex flex-col items-center text-center">
  <span className="text-3xl lg:text-5xl font-black text-primary uppercase tracking-tighter">5 moduri</span>
  <span className="text-xl lg:text-3xl font-bold text-muted-foreground uppercase">să faci diferența</span>
</h2>
```

**Cele 5 tipuri:**
| Categorie | Icon | Descriere scurtă |
|---|---|---|
| Protest | `Megaphone` | Adunări, marșuri, pichete |
| Boycott | `Ban` | Boicotează branduri și alternative |
| Petiție | `FileText` | Strânge semnături pentru o cauză |
| Comunitar | `Heart` | Donații, workshop-uri, activități |
| Caritabil | `HandHeart` | Concerte, livestreams, sport |

**Card pattern:**
```tsx
<Link href={`/evenimente?categorie=${slug}`}
  className="group flex flex-col items-center gap-4 rounded-2xl border border-border bg-card p-8
             text-center transition-all duration-300 hover:scale-105 hover:shadow-lg hover:border-primary/30">
  <div className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary
                  transition-colors group-hover:bg-primary/20">
    <Icon className="size-8" />
  </div>
  <h3 className="text-lg font-black uppercase tracking-tight text-foreground">{name}</h3>
  <p className="text-sm text-muted-foreground">{description}</p>
</Link>
```

---

### 4. EventsSection

**Fișier:** `_components/EventsSection.tsx` — Server Component
**Fișier:** `_components/EventsCarouselClient.tsx` — Client Component

**Props:** `events: EventPreview[]`

**Layout:** `bg-muted/50 py-20 lg:py-28`, titlu editorial, carousel + buton "Vezi toate evenimentele".

**Titlu:**
```tsx
<h2 className="flex flex-col">
  <span className="text-4xl lg:text-7xl font-black text-primary uppercase tracking-tighter">✨Evenimente</span>
  <span className="text-xl lg:text-3xl font-bold text-muted-foreground uppercase">care schimbă</span>
  <span className="text-3xl lg:text-5xl font-black text-foreground uppercase tracking-tighter">comunitatea✨</span>
</h2>
```

**`EventsCarouselClient`:** Embla Carousel, `slidesToScroll: 1`, `loop: true`, autoplay 5000ms. Vizibil: 1 card pe mobil / 2 pe tablet / 3 pe desktop (`basis-full md:basis-1/2 lg:basis-1/3`).

**EventCard** (creat local în `_components/EventCard.tsx`):
- `aspect-video` banner cu `next/image` + gradient overlay + badge categorie stânga-sus + badge dată dreapta-sus
- Titlu `font-black`, categorie badge, descriere truncată la 2 linii
- Pattern exact din CLAUDE.md (zoom `group-hover:scale-110` pe imagine, umbră hover)

**Fallback:** dacă `events.length === 0` → mesaj "Nu există evenimente disponibile momentan."

---

### 5. OrganizationsSection

**Fișier:** `_components/OrganizationsSection.tsx` — Server Component
**Fișier:** `_components/OrgsCarouselClient.tsx` — Client Component

**Props:** `orgs: OrgPreview[]`

**Layout:** `py-20 lg:py-28`, titlu centrat simplu, carousel logo-only.

**Titlu:** `<h2 className="text-2xl lg:text-3xl font-black text-center text-foreground uppercase tracking-tight">ONG-uri partenere</h2>`

**`OrgsCarouselClient`:** Embla cu autoplay 3000ms, `loop: true`, `dragFree: true`. Vizibil: 2 pe mobil / 4 pe tablet / 6 pe desktop (`basis-1/2 md:basis-1/4 lg:basis-1/6`).

Fiecare item:
```tsx
<Link href={`/organizatii/${org.id}`} className="flex flex-col items-center gap-2 px-4 opacity-70 hover:opacity-100 transition-opacity">
  {org.logo_url
    ? <Image src={org.logo_url} alt={org.name} width={64} height={64} className="rounded-full object-cover" />
    : <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-xl">{org.name[0]}</div>
  }
  <span className="text-xs text-muted-foreground text-center font-medium">{org.name}</span>
</Link>
```

**Fallback:** dacă `orgs.length === 0` → secțiunea nu se randează deloc (`if (!orgs.length) return null`).

---

### 6. FaqSection

**Fișier:** `_components/FaqSection.tsx` — Server Component (wrapper)
**Fișier:** `_components/FaqAccordionClient.tsx` — Client Component

**Layout:** `bg-muted/50 py-20 lg:py-28`, max-w-2xl centrat.

**Shadcn Accordion** (instalat dacă nu există: `pnpm dlx shadcn@latest add accordion`).

**5 întrebări statice** despre CIVICOM:
1. "Ce este CIVICOM?" — platforma de implicare civică
2. "Cine poate crea un eveniment?" — orice utilizator autentificat
3. "Cum sunt validate evenimentele?" — admin revizuiește înainte de publicare
4. "Pot participa fără cont?" — pot vedea, dar nu participa
5. "Cum funcționează ONG-urile pe platformă?" — solicită creare, admin aprobă

---

### 7. CtaSection

**Fișier:** `_components/CtaSection.tsx` — Server Component (static)

**Layout:** `bg-foreground text-background py-20 lg:py-28`, conținut centrat.

**Titlu:** `font-black text-4xl lg:text-6xl uppercase tracking-tighter text-background`  — "Fii vocea schimbării."

**Subtitle:** `text-lg text-background/70 max-w-md mx-auto mt-4`

**CTA-uri** (culori inversate față de hero — pe fundal dark):
- `<Link href="/inregistrare" className={buttonVariants({ size: 'lg' }) + ' bg-background text-foreground hover:bg-background/90'}>Creează un cont</Link>`
- `<Link href="/evenimente" className={buttonVariants({ variant: 'outline', size: 'lg' }) + ' border-background/30 text-background hover:bg-background/10'}>Explorează evenimente</Link>`

---

## Metadata SEO

```typescript
// app/(public)/page.tsx
export const metadata: Metadata = {
  title: 'Acasă',
  description: 'CIVICOM — platforma civică unde găsești și creezi proteste, petiții, boicoturi și acțiuni comunitare din România.',
}
```

---

## Shadcn componente necesare

- `accordion` — pentru FaqAccordionClient (`pnpm dlx shadcn@latest add accordion`)
- `card` — posibil necesar pentru EventCard (`pnpm dlx shadcn@latest add card`)

Verificat la instalare dacă există deja.

---

## Animații

- **Hero titlu/subtitle:** `animate-fade-in-up` (CSS, deja în globals.css)
- **Stats counting:** Intersection Observer în `StatsCounterClient` — animație de la 0 la `value` cu `requestAnimationFrame`
- **Carduri acțiuni:** `hover:scale-105 transition-all duration-300` (CSS Tailwind, fără JS)
- **Hover imagine eveniment:** `group-hover:scale-110 transition-transform duration-500` (CSS)
- **Carousel autoplay:** Embla plugin Autoplay (deja instalat)

**Nicio animație de scroll nu folosește `useState`/`useEffect` pentru tracking vizibilitate** — excepție validă: `StatsCounterClient` care are nevoie de Intersection Observer pentru a declanșa counting.

---

## Constrângeri

- **Mobile-first:** toate secțiunile se proiectează și testează pe mobil primul
- **`CIVICOM✨`** în titluri vizibile UI; fără emoji în metadata
- **Nicio culoare hardcodată** — exclusiv tokeni shadcn (`text-primary`, `bg-muted` etc.)
- **`EventCard`** e local în `_components/` — dacă va fi folosit și pe `/evenimente`, se mută în `components/shared/EventCard.tsx`
