# Etapa 9 — Moderare Admin: Design

## Goal

Implementează panoul de administrare: admin-ul poate vedea evenimentele și organizațiile în așteptare, le poate aproba sau respinge (cu notă de respingere), iar creatorul primește o notificare in-app la fiecare decizie.

## Architecture

`admin.service.ts` gestionează toate query-urile și mutațiile admin. `notification.service.ts` expune o singură funcție `createNotification` care folosește `adminClient` (service_role) pentru a bypassa RLS. Paginile admin sunt Server Components pure; singurele componente client sunt `AdminActionBarClient` și `AdminOrgActionBarClient` (butoane approve/reject) și `AdminTabsClient` (navigare). Layout-ul `/admin` face guard server-side cu `checkIsAdmin()`.

## Tech Stack

- Next.js 15 Server Components pentru toate paginile de listă și detail
- Server Actions (`'use server'`) în `admin.service.ts` și `notification.service.ts`
- `adminClient` (service_role) în `notification.service.ts` — bypass RLS la INSERT notifications
- `useRouter` + `router.refresh()` după mutații în componentele client

---

## 1. Migration

### `supabase/migrations/0012_admin_rejection_notes.sql`

```sql
ALTER TABLE events ADD COLUMN rejection_note text;
ALTER TABLE organizations ADD COLUMN rejection_note text;
```

---

## 2. Services

### `services/notification.service.ts`

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

---

### `services/admin.service.ts`

**Tipuri exportate:**

```ts
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

export type AdminEventDetail =
  | { kind: 'protest'; event: AdminEvent; detail: ProtesteDetail }
  | { kind: 'petition'; event: AdminEvent; detail: PetitieDetail }
  | { kind: 'boycott'; event: AdminEvent; detail: BoycottDetail }
  | { kind: 'community'; event: AdminEvent; detail: CommunityDetail }
  | { kind: 'charity'; event: AdminEvent; detail: CharityDetail }

// Sub-type detail shapes (only fields needed for admin review):
type ProtesteDetail = {
  date: string; time_start: string; time_end: string | null
  max_participants: number; safety_rules: string | null
  recommended_equipment: string | null; contact_person: string | null
  subcategory: string // gathering | march | picket
}
type PetitieDetail = {
  goal: number; current_signatures: number
  target_organization: string | null; contact_email: string | null
  why_important: string | null; what_is_requested: string | null
}
type BoycottDetail = {
  reason: string; method: string
  brands: { name: string; link: string | null }[]
}
type CommunityDetail = {
  subcategory: string // outdoor | donation | workshop
  date: string | null; time_start: string | null
  what_organizer_offers: string | null
  donation_type: string | null; donation_goal: number | null
}
type CharityDetail = {
  subcategory: string // concert | meet_greet | livestream | sport
  date: string | null; time_start: string | null
  donation_goal: number | null; cause: string | null
}
```

**Funcții exportate:**

### `checkIsAdmin(): Promise<boolean>`
- `supabase.auth.getUser()` → SELECT role FROM users WHERE auth_users_id = user.id
- Returnează `role === 'admin'`

### `getAdminStats(): Promise<{ pendingEvents: number, pendingOrgs: number }>`
- 2 COUNT-uri paralele: `events WHERE status='pending'` + `organizations WHERE status='pending'`

### `getPendingEvents(): Promise<AdminEvent[]>`
- SELECT din `events` JOIN `users` (creator) WHERE `status = 'pending'` ORDER BY `created_at ASC`
- Returnează `AdminEvent[]`

### `getAdminEventDetail(id: string): Promise<AdminEventDetail | null>`
- Fetch event + creator name
- Switch pe `category`:
  - `protest` → JOIN protests, JOIN (gatherings | marches | pickets) pe subcategory
  - `petition` → JOIN petitions
  - `boycott` → JOIN boycotts + boycott_brands
  - `community` → JOIN community_activities + sub-table (outdoor_activities | donations | workshops)
  - `charity` → JOIN charity_events + sub-table
- Returnează discriminated union `AdminEventDetail`

### `approveEvent(eventId: string): Promise<{ ok: true } | { error: string }>`
- Validare: `checkIsAdmin()`
- UPDATE `events SET status='approved', rejection_note=null WHERE id=eventId`
- Fetch `creator_id` + `title`
- `createNotification(creator_id, 'Eveniment aprobat ✅', 'Evenimentul tău "[title]" a fost aprobat și este acum vizibil public.')`
- Return `{ ok: true }`

### `rejectEvent(eventId: string, note: string): Promise<{ ok: true } | { error: string }>`
- Validare: `note.trim().length >= 10`, `checkIsAdmin()`
- UPDATE `events SET status='rejected', rejection_note=note WHERE id=eventId`
- Fetch `creator_id` + `title`
- `createNotification(creator_id, 'Eveniment respins ❌', 'Evenimentul tău "[title]" a fost respins. Motiv: [note]')`
- Return `{ ok: true }`

### `getPendingOrgs(): Promise<AdminOrg[]>`
- SELECT din `organizations` JOIN `users` (owner) WHERE `status = 'pending'` ORDER BY `created_at ASC`

### `approveOrg(orgId: string): Promise<{ ok: true } | { error: string }>`
- UPDATE `organizations SET status='approved' WHERE id=orgId`
- Fetch `owner_id` + `name`
- `createNotification(owner_id, 'Organizație aprobată ✅', 'Organizația "[name]" a fost aprobată și este acum vizibilă public.')`

### `rejectOrg(orgId: string, note: string): Promise<{ ok: true } | { error: string }>`
- Validare: `note.trim().length >= 10`, `checkIsAdmin()`
- UPDATE `organizations SET status='rejected', rejection_note=note WHERE id=orgId`
- Fetch `owner_id` + `name`
- `createNotification(owner_id, 'Organizație respinsă ❌', 'Organizația "[name]" a fost respinsă. Motiv: [note]')`

---

## 3. Rute & Pagini

```
app/(private)/admin/
  layout.tsx                                    ← guard: checkIsAdmin() → redirect('/panou')
  page.tsx                                      ← overview
  _components/
    AdminTabsClient.tsx                         ← tab nav
  evenimente/
    page.tsx                                    ← lista pending events
    [id]/
      page.tsx                                  ← full event detail
      _components/
        AdminActionBarClient.tsx
  organizatii/
    page.tsx                                    ← lista pending orgs
    _components/
      AdminOrgActionBarClient.tsx
```

**`admin/layout.tsx`** — Server Component:
```tsx
import { checkIsAdmin } from '@/services/admin.service'
import { redirect } from 'next/navigation'

export default async function AdminLayout({ children }) {
  const isAdmin = await checkIsAdmin()
  if (!isAdmin) redirect('/panou')
  return <>{children}</>
}
```

**`admin/page.tsx`** — overview:
- `Promise.all([getAdminStats(), getPendingEvents()])` — limit 10 events pentru tabel recent
- 2× `StatCardDashboard` (refolosit din Etapa 8): „Evenimente în așteptare" + „Organizații în așteptare"
- Tabel compact: titlu · categorie · creator · dată · link „Revizuiește →"
- `AdminTabsClient`

**`admin/evenimente/page.tsx`** — lista completă:
- `getPendingEvents()` (fără limit)
- Rânduri cu: titlu + badge categorie + creator + dată + buton „Revizuiește"
- `AdminTabsClient`

**`admin/evenimente/[id]/page.tsx`** — detaliu complet:
- `getAdminEventDetail(id)` → `notFound()` dacă null
- Layout: `AdminActionBarClient` sticky top + conținut eveniment dedesubt
- Switch pe `kind`: redă banner, titlu, descriere, galerie + câmpurile specifice sub-tipului
- Nu are sidebar de participare — bara de acțiune înlocuiește sidebar-ul

**`admin/organizatii/page.tsx`** — lista pending orgs:
- `getPendingOrgs()`
- Card per org: logo + nume + owner + dată + `AdminOrgActionBarClient`

---

## 4. Componente

### `AdminTabsClient` — `admin/_components/`
`'use client'`, `usePathname`, 2 tab-uri:
- `Evenimente` → `/admin/evenimente`
- `Organizații` → `/admin/organizatii`

Pattern identic cu `PanouTabsClient`.

### `AdminActionBarClient` — `admin/evenimente/[id]/_components/`
`'use client'`. Props: `eventId: string`, `currentStatus: string`, `rejectionNote: string | null`.

```
State: isRejecting (boolean), note (string), isLoading (boolean)

Render:
  - Badge status curent
  - Dacă status === 'pending':
      Button „Aprobă" (primary) → approveEvent(eventId)
      Button „Respinge" (outline destructive) → setIsRejecting(true)
      [dacă isRejecting]:
        Textarea (value=note, onChange, minLength=10, placeholder="Motivul respingerii...")
        Button „Confirmă respingerea" → rejectEvent(eventId, note)
        Button „Anulează" → setIsRejecting(false)
  - Dacă status !== 'pending':
      Badge status (read-only)
      [dacă rejectionNote]: afișează nota
```

### `AdminOrgActionBarClient` — `admin/organizatii/_components/`
Pattern identic cu `AdminActionBarClient`, dar apelează `approveOrg` / `rejectOrg`.
Props: `orgId: string`, `currentStatus: string`, `rejectionNote: string | null`.

---

## 5. Edge Cases

- **Non-admin accesează `/admin/*`** → layout redirect `/panou` server-side
- **Event deja aprobat/respins** → `AdminActionBarClient` ascunde butoanele, afișează status + notă
- **Reject fără notă suficientă** → validare client (disabled dacă `note.trim().length < 10`) + validare server în `rejectEvent`
- **`createNotification` eșuează** → logat silențios, nu blochează approve/reject (notificarea e best-effort)
- **`getAdminEventDetail` returnează null** → `notFound()` în page

---

## Fișiere create / modificate

| Operație | Fișier |
|---|---|
| CREATE | `supabase/migrations/0012_admin_rejection_notes.sql` |
| CREATE | `services/notification.service.ts` |
| CREATE | `services/admin.service.ts` |
| CREATE | `app/(private)/admin/layout.tsx` |
| CREATE | `app/(private)/admin/page.tsx` |
| CREATE | `app/(private)/admin/_components/AdminTabsClient.tsx` |
| CREATE | `app/(private)/admin/evenimente/page.tsx` |
| CREATE | `app/(private)/admin/evenimente/[id]/page.tsx` |
| CREATE | `app/(private)/admin/evenimente/[id]/_components/AdminActionBarClient.tsx` |
| CREATE | `app/(private)/admin/organizatii/page.tsx` |
| CREATE | `app/(private)/admin/organizatii/_components/AdminOrgActionBarClient.tsx` |
