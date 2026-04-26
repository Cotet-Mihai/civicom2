# Etapa 8 — Dashboard Utilizator & Profil Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the authenticated user dashboard with stats overview, 4 activity list sub-routes, and read/edit profile pages with avatar upload.

**Architecture:** All list pages are pure Server Components fetching data via `user.service.ts` Server Actions. A `PanouTabsClient` Client Component handles tab nav with `usePathname`. Profile editing uses two isolated Client Components (`ProfileEditFormClient`, `AvatarUploadClient`) that call Server Actions and trigger `router.refresh()`. The `avatars` Storage bucket is created via a new migration.

**Tech Stack:** Next.js 15 App Router, Supabase PostgreSQL + Storage, Server Actions (`'use server'`), `usePathname` + `useRouter`, Sonner toasts, shadcn/ui (Card, Button, Badge, Input, Label, Progress)

---

### Task 1: avatars bucket migration + `services/user.service.ts`

**Files:**
- Create: `supabase/migrations/0010_avatars_bucket.sql`
- Create: `services/user.service.ts`

**Context:** The existing storage buckets are `banners`, `gallery`, `logos` — none for user avatars. The `participation.service.ts` pattern (private `getUserId()` helper + `'use server'`) is the model to follow. The `appeals` table uses `user_id` (not `creator_id`). The `users` table has `id`, `auth_users_id`, `name`, `avatar_url`, `created_at`, `email`. The `DashboardNavbar` reads the name from `user_metadata.name` (set at signup) — so `updateUserProfile` must also call `supabase.auth.updateUser` to keep the navbar in sync after `router.refresh()`.

- [ ] **Step 1: Create avatars bucket migration**

Create `supabase/migrations/0010_avatars_bucket.sql` with this content:

```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Avatars are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Authenticated users can upload avatars"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'avatars' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update avatars"
ON storage.objects FOR UPDATE
USING (bucket_id = 'avatars' AND auth.uid() IS NOT NULL);
```

- [ ] **Step 2: Apply migration**

Use the `mcp__supabase__apply_migration` tool with the SQL from Step 1.

Expected: `avatars` bucket appears in `storage.buckets`.

- [ ] **Step 3: Create `services/user.service.ts`**

Full contents:

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

export type DashboardEvent = {
  id: string
  title: string
  category: string
  status: string
  participants_count: number
  created_at: string
  banner_url: string | null
}

export type DashboardAppeal = {
  id: string
  event_id: string
  event_title: string
  status: string
  created_at: string
}

export type UserProfile = {
  name: string
  email: string
  avatar_url: string | null
  created_at: string
}

export async function getUserDashboardStats(): Promise<{
  eventsCreated: number
  participations: number
  petitionsSigned: number
  appeals: number
}> {
  const supabase = await createClient()
  const userId = await getUserId()
  if (!userId) return { eventsCreated: 0, participations: 0, petitionsSigned: 0, appeals: 0 }

  const [
    { count: eventsCreated },
    { count: participations },
    { count: petitionsSigned },
    { count: appeals },
  ] = await Promise.all([
    supabase.from('events').select('*', { count: 'exact', head: true }).eq('creator_id', userId),
    supabase.from('event_participants').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'joined'),
    supabase.from('petition_signatures').select('*', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('appeals').select('*', { count: 'exact', head: true }).eq('user_id', userId),
  ])

  return {
    eventsCreated: eventsCreated ?? 0,
    participations: participations ?? 0,
    petitionsSigned: petitionsSigned ?? 0,
    appeals: appeals ?? 0,
  }
}

export async function getUserCreatedEvents(limit?: number): Promise<DashboardEvent[]> {
  const supabase = await createClient()
  const userId = await getUserId()
  if (!userId) return []

  const query = supabase
    .from('events')
    .select('id, title, category, status, participants_count, created_at, banner_url')
    .eq('creator_id', userId)
    .order('created_at', { ascending: false })

  const { data } = limit ? await query.limit(limit) : await query
  return (data ?? []) as DashboardEvent[]
}

export async function getUserParticipations(limit?: number): Promise<DashboardEvent[]> {
  const supabase = await createClient()
  const userId = await getUserId()
  if (!userId) return []

  const query = supabase
    .from('event_participants')
    .select('event:events!event_id(id, title, category, status, participants_count, created_at, banner_url)')
    .eq('user_id', userId)
    .eq('status', 'joined')
    .order('joined_at', { ascending: false })

  const { data } = limit ? await query.limit(limit) : await query
  return ((data ?? []) as any[]).map((row: any) => row.event as DashboardEvent).filter(Boolean)
}

export async function getUserPetitionsSigned(limit?: number): Promise<DashboardEvent[]> {
  const supabase = await createClient()
  const userId = await getUserId()
  if (!userId) return []

  const query = supabase
    .from('petition_signatures')
    .select('event:events!event_id(id, title, category, status, participants_count, created_at, banner_url)')
    .eq('user_id', userId)
    .order('joined_at', { ascending: false })

  const { data } = limit ? await query.limit(limit) : await query
  return ((data ?? []) as any[]).map((row: any) => row.event as DashboardEvent).filter(Boolean)
}

export async function getUserAppeals(): Promise<DashboardAppeal[]> {
  const supabase = await createClient()
  const userId = await getUserId()
  if (!userId) return []

  const { data } = await supabase
    .from('appeals')
    .select('id, event_id, status, created_at, event:events!event_id(title)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  return ((data ?? []) as any[]).map((row: any) => ({
    id: row.id,
    event_id: row.event_id,
    event_title: row.event?.title ?? 'Eveniment necunoscut',
    status: row.status,
    created_at: row.created_at,
  }))
}

export async function getUserProfile(): Promise<UserProfile | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('users')
    .select('name, avatar_url, created_at')
    .eq('auth_users_id', user.id)
    .single()

  if (!data) return null
  return {
    name: data.name,
    email: user.email ?? '',
    avatar_url: data.avatar_url ?? null,
    created_at: data.created_at,
  }
}

export async function updateUserProfile(name: string): Promise<{ ok: true } | { error: string }> {
  if (name.trim().length < 2) return { error: 'Numele trebuie să aibă minim 2 caractere' }

  const supabase = await createClient()
  const userId = await getUserId()
  if (!userId) return { error: 'Neautentificat' }

  const { error } = await supabase
    .from('users')
    .update({ name: name.trim() })
    .eq('id', userId)

  if (error) return { error: error.message }

  // Sync auth metadata so DashboardNavbar reflects the new name after router.refresh()
  await supabase.auth.updateUser({ data: { name: name.trim() } })

  return { ok: true }
}

export async function updateAvatar(avatarUrl: string): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient()
  const userId = await getUserId()
  if (!userId) return { error: 'Neautentificat' }

  const { error } = await supabase
    .from('users')
    .update({ avatar_url: avatarUrl })
    .eq('id', userId)

  if (error) return { error: error.message }
  return { ok: true }
}
```

- [ ] **Step 4: TypeScript check**

Run: `npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/0010_avatars_bucket.sql services/user.service.ts
git commit -m "feat: add user.service.ts + avatars storage bucket migration"
```

---

### Task 2: `StatCardDashboard` + `DashboardEventRow` shared components

**Files:**
- Create: `components/shared/StatCardDashboard.tsx`
- Create: `components/shared/DashboardEventRow.tsx`

**Context:** Both are Server Components. Design system tokens: `text-3xl font-black italic tracking-tighter text-primary` for large numbers, `text-[10px] font-black uppercase tracking-widest text-muted-foreground` for labels. `DashboardEvent` type is imported from `@/services/user.service`. Category-to-URL mapping: `protest→protest`, `boycott→boycott`, `petition→petitie`, `community→comunitar`, `charity→caritabil`.

- [ ] **Step 1: Create `components/shared/StatCardDashboard.tsx`**

```tsx
import { Card, CardContent } from '@/components/ui/card'
import type { LucideIcon } from 'lucide-react'

type Props = {
  label: string
  value: number
  icon: LucideIcon
}

export function StatCardDashboard({ label, value, icon: Icon }: Props) {
  return (
    <Card className="shadow-sm shadow-black/5 border-border">
      <CardContent className="p-5 flex items-center gap-4">
        <div className="size-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
          <Icon size={18} className="text-primary" />
        </div>
        <div>
          <p className="text-3xl font-black italic tracking-tighter text-primary leading-none">{value}</p>
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-1">{label}</p>
        </div>
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 2: Create `components/shared/DashboardEventRow.tsx`**

```tsx
import Link from 'next/link'
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import type { DashboardEvent } from '@/services/user.service'

const CATEGORY_LABEL: Record<string, string> = {
  protest: 'Protest',
  boycott: 'Boycott',
  petition: 'Petiție',
  community: 'Comunitar',
  charity: 'Caritabil',
}

const CATEGORY_PATH: Record<string, string> = {
  protest: 'protest',
  boycott: 'boycott',
  petition: 'petitie',
  community: 'comunitar',
  charity: 'caritabil',
}

const STATUS_LABEL: Record<string, string> = {
  pending: 'În așteptare',
  approved: 'Aprobat',
  rejected: 'Respins',
  contested: 'Contestat',
  completed: 'Finalizat',
}

const STATUS_CLASSES: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  approved: 'bg-primary/10 text-primary border-primary/20',
  rejected: 'bg-destructive/10 text-destructive border-destructive/20',
  contested: 'bg-orange-50 text-orange-700 border-orange-200',
  completed: 'bg-muted text-muted-foreground border-border',
}

type Props = {
  event: DashboardEvent
  showStatus?: boolean
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('ro-RO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function DashboardEventRow({ event, showStatus = true }: Props) {
  const path = CATEGORY_PATH[event.category] ?? event.category
  const href = `/evenimente/${path}/${event.id}`

  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-xl p-3 hover:bg-muted/50 transition-colors group"
    >
      <div className="relative w-16 h-10 rounded-lg overflow-hidden border border-border shrink-0 bg-muted">
        {event.banner_url ? (
          <Image src={event.banner_url} alt={event.title} fill className="object-cover" />
        ) : (
          <div className="w-full h-full bg-primary/10" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
          {event.title}
        </p>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <span className="text-xs text-muted-foreground">{formatDate(event.created_at)}</span>
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
            {CATEGORY_LABEL[event.category] ?? event.category}
          </Badge>
          {showStatus && (
            <span
              className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${STATUS_CLASSES[event.status] ?? ''}`}
            >
              {STATUS_LABEL[event.status] ?? event.status}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
```

- [ ] **Step 3: TypeScript check**

Run: `npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 4: Commit**

```bash
git add components/shared/StatCardDashboard.tsx components/shared/DashboardEventRow.tsx
git commit -m "feat: add StatCardDashboard and DashboardEventRow components"
```

---

### Task 3: `PanouTabsClient` + `/panou/page.tsx` overview

**Files:**
- Create: `app/(private)/panou/_components/PanouTabsClient.tsx`
- Modify: `app/(private)/panou/page.tsx`

**Context:** `PanouTabsClient` needs `'use client'` for `usePathname`. The current `panou/page.tsx` is a placeholder — replace it entirely. Import path for tabs from sub-routes is `'../_components/PanouTabsClient'`. The `cn` utility is at `@/lib/utils`.

- [ ] **Step 1: Create `app/(private)/panou/_components/PanouTabsClient.tsx`**

```tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const tabs = [
  { label: 'Evenimentele mele', href: '/panou/evenimente' },
  { label: 'Participări', href: '/panou/participari' },
  { label: 'Petiții', href: '/panou/petitii' },
  { label: 'Contestații', href: '/panou/contestatii' },
]

export function PanouTabsClient() {
  const pathname = usePathname()
  return (
    <div className="flex gap-1 border-b border-border overflow-x-auto">
      {tabs.map(tab => (
        <Link
          key={tab.href}
          href={tab.href}
          className={cn(
            'px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors',
            pathname === tab.href
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          )}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Replace `app/(private)/panou/page.tsx` with full overview**

Full file contents (replaces the existing placeholder):

```tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import { CalendarPlus, Users, PenLine, Scale, ArrowRight } from 'lucide-react'
import { getUserDashboardStats, getUserCreatedEvents, getUserParticipations } from '@/services/user.service'
import { StatCardDashboard } from '@/components/shared/StatCardDashboard'
import { DashboardEventRow } from '@/components/shared/DashboardEventRow'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = { title: 'Panou' }

export default async function PanouPage() {
  const [stats, recentEvents, recentParticipations] = await Promise.all([
    getUserDashboardStats(),
    getUserCreatedEvents(3),
    getUserParticipations(3),
  ])

  return (
    <div className="mx-auto max-w-7xl px-4 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-foreground">Panou</h1>
        <p className="text-sm text-muted-foreground mt-1">Activitatea ta civică pe CIVICOM✨</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCardDashboard label="Evenimente create" value={stats.eventsCreated} icon={CalendarPlus} />
        <StatCardDashboard label="Participări" value={stats.participations} icon={Users} />
        <StatCardDashboard label="Petiții semnate" value={stats.petitionsSigned} icon={PenLine} />
        <StatCardDashboard label="Contestații" value={stats.appeals} icon={Scale} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-sm shadow-black/5 border-border">
          <CardContent className="p-5 space-y-1">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Evenimentele mele recente
              </h2>
              <Link
                href="/panou/evenimente"
                className="text-xs text-primary font-medium flex items-center gap-1 hover:underline"
              >
                Vezi toate <ArrowRight size={12} />
              </Link>
            </div>
            {recentEvents.length === 0 ? (
              <div className="py-6 text-center space-y-3">
                <p className="text-sm text-muted-foreground">Nu ai creat niciun eveniment încă.</p>
                <Button asChild size="sm">
                  <Link href="/creeaza">Creează primul eveniment</Link>
                </Button>
              </div>
            ) : (
              recentEvents.map(event => (
                <DashboardEventRow key={event.id} event={event} showStatus />
              ))
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm shadow-black/5 border-border">
          <CardContent className="p-5 space-y-1">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Participările mele recente
              </h2>
              <Link
                href="/panou/participari"
                className="text-xs text-primary font-medium flex items-center gap-1 hover:underline"
              >
                Vezi toate <ArrowRight size={12} />
              </Link>
            </div>
            {recentParticipations.length === 0 ? (
              <div className="py-6 text-center space-y-3">
                <p className="text-sm text-muted-foreground">Nu participi la niciun eveniment.</p>
                <Button asChild size="sm" variant="outline">
                  <Link href="/evenimente">Explorează evenimente</Link>
                </Button>
              </div>
            ) : (
              recentParticipations.map(event => (
                <DashboardEventRow key={event.id} event={event} showStatus={false} />
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: TypeScript check**

Run: `npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 4: Commit**

```bash
git add "app/(private)/panou/_components/PanouTabsClient.tsx" "app/(private)/panou/page.tsx"
git commit -m "feat: add PanouTabsClient and panou overview page"
```

---

### Task 4: 4 sub-route list pages

**Files:**
- Create: `app/(private)/panou/evenimente/page.tsx`
- Create: `app/(private)/panou/participari/page.tsx`
- Create: `app/(private)/panou/petitii/page.tsx`
- Create: `app/(private)/panou/contestatii/page.tsx`

**Context:** All four are Server Components. They all import `PanouTabsClient` from `'../_components/PanouTabsClient'`. The `contestatii` page has its own appeal status display (no `DashboardEventRow` — appeals have a different shape: `DashboardAppeal`).

- [ ] **Step 1: Create `app/(private)/panou/evenimente/page.tsx`**

```tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { getUserCreatedEvents } from '@/services/user.service'
import { DashboardEventRow } from '@/components/shared/DashboardEventRow'
import { PanouTabsClient } from '../_components/PanouTabsClient'

export const metadata: Metadata = { title: 'Evenimentele mele' }

export default async function PanouEvenimentePage() {
  const events = await getUserCreatedEvents()

  return (
    <div className="mx-auto max-w-7xl px-4 lg:px-8 py-8 space-y-6">
      <h1 className="text-2xl font-black tracking-tight text-foreground">Panou</h1>
      <PanouTabsClient />
      <div className="space-y-1">
        {events.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <p className="text-muted-foreground">Nu ai creat niciun eveniment încă.</p>
            <Button asChild>
              <Link href="/creeaza">Creează un eveniment</Link>
            </Button>
          </div>
        ) : (
          events.map(event => (
            <DashboardEventRow key={event.id} event={event} showStatus />
          ))
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create `app/(private)/panou/participari/page.tsx`**

```tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { getUserParticipations } from '@/services/user.service'
import { DashboardEventRow } from '@/components/shared/DashboardEventRow'
import { PanouTabsClient } from '../_components/PanouTabsClient'

export const metadata: Metadata = { title: 'Participările mele' }

export default async function PanouParticipariPage() {
  const events = await getUserParticipations()

  return (
    <div className="mx-auto max-w-7xl px-4 lg:px-8 py-8 space-y-6">
      <h1 className="text-2xl font-black tracking-tight text-foreground">Panou</h1>
      <PanouTabsClient />
      <div className="space-y-1">
        {events.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <p className="text-muted-foreground">Nu participi la niciun eveniment.</p>
            <Button asChild variant="outline">
              <Link href="/evenimente">Explorează evenimente</Link>
            </Button>
          </div>
        ) : (
          events.map(event => (
            <DashboardEventRow key={event.id} event={event} showStatus={false} />
          ))
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create `app/(private)/panou/petitii/page.tsx`**

```tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { getUserPetitionsSigned } from '@/services/user.service'
import { DashboardEventRow } from '@/components/shared/DashboardEventRow'
import { PanouTabsClient } from '../_components/PanouTabsClient'

export const metadata: Metadata = { title: 'Petiții semnate' }

export default async function PanouPetitiiPage() {
  const petitions = await getUserPetitionsSigned()

  return (
    <div className="mx-auto max-w-7xl px-4 lg:px-8 py-8 space-y-6">
      <h1 className="text-2xl font-black tracking-tight text-foreground">Panou</h1>
      <PanouTabsClient />
      <div className="space-y-1">
        {petitions.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <p className="text-muted-foreground">Nu ai semnat nicio petiție.</p>
            <Button asChild variant="outline">
              <Link href="/evenimente">Explorează petiții</Link>
            </Button>
          </div>
        ) : (
          petitions.map(event => (
            <DashboardEventRow key={event.id} event={event} showStatus={false} />
          ))
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Create `app/(private)/panou/contestatii/page.tsx`**

```tsx
import type { Metadata } from 'next'
import { getUserAppeals } from '@/services/user.service'
import { PanouTabsClient } from '../_components/PanouTabsClient'

export const metadata: Metadata = { title: 'Contestațiile mele' }

const APPEAL_STATUS_LABEL: Record<string, string> = {
  pending: 'În așteptare',
  under_review: 'În analiză',
  resolved: 'Rezolvată',
}

const APPEAL_STATUS_CLASSES: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  under_review: 'bg-primary/10 text-primary border-primary/20',
  resolved: 'bg-muted text-muted-foreground border-border',
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('ro-RO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export default async function PanouContestatiPage() {
  const appeals = await getUserAppeals()

  return (
    <div className="mx-auto max-w-7xl px-4 lg:px-8 py-8 space-y-6">
      <h1 className="text-2xl font-black tracking-tight text-foreground">Panou</h1>
      <PanouTabsClient />
      <div className="space-y-2">
        {appeals.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-muted-foreground">Nu ai nicio contestație.</p>
          </div>
        ) : (
          appeals.map(appeal => (
            <div
              key={appeal.id}
              className="flex items-center justify-between rounded-xl p-4 border border-border bg-card"
            >
              <div>
                <p className="text-sm font-semibold text-foreground">{appeal.event_title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{formatDate(appeal.created_at)}</p>
              </div>
              <span
                className={`text-[10px] font-semibold px-2 py-1 rounded border ${APPEAL_STATUS_CLASSES[appeal.status] ?? ''}`}
              >
                {APPEAL_STATUS_LABEL[appeal.status] ?? appeal.status}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 5: TypeScript check**

Run: `npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 6: Commit**

```bash
git add "app/(private)/panou/evenimente/page.tsx" "app/(private)/panou/participari/page.tsx" "app/(private)/panou/petitii/page.tsx" "app/(private)/panou/contestatii/page.tsx"
git commit -m "feat: add panou sub-route list pages (evenimente, participari, petitii, contestatii)"
```

---

### Task 5: `/profil/page.tsx`

**Files:**
- Create: `app/(private)/profil/page.tsx`

**Context:** Read-only profile page. Shows avatar (or initials fallback), name, email, join date. `getUserProfile()` returns `{ name, email, avatar_url, created_at }`. Link to `/profil/editare` in the top-right corner.

- [ ] **Step 1: Create `app/(private)/profil/page.tsx`**

```tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { Mail, Calendar, Pencil } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getUserProfile } from '@/services/user.service'
import { notFound } from 'next/navigation'

export const metadata: Metadata = { title: 'Profilul meu' }

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('ro-RO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export default async function ProfilPage() {
  const profile = await getUserProfile()
  if (!profile) notFound()

  const initials = profile.name
    .split(' ')
    .map((w: string) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="mx-auto max-w-2xl px-4 lg:px-8 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black tracking-tight text-foreground">Profilul meu</h1>
        <Button asChild variant="outline" size="sm">
          <Link href="/profil/editare">
            <Pencil size={14} className="mr-1.5" />
            Editează
          </Link>
        </Button>
      </div>

      <Card className="shadow-sm shadow-black/5 border-border">
        <CardContent className="p-6 space-y-6">
          <div className="flex items-center gap-4">
            {profile.avatar_url ? (
              <div className="relative size-20 rounded-full overflow-hidden border-2 border-primary/20 shrink-0">
                <Image src={profile.avatar_url} alt={profile.name} fill className="object-cover" />
              </div>
            ) : (
              <div className="size-20 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center font-black text-xl text-primary shrink-0">
                {initials}
              </div>
            )}
            <div>
              <p className="text-xl font-black text-foreground">{profile.name}</p>
              <p className="text-sm text-muted-foreground">{profile.email}</p>
            </div>
          </div>

          <div className="space-y-3 border-t border-border pt-4">
            <div className="flex items-center gap-3 text-sm">
              <Mail size={16} className="text-primary shrink-0" />
              <span className="text-muted-foreground font-medium">Email:</span>
              <span className="text-foreground">{profile.email}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Calendar size={16} className="text-primary shrink-0" />
              <span className="text-muted-foreground font-medium">Membru din:</span>
              <span className="text-foreground">{formatDate(profile.created_at)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
```

- [ ] **Step 2: TypeScript check**

Run: `npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 3: Commit**

```bash
git add "app/(private)/profil/page.tsx"
git commit -m "feat: add profil read-only page"
```

---

### Task 6: `ProfileEditFormClient` + `AvatarUploadClient`

**Files:**
- Create: `app/(private)/profil/editare/_components/ProfileEditFormClient.tsx`
- Create: `app/(private)/profil/editare/_components/AvatarUploadClient.tsx`

**Context:** Both are `'use client'`. `ProfileEditFormClient` calls `updateUserProfile(name)` Server Action. `AvatarUploadClient` uses `createBrowserClient` from `@supabase/ssr` (same pattern as `lib/upload.ts`) to upload to the `avatars` bucket, then calls `updateAvatar(publicUrl)`. The upload path uses timestamp + random suffix (no userId needed client-side). The avatar `<Image>` must use `unoptimized` because the URL comes from Supabase Storage (external domain not in next.config). The `name` prop is used to render initials as fallback when no avatar exists.

- [ ] **Step 1: Create `ProfileEditFormClient`**

Create `app/(private)/profil/editare/_components/ProfileEditFormClient.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updateUserProfile } from '@/services/user.service'

type Props = {
  initialName: string
}

export function ProfileEditFormClient({ initialName }: Props) {
  const [name, setName] = useState(initialName)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (name.trim().length < 2) {
      toast.error('Numele trebuie să aibă minim 2 caractere')
      return
    }
    setIsLoading(true)
    const result = await updateUserProfile(name.trim())
    setIsLoading(false)
    if ('error' in result) { toast.error(result.error); return }
    toast.success('Profil actualizat')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nume complet</Label>
        <Input
          id="name"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Numele tău"
          minLength={2}
          required
        />
      </div>
      <Button type="submit" disabled={isLoading || name.trim() === initialName.trim()}>
        {isLoading && <Loader2 size={16} className="animate-spin mr-2" />}
        Salvează modificările
      </Button>
    </form>
  )
}
```

- [ ] **Step 2: Create `AvatarUploadClient`**

Create `app/(private)/profil/editare/_components/AvatarUploadClient.tsx`:

```tsx
'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, Camera } from 'lucide-react'
import { createBrowserClient } from '@supabase/ssr'
import { updateAvatar } from '@/services/user.service'

type Props = {
  currentAvatarUrl: string | null
  name: string
}

const MAX_SIZE_BYTES = 2 * 1024 * 1024 // 2MB

export function AvatarUploadClient({ currentAvatarUrl, name }: Props) {
  const [preview, setPreview] = useState<string | null>(currentAvatarUrl)
  const [isLoading, setIsLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const initials = name
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > MAX_SIZE_BYTES) {
      toast.error('Fișierul trebuie să fie mai mic de 2MB')
      return
    }

    const localPreview = URL.createObjectURL(file)
    setPreview(localPreview)
    setIsLoading(true)

    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      const ext = file.name.split('.').pop() ?? 'jpg'
      const path = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data } = supabase.storage.from('avatars').getPublicUrl(path)
      const result = await updateAvatar(data.publicUrl)
      if ('error' in result) throw new Error(result.error)

      toast.success('Avatar actualizat')
      router.refresh()
    } catch (err: any) {
      toast.error(err?.message ?? 'Eroare la upload')
      setPreview(currentAvatarUrl)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={isLoading}
        className="relative size-24 rounded-full overflow-hidden border-2 border-primary/20 bg-primary/10 group cursor-pointer disabled:opacity-50"
      >
        {preview ? (
          <Image src={preview} alt="Avatar" fill className="object-cover" unoptimized />
        ) : (
          <span className="flex items-center justify-center w-full h-full font-black text-2xl text-primary">
            {initials}
          </span>
        )}
        <div className="absolute inset-0 bg-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          {isLoading
            ? <Loader2 size={20} className="text-white animate-spin" />
            : <Camera size={20} className="text-white" />
          }
        </div>
      </button>
      <p className="text-xs text-muted-foreground">Click pe imagine pentru a schimba (max 2MB)</p>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  )
}
```

- [ ] **Step 3: TypeScript check**

Run: `npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 4: Commit**

```bash
git add "app/(private)/profil/editare/_components/ProfileEditFormClient.tsx" "app/(private)/profil/editare/_components/AvatarUploadClient.tsx"
git commit -m "feat: add ProfileEditFormClient and AvatarUploadClient"
```

---

### Task 7: `/profil/editare/page.tsx` + CLAUDE.md update

**Files:**
- Create: `app/(private)/profil/editare/page.tsx`
- Modify: `CLAUDE.md`

**Context:** The editare page is a Server Component that fetches `getUserProfile()` and passes data to the two client components. No extra Supabase call needed — `AvatarUploadClient` no longer needs userId (uses random path). Back link to `/profil`.

- [ ] **Step 1: Create `app/(private)/profil/editare/page.tsx`**

```tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { getUserProfile } from '@/services/user.service'
import { ProfileEditFormClient } from './_components/ProfileEditFormClient'
import { AvatarUploadClient } from './_components/AvatarUploadClient'
import { notFound } from 'next/navigation'

export const metadata: Metadata = { title: 'Editează profilul' }

export default async function ProfilEditarePage() {
  const profile = await getUserProfile()
  if (!profile) notFound()

  return (
    <div className="mx-auto max-w-2xl px-4 lg:px-8 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/profil"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-black tracking-tight text-foreground">Editează profilul</h1>
      </div>

      <Card className="shadow-sm shadow-black/5 border-border">
        <CardContent className="p-6 space-y-8">
          <div className="space-y-3">
            <h2 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              Fotografie profil
            </h2>
            <AvatarUploadClient
              currentAvatarUrl={profile.avatar_url}
              name={profile.name}
            />
          </div>

          <div className="border-t border-border pt-6 space-y-3">
            <h2 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              Informații cont
            </h2>
            <ProfileEditFormClient initialName={profile.name} />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
```

- [ ] **Step 2: Mark Etapa 8 complete in `CLAUDE.md`**

Find this line in `CLAUDE.md`:
```
### ⬜ Etapa 8 — Dashboard Utilizator & Profil (`feat/user-dashboard`)
```

Replace with:
```
### ✅ Etapa 8 — Dashboard Utilizator & Profil (`feat/user-dashboard`)
```

- [ ] **Step 3: Final TypeScript check**

Run: `npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 4: Final commit**

```bash
git add "app/(private)/profil/editare/page.tsx" CLAUDE.md
git commit -m "feat: add profil editare page + mark Etapa 8 complete"
```
