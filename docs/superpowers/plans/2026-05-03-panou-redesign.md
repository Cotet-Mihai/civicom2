# Dashboard Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign `/panou` și `/profil` într-un layout de tip settings-page cu sidebar persistent, context switcher personal/ONG și pagina de evenimente cu statistici + charts.

**Architecture:** Se creează un route group `(dashboard)` în `(private)` care adaugă un sidebar shared tuturor sub-paginilor. Contextul personal/ONG se transmite prin search param `?context=org`. Paginile existente sunt mutate în noul route group; `/profil/editare` dispare, funcționalitatea mergând în `/profil`.

**Tech Stack:** Next.js 15 App Router, Supabase, shadcn/ui, shadcn charts (recharts), Tailwind CSS, TypeScript

---

## File Map

### Fișiere CREATE
```
app/(private)/(dashboard)/layout.tsx
app/(private)/(dashboard)/panou/page.tsx
app/(private)/(dashboard)/panou/_components/CompleteEventButtonClient.tsx
app/(private)/(dashboard)/panou/_components/ProfilePreviewPanel.tsx
app/(private)/(dashboard)/panou/_components/ProfileOrgToggleClient.tsx
app/(private)/(dashboard)/panou/evenimente/page.tsx
app/(private)/(dashboard)/panou/evenimente/_components/EventsStatsSection.tsx
app/(private)/(dashboard)/panou/evenimente/_components/EventsChartsSection.tsx
app/(private)/(dashboard)/panou/evenimente/_components/EventsListSection.tsx
app/(private)/(dashboard)/panou/evenimente/_components/EventsFilterTabsClient.tsx
app/(private)/(dashboard)/panou/evenimente/_components/EditEventWarningModalClient.tsx
app/(private)/(dashboard)/panou/participari/page.tsx
app/(private)/(dashboard)/panou/petitii/page.tsx
app/(private)/(dashboard)/panou/contestatii/page.tsx
app/(private)/(dashboard)/profil/page.tsx
app/(private)/(dashboard)/profil/_components/ProfileViewMode.tsx
app/(private)/(dashboard)/profil/_components/ProfileEditModeClient.tsx
components/layout/DashboardSidebar.tsx
components/layout/DashboardSidebarNavClient.tsx
components/layout/DashboardContextSwitcherClient.tsx
components/layout/DashboardMobileSheetClient.tsx
components/ui/chart.tsx  ← generat de shadcn
```

### Fișiere DELETE
```
app/(private)/panou/page.tsx
app/(private)/panou/_components/CompleteEventButtonClient.tsx
app/(private)/panou/_components/PanouTabsClient.tsx
app/(private)/panou/evenimente/page.tsx  (dacă există)
app/(private)/panou/participari/page.tsx
app/(private)/panou/petitii/page.tsx
app/(private)/panou/contestatii/page.tsx
app/(private)/profil/page.tsx
app/(private)/profil/editare/page.tsx
app/(private)/profil/editare/_components/ProfileEditFormClient.tsx
app/(private)/profil/editare/_components/AvatarUploadClient.tsx
```

### Fișiere MODIFY
```
services/organization.service.ts  ← adăugare getUserOrg()
services/user.service.ts          ← adăugare getMyEventsStats(), getMyEventsChartData(), getOrgCreatedEvents(), getOrgRecentStats()
```

---

## Task 1: Instalare shadcn chart

**Files:**
- Create: `components/ui/chart.tsx` (generat automat)

- [ ] **Step 1: Instalează componenta chart**

```bash
pnpm dlx shadcn@latest add chart
```

- [ ] **Step 2: Verifică că fișierul a fost creat**

```bash
ls components/ui/chart.tsx
```
Expected: fișierul există

- [ ] **Step 3: Commit**

```bash
git add components/ui/chart.tsx
git commit -m "feat(dashboard): add shadcn chart component"
```

---

## Task 2: Extensii service layer

**Files:**
- Modify: `services/organization.service.ts`
- Modify: `services/user.service.ts`

- [ ] **Step 1: Adaugă `getUserOrg` în organization.service.ts**

Adaugă după `getUserOrgId` (linia ~131):

```typescript
export async function getUserOrg(userId: string): Promise<{ id: string; name: string; logo_url: string | null } | null> {
  const supabase = await createClient()
  const { data: member } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle()
  if (!member) return null
  const { data: org } = await supabase
    .from('organizations')
    .select('id, name, logo_url')
    .eq('id', member.organization_id)
    .single()
  return org ?? null
}
```

- [ ] **Step 2: Adaugă `view_count` în `DashboardEvent` și actualizează query-urile**

```typescript
// În services/user.service.ts, modifică DashboardEvent:
export type DashboardEvent = {
  id: string
  title: string
  category: string
  subcategory: string | null
  status: string
  participants_count: number
  view_count: number  // ← adăugat
  created_at: string
  banner_url: string | null
}
```

Actualizează select-ul din `getUserCreatedEvents`:
```typescript
.select('id, title, category, subcategory, status, participants_count, view_count, created_at, banner_url')
```

Actualizează select-ul din `getUserParticipations`:
```typescript
.select('event:events!event_id(id, title, category, subcategory, status, participants_count, view_count, created_at, banner_url)')
```

- [ ] **Step 3: Adaugă tipuri și funcții noi în user.service.ts**

Adaugă după exporturile existente:

```typescript
export type EventsStats = {
  total: number
  approved: number
  pending: number
  completed: number
  rejected: number
}

export type EventsChartData = {
  topByViews: { title: string; view_count: number }[]
  topByParticipants: { title: string; participants_count: number }[]
  byCategory: { category: string; count: number }[]
  byStatus: { status: string; count: number }[]
  byMonth: { month: string; count: number }[]
}

export async function getMyEventsStats(
  context: 'user' | 'org',
  orgId?: string
): Promise<EventsStats> {
  const supabase = await createClient()
  const userId = await getUserId()
  if (!userId) return { total: 0, approved: 0, pending: 0, completed: 0, rejected: 0 }

  const query = supabase.from('events').select('status')
  const { data } = await (
    context === 'org' && orgId
      ? query.eq('organization_id', orgId).eq('creator_type', 'ngo')
      : query.eq('creator_id', userId).eq('creator_type', 'user')
  )
  const events = data ?? []

  return {
    total: events.length,
    approved: events.filter(e => e.status === 'approved').length,
    pending: events.filter(e => e.status === 'pending' || e.status === 'contested').length,
    completed: events.filter(e => e.status === 'completed').length,
    rejected: events.filter(e => e.status === 'rejected').length,
  }
}

export async function getMyEventsChartData(
  context: 'user' | 'org',
  orgId?: string
): Promise<EventsChartData> {
  const supabase = await createClient()
  const userId = await getUserId()
  if (!userId) return { topByViews: [], topByParticipants: [], byCategory: [], byStatus: [], byMonth: [] }

  const query = supabase
    .from('events')
    .select('title, view_count, participants_count, category, status, created_at')
  const { data } = await (
    context === 'org' && orgId
      ? query.eq('organization_id', orgId).eq('creator_type', 'ngo')
      : query.eq('creator_id', userId).eq('creator_type', 'user')
  )
  const events = data ?? []

  const shorten = (title: string) => title.length > 22 ? title.slice(0, 22) + '…' : title

  const topByViews = [...events]
    .sort((a, b) => b.view_count - a.view_count)
    .slice(0, 5)
    .map(e => ({ title: shorten(e.title), view_count: e.view_count }))

  const topByParticipants = [...events]
    .sort((a, b) => b.participants_count - a.participants_count)
    .slice(0, 5)
    .map(e => ({ title: shorten(e.title), participants_count: e.participants_count }))

  const categoryMap: Record<string, number> = {}
  events.forEach(e => { categoryMap[e.category] = (categoryMap[e.category] ?? 0) + 1 })
  const byCategory = Object.entries(categoryMap).map(([category, count]) => ({ category, count }))

  const statusMap: Record<string, number> = {}
  events.forEach(e => { statusMap[e.status] = (statusMap[e.status] ?? 0) + 1 })
  const byStatus = Object.entries(statusMap).map(([status, count]) => ({ status, count }))

  const now = new Date()
  const byMonth = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
    const label = d.toLocaleDateString('ro-RO', { month: 'short', year: '2-digit' })
    const count = events.filter(e => {
      const ed = new Date(e.created_at)
      return ed.getFullYear() === d.getFullYear() && ed.getMonth() === d.getMonth()
    }).length
    return { month: label, count }
  })

  return { topByViews, topByParticipants, byCategory, byStatus, byMonth }
}

export async function getOrgCreatedEvents(orgId: string, limit?: number): Promise<DashboardEvent[]> {
  const supabase = await createClient()
  const query = supabase
    .from('events')
    .select('id, title, category, subcategory, status, participants_count, created_at, banner_url')
    .eq('organization_id', orgId)
    .eq('creator_type', 'ngo')
    .order('created_at', { ascending: false })
  const { data } = limit ? await query.limit(limit) : await query
  return (data ?? []) as DashboardEvent[]
}
```

- [ ] **Step 4: Verifică că TypeScript compilează**

```bash
pnpm tsc --noEmit
```
Expected: 0 erori

- [ ] **Step 5: Commit**

```bash
git add services/organization.service.ts services/user.service.ts
git commit -m "feat(dashboard): extend service layer for dashboard context switching and charts"
```

---

## Task 3: Componente sidebar

**Files:**
- Create: `components/layout/DashboardSidebarNavClient.tsx`
- Create: `components/layout/DashboardContextSwitcherClient.tsx`
- Create: `components/layout/DashboardMobileSheetClient.tsx`
- Create: `components/layout/DashboardSidebar.tsx`

- [ ] **Step 1: Creează `DashboardSidebarNavClient.tsx`**

```typescript
// components/layout/DashboardSidebarNavClient.tsx
'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import {
  LayoutDashboard, Calendar, Users, FileText,
  AlertCircle, User, Building2, Settings,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type Org = { id: string; name: string; logo_url: string | null }
type NavItem = { label: string; href: string; Icon: React.ElementType }

export function DashboardSidebarNavClient({ org }: { org: Org | null }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const isOrgContext = searchParams.get('context') === 'org' && !!org

  const baseItems: NavItem[] = [
    { label: 'Panou', href: isOrgContext ? '/panou?context=org' : '/panou', Icon: LayoutDashboard },
    {
      label: isOrgContext ? `Evenimente ${org?.name ?? 'ONG'}` : 'Evenimentele mele',
      href: isOrgContext ? '/panou/evenimente?context=org' : '/panou/evenimente',
      Icon: Calendar,
    },
    { label: 'Participări', href: '/panou/participari', Icon: Users },
    { label: 'Petiții semnate', href: '/panou/petitii', Icon: FileText },
    { label: 'Contestații', href: '/panou/contestatii', Icon: AlertCircle },
  ]

  const orgItems: NavItem[] = org
    ? [
        { label: 'Panou ONG', href: `/organizatie/${org.id}/panou`, Icon: Building2 },
        { label: 'Membri', href: `/organizatie/${org.id}/membri`, Icon: Users },
        { label: 'Setări ONG', href: `/organizatie/${org.id}/setari`, Icon: Settings },
      ]
    : []

  const contItems: NavItem[] = [
    { label: 'Profil', href: '/profil', Icon: User },
    ...(org ? [{ label: org.name, href: `/organizatie/${org.id}/panou`, Icon: Building2 }] : []),
  ]

  function isActive(href: string) {
    const path = href.split('?')[0]
    if (path === '/panou') return pathname === '/panou'
    return pathname.startsWith(path)
  }

  return (
    <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
      <NavGroup label="Activitate" items={baseItems} isActive={isActive} />
      {isOrgContext && org && <NavGroup label="Organizație" items={orgItems} isActive={isActive} />}
      {!isOrgContext && <NavGroup label="Cont" items={contItems} isActive={isActive} />}
    </nav>
  )
}

function NavGroup({
  label, items, isActive,
}: {
  label: string
  items: NavItem[]
  isActive: (href: string) => boolean
}) {
  return (
    <div>
      <p className="px-2 pb-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <div className="space-y-0.5">
        {items.map(({ label, href, Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors border-l-2',
              isActive(href)
                ? 'border-primary bg-primary/5 text-primary'
                : 'border-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground',
            )}
          >
            <Icon className="size-4 shrink-0" />
            <span className="truncate">{label}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Creează `DashboardContextSwitcherClient.tsx`**

```typescript
// components/layout/DashboardContextSwitcherClient.tsx
'use client'

import { useSearchParams, usePathname, useRouter } from 'next/navigation'
import { ChevronDown } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

type Org = { id: string; name: string; logo_url: string | null }

type Props = {
  userName: string
  userEmail: string
  avatarUrl: string | null
  org: Org | null
}

export function DashboardContextSwitcherClient({ userName, userEmail, avatarUrl, org }: Props) {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()
  const isOrgContext = searchParams.get('context') === 'org' && !!org
  const userInitial = userName.charAt(0).toUpperCase()

  function switchTo(context: 'user' | 'org') {
    const basePath = pathname.split('?')[0]
    router.push(context === 'org' ? `${basePath}?context=org` : basePath)
  }

  if (!org) {
    return (
      <div className="flex items-center gap-3 px-4 py-4 border-b border-border">
        <Avatar className="size-9 shrink-0 border border-border/50">
          <AvatarImage src={avatarUrl ?? undefined} alt={userName} />
          <AvatarFallback className="bg-primary/10 text-sm font-bold text-primary">{userInitial}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="text-sm font-bold text-foreground truncate">{userName}</p>
          <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
        </div>
      </div>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex w-full items-center gap-3 px-4 py-4 border-b border-border hover:bg-muted/30 transition-colors focus:outline-none">
        <Avatar className="size-9 shrink-0 border border-border/50">
          {isOrgContext && org.logo_url
            ? <AvatarImage src={org.logo_url} alt={org.name} />
            : <AvatarImage src={!isOrgContext ? (avatarUrl ?? undefined) : undefined} alt={userName} />
          }
          <AvatarFallback className="bg-primary/10 text-sm font-bold text-primary">
            {isOrgContext ? org.name.charAt(0).toUpperCase() : userInitial}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0 text-left">
          <p className="text-sm font-bold text-foreground truncate">
            {isOrgContext ? org.name : userName}
          </p>
          <p className="text-xs text-muted-foreground">
            {isOrgContext ? 'Context ONG' : userEmail}
          </p>
        </div>
        <ChevronDown className="size-4 text-muted-foreground shrink-0" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-[260px] p-1.5">
        <DropdownMenuItem
          onClick={() => switchTo('user')}
          className={cn('gap-3 rounded-lg p-2 cursor-pointer', !isOrgContext && 'bg-primary/5 text-primary')}
        >
          <Avatar className="size-7">
            <AvatarImage src={avatarUrl ?? undefined} />
            <AvatarFallback className="text-xs bg-primary/10 text-primary">{userInitial}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-semibold">{userName}</p>
            <p className="text-xs text-muted-foreground">Cont personal</p>
          </div>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => switchTo('org')}
          className={cn('gap-3 rounded-lg p-2 cursor-pointer', isOrgContext && 'bg-primary/5 text-primary')}
        >
          <Avatar className="size-7">
            {org.logo_url && <AvatarImage src={org.logo_url} />}
            <AvatarFallback className="text-xs bg-primary/10 text-primary">
              {org.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-semibold">{org.name}</p>
            <p className="text-xs text-muted-foreground">Organizație</p>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

- [ ] **Step 3: Creează `DashboardMobileSheetClient.tsx`**

```typescript
// components/layout/DashboardMobileSheetClient.tsx
'use client'

import { useState } from 'react'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { DashboardContextSwitcherClient } from './DashboardContextSwitcherClient'
import { DashboardSidebarNavClient } from './DashboardSidebarNavClient'

type Org = { id: string; name: string; logo_url: string | null }

type Props = {
  userName: string
  userEmail: string
  avatarUrl: string | null
  org: Org | null
}

export function DashboardMobileSheetClient({ userName, userEmail, avatarUrl, org }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button variant="ghost" size="icon" onClick={() => setOpen(true)} aria-label="Deschide meniul">
        <Menu className="size-5" />
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-[280px] p-0 flex flex-col">
          <DashboardContextSwitcherClient
            userName={userName}
            userEmail={userEmail}
            avatarUrl={avatarUrl}
            org={org}
          />
          <DashboardSidebarNavClient org={org} />
        </SheetContent>
      </Sheet>
    </>
  )
}
```

- [ ] **Step 4: Creează `DashboardSidebar.tsx`**

```typescript
// components/layout/DashboardSidebar.tsx
import { DashboardContextSwitcherClient } from './DashboardContextSwitcherClient'
import { DashboardSidebarNavClient } from './DashboardSidebarNavClient'
import { DashboardMobileSheetClient } from './DashboardMobileSheetClient'

type Org = { id: string; name: string; logo_url: string | null }

type Props = {
  userName: string
  userEmail: string
  avatarUrl: string | null
  org: Org | null
}

export function DashboardSidebar({ userName, userEmail, avatarUrl, org }: Props) {
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-[260px] shrink-0 border-r border-border bg-background sticky top-16 h-[calc(100vh-4rem)] overflow-hidden">
        <DashboardContextSwitcherClient
          userName={userName}
          userEmail={userEmail}
          avatarUrl={avatarUrl}
          org={org}
        />
        <DashboardSidebarNavClient org={org} />
      </aside>

      {/* Mobile trigger (rendered inline în layout, nu fixed) */}
      <div className="md:hidden">
        <DashboardMobileSheetClient
          userName={userName}
          userEmail={userEmail}
          avatarUrl={avatarUrl}
          org={org}
        />
      </div>
    </>
  )
}
```

- [ ] **Step 5: Verifică build**

```bash
pnpm tsc --noEmit
```
Expected: 0 erori

- [ ] **Step 6: Commit**

```bash
git add components/layout/DashboardSidebar.tsx components/layout/DashboardSidebarNavClient.tsx components/layout/DashboardContextSwitcherClient.tsx components/layout/DashboardMobileSheetClient.tsx
git commit -m "feat(dashboard): add sidebar components with context switcher"
```

---

## Task 4: Route group `(dashboard)` + layout

**Files:**
- Create: `app/(private)/(dashboard)/layout.tsx`

- [ ] **Step 1: Creează directorul și layout-ul**

```typescript
// app/(private)/(dashboard)/layout.tsx
import { getAuthUser } from '@/services/auth.service'
import { getUserAvatarUrl } from '@/services/user.service'
import { getUserOrg } from '@/services/organization.service'
import { DashboardSidebar } from '@/components/layout/DashboardSidebar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getAuthUser()
  if (!user) return <>{children}</>

  const userName = user.user_metadata?.display_name ?? user.user_metadata?.name ?? 'Utilizator'
  const userEmail = user.email ?? ''

  const userId = user.id
  // Fetch users table id for getUserOrg — getUserOrg accepts auth user id internally
  const [avatarUrl, org] = await Promise.all([
    getUserAvatarUrl(userId),
    // getUserOrg needs the users table id, not auth id — we get it inside the function
    (async () => {
      const { createClient } = await import('@/lib/supabase/server')
      const supabase = await createClient()
      const { data } = await supabase.from('users').select('id').eq('auth_users_id', userId).single()
      if (!data) return null
      const { getUserOrg } = await import('@/services/organization.service')
      return getUserOrg(data.id)
    })(),
  ])

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      {/* Mobile hamburger */}
      <div className="absolute top-[4.5rem] left-4 z-40 md:hidden">
        <DashboardSidebar
          userName={userName}
          userEmail={userEmail}
          avatarUrl={avatarUrl}
          org={org}
        />
      </div>

      {/* Desktop sidebar */}
      <DashboardSidebar
        userName={userName}
        userEmail={userEmail}
        avatarUrl={avatarUrl}
        org={org}
      />

      <main className="flex-1 min-w-0">
        {children}
      </main>
    </div>
  )
}
```

**Notă:** `getUserOrg` în `organization.service.ts` primește `userId` din tabela `users` (nu auth.users). Layoutul face un query inline pentru a obține userId-ul din tabela users. Alternativă mai curată: adaugă `getUserOrgByAuthId(authUserId)` în organization.service.ts:

```typescript
// Adaugă în organization.service.ts
export async function getUserOrgByAuthId(authUserId: string): Promise<{ id: string; name: string; logo_url: string | null } | null> {
  const supabase = await createClient()
  const { data: userRow } = await supabase
    .from('users')
    .select('id')
    .eq('auth_users_id', authUserId)
    .single()
  if (!userRow) return null
  return getUserOrg(userRow.id)
}
```

Actualizează layout-ul să folosească `getUserOrgByAuthId`:

```typescript
// app/(private)/(dashboard)/layout.tsx — versiunea curată
import { getAuthUser } from '@/services/auth.service'
import { getUserAvatarUrl } from '@/services/user.service'
import { getUserOrgByAuthId } from '@/services/organization.service'
import { DashboardSidebar } from '@/components/layout/DashboardSidebar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getAuthUser()
  if (!user) return <>{children}</>

  const userName = user.user_metadata?.display_name ?? user.user_metadata?.name ?? 'Utilizator'
  const userEmail = user.email ?? ''

  const [avatarUrl, org] = await Promise.all([
    getUserAvatarUrl(user.id),
    getUserOrgByAuthId(user.id),
  ])

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      <DashboardSidebar
        userName={userName}
        userEmail={userEmail}
        avatarUrl={avatarUrl}
        org={org}
      />
      <main className="flex-1 min-w-0">
        {children}
      </main>
    </div>
  )
}
```

- [ ] **Step 2: Adaugă `getUserOrgByAuthId` în organization.service.ts** (înainte de layout)

```typescript
// Adaugă după getUserOrg în organization.service.ts
export async function getUserOrgByAuthId(
  authUserId: string
): Promise<{ id: string; name: string; logo_url: string | null } | null> {
  const supabase = await createClient()
  const { data: userRow } = await supabase
    .from('users')
    .select('id')
    .eq('auth_users_id', authUserId)
    .single()
  if (!userRow) return null
  return getUserOrg(userRow.id)
}
```

- [ ] **Step 3: Verifică build**

```bash
pnpm tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add app/(private)/(dashboard)/layout.tsx services/organization.service.ts
git commit -m "feat(dashboard): add (dashboard) route group layout with sidebar"
```

---

## Task 5: Migrare pagini în noul route group

**Files:**
- Create: toate paginile în `(dashboard)/` cu conținut identic, dar fără `PanouTabsClient`
- Delete: paginile vechi

- [ ] **Step 1: Creează `(dashboard)/panou/participari/page.tsx`**

```typescript
// app/(private)/(dashboard)/panou/participari/page.tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { getUserParticipations } from '@/services/user.service'
import { DashboardEventRow } from '@/components/shared/DashboardEventRow'

export const metadata: Metadata = { title: 'Participările mele' }

export default async function PanouParticipariPage() {
  const events = await getUserParticipations()

  return (
    <div className="mx-auto max-w-4xl px-4 lg:px-8 py-8 space-y-6">
      <h1 className="text-2xl font-black tracking-tight text-foreground">Participări</h1>
      <div className="space-y-1">
        {events.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <p className="text-muted-foreground">Nu participi la niciun eveniment.</p>
            <Link href="/evenimente" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
              Explorează evenimente
            </Link>
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

- [ ] **Step 2: Creează `(dashboard)/panou/petitii/page.tsx`**

```typescript
// app/(private)/(dashboard)/panou/petitii/page.tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { getUserPetitionsSigned } from '@/services/user.service'
import { DashboardEventRow } from '@/components/shared/DashboardEventRow'

export const metadata: Metadata = { title: 'Petiții semnate' }

export default async function PanouPetitiiPage() {
  const petitions = await getUserPetitionsSigned()

  return (
    <div className="mx-auto max-w-4xl px-4 lg:px-8 py-8 space-y-6">
      <h1 className="text-2xl font-black tracking-tight text-foreground">Petiții semnate</h1>
      <div className="space-y-1">
        {petitions.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <p className="text-muted-foreground">Nu ai semnat nicio petiție.</p>
            <Link href="/evenimente" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
              Explorează petiții
            </Link>
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

- [ ] **Step 3: Creează `(dashboard)/panou/contestatii/page.tsx`**

```typescript
// app/(private)/(dashboard)/panou/contestatii/page.tsx
import type { Metadata } from 'next'
import { getUserAppeals } from '@/services/user.service'

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
  return new Date(dateStr).toLocaleDateString('ro-RO', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default async function PanouContestatiePage() {
  const appeals = await getUserAppeals()

  return (
    <div className="mx-auto max-w-4xl px-4 lg:px-8 py-8 space-y-6">
      <h1 className="text-2xl font-black tracking-tight text-foreground">Contestații</h1>
      <div className="space-y-2">
        {appeals.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-muted-foreground">Nu ai nicio contestație.</p>
          </div>
        ) : (
          appeals.map(appeal => (
            <div key={appeal.id} className="flex items-center justify-between rounded-xl p-4 border border-border bg-card">
              <div>
                <p className="text-sm font-semibold text-foreground">{appeal.event_title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{formatDate(appeal.created_at)}</p>
              </div>
              <span className={`text-[10px] font-semibold px-2 py-1 rounded border ${APPEAL_STATUS_CLASSES[appeal.status] ?? ''}`}>
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

- [ ] **Step 4: Copiază fișierele care vor fi șterse odată cu directoarele vechi**

```bash
# CompleteEventButtonClient
copy "app\(private)\panou\_components\CompleteEventButtonClient.tsx" "app\(private)\(dashboard)\panou\_components\CompleteEventButtonClient.tsx"

# Componente profil/editare (refolosite în Task 8)
copy "app\(private)\profil\editare\_components\AvatarUploadClient.tsx" "app\(private)\(dashboard)\profil\_components\AvatarUploadClient.tsx"
copy "app\(private)\profil\editare\_components\ProfileEditFormClient.tsx" "app\(private)\(dashboard)\profil\_components\ProfileEditFormClient.tsx"
```

- [ ] **Step 5: Șterge directoarele vechi**

```bash
Remove-Item -Recurse -Force "app\(private)\panou"
Remove-Item -Recurse -Force "app\(private)\profil"
```

- [ ] **Step 6: Verifică că rutele funcționează**

```bash
pnpm dev
```
Deschide în browser: `/panou/participari`, `/panou/petitii`, `/panou/contestatii` — trebuie să afișeze sidebar + conținut.

- [ ] **Step 7: Commit**

```bash
git add app/(private)/(dashboard)/
git commit -m "feat(dashboard): migrate panou sub-pages to (dashboard) route group"
```

---

## Task 6: Pagina principală `/panou` — redesign

**Files:**
- Create: `app/(private)/(dashboard)/panou/page.tsx`
- Create: `app/(private)/(dashboard)/panou/_components/ProfilePreviewPanel.tsx`
- Create: `app/(private)/(dashboard)/panou/_components/ProfileOrgToggleClient.tsx`

- [ ] **Step 1: Creează `ProfilePreviewPanel.tsx`** (Server Component, afișează tot)

```typescript
// app/(private)/(dashboard)/panou/_components/ProfilePreviewPanel.tsx
import Image from 'next/image'
import { MapPin, Phone, Mail, Globe, Star, Users, Calendar } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { UserProfile } from '@/services/user.service'
import type { OrgDetail } from '@/services/organization.service'

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('ro-RO', { day: 'numeric', month: 'long', year: 'numeric' })
}

export function UserPreview({ profile }: { profile: UserProfile }) {
  const initials = profile.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <Card className="shadow-sm border-border overflow-hidden">
      <div className="h-16 bg-gradient-to-r from-primary/20 to-primary/5" />
      <CardContent className="px-4 pb-4 space-y-4 -mt-8">
        <div className="flex items-end gap-3">
          <div className="size-16 rounded-full border-2 border-background shadow overflow-hidden shrink-0 bg-primary/10 flex items-center justify-center">
            {profile.avatar_url
              ? <Image src={profile.avatar_url} alt={profile.name} width={64} height={64} className="object-cover" />
              : <span className="font-black text-lg text-primary">{initials}</span>
            }
          </div>
        </div>
        <div>
          <p className="font-black text-foreground">{profile.name}</p>
          <p className="text-xs text-muted-foreground">{profile.email}</p>
        </div>
        <div className="space-y-2 text-xs text-muted-foreground">
          {profile.city && (
            <div className="flex items-center gap-2">
              <MapPin className="size-3 text-primary shrink-0" />
              <span>{profile.city}{profile.country ? `, ${profile.country}` : ''}</span>
            </div>
          )}
          {profile.phone && (
            <div className="flex items-center gap-2">
              <Phone className="size-3 text-primary shrink-0" />
              <span>{profile.phone}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Mail className="size-3 text-primary shrink-0" />
            <span>{profile.email}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="size-3 text-primary shrink-0" />
            <span>Membru din {formatDate(profile.created_at)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function OrgPreview({ org }: { org: OrgDetail }) {
  const initials = org.name.charAt(0).toUpperCase()

  return (
    <Card className="shadow-sm border-border overflow-hidden">
      {org.banner_url
        ? <div className="h-20 relative"><Image src={org.banner_url} alt="" fill className="object-cover" /></div>
        : <div className="h-20 bg-gradient-to-r from-primary/20 to-primary/5" />
      }
      <CardContent className="px-4 pb-4 space-y-4 -mt-8">
        <div className="size-16 rounded-xl border-2 border-background shadow overflow-hidden bg-primary/10 flex items-center justify-center shrink-0">
          {org.logo_url
            ? <Image src={org.logo_url} alt={org.name} width={64} height={64} className="object-cover" />
            : <span className="font-black text-xl text-primary">{initials}</span>
          }
        </div>
        <div>
          <p className="font-black text-foreground">{org.name}</p>
          {org.description && <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{org.description}</p>}
        </div>
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Users className="size-3 text-primary" />
            <span>{org.members.length} membri</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Star className="size-3 text-primary" />
            <span>{org.rating.toFixed(1)}</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Calendar className="size-3 text-primary" />
            <span>{org.events_count} evenimente</span>
          </div>
        </div>
        {org.categories.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {org.categories.map(c => (
              <Badge key={c} variant="secondary" className="text-[10px] px-1.5 py-0">{c}</Badge>
            ))}
          </div>
        )}
        <div className="space-y-2 text-xs text-muted-foreground">
          {org.website && (
            <div className="flex items-center gap-2">
              <Globe className="size-3 text-primary shrink-0" />
              <a href={org.website} target="_blank" rel="noopener noreferrer" className="hover:text-primary truncate">{org.website}</a>
            </div>
          )}
          {org.email && (
            <div className="flex items-center gap-2">
              <Mail className="size-3 text-primary shrink-0" />
              <span>{org.email}</span>
            </div>
          )}
          {org.city && (
            <div className="flex items-center gap-2">
              <MapPin className="size-3 text-primary shrink-0" />
              <span>{org.city}{org.address ? `, ${org.address}` : ''}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 2: Creează `ProfileOrgToggleClient.tsx`**

```typescript
// app/(private)/(dashboard)/panou/_components/ProfileOrgToggleClient.tsx
'use client'

import { useState } from 'react'
import { UserPreview, OrgPreview } from './ProfilePreviewPanel'
import type { UserProfile } from '@/services/user.service'
import type { OrgDetail } from '@/services/organization.service'

type Props = {
  profile: UserProfile
  org: OrgDetail
}

export function ProfileOrgToggleClient({ profile, org }: Props) {
  const [active, setActive] = useState<'user' | 'org'>('user')

  return (
    <div className="space-y-3">
      <div className="flex gap-1 p-1 bg-muted rounded-lg">
        <button
          onClick={() => setActive('user')}
          className={`flex-1 text-xs font-semibold py-1.5 rounded-md transition-colors ${
            active === 'user' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Profil
        </button>
        <button
          onClick={() => setActive('org')}
          className={`flex-1 text-xs font-semibold py-1.5 rounded-md transition-colors truncate px-2 ${
            active === 'org' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {org.name}
        </button>
      </div>
      {active === 'user' ? <UserPreview profile={profile} /> : <OrgPreview org={org} />}
    </div>
  )
}
```

- [ ] **Step 3: Creează `(dashboard)/panou/page.tsx`**

```typescript
// app/(private)/(dashboard)/panou/page.tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import { CalendarPlus, Users, PenLine, Scale, ArrowRight } from 'lucide-react'
import {
  getUserDashboardStats, getUserCreatedEvents, getUserParticipations,
  getUserProfile, getOrgCreatedEvents,
} from '@/services/user.service'
import { getOrganizationById, getOrgDashboardStats } from '@/services/organization.service'
import { getAuthUser } from '@/services/auth.service'
import { getUserOrgByAuthId } from '@/services/organization.service'
import { StatCardDashboard } from '@/components/shared/StatCardDashboard'
import { DashboardEventRow } from '@/components/shared/DashboardEventRow'
import { Card, CardContent } from '@/components/ui/card'
import { buttonVariants } from '@/components/ui/button'
import { CompleteEventButtonClient } from './_components/CompleteEventButtonClient'
import { UserPreview, OrgPreview } from './_components/ProfilePreviewPanel'
import { ProfileOrgToggleClient } from './_components/ProfileOrgToggleClient'

export const metadata: Metadata = { title: 'Panou' }

export default async function PanouPage({
  searchParams,
}: {
  searchParams: Promise<{ context?: string }>
}) {
  const { context } = await searchParams
  const isOrgContext = context === 'org'

  const user = await getAuthUser()
  if (!user) return null

  const org = await getUserOrgByAuthId(user.id)
  const isActualOrgContext = isOrgContext && !!org

  const [stats, recentEvents, recentParticipations, profile, orgDetail] = await Promise.all([
    isActualOrgContext
      ? getOrgDashboardStats(org.id).then(s => ({
          eventsCreated: s.eventsCount,
          participations: 0,
          petitionsSigned: 0,
          appeals: 0,
        }))
      : getUserDashboardStats(),
    isActualOrgContext ? getOrgCreatedEvents(org.id, 3) : getUserCreatedEvents(3),
    isActualOrgContext ? Promise.resolve([]) : getUserParticipations(3),
    getUserProfile(),
    org ? getOrganizationById(org.id) : Promise.resolve(null),
  ])

  return (
    <div className="px-4 lg:px-8 py-8 space-y-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Conținut principal */}
        <div className="flex-1 min-w-0 space-y-8">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-foreground">Panou</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {isActualOrgContext ? `Activitatea ${org.name} pe CIVICOM✨` : 'Activitatea ta civică pe CIVICOM✨'}
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCardDashboard label="Evenimente create" value={stats.eventsCreated} icon={CalendarPlus} />
            {!isActualOrgContext && (
              <>
                <StatCardDashboard label="Participări" value={stats.participations} icon={Users} />
                <StatCardDashboard label="Petiții semnate" value={stats.petitionsSigned} icon={PenLine} />
                <StatCardDashboard label="Contestații" value={stats.appeals} icon={Scale} />
              </>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="shadow-sm shadow-black/5 border-border">
              <CardContent className="p-5 space-y-1">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    {isActualOrgContext ? `Evenimente recente ${org.name}` : 'Evenimentele mele recente'}
                  </h2>
                  <Link href={isActualOrgContext ? '/panou/evenimente?context=org' : '/panou/evenimente'} className="text-xs text-primary font-medium flex items-center gap-1 hover:underline">
                    Vezi toate <ArrowRight size={12} />
                  </Link>
                </div>
                {recentEvents.length === 0 ? (
                  <div className="py-6 text-center space-y-3">
                    <p className="text-sm text-muted-foreground">Nu există evenimente.</p>
                    <Link href="/creeaza" className={buttonVariants({ size: 'sm' })}>
                      Creează primul eveniment
                    </Link>
                  </div>
                ) : (
                  recentEvents.map(event => (
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
                  ))
                )}
              </CardContent>
            </Card>

            {!isActualOrgContext && (
              <Card className="shadow-sm shadow-black/5 border-border">
                <CardContent className="p-5 space-y-1">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      Participările mele recente
                    </h2>
                    <Link href="/panou/participari" className="text-xs text-primary font-medium flex items-center gap-1 hover:underline">
                      Vezi toate <ArrowRight size={12} />
                    </Link>
                  </div>
                  {recentParticipations.length === 0 ? (
                    <div className="py-6 text-center space-y-3">
                      <p className="text-sm text-muted-foreground">Nu participi la niciun eveniment.</p>
                      <Link href="/evenimente" className={buttonVariants({ size: 'sm', variant: 'outline' })}>
                        Explorează evenimente
                      </Link>
                    </div>
                  ) : (
                    recentParticipations.map(event => (
                      <DashboardEventRow key={event.id} event={event} showStatus={false} />
                    ))
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Preview panel dreapta */}
        {profile && (
          <div className="w-full lg:w-[300px] shrink-0">
            {orgDetail
              ? <ProfileOrgToggleClient profile={profile} org={orgDetail} />
              : <UserPreview profile={profile} />
            }
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Verifică în browser `/panou`**

Deschide `/panou` și verifică:
- Sidebar apare pe desktop
- Stats cards afișate corect
- Preview panel dreapta funcționează
- Toggle Profil/ONG apare dacă userul are ONG asociat

- [ ] **Step 5: Commit**

```bash
git add app/(private)/(dashboard)/panou/
git commit -m "feat(dashboard): redesign /panou main page with preview panel and context support"
```

---

## Task 7: Pagina `/panou/evenimente` — redesign cu charts

**Files:**
- Create: `app/(private)/(dashboard)/panou/evenimente/page.tsx`
- Create: `app/(private)/(dashboard)/panou/evenimente/_components/EventsStatsSection.tsx`
- Create: `app/(private)/(dashboard)/panou/evenimente/_components/EventsChartsSection.tsx`
- Create: `app/(private)/(dashboard)/panou/evenimente/_components/EventsFilterTabsClient.tsx`
- Create: `app/(private)/(dashboard)/panou/evenimente/_components/EditEventWarningModalClient.tsx`
- Create: `app/(private)/(dashboard)/panou/evenimente/_components/EventsListSection.tsx`

- [ ] **Step 1: Creează `EventsStatsSection.tsx`**

```typescript
// app/(private)/(dashboard)/panou/evenimente/_components/EventsStatsSection.tsx
import { CalendarCheck, Clock, CheckCircle2, XCircle, Hash } from 'lucide-react'
import { StatCardDashboard } from '@/components/shared/StatCardDashboard'
import type { EventsStats } from '@/services/user.service'

export function EventsStatsSection({ stats }: { stats: EventsStats }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
      <StatCardDashboard label="Total" value={stats.total} icon={Hash} />
      <StatCardDashboard label="Aprobate" value={stats.approved} icon={CalendarCheck} />
      <StatCardDashboard label="În așteptare" value={stats.pending} icon={Clock} />
      <StatCardDashboard label="Finalizate" value={stats.completed} icon={CheckCircle2} />
      <StatCardDashboard label="Respinse" value={stats.rejected} icon={XCircle} />
    </div>
  )
}
```

- [ ] **Step 2: Creează `EventsChartsSection.tsx`** (Client Component)

```typescript
// app/(private)/(dashboard)/panou/evenimente/_components/EventsChartsSection.tsx
'use client'

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Line, LineChart, Pie, PieChart, Cell } from 'recharts'
import { Card, CardContent } from '@/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart'
import type { EventsChartData } from '@/services/user.service'

const CATEGORY_LABELS: Record<string, string> = {
  protest: 'Protest', boycott: 'Boycott', petition: 'Petiție',
  community: 'Comunitar', charity: 'Caritabil',
}
const STATUS_LABELS: Record<string, string> = {
  pending: 'În așteptare', approved: 'Aprobat', rejected: 'Respins',
  contested: 'Contestat', completed: 'Finalizat',
}
const CATEGORY_COLORS: Record<string, string> = {
  protest: 'hsl(var(--primary))', boycott: 'hsl(var(--secondary))',
  petition: '#f97316', community: '#06b6d4', charity: '#a855f7',
}
const STATUS_COLORS: Record<string, string> = {
  pending: '#f59e0b', approved: 'hsl(var(--primary))',
  rejected: 'hsl(var(--destructive))', contested: '#f97316', completed: '#6b7280',
}

type Props = { data: EventsChartData }

export function EventsChartsSection({ data }: Props) {
  const categoryChartData = data.byCategory.map(d => ({
    ...d,
    label: CATEGORY_LABELS[d.category] ?? d.category,
    fill: CATEGORY_COLORS[d.category] ?? '#ccc',
  }))
  const statusChartData = data.byStatus.map(d => ({
    ...d,
    label: STATUS_LABELS[d.status] ?? d.status,
    fill: STATUS_COLORS[d.status] ?? '#ccc',
  }))

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top vizualizări */}
        <Card className="p-4 shadow-sm border-border">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4">Top vizualizări</p>
          {data.topByViews.length === 0
            ? <p className="text-sm text-muted-foreground py-8 text-center">Nu există date</p>
            : (
              <ChartContainer config={{ view_count: { label: 'Vizualizări', color: 'hsl(var(--primary))' } }} className="h-[180px]">
                <BarChart data={data.topByViews} layout="vertical" margin={{ left: 0, right: 8, top: 0, bottom: 0 }}>
                  <CartesianGrid horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="title" width={110} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="view_count" fill="var(--color-view_count)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ChartContainer>
            )
          }
        </Card>

        {/* Top participanți */}
        <Card className="p-4 shadow-sm border-border">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4">Top participanți</p>
          {data.topByParticipants.length === 0
            ? <p className="text-sm text-muted-foreground py-8 text-center">Nu există date</p>
            : (
              <ChartContainer config={{ participants_count: { label: 'Participanți', color: 'hsl(var(--secondary))' } }} className="h-[180px]">
                <BarChart data={data.topByParticipants} layout="vertical" margin={{ left: 0, right: 8, top: 0, bottom: 0 }}>
                  <CartesianGrid horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="title" width={110} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="participants_count" fill="var(--color-participants_count)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ChartContainer>
            )
          }
        </Card>

        {/* Distribuție categorii */}
        <Card className="p-4 shadow-sm border-border">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4">Pe categorii</p>
          {data.byCategory.length === 0
            ? <p className="text-sm text-muted-foreground py-8 text-center">Nu există date</p>
            : (
              <ChartContainer config={Object.fromEntries(categoryChartData.map(d => [d.category, { label: d.label, color: d.fill }]))} className="h-[200px]">
                <PieChart>
                  <Pie data={categoryChartData} dataKey="count" nameKey="label" innerRadius={55} outerRadius={75}>
                    {categoryChartData.map((entry) => (
                      <Cell key={entry.category} fill={entry.fill} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent nameKey="label" />} />
                  <ChartLegend content={<ChartLegendContent nameKey="label" />} />
                </PieChart>
              </ChartContainer>
            )
          }
        </Card>

        {/* Distribuție statusuri */}
        <Card className="p-4 shadow-sm border-border">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4">Pe statusuri</p>
          {data.byStatus.length === 0
            ? <p className="text-sm text-muted-foreground py-8 text-center">Nu există date</p>
            : (
              <ChartContainer config={Object.fromEntries(statusChartData.map(d => [d.status, { label: d.label, color: d.fill }]))} className="h-[200px]">
                <PieChart>
                  <Pie data={statusChartData} dataKey="count" nameKey="label" innerRadius={55} outerRadius={75}>
                    {statusChartData.map((entry) => (
                      <Cell key={entry.status} fill={entry.fill} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent nameKey="label" />} />
                  <ChartLegend content={<ChartLegendContent nameKey="label" />} />
                </PieChart>
              </ChartContainer>
            )
          }
        </Card>
      </div>

      {/* Activitate lunară - full width */}
      <Card className="p-4 shadow-sm border-border">
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4">Activitate lunară (ultimele 6 luni)</p>
        <ChartContainer config={{ count: { label: 'Evenimente', color: 'hsl(var(--primary))' } }} className="h-[160px]">
          <LineChart data={data.byMonth} margin={{ left: 0, right: 8, top: 4, bottom: 0 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Line type="monotone" dataKey="count" stroke="var(--color-count)" strokeWidth={2} dot={{ fill: 'var(--color-count)', r: 3 }} />
          </LineChart>
        </ChartContainer>
      </Card>
    </div>
  )
}
```

- [ ] **Step 3: Creează `EventsFilterTabsClient.tsx`**

```typescript
// app/(private)/(dashboard)/panou/evenimente/_components/EventsFilterTabsClient.tsx
'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import type { DashboardEvent } from '@/services/user.service'

const TABS = [
  { label: 'Toate', value: 'all' },
  { label: 'Aprobate', value: 'approved' },
  { label: 'În așteptare', value: 'pending' },
  { label: 'Finalizate', value: 'completed' },
  { label: 'Respinse', value: 'rejected' },
]

type Props = {
  children: (filtered: DashboardEvent[]) => React.ReactNode
  events: DashboardEvent[]
}

export function EventsFilterTabsClient({ events, children }: Props) {
  const [active, setActive] = useState('all')

  const filtered = active === 'all'
    ? events
    : active === 'pending'
      ? events.filter(e => e.status === 'pending' || e.status === 'contested')
      : events.filter(e => e.status === active)

  return (
    <div className="space-y-4">
      <div className="flex gap-1 overflow-x-auto border-b border-border pb-0">
        {TABS.map(tab => (
          <button
            key={tab.value}
            onClick={() => setActive(tab.value)}
            className={cn(
              'px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors',
              active === tab.value
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {children(filtered)}
    </div>
  )
}
```

- [ ] **Step 4: Creează `EditEventWarningModalClient.tsx`**

```typescript
// app/(private)/(dashboard)/panou/evenimente/_components/EditEventWarningModalClient.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

type Props = {
  eventId: string
}

export function EditEventWarningModalClient({ eventId }: Props) {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  function handleConfirm() {
    setOpen(false)
    router.push(`/evenimente/${eventId}/editare`)
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5 text-xs"
        onClick={() => setOpen(true)}
      >
        <Pencil className="size-3" />
        Editează
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="size-5 text-amber-500" />
              Atenție
            </DialogTitle>
            <DialogDescription className="text-sm leading-relaxed pt-1">
              Dacă editezi acest eveniment, el va reveni în starea{' '}
              <span className="font-semibold text-amber-600">„În așteptare"</span> și nu va mai fi
              vizibil public până la revalidarea de către un administrator.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Anulează
            </Button>
            <Button onClick={handleConfirm}>
              Da, continuă
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
```

- [ ] **Step 5: Creează `EventsListSection.tsx`**

```typescript
// app/(private)/(dashboard)/panou/evenimente/_components/EventsListSection.tsx
import Image from 'next/image'
import Link from 'next/link'
import { Eye, Users } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { CompleteEventButtonClient } from '../../_components/CompleteEventButtonClient'
import { EditEventWarningModalClient } from './EditEventWarningModalClient'
import type { DashboardEvent } from '@/services/user.service'
import { EventsFilterTabsClient } from './EventsFilterTabsClient'

const CATEGORY_LABEL: Record<string, string> = {
  protest: 'Protest', boycott: 'Boycott', petition: 'Petiție',
  community: 'Comunitar', charity: 'Caritabil',
}
const CATEGORY_PATH: Record<string, string> = {
  protest: 'protest', boycott: 'boycott', petition: 'petitie',
  community: 'comunitar', charity: 'caritabil',
}
const STATUS_LABEL: Record<string, string> = {
  pending: 'În așteptare', approved: 'Aprobat', rejected: 'Respins',
  contested: 'Contestat', completed: 'Finalizat',
}
const STATUS_CLASSES: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  approved: 'bg-primary/10 text-primary border-primary/20',
  rejected: 'bg-destructive/10 text-destructive border-destructive/20',
  contested: 'bg-orange-50 text-orange-700 border-orange-200',
  completed: 'bg-muted text-muted-foreground border-border',
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('ro-RO', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function EventsListSection({ events }: { events: DashboardEvent[] }) {
  if (events.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-muted-foreground">Nu ai creat niciun eveniment.</p>
        <Link href="/creeaza" className="mt-3 inline-block text-sm text-primary hover:underline font-medium">
          Creează primul eveniment →
        </Link>
      </div>
    )
  }

  return (
    <EventsFilterTabsClient events={events}>
      {(filtered) => (
        <div className="space-y-2">
          {filtered.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">Nu există evenimente în această categorie.</p>
          )}
          {filtered.map(event => {
            const path = CATEGORY_PATH[event.category] ?? event.category
            const href = `/evenimente/${path}/${event.id}`
            return (
              <div
                key={event.id}
                className="flex items-center gap-3 rounded-xl border border-border p-3 bg-card hover:shadow-sm transition-shadow"
              >
                <Link href={href} className="relative w-16 h-12 rounded-lg overflow-hidden border border-border shrink-0 bg-muted">
                  {event.banner_url
                    ? <Image src={event.banner_url} alt={event.title} fill className="object-cover" />
                    : <div className="w-full h-full bg-primary/10" />
                  }
                </Link>

                <div className="flex-1 min-w-0">
                  <Link href={href} className="text-sm font-semibold text-foreground hover:text-primary transition-colors truncate block">
                    {event.title}
                  </Link>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="text-xs text-muted-foreground">{formatDate(event.created_at)}</span>
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                      {CATEGORY_LABEL[event.category] ?? event.category}
                    </Badge>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${STATUS_CLASSES[event.status] ?? ''}`}>
                      {STATUS_LABEL[event.status] ?? event.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Eye className="size-3" />{event.view_count ?? 0}</span>
                    <span className="flex items-center gap-1"><Users className="size-3" />{event.participants_count}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <EditEventWarningModalClient eventId={event.id} />
                  <CompleteEventButtonClient
                    eventId={event.id}
                    category={event.category}
                    subcategory={event.subcategory}
                    status={event.status}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </EventsFilterTabsClient>
  )
}
```


Și actualizează query-urile din `getUserCreatedEvents` și `getUserParticipations` să includă `view_count` în select.

- [ ] **Step 6: Creează `(dashboard)/panou/evenimente/page.tsx`**

```typescript
// app/(private)/(dashboard)/panou/evenimente/page.tsx
import type { Metadata } from 'next'
import { getAuthUser } from '@/services/auth.service'
import { getUserCreatedEvents, getMyEventsStats, getMyEventsChartData, getOrgCreatedEvents } from '@/services/user.service'
import { getUserOrgByAuthId } from '@/services/organization.service'
import { EventsStatsSection } from './_components/EventsStatsSection'
import { EventsChartsSection } from './_components/EventsChartsSection'
import { EventsListSection } from './_components/EventsListSection'

export const metadata: Metadata = { title: 'Evenimentele mele' }

export default async function PanouEvenimentePage({
  searchParams,
}: {
  searchParams: Promise<{ context?: string }>
}) {
  const { context } = await searchParams
  const user = await getAuthUser()
  if (!user) return null

  const org = await getUserOrgByAuthId(user.id)
  const isOrgContext = context === 'org' && !!org

  const [stats, chartData, events] = await Promise.all([
    getMyEventsStats(isOrgContext ? 'org' : 'user', org?.id),
    getMyEventsChartData(isOrgContext ? 'org' : 'user', org?.id),
    isOrgContext && org ? getOrgCreatedEvents(org.id) : getUserCreatedEvents(),
  ])

  return (
    <div className="px-4 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-foreground">
          {isOrgContext ? `Evenimente ${org!.name}` : 'Evenimentele mele'}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {isOrgContext ? 'Statistici și activitate ONG' : 'Statistici și activitate personală'}
        </p>
      </div>

      <EventsStatsSection stats={stats} />
      <EventsChartsSection data={chartData} />
      <EventsListSection events={events} />
    </div>
  )
}
```

- [ ] **Step 7: Verifică în browser `/panou/evenimente`**

- Stats cards afișate
- Charts se randează (dacă există date) sau afișează "Nu există date"
- Lista cu filter tabs funcționează
- Modal avertizare apare la click pe "Editează"

- [ ] **Step 8: Commit**

```bash
git add app/(private)/(dashboard)/panou/evenimente/
git commit -m "feat(dashboard): redesign /panou/evenimente with stats, charts, and event list"
```

---

## Task 8: Pagina `/profil` — view + edit mode

**Files:**
- Create: `app/(private)/(dashboard)/profil/_components/ProfileViewMode.tsx`
- Create: `app/(private)/(dashboard)/profil/_components/ProfileEditModeClient.tsx`
- Create: `app/(private)/(dashboard)/profil/page.tsx`

Fișierele `AvatarUploadClient` și `ProfileEditFormClient` au fost deja copiate în Task 5 Step 4.

- [ ] **Step 1: Creează `ProfileViewMode.tsx`** (Server Component)

```typescript
// app/(private)/(dashboard)/profil/_components/ProfileViewMode.tsx
import Image from 'next/image'
import { Mail, Phone, MapPin, Calendar, Pencil } from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { buttonVariants } from '@/components/ui/button'
import type { UserProfile } from '@/services/user.service'

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('ro-RO', { day: 'numeric', month: 'long', year: 'numeric' })
}

export function ProfileViewMode({ profile }: { profile: UserProfile }) {
  const initials = profile.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="shadow-sm border-border overflow-hidden">
        <div className="h-20 bg-gradient-to-r from-primary/20 to-primary/5" />
        <CardContent className="px-6 pb-6 -mt-10">
          <div className="flex items-end justify-between gap-4">
            <div className="size-20 rounded-full border-4 border-background shadow overflow-hidden bg-primary/10 flex items-center justify-center shrink-0">
              {profile.avatar_url
                ? <Image src={profile.avatar_url} alt={profile.name} width={80} height={80} className="object-cover" />
                : <span className="font-black text-2xl text-primary">{initials}</span>
              }
            </div>
            <Link href="/profil?edit=true" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
              <Pencil className="size-3.5 mr-1.5" />
              Editează profil
            </Link>
          </div>
          <div className="mt-4">
            <p className="text-xl font-black text-foreground">{profile.name}</p>
            <p className="text-sm text-muted-foreground">{profile.email}</p>
          </div>
        </CardContent>
      </Card>

      {/* Informații */}
      <Card className="shadow-sm border-border">
        <CardContent className="p-6 space-y-4">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            Informații cont
          </h3>
          <div className="space-y-3">
            <InfoRow icon={Mail} label="Email" value={profile.email} />
            <InfoRow icon={Phone} label="Telefon" value={profile.phone ?? '—'} />
            <InfoRow icon={MapPin} label="Oraș" value={[profile.city, profile.country].filter(Boolean).join(', ') || '—'} />
            <InfoRow icon={Calendar} label="Membru din" value={formatDate(profile.created_at)} />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <Icon className="size-4 text-primary shrink-0" />
      <span className="text-muted-foreground font-medium w-24 shrink-0">{label}:</span>
      <span className="text-foreground">{value}</span>
    </div>
  )
}
```

- [ ] **Step 2: Creează `ProfileEditModeClient.tsx`**

```typescript
// app/(private)/(dashboard)/profil/_components/ProfileEditModeClient.tsx
'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { AvatarUploadClient } from './AvatarUploadClient'
import { ProfileEditFormClient } from './ProfileEditFormClient'
import type { UserProfile } from '@/services/user.service'

export function ProfileEditModeClient({ profile }: { profile: UserProfile }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/profil" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="size-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">Editează profilul</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Modifică informațiile afișate public</p>
        </div>
      </div>

      <Card className="shadow-sm border-border">
        <CardContent className="p-6 space-y-8">
          <div className="space-y-3">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              Fotografie profil
            </h3>
            <AvatarUploadClient
              currentAvatarUrl={profile.avatar_url}
              name={profile.name}
              userId={profile.id}
            />
          </div>
          <div className="border-t border-border pt-6 space-y-3">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              Informații cont
            </h3>
            <ProfileEditFormClient initialName={profile.name} />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
```

- [ ] **Step 3: Creează `(dashboard)/profil/page.tsx`**

```typescript
// app/(private)/(dashboard)/profil/page.tsx
import type { Metadata } from 'next'
import { getUserProfile } from '@/services/user.service'
import { notFound } from 'next/navigation'
import { ProfileViewMode } from './_components/ProfileViewMode'
import { ProfileEditModeClient } from './_components/ProfileEditModeClient'

export const metadata: Metadata = { title: 'Profilul meu' }

export default async function ProfilPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>
}) {
  const { edit } = await searchParams
  const profile = await getUserProfile()
  if (!profile) notFound()

  return (
    <div className="mx-auto max-w-2xl px-4 lg:px-8 py-8">
      {edit === 'true'
        ? <ProfileEditModeClient profile={profile} />
        : <ProfileViewMode profile={profile} />
      }
    </div>
  )
}
```

- [ ] **Step 4: Verifică în browser `/profil` și `/profil?edit=true`**

- View mode: avatar, nume, email, dată înregistrare, buton "Editează profil"
- Edit mode: upload avatar funcțional, formular salvare nume, buton înapoi
- După save → redirect la `/profil` (view mode)

- [ ] **Step 5: Commit**

```bash
git add app/(private)/(dashboard)/profil/
git commit -m "feat(dashboard): redesign /profil with inline view/edit modes"
```

---

## Task 9: Cleanup final

- [ ] **Step 1: Verifică că nu mai există referințe la `/profil/editare`**

```bash
grep -r "profil/editare" app/ --include="*.tsx" --include="*.ts"
```
Expected: 0 rezultate

- [ ] **Step 2: Verifică că nu mai există referințe la `PanouTabsClient`**

```bash
grep -r "PanouTabsClient" app/ --include="*.tsx"
```
Expected: 0 rezultate

- [ ] **Step 3: Verifică build complet**

```bash
pnpm build
```
Expected: build reușit fără erori

- [ ] **Step 4: Test manual complet în browser**

Parcurge în ordine:
1. `/panou` → sidebar vizibil, stats cards, preview panel, toggle Profil/ONG (dacă ai ONG)
2. `/panou?context=org` → context switcher activ pe ONG, date ONG
3. `/panou/evenimente` → stats + charts + lista cu tabs
4. `/panou/participari`, `/panou/petitii`, `/panou/contestatii` → sidebar prezent, conținut corect
5. `/profil` → view mode cu toate datele
6. `/profil?edit=true` → edit mode, salvare funcționează
7. Mobil (DevTools) → hamburger deschide Sheet cu navigație corectă

- [ ] **Step 5: Commit final**

```bash
git add .
git commit -m "feat(dashboard): complete settings-style dashboard redesign"
```
