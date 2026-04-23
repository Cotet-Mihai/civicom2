# Etapa 5 — Pagina Eveniment: Protest

**Data:** 2026-04-23
**Rută:** `/evenimente/protest/[id]`
**Branch:** `feat/event-detail`
**Scope:** Prima pagină din Etapa 5 — doar tipul Protest

---

## Decizii arhitecturale

- **URL-uri distincte per tip** — fiecare tip de eveniment are propria rută (`/evenimente/protest/[id]`, `/evenimente/petitie/[id]` etc.), nu un singur `[id]` generic cu branching intern
- **`/evenimente/[id]` eliminat complet** — nu există redirect; `EventCard` linkează direct la URL-ul specific tipului
- **`incrementViewCount` fire-and-forget** — apelat fără `await` în `page.tsx` pentru a nu bloca randarea
- **Sidebar primul pe mobil** — utilizatorul vede data/ora/harta înainte de descriere pe mobile

---

## Layer de date

### Tip `ProtestDetail` (adăugat în `services/event.service.ts`)

```typescript
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
```

### Funcții noi în `services/event.service.ts`

```typescript
export async function getProtestById(id: string): Promise<ProtestDetail | null>
export async function incrementViewCount(id: string): Promise<void>
```

**`getProtestById`** — SELECT pe `events` cu JOIN la `protests`, `gatherings`, `marches`, `pickets`, `users` (creator), `organizations`. Returnează `null` dacă evenimentul nu există, nu are `category = 'protest'`, sau `status` nu e `approved`/`completed`.

**`incrementViewCount`** — `.rpc('increment_view_count', { event_id: id })`. Fire-and-forget (fără `await` în page.tsx). Necesită funcție SQL în migrații:
```sql
CREATE OR REPLACE FUNCTION increment_view_count(event_id uuid)
RETURNS void LANGUAGE sql AS $$
  UPDATE events SET view_count = view_count + 1 WHERE id = event_id;
$$;
```

### Nou: `services/feedback.service.ts`

```typescript
export type EventFeedback = {
  id: string
  user_id: string
  rating: number        // 1-5
  comment: string | null
  created_at: string
  user: { name: string; avatar_url: string | null }
}

export async function getFeedback(eventId: string): Promise<{
  feedbacks: EventFeedback[]
  averageRating: number
  totalCount: number
}>

export async function getUserFeedback(eventId: string, userId: string): Promise<EventFeedback | null>
```

---

## Componente

### Shared (reutilizabile în etapele 5–12)

#### `components/shared/EventBanner.tsx` — Server Component
Props: `{ bannerUrl: string | null; title: string; subcategory: string | null; status: string; viewCount: number }`

- Banner `aspect-[21/9]` cu `rounded-3xl overflow-hidden border shadow-xl`
- Badge subtip stânga-sus (ex: "Protest: Marș")
- Badge views dreapta-sus (`bg-muted px-2.5 py-1 rounded-md text-xs font-bold`)
- Badge `completed` pe banner când `status === 'completed'` (overlay verde semitransparent)
- Zoom hover `group-hover:scale-[1.02]`
- Fallback: `bg-muted` când `bannerUrl` e null

#### `components/shared/ActionButtons.tsx` — Client Component
Props: `{ title: string; date?: string }`

Trei butoane outline mici:
- **Share** — `navigator.share` cu fallback `clipboard.writeText(window.location.href)`
- **Calendar** — generează `.ics` și descarcă
- **Print** — `window.print()`

#### `components/shared/ParticipationCardClient.tsx` — Client Component
Props: `{ participantsCount: number; maxParticipants: number; date: string; timeStart: string; timeEnd: string | null; status: string }`

Card sidebar cu:
- Dată formatată + interval orar
- Progress bar participanți (`participantsCount / maxParticipants`)
- Număr `X / max` cu font-black italic
- Buton "Participă" — **disabled** în Etapa 5 (funcțional în Etapa 7)
- Pe `status === 'completed'`: ascunde butonul, afișează contor final + badge "Încheiat"

#### `components/shared/FeedbackSection.tsx` — Server Component
Props: `{ eventId: string; status: string }`

- Vizibil doar când `status === 'completed'`
- Apelează `getFeedback(eventId)`
- Afișează rating mediu (stele) + număr total recenzii
- Listă feedback-uri cu avatar, nume, rating și comentariu
- Dacă `totalCount === 0`: mesaj "Niciun feedback încă"

### Page-specific

#### `app/(public)/evenimente/protest/[id]/_components/ProtestMapClient.tsx` — Client Component
Props: `{ subcategory: 'gathering' | 'march' | 'picket'; location?: [number, number]; locations?: [number, number][] }`

- Import dinamic (`next/dynamic` cu `ssr: false`) pentru shadcn-map
- `gathering` / `picket`: `Map` + `MapTileLayer` + `MapMarker` + `MapPopup`
- `march`: `Map` + `MapTileLayer` + Polyline (React Leaflet `<Polyline>`) + markere start/end
- Înălțime fixă: `h-[300px]` pe mobil, `h-[350px]` pe desktop
- `MapZoomControl` prezent

### Actualizat

#### `components/shared/EventCard.tsx`
```typescript
const CATEGORY_ROUTES: Record<string, string> = {
  protest:   'protest',
  boycott:   'boycott',
  petition:  'petitie',
  community: 'comunitar',
  charity:   'caritabil',
}
// href={`/evenimente/${CATEGORY_ROUTES[event.category]}/${event.id}`}
```

---

## Layout pagină

```
app/(public)/evenimente/protest/[id]/page.tsx  — Server Component
```

### Desktop (lg:grid-cols-12)
```
┌─────────────────────────────────────────────────────────────┐
│ EventBanner (col-span-12, 21/9)                             │
├──────────────────────────────┬──────────────────────────────┤
│  col-span-8                  │  col-span-4 (aside)          │
│                              │                              │
│  ActionButtons               │  ParticipationCardClient     │
│  Titlu h1                    │  ProtestMapClient            │
│  Descriere                   │  [dacă există] Contact card  │
│  [dacă există] Reguli        │                              │
│  [dacă există] Echipament    │                              │
│  [dacă există] Galerie       │                              │
│  [dacă completed]            │                              │
│  FeedbackSection             │                              │
└──────────────────────────────┴──────────────────────────────┘
```

### Mobil (col-span-1, stivuit)
Ordine: Banner → aside (ParticipationCard + Hartă + Contact) → conținut stânga

Implementat prin `order-first lg:order-none` pe `<aside>`.

---

## SEO

### `generateMetadata`
```typescript
export async function generateMetadata({ params }): Promise<Metadata> {
  const event = await getProtestById(params.id)
  if (!event) return { title: 'Eveniment negăsit' }
  return {
    title: event.title,
    description: event.description.slice(0, 160),
    openGraph: {
      title: event.title,
      description: event.description.slice(0, 160),
      images: event.banner_url ? [event.banner_url] : [],
    },
    alternates: { canonical: `/evenimente/protest/${event.id}` },
  }
}
```

### JSON-LD `Event`
```json
{
  "@context": "https://schema.org",
  "@type": "Event",
  "name": "...",
  "description": "...",
  "startDate": "YYYY-MM-DDTHH:MM",
  "location": {
    "@type": "Place",
    "geo": { "@type": "GeoCoordinates", "latitude": ..., "longitude": ... }
  }
}
```

---

## Fișiere create / modificate

| Acțiune | Fișier |
|---|---|
| CREAT | `app/(public)/evenimente/protest/[id]/page.tsx` |
| CREAT | `app/(public)/evenimente/protest/[id]/_components/ProtestMapClient.tsx` |
| CREAT | `components/shared/EventBanner.tsx` |
| CREAT | `components/shared/ActionButtons.tsx` |
| CREAT | `components/shared/ParticipationCardClient.tsx` |
| CREAT | `components/shared/FeedbackSection.tsx` |
| CREAT | `services/feedback.service.ts` |
| MODIFICAT | `services/event.service.ts` (adăugat `ProtestDetail`, `getProtestById`, `incrementViewCount`) |
| MODIFICAT | `components/shared/EventCard.tsx` (link tip-specific) |
