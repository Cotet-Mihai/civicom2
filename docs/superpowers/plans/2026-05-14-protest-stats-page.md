# Protest Stats Page — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a per-event statistics page for protest-type events, accessible by the creator (personal) or org members (ONG), at `/panou/evenimente/[id]` and `/organizatie/[id]/evenimente/[eventId]`.

**Architecture:** A new `stats.service.ts` fetches all data in parallel (event, protest, participants with demographics, feedback) and enforces access control. All components live in `panou/evenimente/[id]/_components/` and are reused verbatim by the ONG page. Demographics and charts are client components receiving plain data via props.

**Tech Stack:** Next.js 15 App Router, Supabase (supabase-js + admin client), Recharts (AreaChart, BarChart, PieChart), shadcn/ui (Card, Progress, Badge, Skeleton), Tailwind CSS tokens.

---

## File Map

### New files
```
services/stats.service.ts

app/(private)/(dashboard)/panou/evenimente/[id]/
  page.tsx
  loading.tsx
  _components/
    memory.md
    ProtestStatsHeader.tsx          ← Server
    StatsKpiBanner.tsx              ← Server
    FillRateCard.tsx                ← Server
    DemographicsSection.tsx         ← Server wrapper
    DemographicsChartsClient.tsx    ← Client (6 charts)
    RegistrationsChartsClient.tsx   ← Client (daily + hourly)
    SingleEventViewsChartClient.tsx ← Client (views evolution)
    ParticipantsListClient.tsx      ← Client (paginated list)
    FeedbackStatsSection.tsx        ← Server

app/(private)/(dashboard)/organizatie/[id]/evenimente/[eventId]/
  page.tsx
  loading.tsx
```

### Modified files
```
components/shared/DashboardEventRow.tsx  ← add "Statistici" link for creator
```

---

## Task 1: stats.service.ts — Types + getProtestStats()

**Files:**
- Create: `services/stats.service.ts`

- [ ] **Step 1: Create the file with all types and getProtestStats**

```ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

async function getUserId(): Promise<string | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('users').select('id').eq('auth_users_id', user.id).single()
  return data?.id ?? null
}

export type ProtestParticipant = {
  user_id: string
  name: string
  avatar_url: string | null
  county: string | null
  city: string | null
  status: 'joined' | 'cancelled'
  joined_at: string
  biological_sex: string | null
  gender: string | null
  birth_date: string | null
  education_level: string | null
}

export type ProtestFeedbackItem = {
  id: string
  rating: number
  comment: string | null
  created_at: string
  user_name: string
  user_avatar: string | null
}

export type ProtestStatsData = {
  id: string
  title: string
  subcategory: 'gathering' | 'march' | 'picket'
  status: string
  view_count: number
  participants_count: number
  created_at: string
  date: string
  time_start: string
  time_end: string | null
  max_participants: number
  participants: ProtestParticipant[]
  feedback: ProtestFeedbackItem[]
  averageRating: number
}

export async function getProtestStats(
  eventId: string,
  context: 'user' | 'org',
  orgId?: string
): Promise<ProtestStatsData | null> {
  const supabase = await createClient()
  const admin = createAdminClient()
  const userId = await getUserId()
  if (!userId) return null

  const { data: event } = await supabase
    .from('events')
    .select('id, title, subcategory, status, view_count, participants_count, created_at, creator_id, creator_type, organization_id, category')
    .eq('id', eventId)
    .single()

  if (!event || event.category !== 'protest') return null

  if (context === 'user') {
    if (event.creator_id !== userId || event.creator_type !== 'user') return null
  } else if (context === 'org' && orgId) {
    const { data: membership } = await supabase
      .from('organization_members')
      .select('user_id')
      .eq('organization_id', orgId)
      .eq('user_id', userId)
      .single()
    if (!membership || event.organization_id !== orgId) return null
  } else {
    return null
  }

  const [protestResult, participantsResult, feedbackResult] = await Promise.all([
    admin
      .from('protests')
      .select('date, time_start, time_end, max_participants')
      .eq('event_id', eventId)
      .single(),
    admin
      .from('event_participants')
      .select('user_id, status, joined_at, user:users!user_id(name, avatar_url, county, city, biological_sex, gender, birth_date, education_level)')
      .eq('event_id', eventId)
      .order('joined_at', { ascending: true }),
    event.status === 'completed'
      ? admin
          .from('event_feedback')
          .select('id, rating, comment, created_at, user:users!user_id(name, avatar_url)')
          .eq('event_id', eventId)
          .order('created_at', { ascending: false })
      : Promise.resolve({ data: [] }),
  ])

  if (!protestResult.data) return null

  const participants: ProtestParticipant[] = (participantsResult.data ?? []).map((row: any) => ({
    user_id: row.user_id,
    name: row.user?.name ?? 'Utilizator necunoscut',
    avatar_url: row.user?.avatar_url ?? null,
    county: row.user?.county ?? null,
    city: row.user?.city ?? null,
    status: row.status as 'joined' | 'cancelled',
    joined_at: row.joined_at,
    biological_sex: row.user?.biological_sex ?? null,
    gender: row.user?.gender ?? null,
    birth_date: row.user?.birth_date ?? null,
    education_level: row.user?.education_level ?? null,
  }))

  const feedbackItems: ProtestFeedbackItem[] = ((feedbackResult as any).data ?? []).map((row: any) => ({
    id: row.id,
    rating: row.rating,
    comment: row.comment ?? null,
    created_at: row.created_at,
    user_name: row.user?.name ?? 'Utilizator necunoscut',
    user_avatar: row.user?.avatar_url ?? null,
  }))

  const averageRating = feedbackItems.length > 0
    ? feedbackItems.reduce((s, f) => s + f.rating, 0) / feedbackItems.length
    : 0

  return {
    id: event.id,
    title: event.title,
    subcategory: event.subcategory as 'gathering' | 'march' | 'picket',
    status: event.status,
    view_count: event.view_count,
    participants_count: event.participants_count,
    created_at: event.created_at,
    date: protestResult.data.date,
    time_start: protestResult.data.time_start,
    time_end: protestResult.data.time_end ?? null,
    max_participants: protestResult.data.max_participants,
    participants,
    feedback: feedbackItems,
    averageRating,
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors in `services/stats.service.ts`

- [ ] **Step 3: Commit**

```bash
git add services/stats.service.ts
git commit -m "feat(stats): add getProtestStats service with types"
```

---

## Task 2: stats.service.ts — getEventViewsEvolution()

**Files:**
- Modify: `services/stats.service.ts` (append)

- [ ] **Step 1: Add ViewRange import and SingleEventViewsData type + function**

Append to `services/stats.service.ts`:

```ts
import type { ViewRange } from '@/services/user.service'
export type { ViewRange }

export type SingleEventViewsData = {
  chartPoints: Array<{ label: string; views: number }>
  range: ViewRange
}

export async function getEventViewsEvolution(
  eventId: string,
  range: ViewRange
): Promise<SingleEventViewsData> {
  const admin = createAdminClient()
  const now = new Date()

  let startDate: Date
  let labels: string[]
  let bucketKey: (d: Date) => string

  if (range === 'today') {
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
    const currentHour = now.getHours()
    labels = Array.from({ length: currentHour + 1 }, (_, i) =>
      `${i.toString().padStart(2, '0')}:00`
    )
    bucketKey = (d) => `${d.getHours().toString().padStart(2, '0')}:00`
  } else if (range === '7d') {
    startDate = new Date(now)
    startDate.setDate(now.getDate() - 6)
    startDate.setHours(0, 0, 0, 0)
    labels = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startDate.getTime() + i * 86400000)
      return d.toLocaleDateString('ro-RO', { day: '2-digit', month: 'short' })
    })
    bucketKey = (d) => d.toLocaleDateString('ro-RO', { day: '2-digit', month: 'short' })
  } else {
    startDate = new Date(now)
    startDate.setDate(now.getDate() - 29)
    startDate.setHours(0, 0, 0, 0)
    labels = Array.from({ length: 30 }, (_, i) => {
      const d = new Date(startDate.getTime() + i * 86400000)
      return d.toLocaleDateString('ro-RO', { day: '2-digit', month: 'short' })
    })
    bucketKey = (d) => d.toLocaleDateString('ro-RO', { day: '2-digit', month: 'short' })
  }

  const { data: snapshots } = await admin
    .from('event_view_snapshots')
    .select('taken_at, view_count')
    .eq('event_id', eventId)
    .gte('taken_at', startDate.toISOString())
    .order('taken_at', { ascending: true })

  const bucketMap: Record<string, number> = {}
  for (const snap of snapshots ?? []) {
    const key = bucketKey(new Date(snap.taken_at))
    bucketMap[key] = Math.max(bucketMap[key] ?? 0, snap.view_count)
  }

  let lastKnown = 0
  const filledPoints: Array<{ label: string; views: number }> = labels.map((label) => {
    if (bucketMap[label] !== undefined) lastKnown = bucketMap[label]
    return { label, views: lastKnown }
  })

  const { data: eventRow } = await admin
    .from('events')
    .select('view_count')
    .eq('id', eventId)
    .single()

  filledPoints.push({ label: 'Acum', views: eventRow?.view_count ?? lastKnown })

  return { chartPoints: filledPoints, range }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add services/stats.service.ts
git commit -m "feat(stats): add getEventViewsEvolution for single event views chart"
```

---

## Task 3: ProtestStatsHeader.tsx

**Files:**
- Create: `app/(private)/(dashboard)/panou/evenimente/[id]/_components/ProtestStatsHeader.tsx`

- [ ] **Step 1: Create the component**

```tsx
import Link from 'next/link'
import { ArrowLeft, CalendarDays, Clock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { ProtestStatsData } from '@/services/stats.service'

const SUBCATEGORY_LABELS: Record<string, string> = {
  gathering: 'Adunare',
  march: 'Marș',
  picket: 'Pichet',
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'În așteptare',
  approved: 'Aprobat',
  rejected: 'Respins',
  contested: 'Contestat',
  completed: 'Finalizat',
}

const STATUS_CLASSES: Record<string, string> = {
  pending: 'bg-secondary text-secondary-foreground',
  approved: 'bg-primary text-primary-foreground',
  rejected: 'bg-destructive text-destructive-foreground',
  contested: 'bg-orange-500 text-white',
  completed: 'bg-muted text-muted-foreground',
}

type Props = {
  data: ProtestStatsData
  backHref: string
}

export function ProtestStatsHeader({ data, backHref }: Props) {
  const protestDate = new Date(data.date).toLocaleDateString('ro-RO', {
    day: '2-digit', month: 'long', year: 'numeric',
  })
  const timeRange = data.time_end
    ? `${data.time_start.slice(0, 5)} – ${data.time_end.slice(0, 5)}`
    : `Ora ${data.time_start.slice(0, 5)}`

  return (
    <div className="space-y-4 border-b border-border/50 pb-6">
      <Link
        href={backHref}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="size-4" />
        Înapoi la evenimente
      </Link>

      <div className="space-y-3">
        <h1 className="text-2xl md:text-4xl font-black tracking-tighter leading-tight uppercase text-foreground italic">
          {data.title}
        </h1>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">
            {SUBCATEGORY_LABELS[data.subcategory] ?? data.subcategory}
          </Badge>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_CLASSES[data.status] ?? 'bg-muted text-muted-foreground'}`}>
            {STATUS_LABELS[data.status] ?? data.status}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <CalendarDays className="size-4 text-primary" />
            {protestDate}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="size-4 text-primary" />
            {timeRange}
          </span>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add "app/(private)/(dashboard)/panou/evenimente/[id]/_components/ProtestStatsHeader.tsx"
git commit -m "feat(stats): add ProtestStatsHeader component"
```

---

## Task 4: StatsKpiBanner.tsx + FillRateCard.tsx

**Files:**
- Create: `app/(private)/(dashboard)/panou/evenimente/[id]/_components/StatsKpiBanner.tsx`
- Create: `app/(private)/(dashboard)/panou/evenimente/[id]/_components/FillRateCard.tsx`

- [ ] **Step 1: Create StatsKpiBanner.tsx**

```tsx
import { Eye, Users, Target, Star } from 'lucide-react'
import { StatsBanner } from '@/components/shared/StatsBanner'
import type { ProtestStatsData } from '@/services/stats.service'

type Props = { data: ProtestStatsData }

export function StatsKpiBanner({ data }: Props) {
  const joined = data.participants.filter(p => p.status === 'joined').length
  const fillRate = data.max_participants > 0
    ? Math.round((joined / data.max_participants) * 100)
    : 0
  const ratingValue = data.status === 'completed' && data.averageRating > 0
    ? `${data.averageRating.toFixed(1)} ★`
    : '—'

  return (
    <StatsBanner
      badge="Statistici eveniment"
      title="Reach eveniment"
      subtitle={data.title}
      items={[
        { icon: Eye,    iconClassName: 'size-4 text-primary',          value: data.view_count, label: 'Vizualizări' },
        { icon: Users,  iconClassName: 'size-4 text-secondary',        value: joined,          label: 'Participanți' },
        { icon: Target, iconClassName: 'size-4 text-green-400',        value: `${fillRate}%`,  label: 'Fill Rate' },
        { icon: Star,   iconClassName: 'size-4 text-yellow-400',       value: ratingValue,     label: 'Rating' },
      ]}
    />
  )
}
```

- [ ] **Step 2: Create FillRateCard.tsx**

```tsx
import { Users, CheckCircle2, XCircle, Target } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import type { ProtestStatsData } from '@/services/stats.service'

type Props = { data: ProtestStatsData }

export function FillRateCard({ data }: Props) {
  const joined = data.participants.filter(p => p.status === 'joined').length
  const cancelled = data.participants.filter(p => p.status === 'cancelled').length
  const remaining = Math.max(0, data.max_participants - joined)
  const fillPct = data.max_participants > 0 ? (joined / data.max_participants) * 100 : 0
  const isNearFull = fillPct >= 90

  return (
    <Card className="overflow-hidden rounded-2xl border border-border bg-card/50 transition-all hover:border-primary/30">
      <CardContent className="p-5 space-y-5">

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Target className="size-4 text-primary" />
            <h3 className="font-bold text-foreground">Grad de ocupare</h3>
          </div>
          {isNearFull && (
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-primary text-primary-foreground">
              Aproape complet
            </span>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-foreground flex items-center gap-1.5">
              <Users className="size-4 text-primary" />
              {joined} / {data.max_participants} locuri
            </span>
            <span className="font-black text-2xl tracking-tighter text-foreground italic">
              {Math.round(fillPct)}%
            </span>
          </div>
          <Progress value={fillPct} className="h-3" />
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: CheckCircle2, label: 'Joined',  value: joined,    color: 'text-primary' },
            { icon: XCircle,      label: 'Anulat',  value: cancelled, color: 'text-destructive' },
            { icon: Target,       label: 'Rămase',  value: remaining, color: 'text-muted-foreground' },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="flex flex-col items-center gap-1 rounded-xl bg-muted/50 p-3">
              <Icon className={`size-4 ${color}`} />
              <span className="font-black text-xl tracking-tighter text-foreground">{value}</span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>

      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add "app/(private)/(dashboard)/panou/evenimente/[id]/_components/StatsKpiBanner.tsx" "app/(private)/(dashboard)/panou/evenimente/[id]/_components/FillRateCard.tsx"
git commit -m "feat(stats): add StatsKpiBanner and FillRateCard components"
```

---

## Task 5: DemographicsSection.tsx + DemographicsChartsClient.tsx

**Files:**
- Create: `app/(private)/(dashboard)/panou/evenimente/[id]/_components/DemographicsSection.tsx`
- Create: `app/(private)/(dashboard)/panou/evenimente/[id]/_components/DemographicsChartsClient.tsx`

- [ ] **Step 1: Create DemographicsSection.tsx**

```tsx
import { Users2 } from 'lucide-react'
import { DemographicsChartsClient } from './DemographicsChartsClient'
import type { ProtestParticipant } from '@/services/stats.service'

type Props = { participants: ProtestParticipant[] }

export function DemographicsSection({ participants }: Props) {
  const joined = participants.filter(p => p.status === 'joined')

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 border-b border-border/50 pb-2">
        <Users2 className="size-5 text-primary" />
        <h2 className="font-heading text-xl font-bold tracking-tight text-foreground">
          Demografice Participanți
        </h2>
        <span className="ml-auto text-xs text-muted-foreground font-medium">
          {joined.length} participanți (joined)
        </span>
      </div>
      <DemographicsChartsClient participants={joined} />
    </div>
  )
}
```

- [ ] **Step 2: Create DemographicsChartsClient.tsx**

```tsx
'use client'

import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Label } from 'recharts'
import { Card, CardContent } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import type { ProtestParticipant } from '@/services/stats.service'

const CHART_COLORS = [
  'var(--primary)', 'var(--secondary)', '#f97316', '#06b6d4',
  '#a855f7', '#ec4899', '#f59e0b', '#6b7280',
]

function groupBy(values: string[]) {
  const map: Record<string, number> = {}
  values.forEach(v => { map[v] = (map[v] ?? 0) + 1 })
  return Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count], i) => ({ name, count, fill: CHART_COLORS[i % CHART_COLORS.length] }))
}

function getAgeGroup(birthDate: string | null): string {
  if (!birthDate) return 'Necunoscut'
  const age = new Date().getFullYear() - new Date(birthDate).getFullYear()
  if (age < 18) return '<18'
  if (age < 25) return '18-24'
  if (age < 35) return '25-34'
  if (age < 45) return '35-44'
  if (age < 55) return '45-54'
  return '55+'
}

const AGE_ORDER = ['18-24', '25-34', '35-44', '45-54', '55+', '<18', 'Necunoscut']

const SEX_LABELS: Record<string, string> = { M: 'Masculin', F: 'Feminin', other: 'Altul' }
const EDU_LABELS: Record<string, string> = {
  none: 'Fără studii', primary: 'Primar', secondary: 'Secundar',
  high_school: 'Liceu', vocational: 'Profesional', bachelor: 'Licență',
  master: 'Masterat', phd: 'Doctorat',
}

type Props = { participants: ProtestParticipant[] }

const empty = (
  <div className="flex h-[180px] items-center justify-center rounded-xl bg-muted/50">
    <p className="text-sm text-muted-foreground">Date insuficiente</p>
  </div>
)

function DonutChart({ data, title }: { data: { name: string; count: number; fill: string }[]; title: string }) {
  const totalCount = data.reduce((s, d) => s + d.count, 0)
  return (
    <Card className="overflow-hidden rounded-2xl border border-border bg-card/50 hover:border-primary/30 transition-all">
      <CardContent className="p-4">
        <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3">{title}</h4>
        {data.length === 0 ? empty : (
          <>
            <ChartContainer
              config={Object.fromEntries(data.map(d => [d.name, { label: d.name, color: d.fill }]))}
              className="h-[160px] w-full"
            >
              <PieChart>
                <Pie data={data} dataKey="count" nameKey="name" innerRadius={42} outerRadius={68} paddingAngle={2}>
                  {data.map((d, i) => <Cell key={i} fill={d.fill} stroke="transparent" />)}
                  <Label
                    content={({ viewBox }) => {
                      if (!viewBox || !('cx' in viewBox)) return null
                      return (
                        <text textAnchor="middle" dominantBaseline="middle">
                          <tspan x={viewBox.cx} y={(viewBox.cy ?? 0) - 7} fontSize={22} fontWeight={700} fill="var(--foreground)" fontFamily="var(--font-heading)">
                            {totalCount}
                          </tspan>
                          <tspan x={viewBox.cx} y={(viewBox.cy ?? 0) + 12} fontSize={10} fill="var(--muted-foreground)">
                            total
                          </tspan>
                        </text>
                      )
                    }}
                  />
                </Pie>
                <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
              </PieChart>
            </ChartContainer>
            <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 mt-1">
              {data.map((d, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full shrink-0" style={{ backgroundColor: d.fill }} />
                  <span className="text-xs text-muted-foreground">
                    {d.name} ({totalCount > 0 ? Math.round((d.count / totalCount) * 100) : 0}%)
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

function VerticalBarChart({ data, title }: { data: { name: string; count: number; fill: string }[]; title: string }) {
  return (
    <Card className="overflow-hidden rounded-2xl border border-border bg-card/50 hover:border-primary/30 transition-all">
      <CardContent className="p-4">
        <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3">{title}</h4>
        {data.length === 0 ? empty : (
          <ChartContainer config={{ count: { label: 'Participanți', color: 'var(--primary)' } }} className="h-[180px] w-full">
            <BarChart data={data} margin={{ left: -16, right: 8, top: 0, bottom: 0 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} allowDecimals={false} width={28} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="count" name="Participanți" radius={[4, 4, 0, 0]} barSize={28}>
                {data.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Bar>
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}

function HorizontalBarChart({ data, title }: { data: { name: string; count: number }[]; title: string }) {
  const h = Math.max(140, data.length * 40)
  return (
    <Card className="overflow-hidden rounded-2xl border border-border bg-card/50 hover:border-primary/30 transition-all">
      <CardContent className="p-4">
        <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3">{title}</h4>
        {data.length === 0 ? empty : (
          <div style={{ height: h }}>
            <ChartContainer config={{ count: { label: 'Participanți', color: 'var(--primary)' } }} className="h-full w-full">
              <BarChart data={data} layout="vertical" margin={{ left: 0, right: 8, top: 0, bottom: 0 }}>
                <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis type="number" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" name="Participanți" fill="var(--primary)" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ChartContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function DemographicsChartsClient({ participants }: Props) {
  const sexData = groupBy(participants.map(p => p.biological_sex ? (SEX_LABELS[p.biological_sex] ?? p.biological_sex) : 'Necunoscut'))

  const ageRaw: Record<string, number> = {}
  participants.forEach(p => { const g = getAgeGroup(p.birth_date); ageRaw[g] = (ageRaw[g] ?? 0) + 1 })
  const ageData = AGE_ORDER
    .filter(g => ageRaw[g] !== undefined)
    .map((g, i) => ({ name: g, count: ageRaw[g], fill: CHART_COLORS[i % CHART_COLORS.length] }))

  const genderData = groupBy(participants.map(p => p.gender ?? 'Necunoscut'))

  const eduData = groupBy(participants.map(p => p.education_level ? (EDU_LABELS[p.education_level] ?? p.education_level) : 'Necunoscut'))

  const countyMap: Record<string, number> = {}
  participants.forEach(p => { if (p.county) countyMap[p.county] = (countyMap[p.county] ?? 0) + 1 })
  const countyData = Object.entries(countyMap).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, count]) => ({ name, count }))

  const cityMap: Record<string, number> = {}
  participants.forEach(p => { if (p.city) cityMap[p.city] = (cityMap[p.city] ?? 0) + 1 })
  const cityData = Object.entries(cityMap).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, count]) => ({ name, count }))

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <DonutChart data={sexData} title="Sex Biologic" />
      <VerticalBarChart data={ageData} title="Grupă de Vârstă" />
      <DonutChart data={genderData} title="Gen" />
      <DonutChart data={eduData} title="Nivel Studii" />
      <HorizontalBarChart data={countyData} title="Top Județe" />
      <HorizontalBarChart data={cityData} title="Top Orașe" />
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add "app/(private)/(dashboard)/panou/evenimente/[id]/_components/DemographicsSection.tsx" "app/(private)/(dashboard)/panou/evenimente/[id]/_components/DemographicsChartsClient.tsx"
git commit -m "feat(stats): add demographics section with 6 charts"
```

---

## Task 6: RegistrationsChartsClient.tsx

**Files:**
- Create: `app/(private)/(dashboard)/panou/evenimente/[id]/_components/RegistrationsChartsClient.tsx`

- [ ] **Step 1: Create the component**

```tsx
'use client'

import { useMemo } from 'react'
import { AreaChart, Area, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, ReferenceLine } from 'recharts'
import { Card, CardContent } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { CalendarDays, Clock } from 'lucide-react'
import type { ProtestParticipant } from '@/services/stats.service'

type Props = {
  participants: ProtestParticipant[]
  createdAt: string
  protestDate: string
}

export function RegistrationsChartsClient({ participants, createdAt, protestDate }: Props) {
  const joined = participants.filter(p => p.status === 'joined')

  const dailyData = useMemo(() => {
    const start = new Date(createdAt)
    start.setHours(0, 0, 0, 0)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const days = Math.min(Math.ceil((today.getTime() - start.getTime()) / 86400000) + 1, 90)

    const dayMap: Record<string, number> = {}
    joined.forEach(p => {
      const key = new Date(p.joined_at).toLocaleDateString('ro-RO', { day: '2-digit', month: 'short' })
      dayMap[key] = (dayMap[key] ?? 0) + 1
    })

    return Array.from({ length: days }, (_, i) => {
      const d = new Date(start.getTime() + i * 86400000)
      const label = d.toLocaleDateString('ro-RO', { day: '2-digit', month: 'short' })
      return { label, count: dayMap[label] ?? 0 }
    })
  }, [joined, createdAt])

  const protestDateLabel = useMemo(() =>
    new Date(protestDate).toLocaleDateString('ro-RO', { day: '2-digit', month: 'short' })
  , [protestDate])

  const isProtestInFuture = new Date(protestDate) > new Date()

  const hourlyData = useMemo(() => {
    const hourMap: Record<number, number> = {}
    joined.forEach(p => { const h = new Date(p.joined_at).getHours(); hourMap[h] = (hourMap[h] ?? 0) + 1 })
    const maxCount = Math.max(...Object.values(hourMap), 0)
    return Array.from({ length: 24 }, (_, h) => ({
      label: `${h.toString().padStart(2, '0')}:00`,
      count: hourMap[h] ?? 0,
      isMax: (hourMap[h] ?? 0) === maxCount && maxCount > 0,
    }))
  }, [joined])

  const empty = (
    <div className="flex h-[200px] items-center justify-center rounded-xl bg-muted/50">
      <p className="text-sm text-muted-foreground">Nicio înregistrare</p>
    </div>
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 border-b border-border/50 pb-2">
        <CalendarDays className="size-5 text-primary" />
        <h2 className="font-heading text-xl font-bold tracking-tight text-foreground">
          Dinamica Înscrierilor
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        <Card className="overflow-hidden rounded-2xl border border-border bg-card/50 hover:border-primary/30 transition-all">
          <CardContent className="p-5 space-y-3">
            <h3 className="font-bold text-foreground text-sm">Înscrieri pe zile</h3>
            {joined.length === 0 ? empty : (
              <ChartContainer config={{ count: { label: 'Înscrieri', color: 'var(--primary)' } }} className="h-[220px] w-full">
                <AreaChart data={dailyData} margin={{ left: -16, right: 8, top: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="fill-inscriptions" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} allowDecimals={false} width={28} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  {isProtestInFuture && (
                    <ReferenceLine
                      x={protestDateLabel}
                      stroke="var(--muted-foreground)"
                      strokeDasharray="4 4"
                      label={{ value: 'Protest', position: 'top', fontSize: 10, fill: 'var(--muted-foreground)' }}
                    />
                  )}
                  <Area
                    type="monotone"
                    dataKey="count"
                    name="Înscrieri"
                    stroke="var(--primary)"
                    strokeWidth={2}
                    fill="url(#fill-inscriptions)"
                    dot={false}
                    activeDot={{ r: 4, strokeWidth: 0, fill: 'var(--primary)' }}
                  />
                </AreaChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-2xl border border-border bg-card/50 hover:border-primary/30 transition-all">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Clock className="size-4 text-primary" />
              <h3 className="font-bold text-foreground text-sm">Distribuție pe ore</h3>
            </div>
            {joined.length === 0 ? empty : (
              <ChartContainer config={{ count: { label: 'Înscrieri', color: 'var(--primary)' } }} className="h-[220px] w-full">
                <BarChart data={hourlyData} margin={{ left: -16, right: 4, top: 4, bottom: 0 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="label" tick={{ fontSize: 8, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} interval={3} />
                  <YAxis tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} allowDecimals={false} width={28} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" name="Înscrieri" radius={[3, 3, 0, 0]} barSize={8}>
                    {hourlyData.map((entry, i) => (
                      <Cell key={i} fill="var(--primary)" fillOpacity={entry.isMax ? 1 : 0.35} />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add "app/(private)/(dashboard)/panou/evenimente/[id]/_components/RegistrationsChartsClient.tsx"
git commit -m "feat(stats): add registrations charts (daily area + hourly bar)"
```

---

## Task 7: SingleEventViewsChartClient.tsx

**Files:**
- Create: `app/(private)/(dashboard)/panou/evenimente/[id]/_components/SingleEventViewsChartClient.tsx`

- [ ] **Step 1: Create the component**

```tsx
'use client'

import { useState, useTransition } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts'
import { Card, CardContent } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { TrendingUp } from 'lucide-react'
import { getEventViewsEvolution, type ViewRange, type SingleEventViewsData } from '@/services/stats.service'

const VIEW_RANGES: { value: ViewRange; label: string }[] = [
  { value: 'today', label: 'Azi' },
  { value: '7d',    label: '7 zile' },
  { value: '30d',   label: '30 zile' },
]

function makeEndDot(totalPoints: number) {
  return function EndDot({ cx, cy, index }: any) {
    if (index !== totalPoints - 1 || !cx || !cy) return null
    return (
      <g>
        <circle cx={cx} cy={cy} r={4} fill="var(--primary)" opacity={0.35}>
          <animate attributeName="r" values="4;11;4" dur="2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.35;0;0.35" dur="2s" repeatCount="indefinite" />
        </circle>
        <circle cx={cx} cy={cy} r={4} fill="var(--primary)" stroke="var(--background)" strokeWidth={2} />
      </g>
    )
  }
}

type Props = {
  eventId: string
  initialData: SingleEventViewsData
}

export function SingleEventViewsChartClient({ eventId, initialData }: Props) {
  const [range, setRange] = useState<ViewRange>('today')
  const [data, setData] = useState<SingleEventViewsData>(initialData)
  const [isPending, startTransition] = useTransition()

  function handleRange(r: ViewRange) {
    setRange(r)
    startTransition(async () => {
      const result = await getEventViewsEvolution(eventId, r)
      setData(result)
    })
  }

  const isEmpty = data.chartPoints.length === 0

  return (
    <Card className="overflow-hidden rounded-2xl border border-border bg-card/50 transition-all hover:border-primary/30">
      <CardContent className="p-5 space-y-4">

        <div className="flex flex-col gap-3 border-b border-border/50 pb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="size-4 text-primary" />
            <h3 className="font-bold text-foreground">Evoluție Vizualizări</h3>
          </div>
          <div className="flex gap-1 flex-wrap">
            {VIEW_RANGES.map(r => (
              <button
                key={r.value}
                onClick={() => handleRange(r.value)}
                disabled={isPending}
                className={`px-2.5 py-0.5 rounded-md text-xs font-medium transition-all cursor-default ${
                  range === r.value
                    ? 'bg-foreground text-background'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        <div className={`transition-opacity duration-200 ${isPending ? 'opacity-40' : 'opacity-100'}`}>
          {isEmpty ? (
            <div className="flex h-[220px] items-center justify-center rounded-xl bg-muted/50">
              <p className="text-sm font-medium text-muted-foreground">
                Nu există date pentru această perioadă
              </p>
            </div>
          ) : (
            <ChartContainer config={{ views: { label: 'Vizualizări', color: 'var(--primary)' } }} className="h-[260px] w-full">
              <AreaChart data={data.chartPoints} margin={{ left: 0, right: 8, top: 22, bottom: 0 }}>
                <defs>
                  <linearGradient id="fill-event-views" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                  width={32}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="views"
                  name="Vizualizări"
                  stroke="var(--primary)"
                  strokeWidth={2}
                  fill="url(#fill-event-views)"
                  dot={makeEndDot(data.chartPoints.length)}
                  activeDot={{ r: 4, strokeWidth: 0, fill: 'var(--primary)' }}
                />
              </AreaChart>
            </ChartContainer>
          )}
        </div>

      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add "app/(private)/(dashboard)/panou/evenimente/[id]/_components/SingleEventViewsChartClient.tsx"
git commit -m "feat(stats): add SingleEventViewsChartClient with pulsing end dot"
```

---

## Task 8: ParticipantsListClient.tsx

**Files:**
- Create: `app/(private)/(dashboard)/panou/evenimente/[id]/_components/ParticipantsListClient.tsx`

- [ ] **Step 1: Create the component**

```tsx
'use client'

import { useState } from 'react'
import { Users, ChevronLeft, ChevronRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { ProtestParticipant } from '@/services/stats.service'

const PAGE_SIZE = 20

type Props = { participants: ProtestParticipant[] }

export function ParticipantsListClient({ participants }: Props) {
  const [filter, setFilter] = useState<'joined' | 'cancelled'>('joined')
  const [page, setPage] = useState(0)

  const filtered = participants.filter(p => p.status === filter)
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const pageData = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  const joinedCount = participants.filter(p => p.status === 'joined').length
  const cancelledCount = participants.filter(p => p.status === 'cancelled').length

  function initials(name: string) {
    return name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('ro-RO', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 border-b border-border/50 pb-2">
        <div className="flex items-center gap-2">
          <Users className="size-5 text-primary" />
          <h2 className="font-heading text-xl font-bold tracking-tight text-foreground">
            Participanți ({participants.length})
          </h2>
        </div>

        <div className="ml-auto flex items-center gap-1 rounded-lg bg-muted p-1">
          {(['joined', 'cancelled'] as const).map(s => (
            <button
              key={s}
              onClick={() => { setFilter(s); setPage(0) }}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-default ${
                filter === s
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {s === 'joined' ? `Joined (${joinedCount})` : `Anulat (${cancelledCount})`}
            </button>
          ))}
        </div>
      </div>

      <Card className="overflow-hidden rounded-2xl border border-border bg-card/50">
        <CardContent className="p-0">
          {pageData.length === 0 ? (
            <div className="flex h-32 items-center justify-center">
              <p className="text-sm text-muted-foreground">Nicio intrare</p>
            </div>
          ) : (
            <ul className="divide-y divide-border/50">
              {pageData.map(p => (
                <li key={p.user_id} className="flex items-center gap-3 px-4 py-3">
                  <div className="size-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-black text-xs text-primary shrink-0">
                    {initials(p.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{p.name}</p>
                    {p.county && <p className="text-xs text-muted-foreground">{p.county}</p>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="hidden sm:block text-xs text-muted-foreground">{formatDate(p.joined_at)}</span>
                    <Badge
                      variant={p.status === 'joined' ? 'default' : 'destructive'}
                      className="text-[10px] px-2 py-0"
                    >
                      {p.status === 'joined' ? 'Joined' : 'Anulat'}
                    </Badge>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} din {filtered.length}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:border-primary/40 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-default"
            >
              <ChevronLeft className="size-3" /> Înapoi
            </button>
            <span className="px-2 text-xs font-medium text-foreground">{page + 1} / {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page === totalPages - 1}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:border-primary/40 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-default"
            >
              Înainte <ChevronRight className="size-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add "app/(private)/(dashboard)/panou/evenimente/[id]/_components/ParticipantsListClient.tsx"
git commit -m "feat(stats): add ParticipantsListClient with pagination and filter"
```

---

## Task 9: FeedbackStatsSection.tsx

**Files:**
- Create: `app/(private)/(dashboard)/panou/evenimente/[id]/_components/FeedbackStatsSection.tsx`

- [ ] **Step 1: Create the component**

```tsx
import { Star } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import type { ProtestFeedbackItem } from '@/services/stats.service'

type Props = {
  feedback: ProtestFeedbackItem[]
  averageRating: number
  status: string
}

export function FeedbackStatsSection({ feedback, averageRating, status }: Props) {
  if (status !== 'completed') return null

  const dist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  feedback.forEach(f => { dist[f.rating] = (dist[f.rating] ?? 0) + 1 })

  function initials(name: string) {
    return name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 border-b border-border/50 pb-2">
        <Star className="size-5 text-primary fill-primary" />
        <h2 className="font-heading text-xl font-bold tracking-tight text-foreground">
          Feedback ({feedback.length})
        </h2>
      </div>

      {feedback.length === 0 ? (
        <p className="text-sm text-muted-foreground italic py-8 text-center">
          Niciun feedback înregistrat.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          <Card className="overflow-hidden rounded-2xl border border-border bg-card/50">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center gap-4">
                <span className="text-5xl font-black italic tracking-tighter text-primary">
                  {averageRating.toFixed(1)}
                </span>
                <div className="space-y-1">
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star
                        key={i}
                        className={`size-5 ${i < Math.round(averageRating) ? 'fill-primary text-primary' : 'text-muted-foreground/30'}`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {feedback.length} {feedback.length === 1 ? 'recenzie' : 'recenzii'}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                {[5, 4, 3, 2, 1].map(star => {
                  const count = dist[star] ?? 0
                  const pct = feedback.length > 0 ? Math.round((count / feedback.length) * 100) : 0
                  return (
                    <div key={star} className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-muted-foreground w-3">{star}</span>
                      <Star className="size-3 fill-primary text-primary shrink-0" />
                      <Progress value={pct} className="h-2 flex-1" />
                      <span className="text-xs font-semibold text-muted-foreground w-8 text-right">{pct}%</span>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
            {feedback.map(f => (
              <div key={f.id} className="flex gap-3">
                <div className="size-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-black text-xs text-primary shrink-0">
                  {initials(f.user_name)}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-foreground">{f.user_name}</span>
                    <div className="flex gap-0.5 shrink-0">
                      {Array.from({ length: 5 }, (_, i) => (
                        <Star key={i} className={`size-3 ${i < f.rating ? 'fill-primary text-primary' : 'text-muted-foreground/30'}`} />
                      ))}
                    </div>
                  </div>
                  {f.comment && (
                    <p className="text-sm text-muted-foreground leading-relaxed">{f.comment}</p>
                  )}
                  <p className="text-xs text-muted-foreground/60">
                    {new Date(f.created_at).toLocaleDateString('ro-RO', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </div>
            ))}
          </div>

        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add "app/(private)/(dashboard)/panou/evenimente/[id]/_components/FeedbackStatsSection.tsx"
git commit -m "feat(stats): add FeedbackStatsSection with rating distribution"
```

---

## Task 10: Personal page.tsx + loading.tsx

**Files:**
- Create: `app/(private)/(dashboard)/panou/evenimente/[id]/page.tsx`
- Create: `app/(private)/(dashboard)/panou/evenimente/[id]/loading.tsx`

- [ ] **Step 1: Create page.tsx**

```tsx
import { notFound, redirect } from 'next/navigation'
import { getAuthUser } from '@/services/auth.service'
import { getProtestStats, getEventViewsEvolution } from '@/services/stats.service'
import { ProtestStatsHeader } from './_components/ProtestStatsHeader'
import { StatsKpiBanner } from './_components/StatsKpiBanner'
import { FillRateCard } from './_components/FillRateCard'
import { DemographicsSection } from './_components/DemographicsSection'
import { RegistrationsChartsClient } from './_components/RegistrationsChartsClient'
import { SingleEventViewsChartClient } from './_components/SingleEventViewsChartClient'
import { ParticipantsListClient } from './_components/ParticipantsListClient'
import { FeedbackStatsSection } from './_components/FeedbackStatsSection'

type PageProps = { params: Promise<{ id: string }> }

export default async function ProtestStatsPage({ params }: PageProps) {
  const { id } = await params
  const user = await getAuthUser()
  if (!user) redirect('/autentificare')

  const [statsData, viewsData] = await Promise.all([
    getProtestStats(id, 'user'),
    getEventViewsEvolution(id, 'today'),
  ])

  if (!statsData) notFound()

  return (
    <div className="relative min-h-screen animate-fade-in-up">
      <div className="pointer-events-none absolute inset-0 overflow-hidden -z-10">
        <div className="absolute -left-1/4 top-0 h-[400px] w-[400px] rounded-full bg-primary/5 blur-[100px]" />
      </div>

      <div className="px-4 lg:px-8 py-8 pb-16 space-y-10">
        <ProtestStatsHeader data={statsData} backHref="/panou/evenimente" />
        <StatsKpiBanner data={statsData} />
        <FillRateCard data={statsData} />
        <DemographicsSection participants={statsData.participants} />
        <RegistrationsChartsClient
          participants={statsData.participants}
          createdAt={statsData.created_at}
          protestDate={statsData.date}
        />
        <SingleEventViewsChartClient eventId={id} initialData={viewsData} />
        <ParticipantsListClient participants={statsData.participants} />
        <FeedbackStatsSection
          feedback={statsData.feedback}
          averageRating={statsData.averageRating}
          status={statsData.status}
        />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create loading.tsx**

```tsx
import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div className="px-4 lg:px-8 py-8 pb-16 space-y-10">
      <div className="space-y-3 border-b border-border/50 pb-6">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-10 w-3/4" />
        <div className="flex gap-2">
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
        <Skeleton className="h-4 w-64" />
      </div>
      <Skeleton className="h-32 w-full rounded-2xl" />
      <Skeleton className="h-44 w-full rounded-2xl" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-52 rounded-2xl" />)}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Skeleton className="h-64 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
      <Skeleton className="h-72 w-full rounded-2xl" />
      <Skeleton className="h-96 w-full rounded-2xl" />
    </div>
  )
}
```

- [ ] **Step 3: Verify the page renders without TypeScript errors**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add "app/(private)/(dashboard)/panou/evenimente/[id]/page.tsx" "app/(private)/(dashboard)/panou/evenimente/[id]/loading.tsx"
git commit -m "feat(stats): add personal protest stats page at /panou/evenimente/[id]"
```

---

## Task 11: ONG page.tsx + loading.tsx

**Files:**
- Create: `app/(private)/(dashboard)/organizatie/[id]/evenimente/[eventId]/page.tsx`
- Create: `app/(private)/(dashboard)/organizatie/[id]/evenimente/[eventId]/loading.tsx`

- [ ] **Step 1: Create page.tsx**

```tsx
import { notFound, redirect } from 'next/navigation'
import { getAuthUser } from '@/services/auth.service'
import { getProtestStats, getEventViewsEvolution } from '@/services/stats.service'
import { ProtestStatsHeader } from '@/app/(private)/(dashboard)/panou/evenimente/[id]/_components/ProtestStatsHeader'
import { StatsKpiBanner } from '@/app/(private)/(dashboard)/panou/evenimente/[id]/_components/StatsKpiBanner'
import { FillRateCard } from '@/app/(private)/(dashboard)/panou/evenimente/[id]/_components/FillRateCard'
import { DemographicsSection } from '@/app/(private)/(dashboard)/panou/evenimente/[id]/_components/DemographicsSection'
import { RegistrationsChartsClient } from '@/app/(private)/(dashboard)/panou/evenimente/[id]/_components/RegistrationsChartsClient'
import { SingleEventViewsChartClient } from '@/app/(private)/(dashboard)/panou/evenimente/[id]/_components/SingleEventViewsChartClient'
import { ParticipantsListClient } from '@/app/(private)/(dashboard)/panou/evenimente/[id]/_components/ParticipantsListClient'
import { FeedbackStatsSection } from '@/app/(private)/(dashboard)/panou/evenimente/[id]/_components/FeedbackStatsSection'

type PageProps = { params: Promise<{ id: string; eventId: string }> }

export default async function OrgProtestStatsPage({ params }: PageProps) {
  const { id, eventId } = await params
  const user = await getAuthUser()
  if (!user) redirect('/autentificare')

  const [statsData, viewsData] = await Promise.all([
    getProtestStats(eventId, 'org', id),
    getEventViewsEvolution(eventId, 'today'),
  ])

  if (!statsData) notFound()

  return (
    <div className="relative min-h-screen animate-fade-in-up">
      <div className="pointer-events-none absolute inset-0 overflow-hidden -z-10">
        <div className="absolute -left-1/4 top-0 h-[400px] w-[400px] rounded-full bg-primary/5 blur-[100px]" />
      </div>

      <div className="px-4 lg:px-8 py-8 pb-16 space-y-10">
        <ProtestStatsHeader data={statsData} backHref={`/organizatie/${id}/evenimente`} />
        <StatsKpiBanner data={statsData} />
        <FillRateCard data={statsData} />
        <DemographicsSection participants={statsData.participants} />
        <RegistrationsChartsClient
          participants={statsData.participants}
          createdAt={statsData.created_at}
          protestDate={statsData.date}
        />
        <SingleEventViewsChartClient eventId={eventId} initialData={viewsData} />
        <ParticipantsListClient participants={statsData.participants} />
        <FeedbackStatsSection
          feedback={statsData.feedback}
          averageRating={statsData.averageRating}
          status={statsData.status}
        />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create loading.tsx** (identical to Task 10 loading.tsx)

```tsx
import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div className="px-4 lg:px-8 py-8 pb-16 space-y-10">
      <div className="space-y-3 border-b border-border/50 pb-6">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-10 w-3/4" />
        <div className="flex gap-2">
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
        <Skeleton className="h-4 w-64" />
      </div>
      <Skeleton className="h-32 w-full rounded-2xl" />
      <Skeleton className="h-44 w-full rounded-2xl" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-52 rounded-2xl" />)}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Skeleton className="h-64 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
      <Skeleton className="h-72 w-full rounded-2xl" />
      <Skeleton className="h-96 w-full rounded-2xl" />
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add "app/(private)/(dashboard)/organizatie/[id]/evenimente/[eventId]/page.tsx" "app/(private)/(dashboard)/organizatie/[id]/evenimente/[eventId]/loading.tsx"
git commit -m "feat(stats): add ONG protest stats page at /organizatie/[id]/evenimente/[eventId]"
```

---

## Task 12: Add "Statistici" navigation link to DashboardEventRow

**Files:**
- Modify: `components/shared/DashboardEventRow.tsx`

The component currently links the whole row to the public event page. We add a small "Statistici →" link that only appears when `statsHref` prop is provided (only protest events on owned dashboards pass it).

- [ ] **Step 1: Read the current file**

Read: `components/shared/DashboardEventRow.tsx` (already done above — use the content from Task research)

- [ ] **Step 2: Update DashboardEventRow to accept optional statsHref**

Replace the current `Props` type and component:

```tsx
type Props = {
    event: DashboardEvent
    showStatus?: boolean
    statsHref?: string
}
```

Inside the component, after the arrow indicator `<ChevronRight>` div, add — but ONLY show the stats link when `statsHref` is provided. Since the whole row is a `<Link>`, wrap the stats button in a separate element that stops propagation:

Actually, the cleanest approach is to keep the row as a `<div>` with a separate link for the row body, and a separate stats button:

Replace the entire component body:

```tsx
export function DashboardEventRow({ event, showStatus = true, statsHref }: Props) {
    const path = CATEGORY_PATH[event.category] ?? event.category
    const href = `/evenimente/${path}/${event.id}`

    return (
        <div className="group flex items-center justify-between gap-2 p-4 transition-colors hover:bg-muted/30 sm:p-5 rounded-lg">
            <Link href={href} className="flex flex-1 min-w-0 items-center gap-4">

                <div className="relative aspect-video w-16 shrink-0 overflow-hidden rounded-lg border border-border bg-muted sm:w-20">
                    {event.banner_url ? (
                        <Image
                            src={event.banner_url}
                            alt={event.title}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                    ) : (
                        <div className="h-full w-full bg-primary/5 transition-colors group-hover:bg-primary/10" />
                    )}
                </div>

                <div className="flex flex-1 min-w-0 flex-col py-0.5">
                    <p className="truncate text-sm font-bold text-foreground transition-colors group-hover:text-primary sm:text-base">
                        {event.title}
                    </p>

                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                        <span className="text-[11px] font-medium text-muted-foreground">
                            {formatDate(event.created_at)}
                        </span>
                        <span className="h-1 w-1 rounded-full bg-border" />
                        <Badge variant="outline" className="border-transparent bg-primary/5 px-2 py-0 text-[10px] font-semibold text-primary">
                            {CATEGORY_LABEL[event.category] ?? event.category}
                        </Badge>
                        {showStatus && (
                            <span className={`rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${STATUS_CLASSES[event.status] ?? ''}`}>
                                {STATUS_LABEL[event.status] ?? event.status}
                            </span>
                        )}
                    </div>
                </div>

            </Link>

            <div className="flex items-center gap-2 shrink-0">
                {statsHref && (
                    <Link
                        href={statsHref}
                        className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-lg border border-border text-[11px] font-semibold text-muted-foreground hover:text-primary hover:border-primary/40 transition-all"
                    >
                        Statistici
                    </Link>
                )}
                <Link href={href} className="flex text-muted-foreground/30 transition-colors group-hover:text-primary">
                    <ChevronRight className="size-5 transition-transform group-hover:translate-x-1" />
                </Link>
            </div>
        </div>
    )
}
```

- [ ] **Step 3: Update EventsListSection to pass statsHref for protest events**

Read `app/(private)/(dashboard)/panou/evenimente/_components/EventsListSection.tsx`, then add `statsHref` for protest events:

In EventsListSection (or wherever DashboardEventRow is called in the personal events page), pass:
```tsx
<DashboardEventRow
  key={event.id}
  event={event as DashboardEvent}
  showStatus
  statsHref={event.category === 'protest' ? `/panou/evenimente/${event.id}` : undefined}
/>
```

- [ ] **Step 4: Update ONG events page to pass statsHref**

In `app/(private)/(dashboard)/organizatie/[id]/evenimente/page.tsx`, update DashboardEventRow usage:
```tsx
<DashboardEventRow
  key={event.id}
  event={event as DashboardEvent}
  showStatus
  statsHref={event.category === 'protest' ? `/organizatie/${id}/evenimente/${event.id}` : undefined}
/>
```

- [ ] **Step 5: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 6: Commit**

```bash
git add components/shared/DashboardEventRow.tsx "app/(private)/(dashboard)/panou/evenimente/_components/EventsListSection.tsx" "app/(private)/(dashboard)/organizatie/[id]/evenimente/page.tsx"
git commit -m "feat(stats): add Statistici link to DashboardEventRow for protest events"
```

---

## Task 13: memory.md files

**Files:**
- Create: `app/(private)/(dashboard)/panou/evenimente/[id]/_components/memory.md`
- Update: `app/(private)/(dashboard)/panou/evenimente/memory.md`
- Update: `services/memory.md`

- [ ] **Step 1: Create `_components/memory.md` for the new folder**

```markdown
# memory.md — panou/evenimente/[id]/_components

Componente pentru pagina de statistici per eveniment (protest).

## Componente Server
- **ProtestStatsHeader.tsx** — header cu buton înapoi, titlu, badge subtip, badge status, dată/orar. Props: `{ data: ProtestStatsData, backHref: string }`
- **StatsKpiBanner.tsx** — wrapper `StatsBanner` cu 4 KPI-uri (vizualizări, participanți, fill rate, rating). Props: `{ data: ProtestStatsData }`
- **FillRateCard.tsx** — progress bar fill rate + 3 cifre secundare (joined, anulat, rămase). Props: `{ data: ProtestStatsData }`
- **DemographicsSection.tsx** — wrapper server care filtrează `joined` și transmite spre `DemographicsChartsClient`. Props: `{ participants: ProtestParticipant[] }`
- **FeedbackStatsSection.tsx** — rating mediu + distribuție 5 bare + lista comentarii. Randează `null` dacă `status !== 'completed'`. Props: `{ feedback, averageRating, status }`

## Componente Client
- **DemographicsChartsClient.tsx** — 6 charts: sex biologic (donut), vârstă (bar vertical), gen (donut), studii (donut), top județe (bar orizontal), top orașe (bar orizontal). Props: `{ participants: ProtestParticipant[] }` (pre-filtrat pe joined)
- **RegistrationsChartsClient.tsx** — AreaChart înscrieri pe zile + BarChart distribuție pe ore. ReferenceLine pe data protestului dacă e viitor. Props: `{ participants, createdAt, protestDate }`
- **SingleEventViewsChartClient.tsx** — AreaChart vizualizări single event cu selector Azi/7 zile/30 zile. Pulsing dot la capăt. Punct final "Acum". Props: `{ eventId: string, initialData: SingleEventViewsData }`
- **ParticipantsListClient.tsx** — Lista paginată (20/pagină) cu toggle Joined/Anulat. Props: `{ participants: ProtestParticipant[] }`

## Dependențe principale
- `services/stats.service.ts` — tipuri `ProtestStatsData`, `ProtestParticipant`, `ProtestFeedbackItem`, `SingleEventViewsData`; funcții `getEventViewsEvolution`
- `components/shared/StatsBanner.tsx` — folosit în StatsKpiBanner
- Recharts — PieChart, BarChart, AreaChart
```

- [ ] **Step 2: Update `services/memory.md`** to include `stats.service.ts`

Add line: `- **stats.service.ts** — getProtestStats(eventId, context, orgId?), getEventViewsEvolution(eventId, range). Tipuri: ProtestStatsData, ProtestParticipant, ProtestFeedbackItem, SingleEventViewsData, ViewRange`

- [ ] **Step 3: Update `app/(private)/(dashboard)/panou/evenimente/memory.md`** to note new sub-route

Add line: `- **[id]/** — pagina statistici per eveniment (protest). Server Component cu acces protejat (creator_id check)`

- [ ] **Step 4: Commit**

```bash
git add "app/(private)/(dashboard)/panou/evenimente/[id]/_components/memory.md"
git commit -m "docs: add memory.md for protest stats components and update service memory"
```

---

## Post-Implementation Checklist

- [ ] Navigate to `/panou/evenimente` — verify "Statistici" button visible on protest event rows
- [ ] Click "Statistici" — verify page loads with header, KPI banner, fill rate card
- [ ] Verify fill rate progress bar turns green + "Aproape complet" badge when ≥ 90%
- [ ] Verify demographics section shows 6 charts (may show "Date insuficiente" if no participants)
- [ ] Verify registration charts render (or show "Nicio înregistrare" empty state)
- [ ] Verify views chart shows pulsing dot on last point
- [ ] Verify participants list paginates at 20, toggle Joined/Anulat works
- [ ] Verify feedback section hidden for non-completed events, visible for completed
- [ ] Navigate to `/organizatie/[id]/evenimente` — verify "Statistici" links work for ONG protests
- [ ] Test unauthorized access: navigate to another user's protest stats URL → expect 404
