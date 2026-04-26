# Etapa 7 — Participare & Semnare Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Activează butoanele de participare și semnare pe toate paginile de eveniment — utilizatorii autentificați pot join/leave evenimente și semna petiții, cu stare persistată în Supabase.

**Architecture:** Un serviciu `participation.service.ts` expune 5 Server Actions (getParticipationStatus, joinEvent, leaveEvent, getSignatureStatus, signPetition). Două hook-uri (`useEventParticipation`, `usePetitionSign`) consumă aceste actions și expun stare + acțiuni. `ParticipationCardClient` și `SignatureCardClient` primesc prop `eventId` și devin funcționale. `router.refresh()` re-randează server components după mutații pentru a actualiza contoarele.

**Tech Stack:** Next.js 15 Server Actions, Supabase PostgreSQL (`event_participants` + `petition_signatures`), `useRouter` + `router.refresh()`, Sonner toasts.

---

## File Map

| Operație | Fișier | Responsabilitate |
|---|---|---|
| CREATE | `services/participation.service.ts` | Toate server actions join/leave/sign/status |
| CREATE | `hooks/useEventParticipation.ts` | Stare + acțiuni participare pentru componente client |
| CREATE | `hooks/usePetitionSign.ts` | Stare + acțiune semnare pentru SignatureCardClient |
| MODIFY | `components/shared/ParticipationCardClient.tsx` | Adaugă eventId prop + integrare hook + butoane funcționale |
| MODIFY | `components/shared/SignatureCardClient.tsx` | Adaugă eventId prop + integrare hook + buton funcțional |
| MODIFY | `app/(public)/evenimente/protest/[id]/page.tsx` | Pasează eventId={event.id} la ParticipationCardClient |
| MODIFY | `app/(public)/evenimente/boycott/[id]/page.tsx` | Pasează eventId={event.id} la ParticipationCardClient |
| MODIFY | `app/(public)/evenimente/comunitar/[id]/page.tsx` | Pasează eventId={event.id} la ParticipationCardClient |
| MODIFY | `app/(public)/evenimente/caritabil/[id]/page.tsx` | Pasează eventId={event.id} la ParticipationCardClient |
| MODIFY | `app/(public)/evenimente/petitie/[id]/page.tsx` | Pasează eventId={event.id} la SignatureCardClient |

---

## Context esențial pentru implementare

**Pattern user_id** (din toate serviciile existente):
```ts
const supabase = await createClient()
const { data: { user } } = await supabase.auth.getUser()
if (!user) return { error: 'Neautentificat' }
const { data: userData } = await supabase.from('users').select('id').eq('auth_users_id', user.id).single()
if (!userData) return { error: 'Utilizator negăsit' }
// userData.id = users.id (folosit în event_participants / petition_signatures)
```

**Tabele relevante:**
- `event_participants` — coloane: `id uuid`, `event_id uuid`, `user_id uuid`, `status participant_status ('joined'|'cancelled')`, `joined_at timestamptz`. UNIQUE(event_id, user_id).
- `petition_signatures` — coloane: `id uuid`, `event_id uuid`, `user_id uuid`, `joined_at timestamptz`. UNIQUE(event_id, user_id). Nu are câmp status.

**Trigger existent:** actualizează automat `events.participants_count` la INSERT/UPDATE pe `event_participants` și la INSERT pe `petition_signatures`.

---

## Task 1: `services/participation.service.ts`

**Files:**
- Create: `services/participation.service.ts`

- [ ] **Step 1: Creează fișierul cu toate cele 5 funcții**

```ts
'use server'

import { createClient } from '@/lib/supabase/server'

async function getUserId(): Promise<string | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('users').select('id').eq('auth_users_id', user.id).single()
  return data?.id ?? null
}

export async function getParticipationStatus(eventId: string): Promise<'joined' | 'cancelled' | null> {
  const supabase = await createClient()
  const userId = await getUserId()
  if (!userId) return null

  const { data } = await supabase
    .from('event_participants')
    .select('status')
    .eq('event_id', eventId)
    .eq('user_id', userId)
    .maybeSingle()

  return (data?.status as 'joined' | 'cancelled') ?? null
}

export async function joinEvent(eventId: string): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient()
  const userId = await getUserId()
  if (!userId) return { error: 'Trebuie să fii autentificat pentru a participa' }

  const { error } = await supabase
    .from('event_participants')
    .upsert(
      { event_id: eventId, user_id: userId, status: 'joined' },
      { onConflict: 'event_id,user_id' }
    )

  if (error) return { error: error.message }
  return { ok: true }
}

export async function leaveEvent(eventId: string): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient()
  const userId = await getUserId()
  if (!userId) return { error: 'Trebuie să fii autentificat' }

  const { error } = await supabase
    .from('event_participants')
    .update({ status: 'cancelled' })
    .eq('event_id', eventId)
    .eq('user_id', userId)

  if (error) return { error: error.message }
  return { ok: true }
}

export async function getSignatureStatus(eventId: string): Promise<boolean> {
  const supabase = await createClient()
  const userId = await getUserId()
  if (!userId) return false

  const { data } = await supabase
    .from('petition_signatures')
    .select('id')
    .eq('event_id', eventId)
    .eq('user_id', userId)
    .maybeSingle()

  return !!data
}

export async function signPetition(eventId: string): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient()
  const userId = await getUserId()
  if (!userId) return { error: 'Trebuie să fii autentificat pentru a semna' }

  const { error } = await supabase
    .from('petition_signatures')
    .insert({ event_id: eventId, user_id: userId })

  // 23505 = unique_violation (deja semnat) — tratăm ca succes
  if (error && error.code !== '23505') return { error: error.message }
  return { ok: true }
}
```

- [ ] **Step 2: Verifică TypeScript**

Run: `npx tsc --noEmit`
Expected: 0 erori

- [ ] **Step 3: Commit**

```bash
git add services/participation.service.ts
git commit -m "feat: add participation service (join/leave/sign server actions)"
```

---

## Task 2: `hooks/useEventParticipation.ts`

**Files:**
- Create: `hooks/useEventParticipation.ts`

- [ ] **Step 1: Creează hook-ul**

```ts
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { getParticipationStatus, joinEvent, leaveEvent } from '@/services/participation.service'

export function useEventParticipation(eventId: string) {
  const [isJoined, setIsJoined] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    getParticipationStatus(eventId).then(status => {
      setIsJoined(status === 'joined')
      setIsLoading(false)
    })
  }, [eventId])

  async function join() {
    setIsLoading(true)
    const result = await joinEvent(eventId)
    setIsLoading(false)
    if ('error' in result) { toast.error(result.error); return }
    setIsJoined(true)
    router.refresh()
  }

  async function leave() {
    setIsLoading(true)
    const result = await leaveEvent(eventId)
    setIsLoading(false)
    if ('error' in result) { toast.error(result.error); return }
    setIsJoined(false)
    router.refresh()
  }

  return { isJoined, isLoading, join, leave }
}
```

- [ ] **Step 2: Verifică TypeScript**

Run: `npx tsc --noEmit`
Expected: 0 erori

- [ ] **Step 3: Commit**

```bash
git add hooks/useEventParticipation.ts
git commit -m "feat: add useEventParticipation hook"
```

---

## Task 3: `hooks/usePetitionSign.ts`

**Files:**
- Create: `hooks/usePetitionSign.ts`

- [ ] **Step 1: Creează hook-ul**

```ts
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { getSignatureStatus, signPetition } from '@/services/participation.service'

export function usePetitionSign(eventId: string) {
  const [isSigned, setIsSigned] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    getSignatureStatus(eventId).then(signed => {
      setIsSigned(signed)
      setIsLoading(false)
    })
  }, [eventId])

  async function sign() {
    setIsLoading(true)
    const result = await signPetition(eventId)
    setIsLoading(false)
    if ('error' in result) { toast.error(result.error); return }
    setIsSigned(true)
    router.refresh()
  }

  return { isSigned, isLoading, sign }
}
```

- [ ] **Step 2: Verifică TypeScript**

Run: `npx tsc --noEmit`
Expected: 0 erori

- [ ] **Step 3: Commit**

```bash
git add hooks/usePetitionSign.ts
git commit -m "feat: add usePetitionSign hook"
```

---

## Task 4: Actualizează `ParticipationCardClient`

**Files:**
- Modify: `components/shared/ParticipationCardClient.tsx`

Fișierul curent se află la `components/shared/ParticipationCardClient.tsx` și arată astfel (pentru referință):
- Props: `participantsCount`, `maxParticipants?`, `date?`, `timeStart?`, `timeEnd?`, `status`
- Butonul "Participă" e `disabled` tot timpul

- [ ] **Step 1: Înlocuiește conținutul complet al fișierului**

```tsx
'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Calendar, Clock, Users, Loader2 } from 'lucide-react'
import { useEventParticipation } from '@/hooks/useEventParticipation'

type Props = {
  eventId: string
  participantsCount: number
  maxParticipants?: number
  date?: string
  timeStart?: string
  timeEnd?: string | null
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
  eventId,
  participantsCount,
  maxParticipants,
  date,
  timeStart,
  timeEnd,
  status,
}: Props) {
  const { isJoined, isLoading, join, leave } = useEventParticipation(eventId)
  const pct =
    maxParticipants && maxParticipants > 0
      ? Math.min(100, Math.round((participantsCount / maxParticipants) * 100))
      : 0
  const isCompleted = status === 'completed'
  const isApproved = status === 'approved'
  const isFull = !!maxParticipants && participantsCount >= maxParticipants

  return (
    <Card className="shadow-lg shadow-black/5 border-border">
      <CardContent className="p-6 space-y-4">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          <Users size={14} />
          Participare
        </h3>

        {date && timeStart && (
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
        )}

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Participanți</span>
            <span className="text-3xl font-black italic tracking-tighter text-primary leading-none">
              {participantsCount}{' '}
              {maxParticipants ? (
                <span className="text-sm font-normal text-muted-foreground not-italic">
                  / {maxParticipants}
                </span>
              ) : null}
            </span>
          </div>
          {maxParticipants ? <Progress value={pct} className="h-2 bg-muted" /> : null}
        </div>

        {isCompleted ? (
          <div className="rounded-lg bg-primary/10 border border-primary/20 px-4 py-2.5 text-center text-sm font-semibold text-primary">
            Eveniment finalizat
          </div>
        ) : isApproved ? (
          isJoined ? (
            <Button
              variant="outline"
              className="w-full text-destructive border-destructive/30 hover:bg-destructive/5"
              onClick={leave}
              disabled={isLoading}
            >
              {isLoading ? <Loader2 size={16} className="animate-spin" /> : 'Renunță'}
            </Button>
          ) : (
            <Button
              className="w-full"
              onClick={join}
              disabled={isLoading || isFull}
            >
              {isLoading
                ? <Loader2 size={16} className="animate-spin" />
                : isFull
                ? 'Complet'
                : 'Participă'}
            </Button>
          )
        ) : null}
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 2: Verifică TypeScript**

Run: `npx tsc --noEmit`
Expected: 0 erori (probabil vor apărea erori despre `eventId` lipsă din paginile care folosesc componenta — normal, se rezolvă în Task 6)

- [ ] **Step 3: Commit**

```bash
git add components/shared/ParticipationCardClient.tsx
git commit -m "feat: wire useEventParticipation into ParticipationCardClient"
```

---

## Task 5: Actualizează `SignatureCardClient`

**Files:**
- Modify: `components/shared/SignatureCardClient.tsx`

Fișierul curent se află la `components/shared/SignatureCardClient.tsx`. Props actuale: `signaturesCount`, `targetSignatures`, `status`.

- [ ] **Step 1: Înlocuiește conținutul complet al fișierului**

```tsx
'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { FileSignature, Loader2, CheckCircle2 } from 'lucide-react'
import { usePetitionSign } from '@/hooks/usePetitionSign'

type Props = {
  eventId: string
  signaturesCount: number
  targetSignatures: number
  status: 'pending' | 'approved' | 'rejected' | 'contested' | 'completed'
}

export function SignatureCardClient({ eventId, signaturesCount, targetSignatures, status }: Props) {
  const { isSigned, isLoading, sign } = usePetitionSign(eventId)
  const pct = targetSignatures > 0 ? Math.min(100, Math.round((signaturesCount / targetSignatures) * 100)) : 0
  const isCompleted = status === 'completed'
  const isApproved = status === 'approved'

  return (
    <Card className="shadow-lg shadow-black/5 border-border">
      <CardContent className="p-6 space-y-4">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          <FileSignature size={14} />
          Semnături
        </h3>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progres</span>
            <span className="text-3xl font-black italic tracking-tighter text-primary leading-none">
              {signaturesCount}{' '}
              <span className="text-sm font-normal text-muted-foreground not-italic">
                / {targetSignatures}
              </span>
            </span>
          </div>
          <Progress value={pct} className="h-2 bg-muted" />
        </div>

        {isCompleted ? (
          <div className="rounded-lg bg-primary/10 border border-primary/20 px-4 py-2.5 text-center text-sm font-semibold text-primary">
            Petiție finalizată
          </div>
        ) : isApproved ? (
          isSigned ? (
            <Button variant="outline" className="w-full gap-2" disabled>
              <CheckCircle2 size={16} className="text-primary" />
              Ai semnat
            </Button>
          ) : (
            <Button className="w-full" onClick={sign} disabled={isLoading}>
              {isLoading
                ? <Loader2 size={16} className="animate-spin" />
                : 'Semnează petiția'}
            </Button>
          )
        ) : null}
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 2: Verifică TypeScript**

Run: `npx tsc --noEmit`
Expected: 0 erori (posibil erori despre `eventId` lipsă în petitie/[id]/page.tsx — se rezolvă în Task 6)

- [ ] **Step 3: Commit**

```bash
git add components/shared/SignatureCardClient.tsx
git commit -m "feat: wire usePetitionSign into SignatureCardClient"
```

---

## Task 6: Pasează `eventId` în toate paginile de eveniment

**Files:**
- Modify: `app/(public)/evenimente/protest/[id]/page.tsx` (linia ~85)
- Modify: `app/(public)/evenimente/boycott/[id]/page.tsx` (linia ~71)
- Modify: `app/(public)/evenimente/comunitar/[id]/page.tsx`
- Modify: `app/(public)/evenimente/caritabil/[id]/page.tsx`
- Modify: `app/(public)/evenimente/petitie/[id]/page.tsx` (linia ~70)

- [ ] **Step 1: `protest/[id]/page.tsx` — adaugă `eventId` la ParticipationCardClient**

Găsește blocul (în jurul liniei 85):
```tsx
<ParticipationCardClient
  participantsCount={event.participants_count}
  maxParticipants={protest.max_participants}
  date={protest.date}
  timeStart={protest.time_start}
  timeEnd={protest.time_end}
  status={event.status}
/>
```

Înlocuiește cu:
```tsx
<ParticipationCardClient
  eventId={event.id}
  participantsCount={event.participants_count}
  maxParticipants={protest.max_participants}
  date={protest.date}
  timeStart={protest.time_start}
  timeEnd={protest.time_end}
  status={event.status}
/>
```

- [ ] **Step 2: `boycott/[id]/page.tsx` — adaugă `eventId` la ParticipationCardClient**

Găsește blocul (în jurul liniei 71):
```tsx
<ParticipationCardClient
  participantsCount={event.participants_count}
  status={event.status}
/>
```

Înlocuiește cu:
```tsx
<ParticipationCardClient
  eventId={event.id}
  participantsCount={event.participants_count}
  status={event.status}
/>
```

- [ ] **Step 3: `comunitar/[id]/page.tsx` — adaugă `eventId` la ParticipationCardClient**

Caută `<ParticipationCardClient` în fișier și adaugă `eventId={event.id}` ca primul prop.

- [ ] **Step 4: `caritabil/[id]/page.tsx` — adaugă `eventId` la ParticipationCardClient**

Caută `<ParticipationCardClient` în fișier și adaugă `eventId={event.id}` ca primul prop.

- [ ] **Step 5: `petitie/[id]/page.tsx` — adaugă `eventId` la SignatureCardClient**

Găsește blocul (în jurul liniei 70):
```tsx
<SignatureCardClient
  signaturesCount={event.participants_count}
  targetSignatures={petition.target_signatures}
  status={event.status}
/>
```

Înlocuiește cu:
```tsx
<SignatureCardClient
  eventId={event.id}
  signaturesCount={event.participants_count}
  targetSignatures={petition.target_signatures}
  status={event.status}
/>
```

- [ ] **Step 6: Verifică TypeScript — 0 erori**

Run: `npx tsc --noEmit`
Expected: output gol (0 erori)

- [ ] **Step 7: Commit**

```bash
git add app/(public)/evenimente/protest/[id]/page.tsx
git add "app/(public)/evenimente/boycott/[id]/page.tsx"
git add "app/(public)/evenimente/comunitar/[id]/page.tsx"
git add "app/(public)/evenimente/caritabil/[id]/page.tsx"
git add "app/(public)/evenimente/petitie/[id]/page.tsx"
git commit -m "feat: wire eventId to participation and signature cards on all event pages"
```
