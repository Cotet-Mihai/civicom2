# Etapa 5 — Pagina Eveniment: Protest

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementează pagina `/evenimente/protest/[id]` cu date reale, hartă Leaflet, card participare și feedback pentru starea completed.

**Architecture:** Rută separată per tip de eveniment (`/evenimente/protest/[id]`). Server Component principal care fetches `ProtestDetail` și randează layout 8/4. Componente shared (`EventBanner`, `ActionButtons`, `ParticipationCardClient`, `FeedbackSection`) reutilizabile în etapele viitoare. `EventCard` actualizat să linkeze la URL-ul specific tipului.

**Tech Stack:** Next.js 15 App Router · Supabase JS v2 · shadcn/ui · shadcn-map (Leaflet + React Leaflet) · Tailwind CSS · TypeScript

---

## Structura fișierelor

| Acțiune | Fișier | Responsabilitate |
|---|---|---|
| CREAT | `supabase/migrations/0007_increment_view_count.sql` | Funcție SQL pentru increment atomic |
| MODIFICAT | `services/event.service.ts` | Tip `ProtestDetail` + `getProtestById` + `incrementViewCount` |
| CREAT | `services/feedback.service.ts` | `getFeedback` + `getUserFeedback` + tipuri |
| MODIFICAT | `components/shared/EventCard.tsx` | Link → URL tip-specific |
| CREAT | `components/shared/EventBanner.tsx` | Banner 21/9 cu badge tip/subtip + views + completed |
| CREAT | `components/shared/ActionButtons.tsx` | Butoane Share / Calendar / Print |
| CREAT | `components/shared/ParticipationCardClient.tsx` | Card participare cu date reale, buton disabled |
| CREAT | `components/shared/FeedbackSection.tsx` | Rating mediu + lista feedback (doar pe completed) |
| CREAT | `app/(public)/evenimente/protest/[id]/_components/ProtestMapClient.tsx` | Hartă shadcn-map (marker sau polyline) |
| CREAT | `app/(public)/evenimente/protest/[id]/page.tsx` | Pagina principală + generateMetadata + JSON-LD |

---

## Task 1: Instalează componente lipsă + aplică migrația SQL

**Files:**
- Create: `supabase/migrations/0007_increment_view_count.sql`

- [ ] **Step 1: Instalează `card` și `progress` din shadcn**

```bash
pnpm dlx shadcn@latest add card progress
```

Expected output: fișiere create în `components/ui/card.tsx` și `components/ui/progress.tsx`.

- [ ] **Step 2: Creează migrația SQL**

Creează fișierul `supabase/migrations/0007_increment_view_count.sql`:

```sql
CREATE OR REPLACE FUNCTION increment_view_count(event_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE events SET view_count = view_count + 1 WHERE id = event_id;
$$;
```

- [ ] **Step 3: Aplică migrația în Supabase**

Folosește tool-ul MCP `mcp__supabase__apply_migration`:
- migration_name: `increment_view_count`
- query: conținutul SQL de mai sus

- [ ] **Step 4: Verifică că funcția există**

Folosește `mcp__supabase__execute_sql` cu query:
```sql
SELECT proname FROM pg_proc WHERE proname = 'increment_view_count';
```

Expected: un rând cu `increment_view_count`.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/0007_increment_view_count.sql
git commit -m "feat: add increment_view_count SQL function"
```

---

## Task 2: Adaugă `ProtestDetail`, `getProtestById`, `incrementViewCount` în `event.service.ts`

**Files:**
- Modify: `services/event.service.ts`

- [ ] **Step 1: Adaugă tipul `ProtestDetail` și constanta de select**

Adaugă după ultimul `export` existent în `services/event.service.ts`:

```typescript
// ─── Protest Detail ──────────────────────────────────────────────────────────

const SELECT_PROTEST = `
  id, title, description, banner_url, gallery_urls, category, subcategory,
  status, creator_id, creator_type, organization_id, view_count, participants_count, created_at,
  protests(
    date, time_start, time_end, max_participants, recommended_equipment, safety_rules, contact_person,
    gatherings(location),
    marches(locations),
    pickets(location)
  ),
  creator:users!creator_id(name, avatar_url),
  organization:organizations!organization_id(name, logo_url)
`

export type ProtestDetail = {
  id: string
  title: string
  description: string
  banner_url: string | null
  gallery_urls: string[]
  category: 'protest'
  subcategory: 'gathering' | 'march' | 'picket'
  status: 'pending' | 'approved' | 'rejected' | 'contested' | 'completed'
  creator_id: string
  creator_type: 'user' | 'ngo'
  organization_id: string | null
  view_count: number
  participants_count: number
  created_at: string
  protest: {
    date: string
    time_start: string
    time_end: string | null
    max_participants: number
    recommended_equipment: string | null
    safety_rules: string | null
    contact_person: string | null
    gathering: { location: [number, number] } | null
    march: { locations: [number, number][] } | null
    picket: { location: [number, number] } | null
  }
  creator: { name: string; avatar_url: string | null }
  organization: { name: string; logo_url: string | null } | null
}

function mapProtestRow(row: any): ProtestDetail {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    banner_url: row.banner_url,
    gallery_urls: row.gallery_urls ?? [],
    category: 'protest',
    subcategory: row.subcategory,
    status: row.status,
    creator_id: row.creator_id,
    creator_type: row.creator_type,
    organization_id: row.organization_id,
    view_count: row.view_count,
    participants_count: row.participants_count,
    created_at: row.created_at,
    protest: {
      date: row.protests.date,
      time_start: row.protests.time_start,
      time_end: row.protests.time_end ?? null,
      max_participants: row.protests.max_participants,
      recommended_equipment: row.protests.recommended_equipment ?? null,
      safety_rules: row.protests.safety_rules ?? null,
      contact_person: row.protests.contact_person ?? null,
      gathering: row.protests.gatherings ?? null,
      march: row.protests.marches ?? null,
      picket: row.protests.pickets ?? null,
    },
    creator: {
      name: row.creator?.name ?? 'Anonim',
      avatar_url: row.creator?.avatar_url ?? null,
    },
    organization: row.organization
      ? { name: row.organization.name, logo_url: row.organization.logo_url ?? null }
      : null,
  }
}

export async function getProtestById(id: string): Promise<ProtestDetail | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('events')
    .select(SELECT_PROTEST)
    .eq('id', id)
    .eq('category', 'protest')
    .in('status', ['approved', 'completed'])
    .maybeSingle()

  if (error) console.error('[getProtestById]', error.message)
  if (!data) return null

  return mapProtestRow(data)
}

export async function incrementViewCount(id: string): Promise<void> {
  const supabase = await createClient()
  await supabase.rpc('increment_view_count', { event_id: id })
}
```

- [ ] **Step 2: Verifică compilare TypeScript**

```bash
pnpm tsc --noEmit 2>&1 | head -30
```

Expected: fără erori în `services/event.service.ts`.

- [ ] **Step 3: Commit**

```bash
git add services/event.service.ts
git commit -m "feat: add ProtestDetail type + getProtestById + incrementViewCount"
```

---

## Task 3: Creează `services/feedback.service.ts`

**Files:**
- Create: `services/feedback.service.ts`

- [ ] **Step 1: Creează fișierul**

```typescript
'use server'

import { createClient } from '@/lib/supabase/server'

export type EventFeedback = {
  id: string
  user_id: string
  rating: number
  comment: string | null
  created_at: string
  user: { name: string; avatar_url: string | null }
}

export type FeedbackSummary = {
  feedbacks: EventFeedback[]
  averageRating: number
  totalCount: number
}

export async function getFeedback(eventId: string): Promise<FeedbackSummary> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('event_feedback')
    .select('id, user_id, rating, comment, created_at, user:users!user_id(name, avatar_url)')
    .eq('event_id', eventId)
    .order('created_at', { ascending: false })

  if (error) console.error('[getFeedback]', error.message)

  const feedbacks: EventFeedback[] = (data ?? []).map((row: any) => ({
    id: row.id,
    user_id: row.user_id,
    rating: row.rating,
    comment: row.comment ?? null,
    created_at: row.created_at,
    user: {
      name: row.user?.name ?? 'Anonim',
      avatar_url: row.user?.avatar_url ?? null,
    },
  }))

  const averageRating =
    feedbacks.length > 0
      ? feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length
      : 0

  return { feedbacks, averageRating, totalCount: feedbacks.length }
}

export async function getUserFeedback(
  eventId: string,
  userId: string
): Promise<EventFeedback | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('event_feedback')
    .select('id, user_id, rating, comment, created_at, user:users!user_id(name, avatar_url)')
    .eq('event_id', eventId)
    .eq('user_id', userId)
    .maybeSingle()

  if (error) console.error('[getUserFeedback]', error.message)
  if (!data) return null

  return {
    id: data.id,
    user_id: data.user_id,
    rating: data.rating,
    comment: data.comment ?? null,
    created_at: data.created_at,
    user: {
      name: (data as any).user?.name ?? 'Anonim',
      avatar_url: (data as any).user?.avatar_url ?? null,
    },
  }
}
```

- [ ] **Step 2: Verifică compilare**

```bash
pnpm tsc --noEmit 2>&1 | head -20
```

Expected: fără erori noi.

- [ ] **Step 3: Commit**

```bash
git add services/feedback.service.ts
git commit -m "feat: add feedback.service.ts with getFeedback + getUserFeedback"
```

---

## Task 4: Actualizează `EventCard` — linkuri tip-specific

**Files:**
- Modify: `components/shared/EventCard.tsx`

- [ ] **Step 1: Adaugă map-ul de rute și actualizează href**

Înlocuiește prima linie a componentei (după imports) cu:

```typescript
const CATEGORY_ROUTES: Record<string, string> = {
  protest: 'protest',
  boycott: 'boycott',
  petition: 'petitie',
  community: 'comunitar',
  charity: 'caritabil',
}
```

Actualizează `href` din `<Link>`:
```typescript
href={`/evenimente/${CATEGORY_ROUTES[event.category] ?? event.category}/${event.id}`}
```

- [ ] **Step 2: Verifică că CATEGORY_LABELS deja existent rămâne**

Fișierul trebuie să aibă ambele maps: `CATEGORY_LABELS` (pentru badge) și `CATEGORY_ROUTES` (pentru link).

- [ ] **Step 3: Verifică compilare**

```bash
pnpm tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 4: Commit**

```bash
git add components/shared/EventCard.tsx
git commit -m "feat: update EventCard links to type-specific URLs"
```

---

## Task 5: Creează `components/shared/EventBanner.tsx`

**Files:**
- Create: `components/shared/EventBanner.tsx`

- [ ] **Step 1: Creează componenta**

```typescript
import Image from 'next/image'
import { Eye } from 'lucide-react'

const SUBCATEGORY_LABELS: Record<string, string> = {
  gathering: 'Protest: Adunare',
  march: 'Protest: Marș',
  picket: 'Protest: Pichet',
  outdoor: 'Activitate: Aer Liber',
  workshop: 'Activitate: Workshop',
  donation: 'Donații',
  concert: 'Concert Caritabil',
  meet_greet: 'Meet & Greet',
  livestream: 'Livestream Caritabil',
  sports: 'Sport Caritabil',
}

const CATEGORY_LABELS: Record<string, string> = {
  protest: 'Protest',
  boycott: 'Boycott',
  petition: 'Petiție',
  community: 'Comunitar',
  charity: 'Caritabil',
}

type Props = {
  bannerUrl: string | null
  title: string
  category: string
  subcategory: string | null
  status: string
  viewCount: number
}

export function EventBanner({ bannerUrl, title, category, subcategory, status, viewCount }: Props) {
  const badgeLabel = subcategory
    ? (SUBCATEGORY_LABELS[subcategory] ?? `${CATEGORY_LABELS[category] ?? category}: ${subcategory}`)
    : (CATEGORY_LABELS[category] ?? category)

  return (
    <div className="relative w-full aspect-[21/9] group rounded-3xl overflow-hidden border border-border shadow-xl">
      {bannerUrl ? (
        <Image
          src={bannerUrl}
          alt={title}
          fill
          priority
          className="object-cover transition-transform duration-700 group-hover:scale-[1.02]"
        />
      ) : (
        <div className="h-full w-full bg-muted" />
      )}

      <div className="absolute inset-0 shadow-[inset_0_0_40px_rgba(0,0,0,0.1)] pointer-events-none z-10" />

      <div className="absolute top-4 left-4 z-20">
        <span className="rounded-full bg-background/90 px-3 py-1.5 text-xs font-semibold text-foreground backdrop-blur-sm border border-border/50">
          {badgeLabel}
        </span>
      </div>

      <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 bg-muted/90 px-2.5 py-1 rounded-md text-xs font-bold border border-border/50 backdrop-blur-sm">
        <Eye size={12} className="text-muted-foreground" />
        <span className="text-muted-foreground">{viewCount.toLocaleString('ro-RO')}</span>
      </div>

      {status === 'completed' && (
        <div className="absolute bottom-4 left-4 z-20">
          <span className="bg-primary/80 text-primary-foreground text-xs font-bold px-3 py-1.5 rounded-full backdrop-blur-sm">
            Finalizat
          </span>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verifică compilare**

```bash
pnpm tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 3: Commit**

```bash
git add components/shared/EventBanner.tsx
git commit -m "feat: add shared EventBanner component"
```

---

## Task 6: Creează `components/shared/ActionButtons.tsx`

**Files:**
- Create: `components/shared/ActionButtons.tsx`

- [ ] **Step 1: Creează componenta**

```typescript
'use client'

import { Share2, Calendar, Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'

type Props = {
  title: string
  date?: string
  timeStart?: string
}

export function ActionButtons({ title, date, timeStart }: Props) {
  function handleShare() {
    const url = window.location.href
    if (typeof navigator.share === 'function') {
      navigator.share({ title, url }).catch(() => {})
    } else {
      navigator.clipboard.writeText(url).catch(() => {})
    }
  }

  function handleCalendar() {
    if (!date || !timeStart) return
    const dtStart = `${date}T${timeStart}`.replace(/[-:]/g, '').slice(0, 13) + '00Z'
    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//CIVICOM//RO',
      'BEGIN:VEVENT',
      `SUMMARY:${title}`,
      `DTSTART:${dtStart}`,
      `DTEND:${dtStart}`,
      `URL:${window.location.href}`,
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n')
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `${title.slice(0, 40).replace(/[^a-zA-Z0-9]/g, '-')}.ics`
    link.click()
    URL.revokeObjectURL(link.href)
  }

  function handlePrint() {
    window.print()
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Button variant="outline" size="sm" onClick={handleShare} className="gap-1.5">
        <Share2 size={14} />
        Distribuie
      </Button>
      {date && timeStart && (
        <Button variant="outline" size="sm" onClick={handleCalendar} className="gap-1.5">
          <Calendar size={14} />
          Adaugă în calendar
        </Button>
      )}
      <Button variant="outline" size="sm" onClick={handlePrint} className="gap-1.5">
        <Printer size={14} />
        Printează
      </Button>
    </div>
  )
}
```

- [ ] **Step 2: Verifică compilare**

```bash
pnpm tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 3: Commit**

```bash
git add components/shared/ActionButtons.tsx
git commit -m "feat: add shared ActionButtons component (Share/Calendar/Print)"
```

---

## Task 7: Creează `components/shared/ParticipationCardClient.tsx`

**Files:**
- Create: `components/shared/ParticipationCardClient.tsx`

- [ ] **Step 1: Creează componenta**

```typescript
'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Calendar, Clock, Users } from 'lucide-react'

type Props = {
  participantsCount: number
  maxParticipants: number
  date: string
  timeStart: string
  timeEnd: string | null
  status: string
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('ro-RO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function ParticipationCardClient({
  participantsCount,
  maxParticipants,
  date,
  timeStart,
  timeEnd,
  status,
}: Props) {
  const pct = Math.min(100, Math.round((participantsCount / maxParticipants) * 100))
  const isCompleted = status === 'completed'

  return (
    <Card className="shadow-lg shadow-black/5 border-border">
      <CardContent className="p-6 space-y-4">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          <Users size={14} />
          Participare
        </h3>

        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground font-medium">
            <Calendar size={14} className="text-primary" />
            {formatDate(date)}
          </div>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground font-medium">
            <Clock size={14} className="text-primary" />
            {timeStart}{timeEnd ? ` – ${timeEnd}` : ''}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Participanți</span>
            <span className="text-3xl font-black italic tracking-tighter text-primary leading-none">
              {participantsCount}{' '}
              <span className="text-sm font-normal text-muted-foreground not-italic">
                / {maxParticipants}
              </span>
            </span>
          </div>
          <Progress value={pct} className="h-2 bg-muted" />
        </div>

        {isCompleted ? (
          <div className="rounded-lg bg-primary/10 border border-primary/20 px-4 py-2.5 text-center text-sm font-semibold text-primary">
            Eveniment finalizat
          </div>
        ) : (
          <Button className="w-full" disabled>
            Participă
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 2: Verifică compilare**

```bash
pnpm tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 3: Commit**

```bash
git add components/shared/ParticipationCardClient.tsx
git commit -m "feat: add shared ParticipationCardClient component"
```

---

## Task 8: Creează `components/shared/FeedbackSection.tsx`

**Files:**
- Create: `components/shared/FeedbackSection.tsx`

- [ ] **Step 1: Creează componenta**

```typescript
import { getFeedback } from '@/services/feedback.service'
import { Star } from 'lucide-react'

type Props = { eventId: string; status: string }

export async function FeedbackSection({ eventId, status }: Props) {
  if (status !== 'completed') return null

  const { feedbacks, averageRating, totalCount } = await getFeedback(eventId)

  return (
    <section className="space-y-6 pt-4 border-t border-border">
      <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
        <Star size={14} />
        Feedback participanți
      </h3>

      <div className="flex items-center gap-4">
        <span className="text-4xl font-black italic tracking-tighter text-primary">
          {averageRating.toFixed(1)}
        </span>
        <div className="space-y-1">
          <div className="flex gap-0.5">
            {Array.from({ length: 5 }, (_, i) => (
              <Star
                key={i}
                size={16}
                className={
                  i < Math.round(averageRating)
                    ? 'fill-primary text-primary'
                    : 'text-muted-foreground/30'
                }
              />
            ))}
          </div>
          <p className="text-xs text-muted-foreground">{totalCount} recenzii</p>
        </div>
      </div>

      {totalCount === 0 ? (
        <p className="text-sm text-muted-foreground italic">Niciun feedback încă.</p>
      ) : (
        <ul className="space-y-5">
          {feedbacks.map((f) => (
            <li key={f.id} className="flex gap-3">
              <div className="size-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-black text-xs text-primary shrink-0">
                {f.user.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-foreground">{f.user.name}</span>
                  <div className="flex gap-0.5 shrink-0">
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star
                        key={i}
                        size={12}
                        className={
                          i < f.rating
                            ? 'fill-primary text-primary'
                            : 'text-muted-foreground/30'
                        }
                      />
                    ))}
                  </div>
                </div>
                {f.comment && (
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.comment}</p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
```

- [ ] **Step 2: Verifică compilare**

```bash
pnpm tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 3: Commit**

```bash
git add components/shared/FeedbackSection.tsx
git commit -m "feat: add shared FeedbackSection component"
```

---

## Task 9: Creează `ProtestMapClient.tsx`

**Files:**
- Create: `app/(public)/evenimente/protest/[id]/_components/ProtestMapClient.tsx`

- [ ] **Step 1: Creează directorul**

```bash
mkdir -p "app/(public)/evenimente/protest/[id]/_components"
```

- [ ] **Step 2: Creează componenta**

```typescript
'use client'

import { Card, CardContent } from '@/components/ui/card'
import { MapPin } from 'lucide-react'
import {
  Map,
  MapMarker,
  MapPolyline,
  MapTileLayer,
  MapZoomControl,
} from '@/components/ui/map'

type Props = {
  subcategory: 'gathering' | 'march' | 'picket'
  location?: [number, number]
  locations?: [number, number][]
}

const BUCHAREST: [number, number] = [44.4268, 26.1025]

export function ProtestMapClient({ subcategory, location, locations }: Props) {
  const center: [number, number] =
    subcategory === 'march' && locations?.length
      ? locations[0]
      : location ?? BUCHAREST

  return (
    <Card className="shadow-lg shadow-black/5 border-border overflow-hidden">
      <CardContent className="p-0">
        <div className="px-4 pt-4 pb-2">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <MapPin size={14} />
            {subcategory === 'march' ? 'Traseu marș' : 'Locație'}
          </h3>
        </div>
        <div className="h-[280px] w-full overflow-hidden">
          <Map center={center} zoom={14} className="!min-h-0 h-full w-full">
            <MapTileLayer />
            <MapZoomControl />
            {subcategory === 'march' && locations?.length ? (
              <>
                <MapPolyline
                  positions={locations}
                  pathOptions={{ color: '#16a34a', weight: 4 }}
                />
                <MapMarker position={locations[0]} />
                <MapMarker position={locations[locations.length - 1]} />
              </>
            ) : location ? (
              <MapMarker position={location} />
            ) : null}
          </Map>
        </div>
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 3: Verifică compilare**

```bash
pnpm tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 4: Commit**

```bash
git add "app/(public)/evenimente/protest/[id]/_components/ProtestMapClient.tsx"
git commit -m "feat: add ProtestMapClient with shadcn-map (marker + polyline)"
```

---

## Task 10: Creează pagina principală `protest/[id]/page.tsx`

**Files:**
- Create: `app/(public)/evenimente/protest/[id]/page.tsx`

- [ ] **Step 1: Creează pagina**

```typescript
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Image from 'next/image'
import { Phone, ShieldCheck, Package, Images } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { getProtestById, incrementViewCount } from '@/services/event.service'
import { EventBanner } from '@/components/shared/EventBanner'
import { ActionButtons } from '@/components/shared/ActionButtons'
import { ParticipationCardClient } from '@/components/shared/ParticipationCardClient'
import { FeedbackSection } from '@/components/shared/FeedbackSection'
import { ProtestMapClient } from './_components/ProtestMapClient'

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const event = await getProtestById(id)
  if (!event) return { title: 'Eveniment negăsit' }
  return {
    title: event.title,
    description: event.description.slice(0, 160),
    openGraph: {
      title: event.title,
      description: event.description.slice(0, 160),
      images: event.banner_url ? [{ url: event.banner_url }] : [],
      type: 'article',
    },
    alternates: { canonical: `/evenimente/protest/${event.id}` },
  }
}

export default async function ProtestPage({ params }: Props) {
  const { id } = await params
  const event = await getProtestById(id)
  if (!event) notFound()

  // fire-and-forget — nu blochează randarea
  incrementViewCount(id)

  const { protest } = event
  const mapLocation =
    protest.gathering?.location ?? protest.picket?.location ?? undefined
  const mapLocations = protest.march?.locations ?? undefined

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.title,
    description: event.description,
    startDate: `${protest.date}T${protest.time_start}`,
    ...(protest.time_end && { endDate: `${protest.date}T${protest.time_end}` }),
    ...(mapLocation && {
      location: {
        '@type': 'Place',
        geo: {
          '@type': 'GeoCoordinates',
          latitude: mapLocation[0],
          longitude: mapLocation[1],
        },
      },
    }),
    url: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://civicom.ro'}/evenimente/protest/${event.id}`,
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="mx-auto max-w-7xl px-4 lg:px-8 py-8 space-y-8">
        <EventBanner
          bannerUrl={event.banner_url}
          title={event.title}
          category={event.category}
          subcategory={event.subcategory}
          status={event.status}
          viewCount={event.view_count}
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Sidebar — apare primul pe mobil */}
          <aside className="lg:col-span-4 space-y-4 order-first lg:order-last">
            <ParticipationCardClient
              participantsCount={event.participants_count}
              maxParticipants={protest.max_participants}
              date={protest.date}
              timeStart={protest.time_start}
              timeEnd={protest.time_end}
              status={event.status}
            />

            <ProtestMapClient
              subcategory={event.subcategory}
              location={mapLocation}
              locations={mapLocations}
            />

            {protest.contact_person && (
              <Card className="shadow-lg shadow-black/5 border-border">
                <CardContent className="p-6 space-y-3">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <Phone size={14} />
                    Contact
                  </h3>
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-black text-xs text-primary shrink-0">
                      {protest.contact_person.slice(0, 2).toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-foreground">
                      {protest.contact_person}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}
          </aside>

          {/* Conținut principal */}
          <div className="lg:col-span-8 space-y-8">
            <ActionButtons
              title={event.title}
              date={protest.date}
              timeStart={protest.time_start}
            />

            <div className="space-y-4">
              <h1 className="text-2xl md:text-4xl font-black tracking-tighter leading-tight uppercase text-primary italic">
                {event.title}
              </h1>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                {event.description}
              </p>
            </div>

            {protest.safety_rules && (
              <section className="space-y-3">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <ShieldCheck size={14} />
                  Reguli de siguranță
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                  {protest.safety_rules}
                </p>
              </section>
            )}

            {protest.recommended_equipment && (
              <section className="space-y-3">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <Package size={14} />
                  Echipament recomandat
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                  {protest.recommended_equipment}
                </p>
              </section>
            )}

            {event.gallery_urls.length > 0 && (
              <section className="space-y-3">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <Images size={14} />
                  Galerie foto
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {event.gallery_urls.map((url, i) => (
                    <div
                      key={i}
                      className="relative aspect-square rounded-xl overflow-hidden border border-border"
                    >
                      <Image
                        src={url}
                        alt={`Foto ${i + 1}`}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
              </section>
            )}

            <FeedbackSection eventId={event.id} status={event.status} />
          </div>
        </div>
      </div>
    </>
  )
}
```

- [ ] **Step 2: Verifică compilare TypeScript**

```bash
pnpm tsc --noEmit 2>&1 | head -30
```

Expected: fără erori.

- [ ] **Step 3: Commit**

```bash
git add "app/(public)/evenimente/protest/[id]/page.tsx"
git commit -m "feat: add protest event detail page with metadata + JSON-LD"
```

---

## Task 11: Build final + verificare vizuală

- [ ] **Step 1: Rulează build-ul complet**

```bash
pnpm build 2>&1 | tail -30
```

Expected: `✓ Compiled successfully` fără erori. Avertismente despre `img` vs `next/image` sau variabile nefolosite sunt acceptabile.

- [ ] **Step 2: Pornește dev server și verifică pagina**

```bash
pnpm dev
```

Navighează la un eveniment de tip protest din DB (sau inserează un seed) și verifică:
- [ ] Banner 21/9 se randează cu badge subtip
- [ ] Sidebar apare deasupra conținutului pe mobil (resize browser)
- [ ] Harta se încarcă și afișează marker (sau polyline pentru marș)
- [ ] Card participare afișează dată/oră și progress bar
- [ ] Titlul are stilul civic bold uppercase italic
- [ ] `EventCard` linkează acum la `/evenimente/protest/[id]`

- [ ] **Step 3: Commit final dacă sunt ajustări CSS**

```bash
git add -p
git commit -m "fix: visual adjustments protest page"
```

- [ ] **Step 4: Actualizează CLAUDE.md — marchează Etapa 5 Protest ca în progres**

În `CLAUDE.md`, la secțiunea Roadmap, actualizează:
```
### 🟡 Etapa 5 — Pagina Eveniment `/evenimente/[id]` (`feat/event-detail`)
`getProtestById` ✅ · `incrementViewCount` ✅ · `ActionButtons` ✅ · `ParticipationCardClient` ✅ · `EventBanner` ✅ · `FeedbackSection` ✅ · `feedback.service.ts` ✅ · Pagina Protest ✅ · Petiție ⬜ · Boycott ⬜ · Comunitar ⬜ · Donații ⬜ · Caritabil ⬜
```

```bash
git add CLAUDE.md
git commit -m "docs: update roadmap — Etapa 5 Protest complete"
```
