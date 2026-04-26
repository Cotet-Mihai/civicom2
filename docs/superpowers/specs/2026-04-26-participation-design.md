# Etapa 7 — Participare & Semnare: Design

## Goal

Activează butoanele de participare și semnare pe toate paginile de eveniment. Utilizatorii autentificați pot participa la proteste, boycott-uri, activități comunitare și evenimente caritabile, sau pot semna petiții. Starea e persistată în Supabase și reflectată în timp real via `router.refresh()`.

## Architecture

Un singur serviciu nou (`participation.service.ts`) gestionează toată logica de join/leave/sign. Două hook-uri (`useEventParticipation`, `usePetitionSign`) consumă serviciul și expun stare + acțiuni componentelor client existente. Componentele `ParticipationCardClient` și `SignatureCardClient` primesc un prop `eventId` și devin pe deplin funcționale.

## Tech Stack

- Next.js 15 Server Actions (`'use server'`) pentru mutații
- Supabase `createClient` (server) pentru DB
- `useRouter` + `router.refresh()` pentru re-randare server components după mutație
- `createClient` (browser) în hook-uri pentru query-uri client-side

---

## 1. Serviciu: `services/participation.service.ts`

**Funcții exportate:**

### `getParticipationStatus(eventId: string): Promise<'joined' | 'cancelled' | null>`
- `createClient()` server, `auth.getUser()`
- Dacă nu e autentificat → `null`
- SELECT din `event_participants` WHERE `event_id = eventId AND user_id = userData.id`
- Returnează `row.status` sau `null` dacă nu există rând

### `joinEvent(eventId: string): Promise<{ ok: true } | { error: string }>`
- Verifică sesiune → eroare dacă lipsă
- Upsert în `event_participants`:
  - Dacă nu există rând: INSERT `{ event_id, user_id, status: 'joined' }`
  - Dacă există cu `status='cancelled'`: UPDATE `status='joined'`
  - Dacă există cu `status='joined'`: no-op (returnează `{ ok: true }`)
- Folosește `upsert` cu `onConflict: 'event_id,user_id'` și `ignoreDuplicates: false`

### `leaveEvent(eventId: string): Promise<{ ok: true } | { error: string }>`
- Verifică sesiune → eroare dacă lipsă
- UPDATE `event_participants` SET `status='cancelled'` WHERE `event_id = eventId AND user_id = userData.id`
- Dacă nu există rând: returnează `{ ok: true }` (idempotent)

### `getSignatureStatus(eventId: string): Promise<boolean>`
- Verifică sesiune → `false` dacă lipsă
- SELECT din `petition_signatures` WHERE `event_id = eventId AND user_id = userData.id`
- Returnează `true` dacă există rând, `false` altfel

### `signPetition(eventId: string): Promise<{ ok: true } | { error: string }>`
- Verifică sesiune → eroare dacă lipsă
- INSERT în `petition_signatures` `{ event_id, user_id }`
- La conflict (UNIQUE) → returnează `{ ok: true }` (idempotent, deja semnat)

**Note:**
- Toate funcțiile rezolvă `user_id` intern via JOIN `users WHERE auth_users_id = auth.uid()`
- Nu există "desemnare" petiție — `signPetition` e one-way
- `participant_status: joined | cancelled` — leave NU șterge rândul, păstrează istoricul

---

## 2. Hook: `hooks/useEventParticipation.ts`

```ts
'use client'
export function useEventParticipation(eventId: string) {
  // state: isJoined, isLoading
  // useEffect: fetch getParticipationStatus on mount
  // join(): calls joinEvent, router.refresh() on success
  // leave(): calls leaveEvent, router.refresh() on success
  return { isJoined, isLoading, join, leave }
}
```

- `join()`, `leave()`, și status fetch-ul inițial apelează Server Actions (`'use server'`) direct din `useEffect`/handler-e — fără Supabase client propriu în hook
- `router.refresh()` după fiecare mutație reușită — re-randează server components (actualizează `participants_count`)
- La eroare: `toast.error(result.error)`

---

## 3. Hook: `hooks/usePetitionSign.ts`

```ts
'use client'
export function usePetitionSign(eventId: string) {
  // state: isSigned, isLoading
  // useEffect: fetch getSignatureStatus on mount
  // sign(): calls signPetition, router.refresh() on success
  return { isSigned, isLoading, sign }
}
```

- Același pattern ca `useEventParticipation` — apelează Server Actions direct, fără Supabase client propriu
- `router.refresh()` actualizează `participants_count` + `RecentSignersClient` (server component)

---

## 4. `components/shared/ParticipationCardClient.tsx` — actualizare

**Props noi adăugate:** `eventId: string`

**Comportament buton:**
- Event `status !== 'approved'` și `status !== 'completed'` → buton ascuns (pending/rejected)
- `status === 'completed'` → afișează "Eveniment finalizat" (existent, fără buton)
- `status === 'approved'` + `isLoading` → buton disabled cu spinner
- `status === 'approved'` + `!isJoined` → buton "Participă" (variant default)
- `status === 'approved'` + `isJoined` → buton "Renunță" (variant outline, text destructive)

**Modificări minore:** adaugă `eventId` la toate paginile care folosesc `ParticipationCardClient`:
- `protest/[id]/page.tsx`
- `boycott/[id]/page.tsx`
- `comunitar/[id]/page.tsx`
- `caritabil/[id]/page.tsx`

---

## 5. `components/shared/SignatureCardClient.tsx` — actualizare

**Props noi adăugate:** `eventId: string`

**Comportament buton:**
- `isLoading` → disabled cu spinner
- `!isSigned` → "Semnează petiția" (variant default)
- `isSigned` → "Ai semnat ✓" (disabled, variant outline)

**Modificări:** adaugă `eventId` la `petitie/[id]/page.tsx`

---

## Data Flow

```
User click "Participă"
  → useEventParticipation.join()
    → joinEvent(eventId) [Server Action]
      → INSERT/UPDATE event_participants
      → trigger actualizează participants_count pe events
    → router.refresh()
      → server re-fetches getProtestById (include participants_count nou)
      → ParticipationCardClient re-randată cu count actualizat
```

---

## Fișiere create / modificate

| Operație | Fișier |
|---|---|
| CREATE | `services/participation.service.ts` |
| CREATE | `hooks/useEventParticipation.ts` |
| CREATE | `hooks/usePetitionSign.ts` |
| MODIFY | `components/shared/ParticipationCardClient.tsx` |
| MODIFY | `components/shared/SignatureCardClient.tsx` |
| MODIFY | `app/(public)/evenimente/protest/[id]/page.tsx` |
| MODIFY | `app/(public)/evenimente/boycott/[id]/page.tsx` |
| MODIFY | `app/(public)/evenimente/comunitar/[id]/page.tsx` |
| MODIFY | `app/(public)/evenimente/caritabil/[id]/page.tsx` |
| MODIFY | `app/(public)/evenimente/petitie/[id]/page.tsx` |

---

## Edge Cases

- **Neautentificat:** click "Participă" → `toast.error('Trebuie să fii autentificat')` (din hook, înainte să apeleze server action)
- **Event plin** (`participants_count >= max_participants`): butonul "Participă" e disabled + text "Complet" — verificat client-side din props
- **Double-click:** `isLoading=true` dezactivează butonul pe durata request-ului
- **Petiție deja semnată:** `signPetition` e idempotent — UNIQUE constraint + no error returned
