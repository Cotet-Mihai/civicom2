# Etapa 4 — Lista Evenimente `/evenimente` — Design Spec

**Data:** 2026-04-22  
**Branch:** `feat/events-list`  
**Etapă roadmap:** 4

---

## Decizii arhitecturale

- **Filtre în URL search params** — Server Component citește `searchParams`, face query direct la DB. URL-uri partajabile, SEO-friendly.
- **Paginare client-side** — infinite scroll gestionat în `EventsListClient` cu Server Action. Nu se actualizează URL-ul la paginare (ar provoca re-render + scroll la top).
- **Fără filtru locație** — DB nu are coloană `city` normalizată. Se adaugă în etapă ulterioară dacă e necesar.

---

## Arhitectură & Data Flow

```
/evenimente?cauta=X&categorie=Y&sort=Z&data_de=A&data_pana=B
       │
       ▼
page.tsx (Server Component)
  ├── citește searchParams
  ├── apelează getEvents(filters, page=1) → { events, total }
  └── randează:
        ├── FilterPanel (server shell) → FilterPanelClient (inputs, router.replace)
        ├── ActiveFiltersBarClient (chips filtre active + remove)
        ├── ResultsCount ("X evenimente găsite")
        └── EventsListClient (Client Component)
              ├── primește evenimentele inițiale + total ca props
              ├── gestionează lista acumulată
              └── InfiniteScrollTrigger
                    └── la scroll → Server Action getEvents(filters, page+1)
                                  → append la lista client
```

**Layout:**
- Desktop: `[FilterPanel sidebar 280px] | [ResultsCount + ActiveFiltersBar + grid 3 coloane]`
- Mobil: `[buton "Filtre" → Sheet drawer] + [grid 1 coloană]`

---

## Componente

### Fișiere noi

```
app/(public)/evenimente/
  page.tsx                        — Server Component; citește searchParams; metadata static
  _components/
    FilterPanel.tsx               — Server: wrapper sidebar desktop + Sheet trigger mobil
    FilterPanelClient.tsx         — Client: inputs (search, categorie, sort, date range);
                                    actualizează URL cu router.replace + resetează pagina
    ActiveFiltersBarClient.tsx    — Client: chip per filtru activ, click → remove din URL
    ResultsCount.tsx              — Server: props total → "X evenimente găsite" / "1 eveniment găsit"
    EventsListClient.tsx          — Client: lista acumulată; primește initialEvents + total;
                                    apelează getEvents Server Action pentru paginare
    InfiniteScrollTrigger.tsx     — Client: IntersectionObserver ref div; la intersect → callback
    EmptyState.tsx                — Server: mesaj + sugestie când total=0
    EventsGridSkeleton.tsx        — Server: 6 skeleton carduri aspect-video + linii text
```

### Fișiere modificate

```
components/shared/EventCard.tsx   — mutat din app/(public)/_components/EventCard.tsx
                                    tipul sursă → EventPreview din event.service.ts
                                    afișează event.date (nu created_at)

services/event.service.ts         — creat; exportă EventPreview, EventFilters, getEvents

services/homepage.service.ts      — EventPreview importat din event.service.ts (nu redefinit)
                                    getRecentEvents rămâne aici

app/(public)/_components/
  EventCard.tsx                   — șters (mutat în shared)
  EventsSection.tsx               — actualizat importul EventCard → @/components/shared/EventCard
```

---

## `event.service.ts` — API

```typescript
export type EventPreview = {
  id: string
  title: string
  banner_url: string | null
  category: 'protest' | 'boycott' | 'petition' | 'community' | 'charity'
  subcategory: string | null
  status: string
  date: string                // data evenimentului din câmpul `date` al tabelului events
  created_at: string
  participants_count: number
  view_count: number
}

export type EventFilters = {
  cauta?: string              // ilike pe title
  categorie?: string          // eq pe category
  sort?: 'data_desc' | 'data_asc' | 'participanti'   // default: data_desc
  data_de?: string            // gte pe date (ISO string)
  data_pana?: string          // lte pe date (ISO string)
}

export async function getEvents(
  filters: EventFilters,
  page: number = 1,
  pageSize: number = 12
): Promise<{ events: EventPreview[]; total: number }>
```

**Query details:**
- Filtrare: `status IN ('approved', 'completed')`
- `cauta` → `.ilike('title', '%cauta%')`
- `categorie` → `.eq('category', categorie)`
- `data_de` → `.gte('date', data_de)`
- `data_pana` → `.lte('date', data_pana)`
- Sort `data_desc` → `.order('date', { ascending: false })`
- Sort `data_asc` → `.order('date', { ascending: true })`
- Sort `participanti` → `.order('participants_count', { ascending: false })`
- Paginare: `.range((page-1)*pageSize, page*pageSize - 1)`
- Total: `{ count: 'exact' }`

---

## Metadata & SEO

```typescript
export const metadata: Metadata = {
  title: 'Evenimente',
  description: 'Descoperă proteste, petiții, boicoturi și activități comunitare din România.',
  alternates: { canonical: '/evenimente' },  // canonical fără query params
}
```

---

## Note pentru implementare

- `FilterPanelClient` folosește `useSearchParams` + `useRouter` (Next.js) pentru a citi și actualiza URL-ul fără navigare completă (`router.replace`)
- `EventsListClient` primește un prop `filterKey` (string din searchParams serializate); `page.tsx` îl pasează ca `key={filterKey}` → React remontează automat componenta la schimbarea filtrelor, resetând lista acumulată fără logică suplimentară
- `InfiniteScrollTrigger` primește un callback `onIntersect`; `EventsListClient` îl conectează la logica de fetch
- `EventsGridSkeleton` apare în `<Suspense fallback>` în timpul încărcării inițiale
- Parametrul `?cauta=` este consistent cu `SearchAction` din JSON-LD WebSite (Etapa 3)
