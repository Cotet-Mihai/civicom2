# Etapa 4 — Lista Evenimente `/evenimente` (COMPLETATĂ)

**Data:** 2026-04-23
**Branch:** `feat/events-list` (creat din `feat/homepage`)
**Status:** ✅ Implementare completă + build ✅

---

## Ce s-a făcut

### 1. `services/event.service.ts` (NOU)

Server Action cu tipuri și funcția principală de query:

```typescript
'use server'

export type EventPreview = {
  id: string
  title: string
  banner_url: string | null
  category: 'protest' | 'boycott' | 'petition' | 'community' | 'charity'
  subcategory: string | null
  status: 'pending' | 'approved' | 'rejected' | 'contested' | 'completed'
  date: string           // câmpul `date` al evenimentului (nu created_at)
  created_at: string
  participants_count: number
  view_count: number
}

export type EventFilters = {
  cauta?: string
  categorie?: 'protest' | 'boycott' | 'petition' | 'community' | 'charity'
  sort?: 'data_desc' | 'data_asc' | 'participanti'
  data_de?: string
  data_pana?: string
}

export async function getEvents(
  filters: EventFilters,
  page: number = 1,
  pageSize: number = 12
): Promise<{ events: EventPreview[]; total: number }>
```

**Query logic:**
- Filtrare: `status IN ('approved', 'completed')`
- `cauta` → `.ilike('title', '%X%')`
- `categorie` → `.eq('category', X)`
- `data_de` / `data_pana` → `.gte/.lte('date', X)`
- Sort `participanti` → `.order('participants_count', { ascending: false })` + tiebreaker `created_at`
- Sort `data_asc` → `.order('date', { ascending: true })`
- Default (`data_desc`) → `.order('date', { ascending: false })`
- Paginare: `.range((page-1)*pageSize, page*pageSize - 1)` cu `{ count: 'exact' }`

### 2. `services/homepage.service.ts` (MODIFICAT)

- Tipul local `EventPreview` eliminat
- Adăugat `export type { EventPreview } from './event.service'` (re-export pentru compatibilitate)
- `getRecentEvents` actualizat să selecteze câmpul `date` (în plus față de `created_at`)
- Adăugat tip de return explicit `Promise<EventPreview[]>`
- Păstrat comentariul: `// hardcodat — tabelul events nu are câmp city normalizat`

### 3. `components/shared/EventCard.tsx` (MUTAT din `app/(public)/_components/EventCard.tsx`)

- Import `EventPreview` din `@/services/event.service`
- Afișează `event.date` în badge-ul de dată (nu `event.created_at`)
- `app/(public)/_components/EventCard.tsx` ȘTERS
- `EventsCarouselClient` actualizat cu noul import

### 4. `app/(public)/evenimente/_components/InfiniteScrollTrigger.tsx` (NOU)

Client Component cu `IntersectionObserver`. Activ doar când `hasMore=true`. Randează `<div ref={ref} className="h-10" aria-hidden />`.

### 5. `app/(public)/evenimente/_components/EventsGridSkeleton.tsx` (NOU)

Server Component. 6 carduri skeleton `animate-pulse` în grid `grid-cols-1 sm:grid-cols-2 xl:grid-cols-3`.

### 6. `app/(public)/evenimente/_components/EmptyState.tsx` (NOU)

Server Component. `SearchX` icon, "Niciun eveniment găsit", Link spre `/evenimente` cu buton outline.

### 7. `app/(public)/evenimente/_components/EventsListClient.tsx` (NOU)

Client Component. Primește `initialEvents`, `total`, `filters`. Acumulează paginile ulterioare via Server Action `getEvents`. Folosește `useRef(false)` ca guard împotriva race condition (dublu-fetch înainte ca state-ul să se actualizeze). `hasMore = events.length < total`.

### 8. `app/(public)/evenimente/_components/FilterPanelClient.tsx` (NOU)

Client Component. 4 secțiuni de filtre: căutare text (debounce 400ms via `useRef`), categorie (select), sortare (select), perioadă (2 date inputs). Actualizează URL cu `router.replace` fără navigare completă.

### 9. `app/(public)/evenimente/_components/FilterPanel.tsx` (NOU)

Server Component. Randează ambele variante via Tailwind:
- Desktop: `hidden w-[280px] shrink-0 lg:block` (sidebar fix)
- Mobil: `lg:hidden` cu Sheet trigger

Nu are prop `mobile` — responsivitatea e gestionată exclusiv prin Tailwind.

**Notă SheetTrigger:** Proiectul folosește `@base-ui/react/dialog`, nu Radix UI. `asChild` nu există — se folosește prop-ul `render`: `<SheetTrigger render={<Button .../>}>`.

> **UPDATE:** La revizuire s-a constatat că `asChild` funcționează totuși în versiunea instalată a shadcn. Dacă apare eroare în viitor, reveniți la `render` prop.

### 10. `app/(public)/evenimente/_components/ActiveFiltersBarClient.tsx` (NOU)

Client Component. Chips per filtru activ. Exclude `data_desc` (sortare default). `SORT_LABELS` conține toate 3 valorile (inclusiv `data_desc`) pentru a evita afișarea cheii raw ca fallback.

### 11. `app/(public)/evenimente/_components/ResultsCount.tsx` (NOU)

Server Component. "1 eveniment găsit" / "X evenimente găsite" cu `toLocaleString('ro-RO')`. Returnează `null` când `total === 0`.

### 12. `app/(public)/evenimente/loading.tsx` (NOU)

Next.js loading UI. Afișat automat în timp ce `page.tsx` face fetch async. Randează `EventsGridSkeleton` în containerul standard.

### 13. `app/(public)/evenimente/page.tsx` (NOU)

Server Component principal. 

**Puncte cheie:**
- `searchParams` tipat ca `Promise<...>` și `await`-it (Next.js 15+ requirement)
- Validare params URL înainte de cast la tipuri enum:
  ```typescript
  const VALID_CATEGORIES = ['protest', 'boycott', 'petition', 'community', 'charity'] as const
  const VALID_SORTS = ['data_desc', 'data_asc', 'participanti'] as const
  // categorie și sort validate cu .includes() înainte de cast
  ```
- `filterKey = new URLSearchParams(Object.fromEntries(...)).toString()` — forțează remontarea `EventsListClient` la schimbarea filtrelor (resetează lista acumulată fără logică suplimentară)
- Layout: `flex-col lg:flex-row` — pe mobil trigger-ul Sheet apare deasupra conținutului, pe desktop sidebar-ul e lateral
- `total === 0` → `EmptyState`; altfel → `EventsListClient key={filterKey}`

**Metadata:**
```typescript
export const metadata: Metadata = {
  title: 'Evenimente',
  description: 'Descoperă proteste, petiții, boicoturi și activități comunitare din România.',
  alternates: { canonical: '/evenimente' },
}
```

---

## Decizii arhitecturale

- **Filtre în URL search params** — Server Component citește `searchParams`, face query direct la DB. URL-uri partajabile, SEO-friendly.
- **Paginare client-side** — `EventsListClient` cu infinite scroll via Server Action. Nu se actualizează URL-ul la paginare (ar provoca re-render + scroll la top).
- **Fără filtru locație** — DB nu are coloană `city` normalizată. Se adaugă în etapă ulterioară.
- **`EventCard` mutat în `components/shared/`** — folosit atât pe homepage (carusel) cât și pe `/evenimente` (grid).
- **`key={filterKey}` pe `EventsListClient`** — React remontează automat componenta la schimbarea filtrelor, eliminând nevoia de logică de reset manuală.

## Bug-uri rezolvate

1. **Race condition infinite scroll** — `loadingRef = useRef(false)` previne dublu-fetch înainte ca `setPage` să ruleze.
2. **`SORT_LABELS` incomplet** — lipsea `data_desc`; fallback-ul ar fi afișat cheia raw. Completat cu toate 3 valorile.
3. **Validare params URL** — `categorie` și `sort` din URL validate cu `includes()` înainte de cast, pentru a preveni query-uri cu valori invalide care returnau silențios 0 rezultate.
4. **`status` tip lax** — tipul `EventPreview.status` era `string`; strâns la union tipat complet.
5. **Sort secundar lipsă** — `participanti` sort nu avea tiebreaker. Adăugat `.order('created_at', { ascending: false })`.
