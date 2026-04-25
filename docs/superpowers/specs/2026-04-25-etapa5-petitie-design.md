# Etapa 5 — Pagina Eveniment: Petiție

**Data:** 2026-04-25
**Rută:** `/evenimente/petitie/[id]`
**Branch:** `feat/event-detail`
**Scope:** Etapa 5 — tipul Petiție

---

## Decizii arhitecturale

- **Fără subtipuri** — petițiile nu au subcategory; `subcategory` e mereu `null`
- **Fără hartă** — petițiile nu au locație fizică
- **Fără dată/oră fixă** — `ActionButtons` randează fără butonul Calendar
- **`participants_count` = semnături** — câmpul denormalizat din `events` reprezintă numărul de semnături
- **`RecentSignersClient` e Server Component** — face fetch la randare, fără interactivitate; nu necesită `"use client"`
- **`getRecentSigners` în `petition.service.ts`** — serviciu dedicat, separat de `event.service.ts`
- **`getPetitionById` cu `React.cache()`** — deduplicare între `generateMetadata` și `page.tsx`

---

## Layer de date

### Tip `PetitionDetail` (adăugat în `services/event.service.ts`)

```typescript
export type PetitionDetail = {
  id: string
  title: string
  description: string
  banner_url: string | null
  gallery_urls: string[]
  category: 'petition'
  subcategory: null
  status: 'pending' | 'approved' | 'rejected' | 'contested' | 'completed'
  creator_id: string
  creator_type: 'user' | 'ngo'
  organization_id: string | null
  view_count: number
  participants_count: number  // număr semnături (denormalizat)
  created_at: string
  petition: {
    what_is_requested: string
    requested_from: string
    target_signatures: number
    why_important: string
    contact_person: string | null
  }
  creator: { name: string; avatar_url: string | null }
  organization: { name: string; logo_url: string | null } | null
}
```

### Funcții noi în `services/event.service.ts`

```typescript
export const getPetitionById = cache(async (id: string): Promise<PetitionDetail | null> => {
  // SELECT pe events cu JOIN la petitions, users, organizations
  // Returnează null dacă: nu există, category !== 'petition', status nu e approved/completed
})
```

### Nou: `services/petition.service.ts`

```typescript
export type RecentSigner = {
  user_id: string
  name: string
  avatar_url: string | null
  signed_at: string   // timestamptz din petition_signatures.joined_at
}

export async function getRecentSigners(eventId: string, limit = 5): Promise<RecentSigner[]>
// SELECT petition_signatures JOIN users WHERE event_id = ? ORDER BY joined_at DESC LIMIT 5
```

---

## Componente

### Noi

#### `components/shared/SignatureCardClient.tsx` — Client Component
Props: `{ signaturesCount: number; targetSignatures: number; status: string }`

- Header: iconiță `FileSignature` + "Semnături"
- Număr mare italic: `signaturesCount / targetSignatures` (stilul `ParticipationCardClient`)
- Progress bar cu guard divide-by-zero (`targetSignatures > 0 ? ... : 0`)
- Buton "Semnează" — **disabled** în Etapa 5 (funcțional în Etapa 7)
- Pe `status === 'completed'`: ascunde butonul, afișează "Petiție finalizată" (verde, același pattern ca `ParticipationCardClient`)
- Fără câmpuri dată/oră

#### `app/(public)/evenimente/petitie/[id]/_components/RecentSignersClient.tsx` — Server Component (async)
Props: `{ eventId: string }`

- Apelează `getRecentSigners(eventId)`
- Card cu header: iconiță `Users` + "Semnatari recenți"
- Listă de 5 intrări: avatar cu inițiale (2 litere, stilul din protest) + nume trunchiat (`truncate max-w-[120px]`) + dată + oră (`ro-RO`, ex: "23 apr. · 14:32")
- Dacă 0 semnatari: mesaj "Fii primul care semnează" (italic, muted)

### Reutilizate fără modificări

- `EventBanner` — badge "Petiție" (fără subcategory)
- `ActionButtons` — Share + Print; butonul Calendar absent (props `date` și `timeStart` nu se pasează)
- `FeedbackSection` — vizibil doar pe `completed`

---

## Layout pagină

```
app/(public)/evenimente/petitie/[id]/page.tsx  — Server Component
```

### Desktop (lg:grid-cols-12)
```
┌─────────────────────────────────────────────────────────────┐
│ EventBanner (col-span-12, 21/9)                             │
├──────────────────────────────┬──────────────────────────────┤
│  col-span-8                  │  col-span-4 (aside)          │
│                              │                              │
│  ActionButtons               │  SignatureCardClient         │
│  Titlu h1                    │  "Adresat către" card        │
│  Descriere                   │  RecentSignersClient         │
│  De ce e importantă          │  [dacă există] Contact card  │
│  Ce se solicită              │                              │
│  [dacă există] Galerie       │                              │
│  [dacă completed]            │                              │
│  FeedbackSection             │                              │
└──────────────────────────────┴──────────────────────────────┘
```

### Mobil
Ordine: Banner → aside (SignatureCard + Adresat + Semnatari + Contact) → conținut stânga

Implementat prin `order-first lg:order-last` pe `<aside>`.

### "Adresat către" card (sidebar)
Card simplu cu iconiță `Building2` + label "Adresat către" + `requested_from` ca text bold. Întotdeauna vizibil (câmp obligatoriu în DB).

---

## SEO

### `generateMetadata`
```typescript
export async function generateMetadata({ params }): Promise<Metadata> {
  const event = await getPetitionById(params.id)
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
    alternates: { canonical: `/evenimente/petitie/${event.id}` },
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
  "url": "https://civicom.ro/evenimente/petitie/[id]"
}
```
Fără `startDate` și `location` (petițiile nu au dată fixă sau locație).

---

## Fișiere create / modificate

| Acțiune | Fișier |
|---|---|
| CREAT | `app/(public)/evenimente/petitie/[id]/page.tsx` |
| CREAT | `app/(public)/evenimente/petitie/[id]/_components/RecentSignersClient.tsx` |
| CREAT | `components/shared/SignatureCardClient.tsx` |
| CREAT | `services/petition.service.ts` |
| MODIFICAT | `services/event.service.ts` (adăugat `PetitionDetail`, `getPetitionById`) |
