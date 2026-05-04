# Event Completion & Feedback Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement event completion (manual button for creators + pg_cron auto-complete for timed events) and a feedback form for participants of completed events.

**Architecture:** `completeEvent` uses the Supabase admin client (service_role) to bypass RLS for status update + bulk notifications. Auto-complete runs via a PostgreSQL `complete_expired_events()` function scheduled with pg_cron every 15 minutes. The `FeedbackFormClient` (client component) is rendered server-side with pre-computed `isParticipant` / `hasSubmitted` flags to avoid client-side data fetching.

**Tech Stack:** Next.js 15 App Router · Supabase PostgreSQL + service_role · pg_cron · shadcn/ui · Sonner toasts · `'use server'` actions in `/services`

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `supabase/migrations/0014_auto_complete_cron.sql` | Create | pg_cron extension + `complete_expired_events()` function + schedule |
| `services/feedback.service.ts` | Modify | Add `submitFeedback` + `hasCurrentUserSubmittedFeedback` |
| `services/completion.service.ts` | Create | `completeEvent` server action (admin client) |
| `components/shared/FeedbackFormClient.tsx` | Create | Star rating + comment form, calls `submitFeedback` |
| `services/user.service.ts` | Modify | Add `subcategory` to `DashboardEvent` type + select query |
| `app/(private)/panou/_components/CompleteEventButtonClient.tsx` | Create | "Marchează finalizat" button for manual-complete event types |
| `app/(private)/panou/evenimente/page.tsx` | Modify | Render `CompleteEventButtonClient` alongside each event row |
| `app/(public)/evenimente/protest/[id]/page.tsx` | Modify | Fetch participation + feedback status, add `FeedbackFormClient` in sidebar |
| `app/(public)/evenimente/boycott/[id]/page.tsx` | Modify | Same as above |
| `app/(public)/evenimente/comunitar/[id]/page.tsx` | Modify | Same as above |
| `app/(public)/evenimente/caritabil/[id]/page.tsx` | Modify | Same as above |

---

### Task 1: SQL migration — pg_cron auto-complete

**Files:**
- Create: `supabase/migrations/0014_auto_complete_cron.sql`

Context: The auto-complete types have a `date` + `time_end` in their subtable. When `date + time_end < NOW()` and the event is still `approved`, the function marks it `completed` and notifies all joined participants. Manual-complete types (boycott, petition, donations, charity_livestreams) are NOT included.

- [ ] **Step 1: Create migration file**

```sql
-- supabase/migrations/0014_auto_complete_cron.sql

-- Enable pg_cron (safe to run if already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Function: mark expired events as completed + notify participants
CREATE OR REPLACE FUNCTION complete_expired_events()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  rec record;
BEGIN
  FOR rec IN
    SELECT DISTINCT e.id, e.title
    FROM events e
    WHERE e.status = 'approved'
    AND (
      -- protests
      EXISTS (
        SELECT 1 FROM protests p
        WHERE p.event_id = e.id
          AND p.time_end IS NOT NULL
          AND (p.date + p.time_end) < NOW()
      )
      OR
      -- outdoor_activities
      EXISTS (
        SELECT 1 FROM community_activities ca
        JOIN outdoor_activities oa ON oa.community_activity_id = ca.id
        WHERE ca.event_id = e.id
          AND oa.time_end IS NOT NULL
          AND (oa.date + oa.time_end) < NOW()
      )
      OR
      -- workshops
      EXISTS (
        SELECT 1 FROM community_activities ca
        JOIN workshops w ON w.community_activity_id = ca.id
        WHERE ca.event_id = e.id
          AND w.time_end IS NOT NULL
          AND (w.date + w.time_end) < NOW()
      )
      OR
      -- charity_concerts
      EXISTS (
        SELECT 1 FROM charity_events ce
        JOIN charity_concerts cc ON cc.charity_event_id = ce.id
        WHERE ce.event_id = e.id
          AND cc.time_end IS NOT NULL
          AND (cc.date + cc.time_end) < NOW()
      )
      OR
      -- meet_greets
      EXISTS (
        SELECT 1 FROM charity_events ce
        JOIN meet_greets mg ON mg.charity_event_id = ce.id
        WHERE ce.event_id = e.id
          AND mg.time_end IS NOT NULL
          AND (mg.date + mg.time_end) < NOW()
      )
      OR
      -- sports_activities
      EXISTS (
        SELECT 1 FROM charity_events ce
        JOIN sports_activities sa ON sa.charity_event_id = ce.id
        WHERE ce.event_id = e.id
          AND sa.time_end IS NOT NULL
          AND (sa.date + sa.time_end) < NOW()
      )
    )
  LOOP
    UPDATE events SET status = 'completed' WHERE id = rec.id;

    INSERT INTO notifications (user_id, title, message, type)
    SELECT
      ep.user_id,
      'Eveniment finalizat',
      'Evenimentul "' || rec.title || '" s-a finalizat. Lasă-ne feedback!',
      'event_completed'
    FROM event_participants ep
    WHERE ep.event_id = rec.id
      AND ep.status = 'joined';
  END LOOP;
END;
$$;

-- Schedule: run every 15 minutes
SELECT cron.schedule(
  'complete-expired-events',
  '*/15 * * * *',
  $$ SELECT complete_expired_events() $$
);
```

- [ ] **Step 2: Apply migration via Supabase MCP**

Use the `mcp__supabase__apply_migration` tool with name `0014_auto_complete_cron` and the SQL above.

- [ ] **Step 3: Verify function exists**

Use `mcp__supabase__execute_sql` with:
```sql
SELECT proname FROM pg_proc WHERE proname = 'complete_expired_events';
```
Expected: one row with `complete_expired_events`.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/0014_auto_complete_cron.sql
git commit -m "feat: add pg_cron auto-complete migration for expired events"
```

---

### Task 2: `submitFeedback` + `hasCurrentUserSubmittedFeedback` in feedback.service.ts

**Files:**
- Modify: `services/feedback.service.ts`

Context: The existing file already has `getFeedback` and `getUserFeedback`. We add two new exports. `submitFeedback` relies on the existing `feedback_insert` RLS policy (requires event `completed` + user in `event_participants` with `status = 'joined'`). The internal user ID is obtained from the `users` table via `auth_users_id`.

- [ ] **Step 1: Add `hasCurrentUserSubmittedFeedback` after the existing `getUserFeedback` export**

Append to `services/feedback.service.ts`:

```typescript
export async function hasCurrentUserSubmittedFeedback(eventId: string): Promise<boolean> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const { data: userData } = await supabase
    .from('users')
    .select('id')
    .eq('auth_users_id', user.id)
    .single()
  if (!userData) return false

  const { data } = await supabase
    .from('event_feedback')
    .select('id')
    .eq('event_id', eventId)
    .eq('user_id', (userData as any).id)
    .maybeSingle()

  return !!data
}

export async function submitFeedback(
  eventId: string,
  rating: number,
  comment: string | null
): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Neautentificat' }

  const { data: userData } = await supabase
    .from('users')
    .select('id')
    .eq('auth_users_id', user.id)
    .single()
  if (!userData) return { error: 'Utilizator negăsit' }

  const { error } = await supabase.from('event_feedback').insert({
    event_id: eventId,
    user_id: (userData as any).id,
    rating,
    comment: comment || null,
  })

  if (error) {
    console.error('[submitFeedback]', error.message)
    return { error: 'Feedback-ul nu a putut fi trimis' }
  }

  return { ok: true }
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | grep "feedback.service"
```
Expected: no output (no errors).

- [ ] **Step 3: Commit**

```bash
git add services/feedback.service.ts
git commit -m "feat: add submitFeedback and hasCurrentUserSubmittedFeedback to feedback service"
```

---

### Task 3: `completeEvent` server action

**Files:**
- Create: `services/completion.service.ts`

Context: Uses `createAdminClient()` to bypass RLS. Verifies the caller is the event creator (by comparing internal user IDs). Only events with `status = 'approved'` can be completed. After updating status, bulk-inserts notifications for all joined participants.

- [ ] **Step 1: Create `services/completion.service.ts`**

```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function completeEvent(
  eventId: string
): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Neautentificat' }

  const { data: userData } = await supabase
    .from('users')
    .select('id')
    .eq('auth_users_id', user.id)
    .single()
  if (!userData) return { error: 'Utilizator negăsit' }

  const { data: evtRaw } = await supabase
    .from('events')
    .select('id, title, creator_id, status')
    .eq('id', eventId)
    .single()
  if (!evtRaw) return { error: 'Eveniment negăsit' }

  const evt = evtRaw as { id: string; title: string; creator_id: string; status: string }
  if (evt.creator_id !== (userData as any).id) return { error: 'Acces interzis' }
  if (evt.status !== 'approved') return { error: 'Evenimentul nu poate fi finalizat în starea curentă' }

  const admin = createAdminClient()

  const { error: updateError } = await admin
    .from('events')
    .update({ status: 'completed' })
    .eq('id', eventId)
  if (updateError) {
    console.error('[completeEvent] update', updateError.message)
    return { error: 'Eroare la finalizare' }
  }

  const { data: participants } = await admin
    .from('event_participants')
    .select('user_id')
    .eq('event_id', eventId)
    .eq('status', 'joined')

  if (participants && participants.length > 0) {
    await admin.from('notifications').insert(
      (participants as { user_id: string }[]).map(p => ({
        user_id: p.user_id,
        title: 'Eveniment finalizat',
        message: `Evenimentul "${evt.title}" a fost finalizat. Lasă-ne feedback!`,
        type: 'event_completed',
      }))
    )
  }

  return { ok: true }
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | grep "completion.service"
```
Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add services/completion.service.ts
git commit -m "feat: add completeEvent server action with admin client + participant notifications"
```

---

### Task 4: `FeedbackFormClient` component

**Files:**
- Create: `components/shared/FeedbackFormClient.tsx`

Context: Receives `isParticipant` and `hasSubmitted` pre-computed server-side. Returns `null` immediately if either condition isn't met (no render). Stars use `fill-secondary text-secondary` for the selected/hovered state (gold) matching the CIVICOM design system.

- [ ] **Step 1: Create `components/shared/FeedbackFormClient.tsx`**

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Star, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { submitFeedback } from '@/services/feedback.service'

type Props = {
  eventId: string
  isParticipant: boolean
  hasSubmitted: boolean
}

export function FeedbackFormClient({ eventId, isParticipant, hasSubmitted }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [rating, setRating] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)

  if (!isParticipant || hasSubmitted) return null

  async function handleSubmit() {
    if (rating === 0) { toast.error('Selectează un rating'); return }
    setLoading(true)
    const result = await submitFeedback(eventId, rating, comment.trim() || null)
    setLoading(false)
    if ('error' in result) { toast.error(result.error); return }
    toast.success('Feedback trimis! Mulțumim.')
    router.refresh()
  }

  return (
    <Card className="shadow-lg shadow-black/5 border-border">
      <CardContent className="p-6 space-y-4">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          <Star size={14} />
          Evaluează evenimentul
        </h3>

        {!open ? (
          <Button className="w-full" onClick={() => setOpen(true)}>
            Evaluează evenimentul
          </Button>
        ) : (
          <div className="space-y-4">
            <div className="flex gap-1 justify-center">
              {[1, 2, 3, 4, 5].map(i => (
                <Star
                  key={i}
                  size={32}
                  className={`cursor-pointer transition-colors ${
                    i <= (hovered || rating)
                      ? 'fill-secondary text-secondary'
                      : 'text-muted-foreground/30'
                  }`}
                  onMouseEnter={() => setHovered(i)}
                  onMouseLeave={() => setHovered(0)}
                  onClick={() => setRating(i)}
                />
              ))}
            </div>
            <Textarea
              placeholder="Comentariu opțional..."
              value={comment}
              onChange={e => setComment(e.target.value)}
              rows={3}
            />
            <Button
              className="w-full"
              onClick={handleSubmit}
              disabled={loading || rating === 0}
            >
              {loading ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
              {loading ? 'Se trimite...' : 'Trimite feedback'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | grep "FeedbackFormClient"
```
Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add components/shared/FeedbackFormClient.tsx
git commit -m "feat: add FeedbackFormClient component with star rating and comment"
```

---

### Task 5: Add FeedbackFormClient to 4 event detail pages

**Files:**
- Modify: `app/(public)/evenimente/protest/[id]/page.tsx`
- Modify: `app/(public)/evenimente/boycott/[id]/page.tsx`
- Modify: `app/(public)/evenimente/comunitar/[id]/page.tsx`
- Modify: `app/(public)/evenimente/caritabil/[id]/page.tsx`

Context: Each page is a server component. We add `getSession()`, `getParticipationStatus()`, and `hasCurrentUserSubmittedFeedback()` calls — but only when the event is `completed` (avoids unnecessary DB queries for non-completed events). The `FeedbackFormClient` is rendered in the sidebar, below `ParticipationCardClient`. Petition pages are NOT updated (petition signers are in `petition_signatures`, not `event_participants`, so RLS prevents feedback).

Pattern to follow for ALL 4 pages:

**Imports to add:**
```typescript
import { getSession } from '@/services/auth.service'
import { getParticipationStatus } from '@/services/participation.service'
import { hasCurrentUserSubmittedFeedback } from '@/services/feedback.service'
import { FeedbackFormClient } from '@/components/shared/FeedbackFormClient'
```

**Data fetching to add** (after the `event` is fetched and `notFound()` guard):
```typescript
const session = await getSession()
let isParticipant = false
let hasSubmittedFeedback = false
if (session && event.status === 'completed') {
  const [participationStatus, feedbackExists] = await Promise.all([
    getParticipationStatus(event.id),
    hasCurrentUserSubmittedFeedback(event.id),
  ])
  isParticipant = participationStatus === 'joined'
  hasSubmittedFeedback = feedbackExists
}
```

**Sidebar JSX to add** (right after `<ParticipationCardClient ... />`):
```tsx
<FeedbackFormClient
  eventId={event.id}
  isParticipant={isParticipant}
  hasSubmitted={hasSubmittedFeedback}
/>
```

- [ ] **Step 1: Update `app/(public)/evenimente/protest/[id]/page.tsx`**

Add the 4 imports listed above at the top of the file.

After `incrementViewCount(id)`, add:
```typescript
const session = await getSession()
let isParticipant = false
let hasSubmittedFeedback = false
if (session && event.status === 'completed') {
  const [participationStatus, feedbackExists] = await Promise.all([
    getParticipationStatus(event.id),
    hasCurrentUserSubmittedFeedback(event.id),
  ])
  isParticipant = participationStatus === 'joined'
  hasSubmittedFeedback = feedbackExists
}
```

In the sidebar JSX, right after `<ParticipationCardClient ... />`, add:
```tsx
<FeedbackFormClient
  eventId={event.id}
  isParticipant={isParticipant}
  hasSubmitted={hasSubmittedFeedback}
/>
```

- [ ] **Step 2: Update `app/(public)/evenimente/boycott/[id]/page.tsx`**

Same 4 imports, same data fetching block (after `incrementViewCount`), same `<FeedbackFormClient />` after `<ParticipationCardClient />` in sidebar.

- [ ] **Step 3: Update `app/(public)/evenimente/comunitar/[id]/page.tsx`**

Same 4 imports, same data fetching block (after `incrementViewCount`), same `<FeedbackFormClient />` after `<ParticipationCardClient />` in sidebar.

- [ ] **Step 4: Update `app/(public)/evenimente/caritabil/[id]/page.tsx`**

Same 4 imports, same data fetching block (after `incrementViewCount`), same `<FeedbackFormClient />` after `<ParticipationCardClient />` in sidebar.

- [ ] **Step 5: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | grep "evenimente"
```
Expected: no output (ignore pre-existing validator.ts errors about admin routes).

- [ ] **Step 6: Commit**

```bash
git add "app/(public)/evenimente/protest/[id]/page.tsx" \
        "app/(public)/evenimente/boycott/[id]/page.tsx" \
        "app/(public)/evenimente/comunitar/[id]/page.tsx" \
        "app/(public)/evenimente/caritabil/[id]/page.tsx"
git commit -m "feat: add FeedbackFormClient to completed event detail pages"
```

---

### Task 6: CompleteEventButtonClient + dashboard events page

**Files:**
- Modify: `services/user.service.ts`
- Create: `app/(private)/panou/_components/CompleteEventButtonClient.tsx`
- Modify: `app/(private)/panou/evenimente/page.tsx`

Context: `DashboardEvent` needs `subcategory` to determine if an event is manually completable. The button only renders for events where `status === 'approved'` AND the category/subcategory combo is a manual-complete type. The button wraps `completeEvent` from completion.service.ts and calls `router.refresh()` on success.

Manual-complete types:
- `category === 'boycott'` (all subtypes)
- `category === 'petition'` (all subtypes)
- `category === 'community'` AND `subcategory === 'donations'`
- `category === 'charity'` AND `subcategory === 'livestream'`

- [ ] **Step 1: Add `subcategory` to `DashboardEvent` in `services/user.service.ts`**

Find `DashboardEvent` type and add `subcategory: string | null`:
```typescript
export type DashboardEvent = {
  id: string
  title: string
  category: string
  subcategory: string | null
  status: string
  participants_count: number
  created_at: string
  banner_url: string | null
}
```

Find `getUserCreatedEvents` and update the select to include `subcategory`:
```typescript
.select('id, title, category, subcategory, status, participants_count, created_at, banner_url')
```

Also update `getUserParticipations` select the same way (so type stays consistent):
```typescript
.select('event:events!event_id(id, title, category, subcategory, status, participants_count, created_at, banner_url)')
```

- [ ] **Step 2: Create `app/(private)/panou/_components/CompleteEventButtonClient.tsx`**

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { completeEvent } from '@/services/completion.service'

function isManualComplete(category: string, subcategory: string | null): boolean {
  if (category === 'boycott' || category === 'petition') return true
  if (category === 'community' && subcategory === 'donations') return true
  if (category === 'charity' && subcategory === 'livestream') return true
  return false
}

type Props = {
  eventId: string
  category: string
  subcategory: string | null
  status: string
}

export function CompleteEventButtonClient({ eventId, category, subcategory, status }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  if (status !== 'approved' || !isManualComplete(category, subcategory)) return null

  async function handleComplete() {
    setLoading(true)
    const result = await completeEvent(eventId)
    setLoading(false)
    if ('error' in result) { toast.error(result.error); return }
    toast.success('Eveniment marcat ca finalizat!')
    router.refresh()
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleComplete}
      disabled={loading}
      className="gap-1.5 shrink-0"
    >
      {loading
        ? <Loader2 size={14} className="animate-spin" />
        : <CheckCircle2 size={14} />}
      {loading ? 'Se procesează...' : 'Marchează finalizat'}
    </Button>
  )
}
```

- [ ] **Step 3: Update `app/(private)/panou/evenimente/page.tsx`**

Add import at top:
```typescript
import { CompleteEventButtonClient } from '../_components/CompleteEventButtonClient'
```

Replace the `events.map(...)` block:
```tsx
{events.map(event => (
  <div key={event.id} className="flex items-center gap-2">
    <div className="flex-1 min-w-0">
      <DashboardEventRow event={event} showStatus />
    </div>
    <CompleteEventButtonClient
      eventId={event.id}
      category={event.category}
      subcategory={event.subcategory}
      status={event.status}
    />
  </div>
))}
```

- [ ] **Step 4: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | grep -v "validator.ts"
```
Expected: no output.

- [ ] **Step 5: Commit**

```bash
git add services/user.service.ts \
        "app/(private)/panou/_components/CompleteEventButtonClient.tsx" \
        "app/(private)/panou/evenimente/page.tsx"
git commit -m "feat: add CompleteEventButtonClient and subcategory to dashboard events"
```

---

### Task 7: Update CLAUDE.md

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Mark Etapa 12 as complete**

Find:
```
### ⬜ Etapa 12 — Finalizare Evenimente & Feedback (`feat/event-completion-feedback`)
```

Replace with:
```
### ✅ Etapa 12 — Finalizare Evenimente & Feedback (`feat/event-completion-feedback`)
```

- [ ] **Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: mark Etapa 12 complete in roadmap"
```
