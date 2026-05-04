# Admin Moderation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementează panoul de administrare cu approve/reject pentru evenimente și organizații, cu notificări in-app la fiecare decizie.

**Architecture:** Două servicii noi (`notification.service.ts` și `admin.service.ts`) plus 8 pagini/componente Next.js. Layout-ul `/admin` face guard server-side. Paginile sunt Server Components; doar `AdminActionBarClient`, `AdminOrgActionBarClient` și `AdminTabsClient` sunt client components.

**Tech Stack:** Next.js 15 App Router, Supabase PostgreSQL (`createClient` pentru reads, `adminClient` pentru notifications), Server Actions, Tailwind CSS, shadcn/ui, Lucide icons.

---

### Task 1: Migration + notification.service.ts

**Files:**
- Create: `supabase/migrations/0012_admin_rejection_notes.sql`
- Create: `services/notification.service.ts`

- [ ] **Step 1: Create migration**

Create `supabase/migrations/0012_admin_rejection_notes.sql`:

```sql
ALTER TABLE events ADD COLUMN rejection_note text;
ALTER TABLE organizations ADD COLUMN rejection_note text;
```

- [ ] **Step 2: Create notification.service.ts**

Create `services/notification.service.ts`:

```ts
'use server'

import { createAdminClient } from '@/lib/supabase/admin'

export async function createNotification(
  userId: string,
  title: string,
  message: string,
  type?: string
): Promise<void> {
  const supabase = createAdminClient()
  await supabase.from('notifications').insert({ user_id: userId, title, message, type })
}
```

`createAdminClient` is at `@/lib/supabase/admin` — uses `SUPABASE_SERVICE_ROLE_KEY` to bypass RLS.

- [ ] **Step 3: TypeScript check**

Run: `npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/0012_admin_rejection_notes.sql services/notification.service.ts
git commit -m "feat: add rejection_note migration and notification service"
```

---

### Task 2: admin.service.ts — types + read functions

**Files:**
- Create: `services/admin.service.ts`

**Context:**
- Uses `createClient` from `@/lib/supabase/server` (standard server client; admin user sees all data via RLS `is_admin()`)
- Embedded join syntax: `creator:users!creator_id(name)` → `row.creator.name`
- `events.subcategory` stores: protests → `'gathering'|'march'|'picket'`, community → `'outdoor'|'donation'|'workshop'`, charity → `'concert'|'meet_greet'|'livestream'|'sport'`
- Community level-3 FK column: `community_activity_id` (references `community_activities.id`)
- Charity level-3 FK column: `charity_event_id` (references `charity_events.id`)

- [ ] **Step 1: Create admin.service.ts with types and read functions**

Create `services/admin.service.ts`:

```ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { createNotification } from '@/services/notification.service'

// ============================================================
// TYPES
// ============================================================

export type AdminEvent = {
  id: string
  title: string
  category: string
  subcategory: string | null
  status: string
  rejection_note: string | null
  creator_id: string
  creator_name: string
  created_at: string
  banner_url: string | null
}

export type AdminOrg = {
  id: string
  name: string
  description: string | null
  owner_id: string
  owner_name: string
  status: string
  rejection_note: string | null
  created_at: string
  logo_url: string | null
}

type ProtesteDetail = {
  date: string
  time_start: string
  time_end: string | null
  max_participants: number
  safety_rules: string | null
  recommended_equipment: string | null
  contact_person: string | null
}

type PetitieDetail = {
  target_signatures: number
  what_is_requested: string
  requested_from: string
  why_important: string
  contact_person: string | null
}

type BoycottDetail = {
  reason: string
  method: string
  brands: { name: string; link: string | null }[]
}

type CommunityDetail = {
  subcategory: string
  date: string | null
  time_start: string | null
  time_end: string | null
  what_organizer_offers: string | null
  donation_type: string | null
  target_amount: number | null
  what_is_needed: string[] | null
  contact_person: string | null
}

type CharityDetail = {
  subcategory: string
  date: string | null
  time_start: string | null
  target_amount: number | null
  cause: string | null
  performers: string[] | null
  guests: string[] | null
  stream_link: string | null
}

export type AdminEventDetail =
  | { kind: 'protest'; event: AdminEvent; description: string; gallery_urls: string[]; detail: ProtesteDetail }
  | { kind: 'petition'; event: AdminEvent; description: string; gallery_urls: string[]; detail: PetitieDetail }
  | { kind: 'boycott'; event: AdminEvent; description: string; gallery_urls: string[]; detail: BoycottDetail }
  | { kind: 'community'; event: AdminEvent; description: string; gallery_urls: string[]; detail: CommunityDetail }
  | { kind: 'charity'; event: AdminEvent; description: string; gallery_urls: string[]; detail: CharityDetail }

// ============================================================
// HELPERS
// ============================================================

export async function checkIsAdmin(): Promise<boolean> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  const { data } = await supabase
    .from('users')
    .select('role')
    .eq('auth_users_id', user.id)
    .single()
  return data?.role === 'admin'
}

// ============================================================
// READ FUNCTIONS
// ============================================================

export async function getAdminStats(): Promise<{ pendingEvents: number; pendingOrgs: number }> {
  const supabase = await createClient()
  const [{ count: pendingEvents }, { count: pendingOrgs }] = await Promise.all([
    supabase.from('events').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('organizations').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
  ])
  return { pendingEvents: pendingEvents ?? 0, pendingOrgs: pendingOrgs ?? 0 }
}

export async function getPendingEvents(limit?: number): Promise<AdminEvent[]> {
  const supabase = await createClient()
  const query = supabase
    .from('events')
    .select('id, title, category, subcategory, status, rejection_note, creator_id, banner_url, created_at, creator:users!creator_id(name)')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
  const { data } = limit ? await query.limit(limit) : await query
  return ((data ?? []) as any[]).map((row: any) => ({
    id: row.id,
    title: row.title,
    category: row.category,
    subcategory: row.subcategory ?? null,
    status: row.status,
    rejection_note: row.rejection_note ?? null,
    creator_id: row.creator_id,
    creator_name: row.creator?.name ?? 'Necunoscut',
    created_at: row.created_at,
    banner_url: row.banner_url ?? null,
  }))
}

export async function getPendingOrgs(): Promise<AdminOrg[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('organizations')
    .select('id, name, description, owner_id, status, rejection_note, logo_url, created_at, owner:users!owner_id(name)')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
  return ((data ?? []) as any[]).map((row: any) => ({
    id: row.id,
    name: row.name,
    description: row.description ?? null,
    owner_id: row.owner_id,
    owner_name: row.owner?.name ?? 'Necunoscut',
    status: row.status,
    rejection_note: row.rejection_note ?? null,
    created_at: row.created_at,
    logo_url: row.logo_url ?? null,
  }))
}

export async function getAdminEventDetail(id: string): Promise<AdminEventDetail | null> {
  const supabase = await createClient()

  const { data: evt } = await supabase
    .from('events')
    .select('id, title, description, category, subcategory, status, rejection_note, creator_id, banner_url, gallery_urls, created_at, creator:users!creator_id(name)')
    .eq('id', id)
    .single()

  if (!evt) return null

  const event: AdminEvent = {
    id: (evt as any).id,
    title: (evt as any).title,
    category: (evt as any).category,
    subcategory: (evt as any).subcategory ?? null,
    status: (evt as any).status,
    rejection_note: (evt as any).rejection_note ?? null,
    creator_id: (evt as any).creator_id,
    creator_name: ((evt as any).creator as any)?.name ?? 'Necunoscut',
    created_at: (evt as any).created_at,
    banner_url: (evt as any).banner_url ?? null,
  }
  const description: string = (evt as any).description ?? ''
  const gallery_urls: string[] = (evt as any).gallery_urls ?? []
  const category: string = (evt as any).category
  const subcategory: string = (evt as any).subcategory ?? ''

  if (category === 'protest') {
    const { data: p } = await supabase
      .from('protests')
      .select('date, time_start, time_end, max_participants, safety_rules, recommended_equipment, contact_person')
      .eq('event_id', id)
      .single()
    if (!p) return null
    return {
      kind: 'protest', event, description, gallery_urls,
      detail: {
        date: (p as any).date,
        time_start: (p as any).time_start,
        time_end: (p as any).time_end ?? null,
        max_participants: (p as any).max_participants,
        safety_rules: (p as any).safety_rules ?? null,
        recommended_equipment: (p as any).recommended_equipment ?? null,
        contact_person: (p as any).contact_person ?? null,
      },
    }
  }

  if (category === 'petition') {
    const { data: p } = await supabase
      .from('petitions')
      .select('what_is_requested, requested_from, target_signatures, why_important, contact_person')
      .eq('event_id', id)
      .single()
    if (!p) return null
    return {
      kind: 'petition', event, description, gallery_urls,
      detail: {
        target_signatures: (p as any).target_signatures,
        what_is_requested: (p as any).what_is_requested,
        requested_from: (p as any).requested_from,
        why_important: (p as any).why_important,
        contact_person: (p as any).contact_person ?? null,
      },
    }
  }

  if (category === 'boycott') {
    const { data: b } = await supabase
      .from('boycotts')
      .select('reason, method, boycott_brands(name, link)')
      .eq('event_id', id)
      .single()
    if (!b) return null
    return {
      kind: 'boycott', event, description, gallery_urls,
      detail: {
        reason: (b as any).reason,
        method: (b as any).method,
        brands: ((b as any).boycott_brands ?? []).map((br: any) => ({ name: br.name, link: br.link ?? null })),
      },
    }
  }

  if (category === 'community') {
    const { data: ca } = await supabase
      .from('community_activities')
      .select('id, contact_person')
      .eq('event_id', id)
      .single()
    if (!ca) return null

    const detail: CommunityDetail = {
      subcategory,
      date: null, time_start: null, time_end: null,
      what_organizer_offers: null,
      donation_type: null, target_amount: null, what_is_needed: null,
      contact_person: (ca as any).contact_person ?? null,
    }

    if (subcategory === 'outdoor') {
      const { data: oa } = await supabase
        .from('outdoor_activities')
        .select('date, time_start, time_end, what_organizer_offers')
        .eq('community_activity_id', (ca as any).id)
        .single()
      if (oa) {
        detail.date = (oa as any).date
        detail.time_start = (oa as any).time_start
        detail.time_end = (oa as any).time_end ?? null
        detail.what_organizer_offers = (oa as any).what_organizer_offers ?? null
      }
    } else if (subcategory === 'donation') {
      const { data: don } = await supabase
        .from('donations')
        .select('donation_type, target_amount, what_is_needed')
        .eq('community_activity_id', (ca as any).id)
        .single()
      if (don) {
        detail.donation_type = (don as any).donation_type
        detail.target_amount = (don as any).target_amount ?? null
        detail.what_is_needed = (don as any).what_is_needed ?? null
      }
    } else if (subcategory === 'workshop') {
      const { data: ws } = await supabase
        .from('workshops')
        .select('date, time_start, time_end, what_organizer_offers')
        .eq('community_activity_id', (ca as any).id)
        .single()
      if (ws) {
        detail.date = (ws as any).date
        detail.time_start = (ws as any).time_start
        detail.time_end = (ws as any).time_end ?? null
        detail.what_organizer_offers = (ws as any).what_organizer_offers ?? null
      }
    }

    return { kind: 'community', event, description, gallery_urls, detail }
  }

  if (category === 'charity') {
    const { data: ce } = await supabase
      .from('charity_events')
      .select('id, target_amount')
      .eq('event_id', id)
      .single()
    if (!ce) return null

    const detail: CharityDetail = {
      subcategory,
      date: null, time_start: null,
      target_amount: (ce as any).target_amount ?? null,
      cause: null, performers: null, guests: null, stream_link: null,
    }

    if (subcategory === 'concert') {
      const { data: cc } = await supabase
        .from('charity_concerts')
        .select('date, time_start, performers')
        .eq('charity_event_id', (ce as any).id)
        .single()
      if (cc) { detail.date = (cc as any).date; detail.time_start = (cc as any).time_start; detail.performers = (cc as any).performers }
    } else if (subcategory === 'meet_greet') {
      const { data: mg } = await supabase
        .from('meet_greets')
        .select('date, time_start, guests')
        .eq('charity_event_id', (ce as any).id)
        .single()
      if (mg) { detail.date = (mg as any).date; detail.time_start = (mg as any).time_start; detail.guests = (mg as any).guests }
    } else if (subcategory === 'livestream') {
      const { data: ls } = await supabase
        .from('charity_livestreams')
        .select('cause, time_start, stream_link')
        .eq('charity_event_id', (ce as any).id)
        .single()
      if (ls) { detail.cause = (ls as any).cause; detail.time_start = (ls as any).time_start; detail.stream_link = (ls as any).stream_link }
    } else if (subcategory === 'sport') {
      const { data: sa } = await supabase
        .from('sports_activities')
        .select('date, time_start, guests')
        .eq('charity_event_id', (ce as any).id)
        .single()
      if (sa) { detail.date = (sa as any).date; detail.time_start = (sa as any).time_start; detail.guests = (sa as any).guests ?? null }
    }

    return { kind: 'charity', event, description, gallery_urls, detail }
  }

  return null
}
```

- [ ] **Step 2: TypeScript check**

Run: `npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 3: Commit**

```bash
git add services/admin.service.ts
git commit -m "feat: add admin service types and read functions"
```

---

### Task 3: admin.service.ts — mutation functions

**Files:**
- Modify: `services/admin.service.ts` (append to end of file)

**Context:** Append these 4 exported functions after the last function in `services/admin.service.ts`. They call `createNotification` (already imported at the top of the file from Task 2).

- [ ] **Step 1: Append mutation functions to services/admin.service.ts**

Append to the end of `services/admin.service.ts`:

```ts
// ============================================================
// MUTATION FUNCTIONS
// ============================================================

export async function approveEvent(eventId: string): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient()
  const isAdmin = await checkIsAdmin()
  if (!isAdmin) return { error: 'Acces interzis' }

  const { data: evt } = await supabase
    .from('events')
    .select('id, title, creator_id')
    .eq('id', eventId)
    .single()
  if (!evt) return { error: 'Eveniment negăsit' }

  const { error } = await supabase
    .from('events')
    .update({ status: 'approved', rejection_note: null })
    .eq('id', eventId)
  if (error) return { error: error.message }

  await createNotification(
    (evt as any).creator_id,
    'Eveniment aprobat ✅',
    `Evenimentul tău "${(evt as any).title}" a fost aprobat și este acum vizibil public.`,
    'event_approved'
  )
  return { ok: true }
}

export async function rejectEvent(eventId: string, note: string): Promise<{ ok: true } | { error: string }> {
  if (note.trim().length < 10) return { error: 'Motivul trebuie să aibă minim 10 caractere' }

  const supabase = await createClient()
  const isAdmin = await checkIsAdmin()
  if (!isAdmin) return { error: 'Acces interzis' }

  const { data: evt } = await supabase
    .from('events')
    .select('id, title, creator_id')
    .eq('id', eventId)
    .single()
  if (!evt) return { error: 'Eveniment negăsit' }

  const { error } = await supabase
    .from('events')
    .update({ status: 'rejected', rejection_note: note.trim() })
    .eq('id', eventId)
  if (error) return { error: error.message }

  await createNotification(
    (evt as any).creator_id,
    'Eveniment respins ❌',
    `Evenimentul tău "${(evt as any).title}" a fost respins. Motiv: ${note.trim()}`,
    'event_rejected'
  )
  return { ok: true }
}

export async function approveOrg(orgId: string): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient()
  const isAdmin = await checkIsAdmin()
  if (!isAdmin) return { error: 'Acces interzis' }

  const { data: org } = await supabase
    .from('organizations')
    .select('id, name, owner_id')
    .eq('id', orgId)
    .single()
  if (!org) return { error: 'Organizație negăsită' }

  const { error } = await supabase
    .from('organizations')
    .update({ status: 'approved', rejection_note: null })
    .eq('id', orgId)
  if (error) return { error: error.message }

  await createNotification(
    (org as any).owner_id,
    'Organizație aprobată ✅',
    `Organizația "${(org as any).name}" a fost aprobată și este acum vizibilă public.`,
    'org_approved'
  )
  return { ok: true }
}

export async function rejectOrg(orgId: string, note: string): Promise<{ ok: true } | { error: string }> {
  if (note.trim().length < 10) return { error: 'Motivul trebuie să aibă minim 10 caractere' }

  const supabase = await createClient()
  const isAdmin = await checkIsAdmin()
  if (!isAdmin) return { error: 'Acces interzis' }

  const { data: org } = await supabase
    .from('organizations')
    .select('id, name, owner_id')
    .eq('id', orgId)
    .single()
  if (!org) return { error: 'Organizație negăsită' }

  const { error } = await supabase
    .from('organizations')
    .update({ status: 'rejected', rejection_note: note.trim() })
    .eq('id', orgId)
  if (error) return { error: error.message }

  await createNotification(
    (org as any).owner_id,
    'Organizație respinsă ❌',
    `Organizația "${(org as any).name}" a fost respinsă. Motiv: ${note.trim()}`,
    'org_rejected'
  )
  return { ok: true }
}
```

- [ ] **Step 2: TypeScript check**

Run: `npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 3: Commit**

```bash
git add services/admin.service.ts
git commit -m "feat: add admin service mutation functions (approve/reject events + orgs)"
```

---

### Task 4: Admin layout + AdminTabsClient + overview page

**Files:**
- Create: `app/(private)/admin/layout.tsx`
- Create: `app/(private)/admin/_components/AdminTabsClient.tsx`
- Create: `app/(private)/admin/page.tsx`

**Context:**
- `StatCardDashboard` at `@/components/shared/StatCardDashboard` — props: `label: string`, `value: number`, `icon: LucideIcon`
- `buttonVariants` at `@/components/ui/button` — `Button` does NOT support `asChild`, use `<Link className={buttonVariants(...)}>` for link buttons
- `cn` at `@/lib/utils`
- `params` is NOT used in this task (no dynamic segments)

- [ ] **Step 1: Create admin layout**

Create `app/(private)/admin/layout.tsx`:

```tsx
import { checkIsAdmin } from '@/services/admin.service'
import { redirect } from 'next/navigation'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const isAdmin = await checkIsAdmin()
  if (!isAdmin) redirect('/panou')
  return <>{children}</>
}
```

- [ ] **Step 2: Create AdminTabsClient**

Create `app/(private)/admin/_components/AdminTabsClient.tsx`:

```tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const tabs = [
  { label: 'Evenimente', href: '/admin/evenimente' },
  { label: 'Organizații', href: '/admin/organizatii' },
]

export function AdminTabsClient() {
  const pathname = usePathname()
  return (
    <div className="flex gap-1 border-b border-border overflow-x-auto">
      {tabs.map(tab => (
        <Link
          key={tab.href}
          href={tab.href}
          className={cn(
            'px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors',
            pathname.startsWith(tab.href)
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

Note: `pathname.startsWith(tab.href)` so `/admin/evenimente/[id]` also highlights the „Evenimente" tab.

- [ ] **Step 3: Create admin overview page**

Create `app/(private)/admin/page.tsx`:

```tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import { Clock, Building2 } from 'lucide-react'
import { StatCardDashboard } from '@/components/shared/StatCardDashboard'
import { getAdminStats, getPendingEvents } from '@/services/admin.service'
import { AdminTabsClient } from './_components/AdminTabsClient'
import { buttonVariants } from '@/components/ui/button'

export const metadata: Metadata = { title: 'Admin — Moderare' }

const CATEGORY_LABEL: Record<string, string> = {
  protest: 'Protest',
  boycott: 'Boycott',
  petition: 'Petiție',
  community: 'Comunitar',
  charity: 'Caritabil',
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('ro-RO', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default async function AdminPage() {
  const [stats, events] = await Promise.all([getAdminStats(), getPendingEvents(10)])

  return (
    <div className="mx-auto max-w-7xl px-4 lg:px-8 py-8 space-y-6">
      <h1 className="text-2xl font-black tracking-tight text-foreground">Admin</h1>
      <AdminTabsClient />

      <div className="grid grid-cols-2 gap-4">
        <StatCardDashboard label="Evenimente în așteptare" value={stats.pendingEvents} icon={Clock} />
        <StatCardDashboard label="Organizații în așteptare" value={stats.pendingOrgs} icon={Building2} />
      </div>

      <div className="space-y-3">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
          Evenimente recente în așteptare
        </h3>
        {events.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Nicio cerere în așteptare.</p>
        ) : (
          <div className="border border-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-4 py-2.5 text-xs font-bold text-muted-foreground">Titlu</th>
                  <th className="text-left px-4 py-2.5 text-xs font-bold text-muted-foreground hidden sm:table-cell">Categorie</th>
                  <th className="text-left px-4 py-2.5 text-xs font-bold text-muted-foreground hidden md:table-cell">Creator</th>
                  <th className="text-left px-4 py-2.5 text-xs font-bold text-muted-foreground hidden lg:table-cell">Dată</th>
                  <th className="px-4 py-2.5"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {events.map(ev => (
                  <tr key={ev.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground truncate max-w-[200px]">{ev.title}</td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                        {CATEGORY_LABEL[ev.category] ?? ev.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{ev.creator_name}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">{formatDate(ev.created_at)}</td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/evenimente/${ev.id}`}
                        className={buttonVariants({ variant: 'outline', size: 'sm' })}
                      >
                        Revizuiește →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: TypeScript check**

Run: `npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 5: Commit**

```bash
git add "app/(private)/admin/layout.tsx" "app/(private)/admin/_components/AdminTabsClient.tsx" "app/(private)/admin/page.tsx"
git commit -m "feat: add admin layout, tabs nav, and overview page"
```

---

### Task 5: AdminActionBarClient + events list + event detail page

**Files:**
- Create: `app/(private)/admin/evenimente/[id]/_components/AdminActionBarClient.tsx`
- Create: `app/(private)/admin/evenimente/page.tsx`
- Create: `app/(private)/admin/evenimente/[id]/page.tsx`

**Context:**
- `params` in Next.js 15 is `Promise<{ id: string }>` — always use `const { id } = await params`
- `Image` from `next/image` needs `unoptimized` for Supabase Storage URLs (external domain not in next.config)
- `Textarea` from `@/components/ui/textarea`
- `AdminEventDetail` type is imported from `@/services/admin.service`
- No map component in admin review — location fields shown as text only

- [ ] **Step 1: Create AdminActionBarClient**

Create `app/(private)/admin/evenimente/[id]/_components/AdminActionBarClient.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { approveEvent, rejectEvent } from '@/services/admin.service'

type Props = {
  eventId: string
  currentStatus: string
  rejectionNote: string | null
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

export function AdminActionBarClient({ eventId, currentStatus, rejectionNote }: Props) {
  const [isRejecting, setIsRejecting] = useState(false)
  const [note, setNote] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  async function handleApprove() {
    setIsLoading(true)
    const result = await approveEvent(eventId)
    setIsLoading(false)
    if ('error' in result) { toast.error(result.error); return }
    toast.success('Eveniment aprobat')
    router.refresh()
  }

  async function handleReject() {
    if (note.trim().length < 10) {
      toast.error('Motivul trebuie să aibă minim 10 caractere')
      return
    }
    setIsLoading(true)
    const result = await rejectEvent(eventId, note)
    setIsLoading(false)
    if ('error' in result) { toast.error(result.error); return }
    toast.success('Eveniment respins')
    setIsRejecting(false)
    router.refresh()
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3 shadow-sm">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Status:</span>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${STATUS_CLASSES[currentStatus] ?? ''}`}>
            {STATUS_LABEL[currentStatus] ?? currentStatus}
          </span>
        </div>

        {currentStatus === 'pending' && !isRejecting && (
          <div className="flex items-center gap-2">
            <Button onClick={handleApprove} disabled={isLoading} size="sm">
              {isLoading
                ? <Loader2 size={14} className="animate-spin" />
                : <><CheckCircle size={14} className="mr-1.5" />Aprobă</>
              }
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsRejecting(true)}
              disabled={isLoading}
              className="text-destructive border-destructive/30 hover:bg-destructive/5"
            >
              <XCircle size={14} className="mr-1.5" />
              Respinge
            </Button>
          </div>
        )}
      </div>

      {currentStatus === 'pending' && isRejecting && (
        <div className="space-y-2">
          <Textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Motivul respingerii (minim 10 caractere)..."
            rows={3}
            className="text-sm"
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="destructive"
              onClick={handleReject}
              disabled={isLoading || note.trim().length < 10}
            >
              {isLoading ? <Loader2 size={14} className="animate-spin" /> : 'Confirmă respingerea'}
            </Button>
            <Button size="sm" variant="outline" onClick={() => { setIsRejecting(false); setNote('') }}>
              Anulează
            </Button>
          </div>
        </div>
      )}

      {currentStatus !== 'pending' && rejectionNote && (
        <div className="text-sm text-muted-foreground">
          <span className="font-medium">Motiv respingere:</span> {rejectionNote}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Create events list page**

Create `app/(private)/admin/evenimente/page.tsx`:

```tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import { getPendingEvents } from '@/services/admin.service'
import { AdminTabsClient } from '../_components/AdminTabsClient'
import { buttonVariants } from '@/components/ui/button'

export const metadata: Metadata = { title: 'Admin — Evenimente în așteptare' }

const CATEGORY_LABEL: Record<string, string> = {
  protest: 'Protest',
  boycott: 'Boycott',
  petition: 'Petiție',
  community: 'Comunitar',
  charity: 'Caritabil',
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('ro-RO', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default async function AdminEvenimentePage() {
  const events = await getPendingEvents()

  return (
    <div className="mx-auto max-w-7xl px-4 lg:px-8 py-8 space-y-6">
      <h1 className="text-2xl font-black tracking-tight text-foreground">Admin</h1>
      <AdminTabsClient />

      <div className="space-y-2">
        {events.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">Nicio cerere de eveniment în așteptare.</p>
        ) : (
          events.map(ev => (
            <div key={ev.id} className="flex items-center justify-between rounded-xl border border-border bg-card p-4 gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{ev.title}</p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                    {CATEGORY_LABEL[ev.category] ?? ev.category}
                  </span>
                  <span className="text-xs text-muted-foreground">{ev.creator_name}</span>
                  <span className="text-xs text-muted-foreground">{formatDate(ev.created_at)}</span>
                </div>
              </div>
              <Link
                href={`/admin/evenimente/${ev.id}`}
                className={buttonVariants({ variant: 'outline', size: 'sm' })}
              >
                Revizuiește →
              </Link>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create event detail page**

Create `app/(private)/admin/evenimente/[id]/page.tsx`:

```tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { getAdminEventDetail } from '@/services/admin.service'
import type { AdminEventDetail } from '@/services/admin.service'
import { AdminActionBarClient } from './_components/AdminActionBarClient'

export const metadata: Metadata = { title: 'Admin — Revizuire eveniment' }

type Props = { params: Promise<{ id: string }> }

// ---- inline field renderers ----

function Field({ label, value }: { label: string; value: string | number | null | undefined }) {
  if (value === null || value === undefined || value === '') return null
  return (
    <div className="text-sm">
      <span className="font-medium text-muted-foreground">{label}: </span>
      <span className="text-foreground">{value}</span>
    </div>
  )
}

function FieldList({ label, items }: { label: string; items: string[] | null | undefined }) {
  if (!items?.length) return null
  return (
    <div className="text-sm">
      <span className="font-medium text-muted-foreground">{label}: </span>
      <span className="text-foreground">{items.join(', ')}</span>
    </div>
  )
}

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border p-4 space-y-2">
      <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{title}</h3>
      {children}
    </div>
  )
}

function EventFields({ d }: { d: AdminEventDetail }) {
  if (d.kind === 'protest') {
    return (
      <DetailSection title="Detalii protest">
        <Field label="Dată" value={d.detail.date} />
        <Field label="Ora start" value={d.detail.time_start} />
        <Field label="Ora sfârșit" value={d.detail.time_end} />
        <Field label="Participanți max" value={d.detail.max_participants} />
        <Field label="Reguli siguranță" value={d.detail.safety_rules} />
        <Field label="Echipament recomandat" value={d.detail.recommended_equipment} />
        <Field label="Contact" value={d.detail.contact_person} />
      </DetailSection>
    )
  }
  if (d.kind === 'petition') {
    return (
      <DetailSection title="Detalii petiție">
        <Field label="Target semnături" value={d.detail.target_signatures} />
        <Field label="Ce se solicită" value={d.detail.what_is_requested} />
        <Field label="De la" value={d.detail.requested_from} />
        <Field label="De ce e important" value={d.detail.why_important} />
        <Field label="Contact" value={d.detail.contact_person} />
      </DetailSection>
    )
  }
  if (d.kind === 'boycott') {
    return (
      <DetailSection title="Detalii boycott">
        <Field label="Motiv" value={d.detail.reason} />
        <Field label="Metodă" value={d.detail.method} />
        {d.detail.brands.length > 0 && (
          <div className="text-sm">
            <span className="font-medium text-muted-foreground">Branduri: </span>
            <span className="text-foreground">{d.detail.brands.map(b => b.name).join(', ')}</span>
          </div>
        )}
      </DetailSection>
    )
  }
  if (d.kind === 'community') {
    return (
      <DetailSection title="Detalii activitate comunitară">
        <Field label="Tip" value={d.detail.subcategory} />
        <Field label="Dată" value={d.detail.date} />
        <Field label="Ora start" value={d.detail.time_start} />
        <Field label="Ora sfârșit" value={d.detail.time_end} />
        <Field label="Ce oferă organizatorul" value={d.detail.what_organizer_offers} />
        <Field label="Tip donație" value={d.detail.donation_type} />
        <Field label="Target donație" value={d.detail.target_amount} />
        <FieldList label="Ce este necesar" items={d.detail.what_is_needed} />
        <Field label="Contact" value={d.detail.contact_person} />
      </DetailSection>
    )
  }
  if (d.kind === 'charity') {
    return (
      <DetailSection title="Detalii eveniment caritabil">
        <Field label="Tip" value={d.detail.subcategory} />
        <Field label="Dată" value={d.detail.date} />
        <Field label="Ora start" value={d.detail.time_start} />
        <Field label="Target donații" value={d.detail.target_amount} />
        <Field label="Cauză" value={d.detail.cause} />
        <FieldList label="Artiști" items={d.detail.performers} />
        <FieldList label="Invitați" items={d.detail.guests} />
        <Field label="Link stream" value={d.detail.stream_link} />
      </DetailSection>
    )
  }
  return null
}

// ---- page ----

export default async function AdminEventDetailPage({ params }: Props) {
  const { id } = await params
  const detail = await getAdminEventDetail(id)
  if (!detail) notFound()

  const { event, description, gallery_urls } = detail

  return (
    <div className="mx-auto max-w-4xl px-4 lg:px-8 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/evenimente" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-xl font-black tracking-tight text-foreground truncate">{event.title}</h1>
      </div>

      <AdminActionBarClient
        eventId={event.id}
        currentStatus={event.status}
        rejectionNote={event.rejection_note}
      />

      {event.banner_url && (
        <div className="relative w-full aspect-[21/9] rounded-2xl overflow-hidden border border-border">
          <Image src={event.banner_url} alt={event.title} fill className="object-cover" unoptimized />
        </div>
      )}

      <div className="space-y-2">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Descriere</h3>
        <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{description}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm rounded-xl border border-border p-4">
        <div>
          <span className="font-medium text-muted-foreground">Creator: </span>
          <span className="text-foreground">{event.creator_name}</span>
        </div>
        <div>
          <span className="font-medium text-muted-foreground">Categorie: </span>
          <span className="text-foreground">{event.category}</span>
        </div>
        {event.subcategory && (
          <div>
            <span className="font-medium text-muted-foreground">Subtip: </span>
            <span className="text-foreground">{event.subcategory}</span>
          </div>
        )}
      </div>

      <EventFields d={detail} />

      {gallery_urls.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Galerie</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {gallery_urls.map((url, i) => (
              <div key={i} className="relative aspect-video rounded-xl overflow-hidden border border-border">
                <Image src={url} alt={`Galerie ${i + 1}`} fill className="object-cover" unoptimized />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: TypeScript check**

Run: `npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 5: Commit**

```bash
git add "app/(private)/admin/evenimente/[id]/_components/AdminActionBarClient.tsx" "app/(private)/admin/evenimente/page.tsx" "app/(private)/admin/evenimente/[id]/page.tsx"
git commit -m "feat: add admin events list, detail page, and AdminActionBarClient"
```

---

### Task 6: AdminOrgActionBarClient + orgs list page + CLAUDE.md

**Files:**
- Create: `app/(private)/admin/organizatii/_components/AdminOrgActionBarClient.tsx`
- Create: `app/(private)/admin/organizatii/page.tsx`
- Modify: `CLAUDE.md`

**Context:** `AdminOrgActionBarClient` is rendered inside each org card in the list page — no dedicated detail page for orgs. Logo uses `unoptimized` Image.

- [ ] **Step 1: Create AdminOrgActionBarClient**

Create `app/(private)/admin/organizatii/_components/AdminOrgActionBarClient.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { approveOrg, rejectOrg } from '@/services/admin.service'

type Props = {
  orgId: string
  currentStatus: string
  rejectionNote: string | null
}

const STATUS_LABEL: Record<string, string> = {
  pending: 'În așteptare',
  approved: 'Aprobată',
  rejected: 'Respinsă',
}

const STATUS_CLASSES: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  approved: 'bg-primary/10 text-primary border-primary/20',
  rejected: 'bg-destructive/10 text-destructive border-destructive/20',
}

export function AdminOrgActionBarClient({ orgId, currentStatus, rejectionNote }: Props) {
  const [isRejecting, setIsRejecting] = useState(false)
  const [note, setNote] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  async function handleApprove() {
    setIsLoading(true)
    const result = await approveOrg(orgId)
    setIsLoading(false)
    if ('error' in result) { toast.error(result.error); return }
    toast.success('Organizație aprobată')
    router.refresh()
  }

  async function handleReject() {
    if (note.trim().length < 10) {
      toast.error('Motivul trebuie să aibă minim 10 caractere')
      return
    }
    setIsLoading(true)
    const result = await rejectOrg(orgId, note)
    setIsLoading(false)
    if ('error' in result) { toast.error(result.error); return }
    toast.success('Organizație respinsă')
    setIsRejecting(false)
    router.refresh()
  }

  return (
    <div className="space-y-2 mt-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${STATUS_CLASSES[currentStatus] ?? ''}`}>
          {STATUS_LABEL[currentStatus] ?? currentStatus}
        </span>

        {currentStatus === 'pending' && !isRejecting && (
          <div className="flex items-center gap-2">
            <Button onClick={handleApprove} disabled={isLoading} size="sm">
              {isLoading
                ? <Loader2 size={14} className="animate-spin" />
                : <><CheckCircle size={14} className="mr-1.5" />Aprobă</>
              }
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsRejecting(true)}
              disabled={isLoading}
              className="text-destructive border-destructive/30 hover:bg-destructive/5"
            >
              <XCircle size={14} className="mr-1.5" />
              Respinge
            </Button>
          </div>
        )}
      </div>

      {currentStatus === 'pending' && isRejecting && (
        <div className="space-y-2">
          <Textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Motivul respingerii (minim 10 caractere)..."
            rows={2}
            className="text-sm"
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="destructive"
              onClick={handleReject}
              disabled={isLoading || note.trim().length < 10}
            >
              {isLoading ? <Loader2 size={14} className="animate-spin" /> : 'Confirmă respingerea'}
            </Button>
            <Button size="sm" variant="outline" onClick={() => { setIsRejecting(false); setNote('') }}>
              Anulează
            </Button>
          </div>
        </div>
      )}

      {currentStatus !== 'pending' && rejectionNote && (
        <p className="text-xs text-muted-foreground">
          <span className="font-medium">Motiv respingere:</span> {rejectionNote}
        </p>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Create orgs list page**

Create `app/(private)/admin/organizatii/page.tsx`:

```tsx
import type { Metadata } from 'next'
import Image from 'next/image'
import { Building2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { getPendingOrgs } from '@/services/admin.service'
import { AdminTabsClient } from '../_components/AdminTabsClient'
import { AdminOrgActionBarClient } from './_components/AdminOrgActionBarClient'

export const metadata: Metadata = { title: 'Admin — Organizații în așteptare' }

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('ro-RO', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default async function AdminOrganizatiiPage() {
  const orgs = await getPendingOrgs()

  return (
    <div className="mx-auto max-w-7xl px-4 lg:px-8 py-8 space-y-6">
      <h1 className="text-2xl font-black tracking-tight text-foreground">Admin</h1>
      <AdminTabsClient />

      <div className="space-y-4">
        {orgs.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">Nicio organizație în așteptare.</p>
        ) : (
          orgs.map(org => (
            <Card key={org.id} className="shadow-sm shadow-black/5 border-border">
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  {org.logo_url ? (
                    <div className="relative size-12 rounded-lg overflow-hidden border border-border shrink-0">
                      <Image src={org.logo_url} alt={org.name} fill className="object-cover" unoptimized />
                    </div>
                  ) : (
                    <div className="size-12 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                      <Building2 size={20} className="text-primary" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-foreground text-base">{org.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Owner: {org.owner_name} · {formatDate(org.created_at)}
                    </p>
                    {org.description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{org.description}</p>
                    )}
                    <AdminOrgActionBarClient
                      orgId={org.id}
                      currentStatus={org.status}
                      rejectionNote={org.rejection_note}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Update CLAUDE.md**

In `CLAUDE.md`, find this exact line:
```
### ⬜ Etapa 9 — Moderare Admin (`feat/admin-moderation`)
```

Replace with:
```
### ✅ Etapa 9 — Moderare Admin (`feat/admin-moderation`)
```

- [ ] **Step 4: TypeScript check**

Run: `npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 5: Commit**

```bash
git add "app/(private)/admin/organizatii/_components/AdminOrgActionBarClient.tsx" "app/(private)/admin/organizatii/page.tsx" CLAUDE.md
git commit -m "feat: add admin org list, AdminOrgActionBarClient, mark Etapa 9 complete"
```
