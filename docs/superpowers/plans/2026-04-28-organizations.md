# Etapa 11 — ONG-uri Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the full Organizations (ONG) feature: public list/detail pages, private ONG management dashboard (events, members, settings), create org flow, and rating system.

**Architecture:** `organization.service.ts` provides all data access via Server Actions. Public pages are Server Components with one Client leaf per interactive widget. Private ONG pages guard via layout (org membership check). Admin client used for queries that need to bypass RLS on cross-member data (member list, all org events).

**Tech Stack:** Next.js 15 App Router, Supabase (PostgreSQL + Storage), shadcn/ui, Tailwind CSS, Sonner toasts, Lucide icons.

---

## File Map

**New files:**
- `supabase/migrations/0013_logos_bucket.sql`
- `services/organization.service.ts` (rewrite from stub)
- `lib/upload.ts` (add `uploadLogo`)
- `app/(public)/organizatii/page.tsx`
- `app/(public)/organizatii/[id]/page.tsx`
- `app/(private)/organizatie/_components/LogoUploadClient.tsx`
- `app/(private)/organizatie/creeaza/page.tsx`
- `app/(private)/organizatie/creeaza/_components/OngCreateFormClient.tsx`
- `app/(private)/organizatie/[id]/layout.tsx`
- `app/(private)/organizatie/[id]/_components/OrgTabsClient.tsx`
- `app/(private)/organizatie/[id]/panou/page.tsx`
- `app/(private)/organizatie/[id]/evenimente/page.tsx`
- `app/(private)/organizatie/[id]/membri/page.tsx`
- `app/(private)/organizatie/[id]/membri/_components/InviteMemberFormClient.tsx`
- `app/(private)/organizatie/[id]/membri/_components/MemberActionsClient.tsx`
- `app/(private)/organizatie/[id]/setari/page.tsx`
- `app/(private)/organizatie/[id]/setari/_components/OngSettingsFormClient.tsx`

**Modified files:**
- `lib/upload.ts`
- `CLAUDE.md` (mark Etapa 11 ✅)

---

## Task 1: Logos Storage Bucket Migration

**Files:**
- Create: `supabase/migrations/0013_logos_bucket.sql`

- [ ] **Step 1: Create migration file**

```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('logos', 'logos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Logos are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'logos');

CREATE POLICY "Authenticated users can upload logos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'logos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update logos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'logos' AND auth.uid() IS NOT NULL);
```

- [ ] **Step 2: Apply migration via Supabase MCP or CLI**

Run in terminal: `npx supabase db push` (or apply via MCP `mcp__supabase__apply_migration`)

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/0013_logos_bucket.sql
git commit -m "feat: add logos storage bucket migration"
```

---

## Task 2: Add `uploadLogo` to `lib/upload.ts`

**Files:**
- Modify: `lib/upload.ts`

- [ ] **Step 1: Add uploadLogo function**

Append to the bottom of `lib/upload.ts`:

```typescript
export async function uploadLogo(file: File, orgId: string): Promise<string | null> {
  const supabase = getClient()
  const ext = file.name.split('.').pop()
  const path = `${orgId}/${Date.now()}.${ext}`
  const { error } = await supabase.storage.from('logos').upload(path, file, { upsert: true })
  if (error) { console.error('[uploadLogo]', error.message); return null }
  const { data } = supabase.storage.from('logos').getPublicUrl(path)
  return data.publicUrl
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/upload.ts
git commit -m "feat: add uploadLogo for org logos bucket"
```

---

## Task 3: Complete `organization.service.ts`

**Files:**
- Rewrite: `services/organization.service.ts`

- [ ] **Step 1: Replace the file with the complete implementation**

```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// ============================================================
// PUBLIC TYPES
// ============================================================

export type OrgListItem = {
  id: string
  name: string
  description: string | null
  logo_url: string | null
  website: string | null
  rating: number
  created_at: string
}

export type OrgMember = {
  user_id: string
  name: string
  role: string
  joined_at: string
}

export type OrgDetail = {
  id: string
  name: string
  description: string | null
  website: string | null
  iban: string | null
  logo_url: string | null
  status: string
  rating: number
  owner_id: string
  created_at: string
  members: OrgMember[]
  events_count: number
}

export type OrgEvent = {
  id: string
  title: string
  category: string
  subcategory: string | null
  status: string
  banner_url: string | null
  created_at: string
  participants_count: number
}

export type OrgStats = {
  membersCount: number
  eventsCount: number
  rating: number
}

// ============================================================
// INTERNAL ROW TYPES
// ============================================================

type OrgRow = {
  id: string; name: string; description: string | null
  logo_url: string | null; website: string | null
  rating: number; created_at: string
}

type OrgDetailRow = {
  id: string; name: string; description: string | null
  website: string | null; iban: string | null
  logo_url: string | null; status: string; rating: number
  owner_id: string; created_at: string
}

type OrgMemberRow = {
  user_id: string; role: string; joined_at: string
  user: { name: string } | null
}

// ============================================================
// HELPERS
// ============================================================

async function getCurrentUserId(): Promise<string | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('users').select('id').eq('auth_users_id', user.id).single()
  return data?.id ?? null
}

// ============================================================
// READ FUNCTIONS
// ============================================================

export async function getUserOrgId(userId: string): Promise<string | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle()
  return data?.organization_id ?? null
}

export async function getOrgMemberRole(orgId: string): Promise<'admin' | 'member' | null> {
  const supabase = await createClient()
  const userId = await getCurrentUserId()
  if (!userId) return null
  const { data } = await supabase
    .from('organization_members')
    .select('role')
    .eq('organization_id', orgId)
    .eq('user_id', userId)
    .maybeSingle()
  return (data?.role as 'admin' | 'member') ?? null
}

export async function getOrganizations(filters?: { status?: string }): Promise<OrgListItem[]> {
  const supabase = await createClient()
  const status = filters?.status ?? 'approved'
  const { data, error } = await supabase
    .from('organizations')
    .select('id, name, description, logo_url, website, rating, created_at')
    .eq('status', status)
    .order('rating', { ascending: false })
  if (error) console.error('[getOrganizations]', error.message)
  return (data ?? []) as OrgRow[]
}

export async function getOrganizationById(id: string): Promise<OrgDetail | null> {
  const adminClient = createAdminClient()

  const { data: orgRaw, error: orgErr } = await adminClient
    .from('organizations')
    .select('id, name, description, website, iban, logo_url, status, rating, owner_id, created_at')
    .eq('id', id)
    .single()
  if (orgErr || !orgRaw) return null
  const org = orgRaw as OrgDetailRow

  const [{ data: membersRaw }, { count: events_count }] = await Promise.all([
    adminClient
      .from('organization_members')
      .select('user_id, role, joined_at, user:users!user_id(name)')
      .eq('organization_id', id)
      .order('joined_at', { ascending: true }),
    adminClient
      .from('events')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', id)
      .in('status', ['approved', 'completed']),
  ])

  const members: OrgMember[] = ((membersRaw ?? []) as unknown as OrgMemberRow[]).map(m => ({
    user_id: m.user_id,
    name: m.user?.name ?? 'Utilizator',
    role: m.role,
    joined_at: m.joined_at,
  }))

  return { ...org, members, events_count: events_count ?? 0 }
}

export async function getOrganizationPublicEvents(orgId: string): Promise<OrgEvent[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('events')
    .select('id, title, category, subcategory, status, banner_url, created_at, participants_count')
    .eq('organization_id', orgId)
    .in('status', ['approved', 'completed'])
    .order('created_at', { ascending: false })
  if (error) console.error('[getOrganizationPublicEvents]', error.message)
  return (data ?? []) as OrgEvent[]
}

export async function getOrganizationEvents(orgId: string): Promise<OrgEvent[]> {
  const adminClient = createAdminClient()
  const role = await getOrgMemberRole(orgId)
  if (!role) return []
  const { data, error } = await adminClient
    .from('events')
    .select('id, title, category, subcategory, status, banner_url, created_at, participants_count')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })
  if (error) console.error('[getOrganizationEvents]', error.message)
  return (data ?? []) as OrgEvent[]
}

export async function getOrgDashboardStats(orgId: string): Promise<OrgStats> {
  const adminClient = createAdminClient()
  const [
    { count: membersCount },
    { count: eventsCount },
    { data: orgData },
  ] = await Promise.all([
    adminClient.from('organization_members').select('*', { count: 'exact', head: true }).eq('organization_id', orgId),
    adminClient.from('events').select('*', { count: 'exact', head: true }).eq('organization_id', orgId).in('status', ['approved', 'completed']),
    adminClient.from('organizations').select('rating').eq('id', orgId).single(),
  ])
  return {
    membersCount: membersCount ?? 0,
    eventsCount: eventsCount ?? 0,
    rating: (orgData as { rating: number } | null)?.rating ?? 0,
  }
}

export async function getOrganizationMembers(orgId: string): Promise<OrgMember[]> {
  const adminClient = createAdminClient()
  const role = await getOrgMemberRole(orgId)
  if (!role) return []
  const { data } = await adminClient
    .from('organization_members')
    .select('user_id, role, joined_at, user:users!user_id(name)')
    .eq('organization_id', orgId)
    .order('joined_at', { ascending: true })
  return ((data ?? []) as unknown as OrgMemberRow[]).map(m => ({
    user_id: m.user_id,
    name: m.user?.name ?? 'Utilizator',
    role: m.role,
    joined_at: m.joined_at,
  }))
}

export async function getOrganizationRatings(orgId: string): Promise<{ average: number; total: number }> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('organization_ratings')
    .select('rating')
    .eq('organization_id', orgId)
  const ratings = (data ?? []) as { rating: number }[]
  if (ratings.length === 0) return { average: 0, total: 0 }
  const average = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
  return { average: Math.round(average * 10) / 10, total: ratings.length }
}

export async function getUserRatingForOrganization(orgId: string): Promise<number | null> {
  const supabase = await createClient()
  const userId = await getCurrentUserId()
  if (!userId) return null
  const { data } = await supabase
    .from('organization_ratings')
    .select('rating')
    .eq('organization_id', orgId)
    .eq('user_id', userId)
    .maybeSingle()
  return (data as { rating: number } | null)?.rating ?? null
}

// ============================================================
// MUTATION FUNCTIONS
// ============================================================

export async function createOrganization(data: {
  name: string
  description?: string
  iban?: string
  website?: string
  logo_url?: string
}): Promise<{ ok: true; orgId: string } | { error: string }> {
  if (data.name.trim().length < 2) return { error: 'Numele trebuie să aibă minim 2 caractere' }

  const supabase = await createClient()
  const userId = await getCurrentUserId()
  if (!userId) return { error: 'Neautentificat' }

  const { data: org, error: orgErr } = await supabase
    .from('organizations')
    .insert({
      name: data.name.trim(),
      description: data.description?.trim() || null,
      iban: data.iban?.trim() || null,
      website: data.website?.trim() || null,
      logo_url: data.logo_url || null,
      owner_id: userId,
    })
    .select('id')
    .single()

  if (orgErr || !org) return { error: orgErr?.message ?? 'Eroare la creare organizație' }

  const { error: memberErr } = await supabase
    .from('organization_members')
    .insert({ organization_id: (org as { id: string }).id, user_id: userId, role: 'admin' })

  if (memberErr) console.error('[createOrganization] member insert', memberErr.message)

  return { ok: true, orgId: (org as { id: string }).id }
}

export async function updateOrganization(
  orgId: string,
  data: { name?: string; description?: string | null; website?: string | null; iban?: string | null; logo_url?: string | null }
): Promise<{ ok: true } | { error: string }> {
  const role = await getOrgMemberRole(orgId)
  if (role !== 'admin') return { error: 'Acces interzis — trebuie să fii admin ONG' }

  const supabase = await createClient()
  const update: Record<string, unknown> = {}
  if (data.name !== undefined) update.name = data.name.trim()
  if (data.description !== undefined) update.description = data.description || null
  if (data.website !== undefined) update.website = data.website || null
  if (data.iban !== undefined) update.iban = data.iban || null
  if (data.logo_url !== undefined) update.logo_url = data.logo_url || null

  const { error } = await supabase.from('organizations').update(update).eq('id', orgId)
  if (error) return { error: error.message }
  return { ok: true }
}

export async function inviteMember(orgId: string, email: string): Promise<{ ok: true } | { error: string }> {
  const role = await getOrgMemberRole(orgId)
  if (role !== 'admin') return { error: 'Acces interzis' }

  const supabase = await createClient()
  const { data: targetUser } = await supabase
    .from('users')
    .select('id')
    .eq('email', email.trim().toLowerCase())
    .maybeSingle()
  if (!targetUser) return { error: 'Niciun utilizator găsit cu acest email' }

  const { error } = await supabase
    .from('organization_members')
    .insert({ organization_id: orgId, user_id: (targetUser as { id: string }).id, role: 'member' })

  if (error) {
    if (error.code === '23505') return { error: 'Utilizatorul este deja membru' }
    return { error: error.message }
  }
  return { ok: true }
}

export async function removeMember(orgId: string, targetUserId: string): Promise<{ ok: true } | { error: string }> {
  const role = await getOrgMemberRole(orgId)
  if (role !== 'admin') return { error: 'Acces interzis' }

  const supabase = await createClient()
  const { data: admins } = await supabase
    .from('organization_members')
    .select('user_id')
    .eq('organization_id', orgId)
    .eq('role', 'admin')

  if ((admins ?? []).length === 1 && (admins as { user_id: string }[])[0].user_id === targetUserId) {
    return { error: 'Nu poți elimina singurul admin al organizației' }
  }

  const { error } = await supabase
    .from('organization_members')
    .delete()
    .eq('organization_id', orgId)
    .eq('user_id', targetUserId)

  if (error) return { error: error.message }
  return { ok: true }
}

export async function updateMemberRole(
  orgId: string,
  targetUserId: string,
  newRole: 'admin' | 'member'
): Promise<{ ok: true } | { error: string }> {
  const role = await getOrgMemberRole(orgId)
  if (role !== 'admin') return { error: 'Acces interzis' }

  const supabase = await createClient()
  if (newRole === 'member') {
    const { data: admins } = await supabase
      .from('organization_members')
      .select('user_id')
      .eq('organization_id', orgId)
      .eq('role', 'admin')
    if ((admins ?? []).length === 1 && (admins as { user_id: string }[])[0].user_id === targetUserId) {
      return { error: 'Nu poți retrograda singurul admin al organizației' }
    }
  }

  const { error } = await supabase
    .from('organization_members')
    .update({ role: newRole })
    .eq('organization_id', orgId)
    .eq('user_id', targetUserId)

  if (error) return { error: error.message }
  return { ok: true }
}

export async function rateOrganization(orgId: string, rating: number): Promise<{ ok: true } | { error: string }> {
  if (rating < 1 || rating > 5) return { error: 'Rating trebuie să fie între 1 și 5' }

  const supabase = await createClient()
  const userId = await getCurrentUserId()
  if (!userId) return { error: 'Neautentificat' }

  const { error: upsertErr } = await supabase
    .from('organization_ratings')
    .upsert({ organization_id: orgId, user_id: userId, rating }, { onConflict: 'organization_id,user_id' })

  if (upsertErr) return { error: upsertErr.message }

  const { data: ratings } = await supabase
    .from('organization_ratings')
    .select('rating')
    .eq('organization_id', orgId)

  const avg = ratings && ratings.length > 0
    ? (ratings as { rating: number }[]).reduce((sum, r) => sum + r.rating, 0) / ratings.length
    : 0

  await supabase.from('organizations').update({ rating: avg }).eq('id', orgId)

  return { ok: true }
}
```

- [ ] **Step 2: Commit**

```bash
git add services/organization.service.ts
git commit -m "feat: complete organization.service.ts with all CRUD, member, rating functions"
```

---

## Task 4: Public `/organizatii` List Page

**Files:**
- Create: `app/(public)/organizatii/page.tsx`

- [ ] **Step 1: Create the page**

```typescript
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { Building2, Star, Globe, ArrowRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { buttonVariants } from '@/components/ui/button'
import { getOrganizations } from '@/services/organization.service'

export const metadata: Metadata = {
  title: 'Organizații',
  description: 'Descoperă organizațiile non-guvernamentale verificate pe CIVICOM care coordonează acțiuni civice.',
  alternates: { canonical: '/organizatii' },
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          size={12}
          className={i <= Math.round(rating) ? 'fill-secondary text-secondary' : 'text-muted-foreground/30'}
        />
      ))}
      <span className="text-xs text-muted-foreground ml-1">{rating > 0 ? rating.toFixed(1) : 'Fără evaluări'}</span>
    </div>
  )
}

export default async function OrganizatiiPage() {
  const orgs = await getOrganizations()

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8 lg:py-16 space-y-8">
      <div>
        <h1 className="text-2xl font-black uppercase tracking-tighter text-foreground lg:text-3xl">
          Organizații
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {orgs.length} organizații verificate pe CIVICOM✨
        </p>
      </div>

      {orgs.length === 0 ? (
        <div className="py-24 text-center">
          <Building2 size={40} className="mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">Nicio organizație aprobată momentan.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {orgs.map(org => (
            <Card key={org.id} className="group flex flex-col overflow-hidden transition-shadow hover:shadow-lg shadow-sm shadow-black/5 border-border">
              <CardContent className="flex flex-col flex-1 p-5 gap-4">
                <div className="flex items-start gap-3">
                  {org.logo_url ? (
                    <div className="relative size-12 rounded-xl overflow-hidden border border-border shrink-0">
                      <Image src={org.logo_url} alt={org.name} fill className="object-cover" unoptimized />
                    </div>
                  ) : (
                    <div className="size-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                      <Building2 size={20} className="text-primary" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-foreground text-base leading-tight line-clamp-1 group-hover:text-primary transition-colors">
                      {org.name}
                    </p>
                    <div className="mt-1">
                      <StarRating rating={org.rating} />
                    </div>
                  </div>
                </div>

                {org.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2 flex-1">{org.description}</p>
                )}

                <div className="flex items-center justify-between pt-1 border-t border-border/50 mt-auto">
                  {org.website ? (
                    <a
                      href={org.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                      onClick={e => e.stopPropagation()}
                    >
                      <Globe size={12} />
                      Website
                    </a>
                  ) : (
                    <span />
                  )}
                  <Link
                    href={`/organizatii/${org.id}`}
                    className={buttonVariants({ variant: 'outline', size: 'sm' }) + ' gap-1 text-xs h-7 px-2'}
                  >
                    Află mai mult <ArrowRight size={12} />
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add "app/(public)/organizatii/page.tsx"
git commit -m "feat: add public /organizatii list page"
```

---

## Task 5: Public `/organizatii/[id]` Detail Page

**Files:**
- Create: `app/(public)/organizatii/[id]/page.tsx`
- Create: `app/(public)/organizatii/[id]/_components/OrgRatingClient.tsx`

- [ ] **Step 1: Create `OrgRatingClient.tsx`**

```typescript
'use client'

import { useState } from 'react'
import { Star } from 'lucide-react'
import { toast } from 'sonner'
import { rateOrganization } from '@/services/organization.service'

type Props = {
  orgId: string
  initialRating: number | null
  isAuthenticated: boolean
}

export function OrgRatingClient({ orgId, initialRating, isAuthenticated }: Props) {
  const [selected, setSelected] = useState<number>(initialRating ?? 0)
  const [hovered, setHovered] = useState<number>(0)
  const [loading, setLoading] = useState(false)

  async function handleRate(rating: number) {
    if (!isAuthenticated) {
      toast.error('Trebuie să fii autentificat pentru a evalua.')
      return
    }
    setLoading(true)
    const result = await rateOrganization(orgId, rating)
    if ('error' in result) {
      toast.error(result.error)
    } else {
      setSelected(rating)
      toast.success('Evaluare salvată!')
    }
    setLoading(false)
  }

  const display = hovered || selected

  return (
    <div className="flex flex-col gap-2">
      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
        Evaluează organizația
      </p>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map(i => (
          <button
            key={i}
            disabled={loading}
            onClick={() => handleRate(i)}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(0)}
            className="transition-transform hover:scale-110 focus:outline-none disabled:opacity-50"
            aria-label={`Evaluează cu ${i} stele`}
          >
            <Star
              size={24}
              className={i <= display ? 'fill-secondary text-secondary' : 'text-muted-foreground/30'}
            />
          </button>
        ))}
      </div>
      {selected > 0 && (
        <p className="text-xs text-muted-foreground">Evaluarea ta: {selected}/5</p>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Create the detail page `app/(public)/organizatii/[id]/page.tsx`**

```typescript
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Building2, Globe, Star, Users, CalendarDays, CreditCard } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import {
  getOrganizationById,
  getOrganizationPublicEvents,
  getOrganizationRatings,
  getUserRatingForOrganization,
} from '@/services/organization.service'
import { getSession } from '@/services/auth.service'
import { EventCard } from '@/components/shared/EventCard'
import { OrgRatingClient } from './_components/OrgRatingClient'

const CATEGORY_PATH: Record<string, string> = {
  protest: 'protest', boycott: 'boycott', petition: 'petitie',
  community: 'comunitar', charity: 'caritabil',
}

type PageProps = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const org = await getOrganizationById(id)
  if (!org) return { title: 'Organizație negăsită' }
  return {
    title: org.name,
    description: org.description ?? `Pagina organizației ${org.name} pe CIVICOM.`,
    openGraph: {
      title: org.name,
      description: org.description ?? '',
      images: org.logo_url ? [{ url: org.logo_url }] : [],
    },
    alternates: { canonical: `/organizatii/${id}` },
  }
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('ro-RO', { month: 'long', year: 'numeric' })
}

export default async function OrganizatieDetailPage({ params }: PageProps) {
  const { id } = await params

  const [org, events, ratings, session] = await Promise.all([
    getOrganizationById(id),
    getOrganizationPublicEvents(id),
    getOrganizationRatings(id),
    getSession(),
  ])

  if (!org || org.status !== 'approved') notFound()

  const userRating = session ? await getUserRatingForOrganization(id) : null
  const isAuthenticated = !!session

  // JSON-LD
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: org.name,
    description: org.description ?? undefined,
    url: org.website ?? undefined,
    logo: org.logo_url ?? undefined,
    foundingDate: org.created_at.split('T')[0],
    aggregateRating: ratings.total > 0 ? {
      '@type': 'AggregateRating',
      ratingValue: ratings.average,
      reviewCount: ratings.total,
      bestRating: 5,
      worstRating: 1,
    } : undefined,
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8 lg:py-16">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">

          {/* ── Left column ── */}
          <div className="lg:col-span-8 space-y-8">

            {/* Header */}
            <div className="flex items-start gap-5">
              {org.logo_url ? (
                <div className="relative size-20 lg:size-24 rounded-2xl overflow-hidden border border-border shrink-0">
                  <Image src={org.logo_url} alt={org.name} fill className="object-cover" unoptimized />
                </div>
              ) : (
                <div className="size-20 lg:size-24 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                  <Building2 size={32} className="text-primary" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-black tracking-tight text-foreground lg:text-3xl">{org.name}</h1>
                <p className="text-xs text-muted-foreground mt-1">Membră din {formatDate(org.created_at)}</p>
                {org.website && (
                  <a
                    href={org.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline mt-2"
                  >
                    <Globe size={14} /> {org.website}
                  </a>
                )}
              </div>
            </div>

            {/* Description */}
            {org.description && (
              <div>
                <h2 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">
                  Despre organizație
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">{org.description}</p>
              </div>
            )}

            {/* IBAN */}
            {org.iban && (
              <div>
                <h2 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1.5">
                  <CreditCard size={12} /> Cont donații
                </h2>
                <code className="text-sm font-mono bg-muted px-3 py-1.5 rounded-lg border border-border text-foreground">
                  {org.iban}
                </code>
              </div>
            )}

            {/* Members */}
            {org.members.length > 0 && (
              <div>
                <h2 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-1.5">
                  <Users size={12} /> Echipă ({org.members.length})
                </h2>
                <div className="flex flex-wrap gap-2">
                  {org.members.map(m => (
                    <div key={m.user_id} className="flex items-center gap-2 bg-muted/50 rounded-full px-3 py-1.5 border border-border/50">
                      <div className="size-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-[10px] font-black text-primary">
                        {m.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-xs font-medium text-foreground">{m.name}</span>
                      {m.role === 'admin' && (
                        <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4">Admin</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Events */}
            {events.length > 0 && (
              <div>
                <h2 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-1.5">
                  <CalendarDays size={12} /> Evenimente ({org.events_count})
                </h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {events.slice(0, 6).map(event => (
                    <EventCard
                      key={event.id}
                      event={{
                        id: event.id,
                        title: event.title,
                        category: event.category,
                        status: event.status,
                        banner_url: event.banner_url,
                        created_at: event.created_at,
                        participants_count: event.participants_count,
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Sidebar ── */}
          <aside className="lg:col-span-4 space-y-6">
            {/* Stats card */}
            <Card className="p-6 shadow-lg bg-white shadow-black/5 border-border">
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Rating mediu</p>
                  <div className="flex items-center gap-2">
                    <span className="text-3xl font-black italic tracking-tighter text-primary">
                      {ratings.average > 0 ? ratings.average.toFixed(1) : '—'}
                    </span>
                    <div>
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map(i => (
                          <Star key={i} size={14} className={i <= Math.round(ratings.average) ? 'fill-secondary text-secondary' : 'text-muted-foreground/30'} />
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">{ratings.total} evaluări</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border/50">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Membri</p>
                    <p className="text-xl font-black text-foreground">{org.members.length}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Evenimente</p>
                    <p className="text-xl font-black text-foreground">{org.events_count}</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Rating widget */}
            <Card className="p-6 shadow-lg bg-white shadow-black/5 border-border">
              <OrgRatingClient orgId={id} initialRating={userRating} isAuthenticated={isAuthenticated} />
            </Card>

            {/* Back link */}
            <Link href="/organizatii" className={buttonVariants({ variant: 'outline' }) + ' w-full'}>
              ← Toate organizațiile
            </Link>
          </aside>
        </div>
      </div>
    </>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add "app/(public)/organizatii/"
git commit -m "feat: add public /organizatii/[id] detail page with generateMetadata and JSON-LD Organization"
```

---

## Task 6: `LogoUploadClient` Component

**Files:**
- Create: `app/(private)/organizatie/_components/LogoUploadClient.tsx`

- [ ] **Step 1: Create the component**

```typescript
'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { Upload, X, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { uploadLogo } from '@/lib/upload'

type Props = {
  orgId: string
  logoUrl: string | null
  onLogoChange: (url: string | null) => void
}

export function LogoUploadClient({ orgId, logoUrl, onLogoChange }: Props) {
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const url = await uploadLogo(file, orgId)
    if (url) onLogoChange(url)
    setUploading(false)
  }

  return (
    <div className="space-y-2">
      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Logo organizație</p>
      <div
        onClick={() => inputRef.current?.click()}
        className="relative size-24 rounded-2xl overflow-hidden border-2 border-dashed border-border bg-muted/30 flex items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors"
      >
        {logoUrl ? (
          <Image src={logoUrl} alt="Logo" fill className="object-cover" unoptimized />
        ) : (
          <div className="flex flex-col items-center gap-1 text-muted-foreground">
            {uploading ? <Upload size={20} className="animate-pulse" /> : <Building2 size={20} />}
            <span className="text-[10px]">{uploading ? 'Se încarcă...' : 'Logo'}</span>
          </div>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      {logoUrl && (
        <Button variant="ghost" size="sm" className="text-destructive text-xs h-7 px-2" onClick={() => onLogoChange(null)}>
          <X size={12} className="mr-1" /> Șterge logo
        </Button>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add "app/(private)/organizatie/_components/LogoUploadClient.tsx"
git commit -m "feat: add LogoUploadClient for org logo upload"
```

---

## Task 7: Create Organization Page

**Files:**
- Create: `app/(private)/organizatie/creeaza/page.tsx`
- Create: `app/(private)/organizatie/creeaza/_components/OngCreateFormClient.tsx`

- [ ] **Step 1: Create `OngCreateFormClient.tsx`**

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { createOrganization } from '@/services/organization.service'
import { LogoUploadClient } from '../../_components/LogoUploadClient'

const TEMP_ORG_ID = 'new'

export function OngCreateFormClient() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', description: '', website: '', iban: '' })

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) { toast.error('Numele organizației este obligatoriu'); return }
    setLoading(true)
    const result = await createOrganization({
      name: form.name,
      description: form.description || undefined,
      website: form.website || undefined,
      iban: form.iban || undefined,
      logo_url: logoUrl || undefined,
    })
    setLoading(false)
    if ('error' in result) { toast.error(result.error); return }
    toast.success('Organizație creată! Acum este în așteptarea aprobării.')
    router.push(`/organizatie/${result.orgId}/panou`)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <LogoUploadClient orgId={TEMP_ORG_ID} logoUrl={logoUrl} onLogoChange={setLogoUrl} />

      <div className="space-y-2">
        <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
          Nume organizație *
        </Label>
        <Input
          id="name"
          placeholder="Asociația Civică România"
          value={form.name}
          onChange={e => set('name', e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
          Descriere
        </Label>
        <Textarea
          id="description"
          placeholder="Descrieți misiunea și activitățile organizației..."
          value={form.description}
          onChange={e => set('description', e.target.value)}
          rows={4}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="website" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            Website
          </Label>
          <Input
            id="website"
            type="url"
            placeholder="https://organizatia.ro"
            value={form.website}
            onChange={e => set('website', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="iban" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            IBAN donații
          </Label>
          <Input
            id="iban"
            placeholder="RO49AAAA1B31007593840000"
            value={form.iban}
            onChange={e => set('iban', e.target.value)}
          />
        </div>
      </div>

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? 'Se creează...' : 'Creează organizație'}
      </Button>
    </form>
  )
}
```

- [ ] **Step 2: Create `app/(private)/organizatie/creeaza/page.tsx`**

```typescript
import type { Metadata } from 'next'
import { Building2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { OngCreateFormClient } from './_components/OngCreateFormClient'

export const metadata: Metadata = { title: 'Creează organizație' }

export default function OrganizatieCreeazaPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 lg:px-8 py-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="size-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
          <Building2 size={20} className="text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">Creează organizație</h1>
          <p className="text-sm text-muted-foreground">Organizația va fi verificată de echipa CIVICOM✨</p>
        </div>
      </div>

      <Card className="shadow-sm shadow-black/5 border-border">
        <CardContent className="p-6">
          <OngCreateFormClient />
        </CardContent>
      </Card>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add "app/(private)/organizatie/creeaza/"
git commit -m "feat: add /organizatie/creeaza page with ONG creation form"
```

---

## Task 8: ONG Private Layout + `OrgTabsClient`

**Files:**
- Create: `app/(private)/organizatie/[id]/layout.tsx`
- Create: `app/(private)/organizatie/[id]/_components/OrgTabsClient.tsx`

- [ ] **Step 1: Create `OrgTabsClient.tsx`**

```typescript
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

type Props = { orgId: string }

export function OrgTabsClient({ orgId }: Props) {
  const pathname = usePathname()

  const tabs = [
    { label: 'Panou', href: `/organizatie/${orgId}/panou` },
    { label: 'Evenimente', href: `/organizatie/${orgId}/evenimente` },
    { label: 'Membri', href: `/organizatie/${orgId}/membri` },
    { label: 'Setări', href: `/organizatie/${orgId}/setari` },
  ]

  return (
    <div className="flex gap-1 bg-muted/50 rounded-xl p-1 w-full overflow-x-auto">
      {tabs.map(tab => (
        <Link
          key={tab.href}
          href={tab.href}
          className={cn(
            'flex-1 text-center text-xs font-semibold px-3 py-2 rounded-lg transition-colors whitespace-nowrap',
            pathname === tab.href
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Create `app/(private)/organizatie/[id]/layout.tsx`**

```typescript
import { redirect } from 'next/navigation'
import { getOrgMemberRole } from '@/services/organization.service'
import { OrgTabsClient } from './_components/OrgTabsClient'

type Props = {
  children: React.ReactNode
  params: Promise<{ id: string }>
}

export default async function OrgLayout({ children, params }: Props) {
  const { id } = await params
  const role = await getOrgMemberRole(id)

  if (!role) redirect('/panou')

  return (
    <div className="mx-auto max-w-7xl px-4 lg:px-8 py-8 space-y-6">
      <OrgTabsClient orgId={id} />
      {children}
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add "app/(private)/organizatie/[id]/"
git commit -m "feat: add ONG private layout with membership guard and OrgTabsClient"
```

---

## Task 9: ONG Dashboard `/organizatie/[id]/panou`

**Files:**
- Create: `app/(private)/organizatie/[id]/panou/page.tsx`

- [ ] **Step 1: Create the page**

```typescript
import type { Metadata } from 'next'
import Link from 'next/link'
import { Users, CalendarDays, Star, ArrowRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { buttonVariants } from '@/components/ui/button'
import { StatCardDashboard } from '@/components/shared/StatCardDashboard'
import { DashboardEventRow } from '@/components/shared/DashboardEventRow'
import { getOrgDashboardStats, getOrganizationEvents } from '@/services/organization.service'
import type { DashboardEvent } from '@/services/user.service'

export const metadata: Metadata = { title: 'Panou ONG' }

type PageProps = { params: Promise<{ id: string }> }

export default async function OrgPanouPage({ params }: PageProps) {
  const { id } = await params
  const [stats, allEvents] = await Promise.all([
    getOrgDashboardStats(id),
    getOrganizationEvents(id),
  ])
  const recentEvents = allEvents.slice(0, 5)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-foreground">Panou ONG</h1>
        <p className="text-sm text-muted-foreground mt-1">Gestionează organizația ta pe CIVICOM✨</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCardDashboard label="Membri" value={stats.membersCount} icon={Users} />
        <StatCardDashboard label="Evenimente active" value={stats.eventsCount} icon={CalendarDays} />
        <StatCardDashboard label="Rating" value={`${stats.rating > 0 ? stats.rating.toFixed(1) : '—'}`} icon={Star} />
      </div>

      <Card className="shadow-sm shadow-black/5 border-border">
        <CardContent className="p-5 space-y-1">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              Evenimente recente
            </h2>
            <Link
              href={`/organizatie/${id}/evenimente`}
              className="text-xs text-primary font-medium flex items-center gap-1 hover:underline"
            >
              Vezi toate <ArrowRight size={12} />
            </Link>
          </div>
          {recentEvents.length === 0 ? (
            <div className="py-6 text-center space-y-3">
              <p className="text-sm text-muted-foreground">Organizația nu are niciun eveniment încă.</p>
              <Link href="/creeaza" className={buttonVariants({ size: 'sm' })}>
                Creează primul eveniment
              </Link>
            </div>
          ) : (
            recentEvents.map(event => (
              <DashboardEventRow
                key={event.id}
                event={event as DashboardEvent}
                showStatus
              />
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add "app/(private)/organizatie/[id]/panou/page.tsx"
git commit -m "feat: add ONG dashboard page with stats and recent events"
```

---

## Task 10: ONG Events `/organizatie/[id]/evenimente`

**Files:**
- Create: `app/(private)/organizatie/[id]/evenimente/page.tsx`

- [ ] **Step 1: Create the page**

```typescript
import type { Metadata } from 'next'
import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { DashboardEventRow } from '@/components/shared/DashboardEventRow'
import { getOrganizationEvents } from '@/services/organization.service'
import type { DashboardEvent } from '@/services/user.service'

export const metadata: Metadata = { title: 'Evenimente ONG' }

type PageProps = { params: Promise<{ id: string }> }

export default async function OrgEvenimentePage({ params }: PageProps) {
  const { id } = await params
  const events = await getOrganizationEvents(id)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-black tracking-tight text-foreground">
          Evenimente ({events.length})
        </h2>
        <Link href="/creeaza" className={buttonVariants({ size: 'sm' }) + ' gap-1.5'}>
          + Eveniment nou
        </Link>
      </div>

      {events.length === 0 ? (
        <div className="py-16 text-center rounded-xl border border-dashed border-border">
          <p className="text-muted-foreground text-sm">Organizația nu are niciun eveniment.</p>
        </div>
      ) : (
        <div className="space-y-1 rounded-xl border border-border bg-card p-2">
          {events.map(event => (
            <DashboardEventRow
              key={event.id}
              event={event as DashboardEvent}
              showStatus
            />
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add "app/(private)/organizatie/[id]/evenimente/page.tsx"
git commit -m "feat: add ONG events page with full org event list"
```

---

## Task 11: ONG Members `/organizatie/[id]/membri`

**Files:**
- Create: `app/(private)/organizatie/[id]/membri/page.tsx`
- Create: `app/(private)/organizatie/[id]/membri/_components/InviteMemberFormClient.tsx`
- Create: `app/(private)/organizatie/[id]/membri/_components/MemberActionsClient.tsx`

- [ ] **Step 1: Create `InviteMemberFormClient.tsx`**

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { inviteMember } from '@/services/organization.service'

type Props = { orgId: string }

export function InviteMemberFormClient({ orgId }: Props) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    const result = await inviteMember(orgId, email)
    setLoading(false)
    if ('error' in result) { toast.error(result.error); return }
    toast.success('Membru adăugat cu succes!')
    setEmail('')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input
        type="email"
        placeholder="email@utilizator.ro"
        value={email}
        onChange={e => setEmail(e.target.value)}
        required
        className="flex-1"
      />
      <Button type="submit" disabled={loading} size="sm">
        {loading ? 'Se adaugă...' : 'Invită'}
      </Button>
    </form>
  )
}
```

- [ ] **Step 2: Create `MemberActionsClient.tsx`**

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Trash2, ShieldCheck, ShieldOff } from 'lucide-react'
import { removeMember, updateMemberRole } from '@/services/organization.service'

type Props = {
  orgId: string
  userId: string
  currentRole: string
}

export function MemberActionsClient({ orgId, userId, currentRole }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleToggleRole() {
    const newRole = currentRole === 'admin' ? 'member' : 'admin'
    setLoading(true)
    const result = await updateMemberRole(orgId, userId, newRole)
    setLoading(false)
    if ('error' in result) { toast.error(result.error); return }
    toast.success(`Rol actualizat la ${newRole}`)
    router.refresh()
  }

  async function handleRemove() {
    setLoading(true)
    const result = await removeMember(orgId, userId)
    setLoading(false)
    if ('error' in result) { toast.error(result.error); return }
    toast.success('Membru eliminat')
    router.refresh()
  }

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="sm"
        disabled={loading}
        onClick={handleToggleRole}
        className="h-7 px-2 text-xs gap-1"
        title={currentRole === 'admin' ? 'Retrogradează la member' : 'Promovează la admin'}
      >
        {currentRole === 'admin' ? <ShieldOff size={12} /> : <ShieldCheck size={12} />}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        disabled={loading}
        onClick={handleRemove}
        className="h-7 px-2 text-destructive hover:text-destructive"
      >
        <Trash2 size={12} />
      </Button>
    </div>
  )
}
```

- [ ] **Step 3: Create `app/(private)/organizatie/[id]/membri/page.tsx`**

```typescript
import type { Metadata } from 'next'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { getOrganizationMembers, getOrgMemberRole } from '@/services/organization.service'
import { InviteMemberFormClient } from './_components/InviteMemberFormClient'
import { MemberActionsClient } from './_components/MemberActionsClient'

export const metadata: Metadata = { title: 'Membri ONG' }

type PageProps = { params: Promise<{ id: string }> }

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('ro-RO', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default async function OrgMembriPage({ params }: PageProps) {
  const { id } = await params
  const [members, currentRole] = await Promise.all([
    getOrganizationMembers(id),
    getOrgMemberRole(id),
  ])
  const isAdmin = currentRole === 'admin'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-black tracking-tight text-foreground">
          Membri ({members.length})
        </h2>
      </div>

      {isAdmin && (
        <Card className="shadow-sm shadow-black/5 border-border">
          <CardContent className="p-5 space-y-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              Invită un nou membru
            </p>
            <InviteMemberFormClient orgId={id} />
            <p className="text-xs text-muted-foreground">Utilizatorul trebuie să aibă deja un cont CIVICOM.</p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {members.map(member => (
          <Card key={member.user_id} className="shadow-sm shadow-black/5 border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-black text-xs text-primary shrink-0">
                  {member.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-foreground text-sm">{member.name}</p>
                    <Badge
                      variant={member.role === 'admin' ? 'default' : 'secondary'}
                      className="text-[9px] px-1.5 py-0 h-4"
                    >
                      {member.role === 'admin' ? 'Admin' : 'Membru'}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">Din {formatDate(member.joined_at)}</p>
                </div>
                {isAdmin && (
                  <MemberActionsClient
                    orgId={id}
                    userId={member.user_id}
                    currentRole={member.role}
                  />
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add "app/(private)/organizatie/[id]/membri/"
git commit -m "feat: add ONG members page with invite, role toggle, and remove actions"
```

---

## Task 12: ONG Settings `/organizatie/[id]/setari`

**Files:**
- Create: `app/(private)/organizatie/[id]/setari/page.tsx`
- Create: `app/(private)/organizatie/[id]/setari/_components/OngSettingsFormClient.tsx`

- [ ] **Step 1: Create `OngSettingsFormClient.tsx`**

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { updateOrganization } from '@/services/organization.service'
import { LogoUploadClient } from '../../../_components/LogoUploadClient'
import type { OrgDetail } from '@/services/organization.service'

type Props = { org: OrgDetail }

export function OngSettingsFormClient({ org }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [logoUrl, setLogoUrl] = useState<string | null>(org.logo_url)
  const [form, setForm] = useState({
    name: org.name,
    description: org.description ?? '',
    website: org.website ?? '',
    iban: org.iban ?? '',
  })

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) { toast.error('Numele este obligatoriu'); return }
    setLoading(true)
    const result = await updateOrganization(org.id, {
      name: form.name,
      description: form.description || null,
      website: form.website || null,
      iban: form.iban || null,
      logo_url: logoUrl,
    })
    setLoading(false)
    if ('error' in result) { toast.error(result.error); return }
    toast.success('Setări salvate!')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <LogoUploadClient orgId={org.id} logoUrl={logoUrl} onLogoChange={setLogoUrl} />

      <div className="space-y-2">
        <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
          Nume *
        </Label>
        <Input id="name" value={form.name} onChange={e => set('name', e.target.value)} required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
          Descriere
        </Label>
        <Textarea
          id="description"
          value={form.description}
          onChange={e => set('description', e.target.value)}
          rows={4}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="website" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            Website
          </Label>
          <Input id="website" type="url" value={form.website} onChange={e => set('website', e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="iban" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            IBAN donații
          </Label>
          <Input id="iban" value={form.iban} onChange={e => set('iban', e.target.value)} />
        </div>
      </div>

      <Button type="submit" disabled={loading}>
        {loading ? 'Se salvează...' : 'Salvează modificările'}
      </Button>
    </form>
  )
}
```

- [ ] **Step 2: Create `app/(private)/organizatie/[id]/setari/page.tsx`**

```typescript
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { getOrganizationById, getOrgMemberRole } from '@/services/organization.service'
import { OngSettingsFormClient } from './_components/OngSettingsFormClient'

export const metadata: Metadata = { title: 'Setări ONG' }

type PageProps = { params: Promise<{ id: string }> }

export default async function OrgSetariPage({ params }: PageProps) {
  const { id } = await params
  const [org, role] = await Promise.all([
    getOrganizationById(id),
    getOrgMemberRole(id),
  ])

  if (role !== 'admin') redirect(`/organizatie/${id}/panou`)
  if (!org) redirect('/panou')

  return (
    <div className="space-y-6 max-w-2xl">
      <h2 className="text-lg font-black tracking-tight text-foreground">Setări organizație</h2>
      <Card className="shadow-sm shadow-black/5 border-border">
        <CardContent className="p-6">
          <OngSettingsFormClient org={org} />
        </CardContent>
      </Card>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add "app/(private)/organizatie/[id]/setari/"
git commit -m "feat: add ONG settings page with logo upload and form (admin only)"
```

---

## Task 13: Update CLAUDE.md

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Mark Etapa 11 complete in CLAUDE.md**

Find this line in CLAUDE.md:
```
### ⬜ Etapa 11 — ONG-uri (`feat/organizations`)
`organization.service.ts` complet · `/organizatii` + `/organizatii/[id]` · `/organizatie/creeaza` · Panou ONG + membri + setari · `generateMetadata` + JSON-LD `Organization` · Notificări aprobare ONG
```

Replace `⬜` with `✅`.

- [ ] **Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: mark Etapa 11 (ONG-uri) complete"
```

---

## Self-Review

**Spec coverage check:**
- ✅ `organization.service.ts` complet — all 12 functions from Notion spec implemented
- ✅ `/organizatii` public list page
- ✅ `/organizatii/[id]` with `generateMetadata` + JSON-LD `Organization`
- ✅ `/organizatie/creeaza` with `OngCreateFormClient` + `LogoUpload`
- ✅ `/organizatie/[id]/panou` — `OngDashboardStats`, `RecentEventList`
- ✅ `/organizatie/[id]/evenimente` — full event list
- ✅ `/organizatie/[id]/membri` — `MemberList`, `InviteMemberFormClient`, `MemberActionsClient`
- ✅ `/organizatie/[id]/setari` — `OngSettingsFormClient`, `LogoUpload`
- ✅ Notificări aprobare ONG — already implemented in `admin.service.ts` (`approveOrg`/`rejectOrg`)

**Type consistency:**
- `OrgDetail` used in Task 3 (service) and Task 12 (settings page) ✅
- `OrgEvent` returned by `getOrganizationEvents` and cast to `DashboardEvent` in Tasks 9 & 10 ✅
- `getOrgMemberRole` used in layout (Task 8), members page (Task 11), settings page (Task 12) ✅

**Notes:**
- `getOrganizationEvents` uses admin client (to bypass events RLS for org members seeing pending events). It checks org membership first before calling admin client.
- `getOrganizationById` uses admin client to read members (bypasses `org_members_select` RLS for public page).
- `OngCreateFormClient` uses `TEMP_ORG_ID = 'new'` for the logo upload path. The logo is uploaded before the org is created; a better UX would be to upload after org creation. For MVP this is acceptable.
- `DashboardEventRow` expects `DashboardEvent` type (from `user.service`) which has the same shape as `OrgEvent`. A cast via `as DashboardEvent` is safe.
