# Lista Evenimente `/evenimente` — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementează pagina `/evenimente` cu grid de carduri, filtre URL-based (categorie, text, dată, sortare) și infinite scroll client-side.

**Architecture:** Server Component citește `searchParams` async și face query inițial la DB; `EventsListClient` (Client Component) acumulează paginile ulterioare via Server Action. Filtrele trăiesc în URL (partajabile), paginarea în state client. La schimbare filtru, `EventsListClient` se remontează via `key` prop derivat din filtrele active.

**Tech Stack:** Next.js 16 App Router, Supabase (server client), Tailwind CSS, shadcn/ui (Sheet, Input, Button), Lucide React, TypeScript.

---

## File Map

```
CREAT:
services/event.service.ts                              ← EventPreview, EventFilters, getEvents
components/shared/EventCard.tsx                        ← mutat + actualizat din (public)/_components/
app/(public)/evenimente/page.tsx                       ← Server Component, searchParams async
app/(public)/evenimente/loading.tsx                    ← skeleton automat Next.js
app/(public)/evenimente/_components/
  FilterPanel.tsx                                      ← Server: sidebar desktop + Sheet trigger mobil
  FilterPanelClient.tsx                                ← Client: inputs filtre, router.replace
  ActiveFiltersBarClient.tsx                           ← Client: chips filtre active + remove
  ResultsCount.tsx                                     ← Server: "X evenimente găsite"
  EventsListClient.tsx                                 ← Client: lista acumulată + paginare
  InfiniteScrollTrigger.tsx                            ← Client: IntersectionObserver

MODIFICAT:
services/homepage.service.ts                           ← importă EventPreview din event.service.ts
app/(public)/_components/EventsCarouselClient.tsx      ← importă EventCard din components/shared
app/(public)/_components/EventCard.tsx                 ← ȘTERS (mutat în components/shared)
```

---

## Task 1: Creează `event.service.ts` cu tipuri și `getEvents`

**Files:**
- Create: `services/event.service.ts`

- [ ] **Step 1: Creează fișierul**

```typescript
// services/event.service.ts
'use server'

import { createClient } from '@/lib/supabase/server'

export type EventPreview = {
  id: string
  title: string
  banner_url: string | null
  category: 'protest' | 'boycott' | 'petition' | 'community' | 'charity'
  subcategory: string | null
  status: string
  date: string
  created_at: string
  participants_count: number
  view_count: number
}

export type EventFilters = {
  cauta?: string
  categorie?: string
  sort?: 'data_desc' | 'data_asc' | 'participanti'
  data_de?: string
  data_pana?: string
}

export async function getEvents(
  filters: EventFilters,
  page: number = 1,
  pageSize: number = 12
): Promise<{ events: EventPreview[]; total: number }> {
  const supabase = await createClient()

  let query = supabase
    .from('events')
    .select(
      'id, title, banner_url, category, subcategory, status, date, created_at, participants_count, view_count',
      { count: 'exact' }
    )
    .in('status', ['approved', 'completed'])

  if (filters.cauta) {
    query = query.ilike('title', `%${filters.cauta}%`)
  }
  if (filters.categorie) {
    query = query.eq('category', filters.categorie)
  }
  if (filters.data_de) {
    query = query.gte('date', filters.data_de)
  }
  if (filters.data_pana) {
    query = query.lte('date', filters.data_pana)
  }

  if (filters.sort === 'data_asc') {
    query = query.order('date', { ascending: true })
  } else if (filters.sort === 'participanti') {
    query = query.order('participants_count', { ascending: false })
  } else {
    query = query.order('date', { ascending: false })
  }

  const from = (page - 1) * pageSize
  query = query.range(from, from + pageSize - 1)

  const { data, count, error } = await query
  if (error) console.error('[getEvents]', error.message)

  return { events: data ?? [], total: count ?? 0 }
}
```

- [ ] **Step 2: Commit**

```bash
git add services/event.service.ts
git commit -m "feat(events): add event.service.ts with EventPreview type and getEvents"
```

---

## Task 2: Actualizează `homepage.service.ts` + mută `EventCard` în shared

**Files:**
- Modify: `services/homepage.service.ts`
- Create: `components/shared/EventCard.tsx`
- Delete: `app/(public)/_components/EventCard.tsx`
- Modify: `app/(public)/_components/EventsCarouselClient.tsx`

- [ ] **Step 1: Actualizează `homepage.service.ts`**

Înlocuiește tipul local `EventPreview` cu import din `event.service.ts`. Adaugă `date` în query-ul `getRecentEvents`.

```typescript
// services/homepage.service.ts
'use server'

import { createClient } from '@/lib/supabase/server'
export type { EventPreview } from './event.service'

export type HomepageStats = {
  eventsCount: number
  volunteersCount: number
  orgsCount: number
  citiesCount: number
}

export type OrgPreview = {
  id: string
  name: string
  logo_url: string | null
}

export async function getHomepageStats(): Promise<HomepageStats> {
  const supabase = await createClient()

  const [eventsResult, volunteersResult, orgsResult] = await Promise.all([
    supabase
      .from('events')
      .select('*', { count: 'exact', head: true })
      .in('status', ['approved', 'completed']),
    supabase.from('users').select('*', { count: 'exact', head: true }),
    supabase
      .from('organizations')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'approved'),
  ])

  return {
    eventsCount: eventsResult.count ?? 0,
    volunteersCount: volunteersResult.count ?? 0,
    orgsCount: orgsResult.count ?? 0,
    citiesCount: 12,
  }
}

export async function getRecentEvents(limit: number) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('events')
    .select(
      'id, title, banner_url, category, subcategory, status, date, created_at, participants_count, view_count'
    )
    .in('status', ['approved', 'completed'])
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) console.error('[getRecentEvents]', error.message)
  return data ?? []
}

export async function getApprovedOrgs(): Promise<OrgPreview[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('organizations')
    .select('id, name, logo_url')
    .eq('status', 'approved')
    .order('created_at', { ascending: true })

  if (error) console.error('[getApprovedOrgs]', error.message)
  return data ?? []
}
```

- [ ] **Step 2: Creează `components/shared/EventCard.tsx`**

Același conținut ca cel vechi, cu 2 modificări: importul tipului vine din `event.service.ts` și se afișează `event.date` în loc de `event.created_at`.

```typescript
// components/shared/EventCard.tsx
import Link from 'next/link'
import Image from 'next/image'
import { Calendar, Eye, Users } from 'lucide-react'
import type { EventPreview } from '@/services/event.service'

const CATEGORY_LABELS: Record<string, string> = {
  protest: 'Protest',
  boycott: 'Boycott',
  petition: 'Petiție',
  community: 'Comunitar',
  charity: 'Caritabil',
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('ro-RO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

type Props = { event: EventPreview }

export function EventCard({ event }: Props) {
  return (
    <Link
      href={`/evenimente/${event.id}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-shadow duration-300 hover:shadow-lg"
    >
      <div className="relative aspect-video overflow-hidden">
        {event.banner_url ? (
          <Image
            src={event.banner_url}
            alt={event.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="h-full w-full bg-muted" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/30 to-transparent" />

        <div className="absolute left-3 top-3">
          <span className="rounded-full bg-background/90 px-2.5 py-1 text-xs font-semibold text-foreground backdrop-blur-sm">
            {CATEGORY_LABELS[event.category] ?? event.category}
          </span>
        </div>

        <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-background/90 px-2 py-1 text-xs backdrop-blur-sm">
          <Calendar className="size-3 text-primary" />
          <span className="font-medium">{formatDate(event.date)}</span>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="line-clamp-2 text-base font-bold leading-snug text-foreground">
          {event.title}
        </h3>

        <div className="mt-auto flex items-center gap-4 pt-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Users className="size-3" />
            {event.participants_count}
          </span>
          <span className="flex items-center gap-1">
            <Eye className="size-3" />
            {event.view_count}
          </span>
        </div>
      </div>
    </Link>
  )
}
```

- [ ] **Step 3: Actualizează `EventsCarouselClient` — importă `EventCard` din shared**

```typescript
// app/(public)/_components/EventsCarouselClient.tsx
'use client'

import useEmblaCarousel from 'embla-carousel-react'
import Autoplay from 'embla-carousel-autoplay'
import type { EventPreview } from '@/services/homepage.service'
import { EventCard } from '@/components/shared/EventCard'

type Props = { events: EventPreview[] }

export function EventsCarouselClient({ events }: Props) {
  const [emblaRef] = useEmblaCarousel(
    { loop: true, align: 'start' },
    [Autoplay({ delay: 5000, stopOnInteraction: true })]
  )

  return (
    <div className="overflow-hidden" ref={emblaRef}>
      <div className="flex gap-6">
        {events.map((event) => (
          <div
            key={event.id}
            className="min-w-0 shrink-0 grow-0 basis-full md:basis-1/2 lg:basis-1/3"
          >
            <EventCard event={event} />
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Șterge `app/(public)/_components/EventCard.tsx`**

```bash
rm "app/(public)/_components/EventCard.tsx"
```

- [ ] **Step 5: Verifică build**

```bash
pnpm build
```

Expected: build reușit fără erori de tip. Dacă apar erori, verifică importurile.

- [ ] **Step 6: Commit**

```bash
git add services/homepage.service.ts components/shared/EventCard.tsx "app/(public)/_components/EventsCarouselClient.tsx" "app/(public)/_components/EventCard.tsx"
git commit -m "feat(events): move EventCard to components/shared, update EventPreview to include date"
```

---

## Task 3: Creează `InfiniteScrollTrigger`, `EventsGridSkeleton`, `EmptyState`

**Files:**
- Create: `app/(public)/evenimente/_components/InfiniteScrollTrigger.tsx`
- Create: `app/(public)/evenimente/_components/EventsGridSkeleton.tsx`
- Create: `app/(public)/evenimente/_components/EmptyState.tsx`

- [ ] **Step 1: Creează `InfiniteScrollTrigger.tsx`**

```typescript
// app/(public)/evenimente/_components/InfiniteScrollTrigger.tsx
'use client'

import { useEffect, useRef } from 'react'

type Props = {
  onIntersect: () => void
  hasMore: boolean
}

export function InfiniteScrollTrigger({ onIntersect, hasMore }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!hasMore) return
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) onIntersect()
      },
      { threshold: 0.1 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [onIntersect, hasMore])

  return <div ref={ref} className="h-10" aria-hidden />
}
```

- [ ] **Step 2: Creează `EventsGridSkeleton.tsx`**

```typescript
// app/(public)/evenimente/_components/EventsGridSkeleton.tsx
export function EventsGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse overflow-hidden rounded-2xl border border-border bg-card"
        >
          <div className="aspect-video bg-muted" />
          <div className="space-y-3 p-4">
            <div className="h-4 w-3/4 rounded bg-muted" />
            <div className="h-4 w-1/2 rounded bg-muted" />
            <div className="h-3 w-1/4 rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 3: Creează `EmptyState.tsx`**

```typescript
// app/(public)/evenimente/_components/EmptyState.tsx
import Link from 'next/link'
import { SearchX } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-muted">
        <SearchX className="size-8 text-muted-foreground" />
      </div>
      <div className="space-y-1">
        <p className="text-lg font-bold text-foreground">Niciun eveniment găsit</p>
        <p className="text-sm text-muted-foreground">
          Încearcă să modifici filtrele sau explorează toate evenimentele.
        </p>
      </div>
      <Link href="/evenimente" className={buttonVariants({ variant: 'outline' })}>
        Șterge filtrele
      </Link>
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add "app/(public)/evenimente/_components/InfiniteScrollTrigger.tsx" "app/(public)/evenimente/_components/EventsGridSkeleton.tsx" "app/(public)/evenimente/_components/EmptyState.tsx"
git commit -m "feat(events): add InfiniteScrollTrigger, EventsGridSkeleton, EmptyState"
```

---

## Task 4: Creează `EventsListClient`

**Files:**
- Create: `app/(public)/evenimente/_components/EventsListClient.tsx`

- [ ] **Step 1: Creează `EventsListClient.tsx`**

Componenta primește evenimentele inițiale din server, le acumulează pe cele ulterioare din Server Action, și gestionează `InfiniteScrollTrigger`.

```typescript
// app/(public)/evenimente/_components/EventsListClient.tsx
'use client'

import { useState, useCallback, useTransition } from 'react'
import { getEvents } from '@/services/event.service'
import type { EventPreview, EventFilters } from '@/services/event.service'
import { EventCard } from '@/components/shared/EventCard'
import { InfiniteScrollTrigger } from './InfiniteScrollTrigger'
import { EventsGridSkeleton } from './EventsGridSkeleton'

const PAGE_SIZE = 12

type Props = {
  initialEvents: EventPreview[]
  total: number
  filters: EventFilters
}

export function EventsListClient({ initialEvents, total, filters }: Props) {
  const [events, setEvents] = useState<EventPreview[]>(initialEvents)
  const [page, setPage] = useState(1)
  const [isPending, startTransition] = useTransition()

  const hasMore = events.length < total

  const loadMore = useCallback(() => {
    if (isPending || !hasMore) return
    startTransition(async () => {
      const nextPage = page + 1
      const { events: newEvents } = await getEvents(filters, nextPage, PAGE_SIZE)
      setEvents((prev) => [...prev, ...newEvents])
      setPage(nextPage)
    })
  }, [isPending, hasMore, page, filters])

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {events.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>

      {isPending && <EventsGridSkeleton />}

      <InfiniteScrollTrigger onIntersect={loadMore} hasMore={hasMore && !isPending} />
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add "app/(public)/evenimente/_components/EventsListClient.tsx"
git commit -m "feat(events): add EventsListClient with infinite scroll and Server Action pagination"
```

---

## Task 5: Creează `FilterPanelClient` și `FilterPanel`

**Files:**
- Create: `app/(public)/evenimente/_components/FilterPanelClient.tsx`
- Create: `app/(public)/evenimente/_components/FilterPanel.tsx`

- [ ] **Step 1: Creează `FilterPanelClient.tsx`**

Inputs pentru toate filtrele. Actualizează URL cu `router.replace`. Debounce pe câmpul text (400ms).

```typescript
// app/(public)/evenimente/_components/FilterPanelClient.tsx
'use client'

import { useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import type { EventFilters } from '@/services/event.service'

const CATEGORIES = [
  { value: '', label: 'Toate categoriile' },
  { value: 'protest', label: 'Protest' },
  { value: 'boycott', label: 'Boycott' },
  { value: 'petition', label: 'Petiție' },
  { value: 'community', label: 'Comunitar' },
  { value: 'charity', label: 'Caritabil' },
]

const SORT_OPTIONS = [
  { value: 'data_desc', label: 'Cele mai recente' },
  { value: 'data_asc', label: 'Cele mai vechi' },
  { value: 'participanti', label: 'Popularitate' },
]

type Props = { filters: EventFilters }

export function FilterPanelClient({ filters }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  function updateParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    router.replace('/evenimente?' + params.toString())
  }

  function handleSearch(value: string) {
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(() => {
      updateParam('cauta', value || null)
    }, 400)
  }

  return (
    <div className="space-y-6">
      {/* Căutare text */}
      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
          Caută
        </label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Titlu eveniment..."
            defaultValue={filters.cauta ?? ''}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Categorie */}
      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
          Categorie
        </label>
        <select
          value={filters.categorie ?? ''}
          onChange={(e) => updateParam('categorie', e.target.value || null)}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      {/* Sortare */}
      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
          Sortare
        </label>
        <select
          value={filters.sort ?? 'data_desc'}
          onChange={(e) =>
            updateParam('sort', e.target.value === 'data_desc' ? null : e.target.value)
          }
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          {SORT_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {/* Interval dată */}
      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
          Perioadă
        </label>
        <div className="space-y-2">
          <Input
            type="date"
            defaultValue={filters.data_de ?? ''}
            onChange={(e) => updateParam('data_de', e.target.value || null)}
            className="text-sm"
          />
          <Input
            type="date"
            defaultValue={filters.data_pana ?? ''}
            onChange={(e) => updateParam('data_pana', e.target.value || null)}
            className="text-sm"
          />
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Creează `FilterPanel.tsx`**

Randează ambele variante via Tailwind — fără niciun prop condițional. `page.tsx` îl folosește o singură dată, într-un container `flex-col lg:flex-row`: pe mobile apare trigger-ul Sheet, pe desktop apare sidebar-ul 280px.

```typescript
// app/(public)/evenimente/_components/FilterPanel.tsx
import { SlidersHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import type { EventFilters } from '@/services/event.service'
import { FilterPanelClient } from './FilterPanelClient'

type Props = { filters: EventFilters }

export function FilterPanel({ filters }: Props) {
  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden w-[280px] shrink-0 lg:block">
        <p className="mb-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
          Filtre
        </p>
        <FilterPanelClient filters={filters} />
      </div>

      {/* Mobile Sheet trigger */}
      <div className="lg:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <SlidersHorizontal className="size-4" />
              Filtre
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[300px] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Filtre</SheetTitle>
            </SheetHeader>
            <div className="mt-6">
              <FilterPanelClient filters={filters} />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add "app/(public)/evenimente/_components/FilterPanelClient.tsx" "app/(public)/evenimente/_components/FilterPanel.tsx"
git commit -m "feat(events): add FilterPanel with desktop sidebar and mobile Sheet"
```

---

## Task 6: Creează `ActiveFiltersBarClient` și `ResultsCount`

**Files:**
- Create: `app/(public)/evenimente/_components/ActiveFiltersBarClient.tsx`
- Create: `app/(public)/evenimente/_components/ResultsCount.tsx`

- [ ] **Step 1: Creează `ActiveFiltersBarClient.tsx`**

```typescript
// app/(public)/evenimente/_components/ActiveFiltersBarClient.tsx
'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { X } from 'lucide-react'
import type { EventFilters } from '@/services/event.service'

const CATEGORY_LABELS: Record<string, string> = {
  protest: 'Protest',
  boycott: 'Boycott',
  petition: 'Petiție',
  community: 'Comunitar',
  charity: 'Caritabil',
}

const SORT_LABELS: Record<string, string> = {
  data_asc: 'Dată crescătoare',
  participanti: 'Popularitate',
}

type Props = { filters: EventFilters }

export function ActiveFiltersBarClient({ filters }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function removeParam(key: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.delete(key)
    router.replace('/evenimente?' + params.toString())
  }

  const chips: { label: string; key: string }[] = []

  if (filters.cauta) chips.push({ label: `"${filters.cauta}"`, key: 'cauta' })
  if (filters.categorie) chips.push({ label: CATEGORY_LABELS[filters.categorie] ?? filters.categorie, key: 'categorie' })
  if (filters.sort && filters.sort !== 'data_desc') chips.push({ label: SORT_LABELS[filters.sort] ?? filters.sort, key: 'sort' })
  if (filters.data_de) chips.push({ label: `De la: ${filters.data_de}`, key: 'data_de' })
  if (filters.data_pana) chips.push({ label: `Până la: ${filters.data_pana}`, key: 'data_pana' })

  if (chips.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2">
      {chips.map((chip) => (
        <button
          key={chip.key}
          onClick={() => removeParam(chip.key)}
          className="flex items-center gap-1.5 rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium text-foreground transition-colors hover:bg-muted/80"
        >
          {chip.label}
          <X className="size-3 text-muted-foreground" />
        </button>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Creează `ResultsCount.tsx`**

```typescript
// app/(public)/evenimente/_components/ResultsCount.tsx
type Props = { total: number }

export function ResultsCount({ total }: Props) {
  if (total === 0) return null
  return (
    <p className="text-sm text-muted-foreground">
      {total === 1 ? '1 eveniment găsit' : `${total.toLocaleString('ro-RO')} evenimente găsite`}
    </p>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add "app/(public)/evenimente/_components/ActiveFiltersBarClient.tsx" "app/(public)/evenimente/_components/ResultsCount.tsx"
git commit -m "feat(events): add ActiveFiltersBarClient and ResultsCount"
```

---

## Task 7: Creează `loading.tsx` și `page.tsx` pentru `/evenimente`

**Files:**
- Create: `app/(public)/evenimente/loading.tsx`
- Create: `app/(public)/evenimente/page.tsx`

- [ ] **Step 1: Citește docs Next.js pentru `searchParams` async**

Verifică în `node_modules/next/dist/docs/` sau tipurile din `node_modules/next/dist/server/app-render/` că `searchParams` în `page.tsx` este `Promise<Record<string, string | string[] | undefined>>` în Next.js 15+.

- [ ] **Step 2: Creează `loading.tsx`**

Next.js afișează automat acest fișier cât timp page.tsx face fetch async.

```typescript
// app/(public)/evenimente/loading.tsx
import { EventsGridSkeleton } from './_components/EventsGridSkeleton'

export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8 lg:py-16">
      <EventsGridSkeleton />
    </div>
  )
}
```

- [ ] **Step 3: Creează `page.tsx`**

```typescript
// app/(public)/evenimente/page.tsx
import type { Metadata } from 'next'
import { getEvents } from '@/services/event.service'
import type { EventFilters } from '@/services/event.service'
import { FilterPanel } from './_components/FilterPanel'
import { ActiveFiltersBarClient } from './_components/ActiveFiltersBarClient'
import { ResultsCount } from './_components/ResultsCount'
import { EventsListClient } from './_components/EventsListClient'
import { EmptyState } from './_components/EmptyState'

export const metadata: Metadata = {
  title: 'Evenimente',
  description:
    'Descoperă proteste, petiții, boicoturi și activități comunitare din România.',
  alternates: { canonical: '/evenimente' },
}

type PageProps = {
  searchParams: Promise<{
    cauta?: string
    categorie?: string
    sort?: string
    data_de?: string
    data_pana?: string
  }>
}

export default async function EventsPage({ searchParams }: PageProps) {
  const params = await searchParams

  const filters: EventFilters = {
    cauta: params.cauta,
    categorie: params.categorie,
    sort: params.sort as EventFilters['sort'],
    data_de: params.data_de,
    data_pana: params.data_pana,
  }

  const { events, total } = await getEvents(filters, 1)

  // filterKey forțează remontarea EventsListClient la schimbare filtre
  const filterKey = new URLSearchParams(
    Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== undefined)
    ) as Record<string, string>
  ).toString()

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8 lg:py-16">
      {/* flex-col pe mobil (trigger deasupra conținutului), flex-row pe desktop (sidebar lateral) */}
      <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
        {/* FilterPanel: pe desktop = sidebar 280px, pe mobil = Sheet trigger */}
        <FilterPanel filters={filters} />

        {/* Conținut principal */}
        <div className="min-w-0 flex-1 space-y-6">
          <h1 className="text-2xl font-black uppercase tracking-tighter text-foreground lg:text-3xl">
            Evenimente
          </h1>

          {/* Filtre active */}
          <ActiveFiltersBarClient filters={filters} />

          {/* Număr rezultate */}
          <ResultsCount total={total} />

          {/* Grid sau empty state */}
          {total === 0 ? (
            <EmptyState />
          ) : (
            <EventsListClient
              key={filterKey}
              initialEvents={events}
              total={total}
              filters={filters}
            />
          )}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add "app/(public)/evenimente/loading.tsx" "app/(public)/evenimente/page.tsx"
git commit -m "feat(events): add /evenimente page with URL-based filters and infinite scroll"
```

---

## Task 8: Build final + actualizare CLAUDE.md

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Rulează build**

```bash
pnpm build
```

Expected: toate rutele compilate fără erori TypeScript. Verifică în output că `/evenimente` apare ca `ƒ` (Dynamic).

- [ ] **Step 2: Verificare vizuală în browser**

```bash
pnpm dev
```

Verifică:
1. `/evenimente` — grid 3 col desktop, 1 col mobil, se încarcă cu date din DB
2. Filtrează după categorie → URL se actualizează, grid se reîncarcă
3. Caută text → debounce 400ms, URL se actualizează
4. Scroll până jos → se încarcă pagina 2 (dacă există)
5. Buton "Filtre" pe mobil → Sheet se deschide cu filtrele
6. Chip filtru activ → click X → filtrul se elimină
7. Niciun rezultat → EmptyState apare

- [ ] **Step 3: Marchează Etapa 4 completă în CLAUDE.md**

În `CLAUDE.md`, secțiunea Roadmap, înlocuiește:
```
### ⬜ Etapa 4 — Lista Evenimente `/evenimente` (`feat/events-list`)
`getEvents` cu filtre · `EventCard` · `FilterPanel` + `FilterPanelClient` · `ActiveFiltersBarClient` · `ResultsCount` · `EmptyState` · `EventsGridSkeleton` · `InfiniteScrollTrigger` · `EventsGrid` · metadata static + canonical
```
cu:
```
### ✅ Etapa 4 — Lista Evenimente `/evenimente` (`feat/events-list`)
`event.service.ts` + `getEvents` · `EventCard` (shared) · `FilterPanel` + `FilterPanelClient` · `ActiveFiltersBarClient` · `ResultsCount` · `EmptyState` · `EventsGridSkeleton` · `EventsListClient` · `InfiniteScrollTrigger` · metadata + canonical
```

- [ ] **Step 4: Creează `context/etapa4.md`**

Documentează tot ce s-a implementat — componente, tipuri, decizii, bug-uri — urmând același format ca `context/etapa3.md`.

- [ ] **Step 5: Commit final**

```bash
git add CLAUDE.md context/etapa4.md
git commit -m "docs(events): mark Etapa 4 complete, add context/etapa4.md"
```
