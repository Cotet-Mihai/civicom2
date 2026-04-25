# Etapa 5 — Pagina Petiție Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the petition event detail page at `/evenimente/petitie/[id]` with signature progress, recent signers sidebar, and full SEO.

**Architecture:** Follows the exact same pattern as the completed protest page (`app/(public)/evenimente/protest/[id]/page.tsx`). `PetitionDetail` type + `getPetitionById` (with `React.cache`) added to `event.service.ts`. A new `petition.service.ts` handles `getRecentSigners`. Two new shared/page-scoped components: `SignatureCardClient` and `RecentSignersClient`.

**Tech Stack:** Next.js 15 App Router (Server Components, `params` as Promise), Supabase JS v2 (nested selects), TypeScript, Tailwind CSS, shadcn/ui (Card, Button, Progress), lucide-react icons.

---

## File Map

| Action | File | Responsibility |
|---|---|---|
| Modify | `services/event.service.ts` | Add `PetitionDetail` type + `getPetitionById` |
| Create | `services/petition.service.ts` | `RecentSigner` type + `getRecentSigners` |
| Create | `components/shared/SignatureCardClient.tsx` | Signature progress card (client) |
| Create | `app/(public)/evenimente/petitie/[id]/_components/RecentSignersClient.tsx` | Recent signers list (server async) |
| Create | `app/(public)/evenimente/petitie/[id]/page.tsx` | Full petition detail page |

---

### Task 1: PetitionDetail type + getPetitionById in event.service.ts

**Context:** `services/event.service.ts` already has `'use server'`, imports `cache` from `'react'` and `createClient` from `'@/lib/supabase/server'`. The file already has the `ProtestDetail` section at line ~120. Append petition section at the end of the file. Pattern to follow: `SELECT_PROTEST` → `ProtestDetail` → `mapProtestRow` → `getProtestById = cache(...)`.

**Files:**
- Modify: `services/event.service.ts` (append at end of file)

- [ ] **Step 1: Append the petition section to event.service.ts**

Add this block at the very end of `services/event.service.ts`:

```typescript
// ─── Petition Detail ─────────────────────────────────────────────────────────

const SELECT_PETITION = `
  id, title, description, banner_url, gallery_urls, category, subcategory,
  status, creator_id, creator_type, organization_id, view_count, participants_count, created_at,
  petitions(
    what_is_requested, requested_from, target_signatures, why_important, contact_person
  ),
  creator:users!creator_id(name, avatar_url),
  organization:organizations!organization_id(name, logo_url)
`

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
    participants_count: number
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

function mapPetitionRow(row: any): PetitionDetail {
    return {
        id: row.id,
        title: row.title,
        description: row.description,
        banner_url: row.banner_url,
        gallery_urls: row.gallery_urls ?? [],
        category: 'petition',
        subcategory: null,
        status: row.status,
        creator_id: row.creator_id,
        creator_type: row.creator_type,
        organization_id: row.organization_id,
        view_count: row.view_count,
        participants_count: row.participants_count,
        created_at: row.created_at,
        petition: {
            what_is_requested: row.petitions?.what_is_requested ?? '',
            requested_from: row.petitions?.requested_from ?? '',
            target_signatures: row.petitions?.target_signatures ?? 0,
            why_important: row.petitions?.why_important ?? '',
            contact_person: row.petitions?.contact_person ?? null,
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

export const getPetitionById = cache(async (id: string): Promise<PetitionDetail | null> => {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('events')
        .select(SELECT_PETITION)
        .eq('id', id)
        .eq('category', 'petition')
        .in('status', ['approved', 'completed'])
        .maybeSingle()

    if (error) console.error('[getPetitionById]', error.message)
    if (!data) return null

    return mapPetitionRow(data)
})
```

- [ ] **Step 2: Type-check**

```bash
pnpm tsc --noEmit
```

Expected: no output (zero errors).

- [ ] **Step 3: Commit**

```bash
git add services/event.service.ts
git commit -m "feat: add PetitionDetail type + getPetitionById to event.service"
```

---

### Task 2: petition.service.ts — getRecentSigners

**Context:** New service file. Pattern: `'use server'` at top, `createClient` from `'@/lib/supabase/server'`. The `petition_signatures` table has columns: `event_id uuid`, `user_id uuid`, `joined_at timestamptz`. Join to `users` table using FK hint `user:users!user_id(name, avatar_url)`.

**Files:**
- Create: `services/petition.service.ts`

- [ ] **Step 1: Create services/petition.service.ts**

```typescript
'use server'

import { createClient } from '@/lib/supabase/server'

export type RecentSigner = {
    user_id: string
    name: string
    avatar_url: string | null
    signed_at: string
}

export async function getRecentSigners(eventId: string, limit = 5): Promise<RecentSigner[]> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('petition_signatures')
        .select('user_id, joined_at, user:users!user_id(name, avatar_url)')
        .eq('event_id', eventId)
        .order('joined_at', { ascending: false })
        .limit(limit)

    if (error) console.error('[getRecentSigners]', error.message)

    return (data ?? []).map((row: any) => ({
        user_id: row.user_id,
        name: row.user?.name ?? 'Anonim',
        avatar_url: row.user?.avatar_url ?? null,
        signed_at: row.joined_at,
    }))
}
```

- [ ] **Step 2: Type-check**

```bash
pnpm tsc --noEmit
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add services/petition.service.ts
git commit -m "feat: add petition.service with getRecentSigners"
```

---

### Task 3: SignatureCardClient.tsx

**Context:** Client component in `components/shared/`. Follow `ParticipationCardClient.tsx` exactly — same card structure, same styling, same completed-state pattern — but with signature-specific text and no date/time fields. The `Button` component comes from `@/components/ui/button` and uses `@base-ui/react` under the hood. The `Progress` component is from `@/components/ui/progress`.

**Files:**
- Create: `components/shared/SignatureCardClient.tsx`

- [ ] **Step 1: Create components/shared/SignatureCardClient.tsx**

```typescript
'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { FileSignature } from 'lucide-react'

type Props = {
    signaturesCount: number
    targetSignatures: number
    status: string
}

export function SignatureCardClient({ signaturesCount, targetSignatures, status }: Props) {
    const pct = targetSignatures > 0
        ? Math.min(100, Math.round((signaturesCount / targetSignatures) * 100))
        : 0
    const isCompleted = status === 'completed'

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
                ) : (
                    <Button className="w-full" disabled>
                        Semnează
                    </Button>
                )}
            </CardContent>
        </Card>
    )
}
```

- [ ] **Step 2: Type-check**

```bash
pnpm tsc --noEmit
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add components/shared/SignatureCardClient.tsx
git commit -m "feat: add SignatureCardClient component"
```

---

### Task 4: RecentSignersClient.tsx

**Context:** Server Component (async function, NO `'use client'`). Lives in the page-scoped `_components` folder. Calls `getRecentSigners` from `petition.service.ts`. Avatar styling: `size-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-black text-xs text-primary shrink-0` — same as the contact avatar in protest page but `size-8` (smaller). Date format: day + short month + `·` separator + hours:minutes in `ro-RO` locale.

**Files:**
- Create: `app/(public)/evenimente/petitie/[id]/_components/RecentSignersClient.tsx`

Note: The directory `app/(public)/evenimente/petitie/[id]/_components/` must be created. Create the file directly — Next.js handles directory creation implicitly when the file is written.

- [ ] **Step 1: Create the _components directory file**

```typescript
import { Card, CardContent } from '@/components/ui/card'
import { Users } from 'lucide-react'
import { getRecentSigners } from '@/services/petition.service'

type Props = { eventId: string }

function formatSignedAt(dateStr: string) {
    const d = new Date(dateStr)
    const date = d.toLocaleDateString('ro-RO', { day: 'numeric', month: 'short' })
    const time = d.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })
    return `${date} · ${time}`
}

export async function RecentSignersClient({ eventId }: Props) {
    const signers = await getRecentSigners(eventId)

    return (
        <Card className="shadow-lg shadow-black/5 border-border">
            <CardContent className="p-6 space-y-4">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <Users size={14} />
                    Semnatari recenți
                </h3>

                {signers.length === 0 ? (
                    <p className="text-sm italic text-muted-foreground">Fii primul care semnează</p>
                ) : (
                    <ul className="space-y-3">
                        {signers.map((signer) => (
                            <li key={signer.user_id} className="flex items-center gap-3">
                                <div className="size-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-black text-xs text-primary shrink-0">
                                    {signer.name.slice(0, 2).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-foreground truncate">
                                        {signer.name}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {formatSignedAt(signer.signed_at)}
                                    </p>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </CardContent>
        </Card>
    )
}
```

- [ ] **Step 2: Type-check**

```bash
pnpm tsc --noEmit
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add "app/(public)/evenimente/petitie/[id]/_components/RecentSignersClient.tsx"
git commit -m "feat: add RecentSignersClient server component"
```

---

### Task 5: petition/[id]/page.tsx — full page assembly

**Context:** Full Server Component page. Pattern follows `app/(public)/evenimente/protest/[id]/page.tsx` exactly. Key differences from protest page:
- Uses `getPetitionById` + `PetitionDetail`
- No map component
- Sidebar: `SignatureCardClient` + "Adresat către" card + `RecentSignersClient` + optional contact card
- Main content: description + `why_important` section + `what_is_requested` section + gallery + FeedbackSection
- `ActionButtons` called without `date`/`timeStart` props (no calendar button)
- JSON-LD has no `startDate` or `location`
- `type Props = { params: Promise<{ id: string }> }` — Next.js 15 requires params as Promise

**Files:**
- Create: `app/(public)/evenimente/petitie/[id]/page.tsx`

- [ ] **Step 1: Create app/(public)/evenimente/petitie/[id]/page.tsx**

```typescript
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Image from 'next/image'
import { Phone, Building2, Target, FileText, Images } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { getPetitionById, incrementViewCount } from '@/services/event.service'
import { EventBanner } from '@/components/shared/EventBanner'
import { ActionButtons } from '@/components/shared/ActionButtons'
import { SignatureCardClient } from '@/components/shared/SignatureCardClient'
import { FeedbackSection } from '@/components/shared/FeedbackSection'
import { RecentSignersClient } from './_components/RecentSignersClient'

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { id } = await params
    const event = await getPetitionById(id)
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

export default async function PetitionPage({ params }: Props) {
    const { id } = await params
    const event = await getPetitionById(id)
    if (!event) notFound()

    // fire-and-forget — nu blochează randarea
    incrementViewCount(id)

    const { petition } = event

    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Event',
        name: event.title,
        description: event.description,
        url: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://civicom.ro'}/evenimente/petitie/${event.id}`,
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
                    subcategory={null}
                    status={event.status}
                    viewCount={event.view_count}
                />

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
                    {/* Sidebar — apare primul pe mobil */}
                    <aside className="lg:col-span-4 space-y-4 order-first lg:order-last">
                        <SignatureCardClient
                            signaturesCount={event.participants_count}
                            targetSignatures={petition.target_signatures}
                            status={event.status}
                        />

                        <Card className="shadow-lg shadow-black/5 border-border">
                            <CardContent className="p-6 space-y-3">
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                    <Building2 size={14} />
                                    Adresat către
                                </h3>
                                <p className="text-sm font-bold text-foreground">
                                    {petition.requested_from}
                                </p>
                            </CardContent>
                        </Card>

                        <RecentSignersClient eventId={event.id} />

                        {petition.contact_person && (
                            <Card className="shadow-lg shadow-black/5 border-border">
                                <CardContent className="p-6 space-y-3">
                                    <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                        <Phone size={14} />
                                        Contact
                                    </h3>
                                    <div className="flex items-center gap-3">
                                        <div className="size-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-black text-xs text-primary shrink-0">
                                            {petition.contact_person.slice(0, 2).toUpperCase()}
                                        </div>
                                        <span className="text-sm font-medium text-foreground">
                                            {petition.contact_person}
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </aside>

                    {/* Conținut principal */}
                    <div className="lg:col-span-8 space-y-8">
                        <ActionButtons title={event.title} />

                        <div className="space-y-4">
                            <h1 className="text-2xl md:text-4xl font-black tracking-tighter leading-tight uppercase text-primary italic">
                                {event.title}
                            </h1>
                            <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                                {event.description}
                            </p>
                        </div>

                        <section className="space-y-3">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                <Target size={14} />
                                De ce e importantă
                            </h3>
                            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                                {petition.why_important}
                            </p>
                        </section>

                        <section className="space-y-3">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                <FileText size={14} />
                                Ce se solicită
                            </h3>
                            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                                {petition.what_is_requested}
                            </p>
                        </section>

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

- [ ] **Step 2: Type-check**

```bash
pnpm tsc --noEmit
```

Expected: no output.

- [ ] **Step 3: Build check**

```bash
pnpm build
```

Expected: build succeeds, `/evenimente/petitie/[id]` listed as `ƒ (Dynamic)` in route output.

- [ ] **Step 4: Commit**

```bash
git add "app/(public)/evenimente/petitie/[id]/page.tsx"
git commit -m "feat: add petition event detail page with metadata + JSON-LD"
```
