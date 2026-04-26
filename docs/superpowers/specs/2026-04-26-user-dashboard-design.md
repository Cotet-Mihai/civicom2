# Etapa 8 — Dashboard Utilizator & Profil: Design

## Goal

Implementează dashboard-ul utilizatorului autentificat: pagina principală cu statistici + activitate recentă, 4 sub-rute cu liste complete, și paginile de profil cu editare nume + avatar.

## Architecture

Un singur `user.service.ts` gestionează toate query-urile legate de utilizator. Paginile de listă sunt Server Components pure — date fetched server-side. Editarea profilului și upload-ul de avatar sunt componente client izolate care apelează Server Actions. Navigarea între sub-rute se face printr-un `PanouTabsClient` cu `usePathname`.

## Tech Stack

- Next.js 15 Server Components pentru toate paginile de listă
- Server Actions (`'use server'`) în `user.service.ts`
- Supabase Storage pentru avatare (`avatars/` bucket)
- `useRouter` + `router.refresh()` după mutații
- `usePathname` pentru tab nav activ

---

## 1. Service: `services/user.service.ts`

**Funcții exportate:**

### `getUserDashboardStats(): Promise<{ eventsCreated: number, participations: number, petitionsSigned: number, appeals: number }>`
- `getUserId()` intern (același pattern ca în `participation.service.ts`)
- 4 COUNT-uri paralele via `Promise.all`:
  - `events` WHERE `creator_id = userId`
  - `event_participants` WHERE `user_id = userId AND status = 'joined'`
  - `petition_signatures` WHERE `user_id = userId`
  - `appeals` WHERE `user_id = userId`

### `getUserCreatedEvents(limit?: number): Promise<DashboardEvent[]>`
- SELECT din `events` WHERE `creator_id = userId` ORDER BY `created_at DESC`
- Returnează: `{ id, title, category, status, participants_count, created_at, banner_url }`
- `limit` opțional (3 pentru overview, undefined pentru pagina completă)

### `getUserParticipations(limit?: number): Promise<DashboardEvent[]>`
- JOIN `event_participants` → `events` WHERE `user_id = userId AND status = 'joined'`
- ORDER BY `joined_at DESC`
- Același shape ca `DashboardEvent`

### `getUserPetitionsSigned(limit?: number): Promise<DashboardEvent[]>`
- JOIN `petition_signatures` → `events` WHERE `user_id = userId`
- ORDER BY `joined_at DESC`

### `getUserAppeals(): Promise<DashboardAppeal[]>`
- SELECT din `appeals` WHERE `user_id = userId` ORDER BY `created_at DESC`
- Returnează: `{ id, event_id, event_title, status, created_at }`
- Read-only în Etapa 8; acțiunile de creare contestație vin în Etapa 10

### `getUserProfile(): Promise<UserProfile | null>`
- `supabase.auth.getUser()` pentru email
- SELECT din `users` WHERE `auth_users_id = user.id` pentru `name`, `avatar_url`, `created_at`
- Returnează: `{ name, email, avatar_url, created_at }`

### `updateUserProfile(name: string): Promise<{ ok: true } | { error: string }>`
- Validare: `name.trim().length >= 2`
- UPDATE `users` SET `name` WHERE `id = userId`

### `updateAvatar(avatarUrl: string): Promise<{ ok: true } | { error: string }>`
- UPDATE `users` SET `avatar_url` WHERE `id = userId`
- Apelat din `AvatarUploadClient` după upload în Storage

**Tipuri exportate:**
```ts
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
```

---

## 2. Rute & Pagini

```
app/(private)/
  panou/
    page.tsx                    ← overview: stats + 3 ev. recente + 3 participări recente
    _components/
      PanouTabsClient.tsx       ← tab nav cu usePathname
    evenimente/
      page.tsx                  ← lista completă evenimente create
    participari/
      page.tsx                  ← lista completă participări
    petitii/
      page.tsx                  ← lista completă petiții semnate
    contestatii/
      page.tsx                  ← lista contestații (read-only)
  profil/
    page.tsx                    ← avatar + nume + email + data înregistrării
    editare/
      page.tsx                  ← form: nume + AvatarUploadClient
      _components/
        ProfileEditFormClient.tsx
        AvatarUploadClient.tsx
```

**Layout:** Refolosește `(private)/layout.tsx` existent (DashboardNavbar). Nu e nevoie de layout dedicat cu sidebar.

**Metadata:** `export const metadata` static pe fiecare pagină. `noindex` moștenit din `(private)/layout.tsx`.

---

## 3. Componente

### `StatCardDashboard` — `components/shared/`
Server Component. Props: `label: string`, `value: number`, `icon: LucideIcon`. Card compact cu număr mare italic + label + icon.

### `DashboardEventRow` — `components/shared/`
Server Component. Props: `event: DashboardEvent`, `showStatus?: boolean`. Rând compact: banner mic (aspect 16/9, 80px lățime) + titlu + badge categorie + badge status + dată relativă.

### `PanouTabsClient` — `panou/_components/`
Client Component. `usePathname` pentru highlight activ. 4 linkuri: Evenimentele mele (`/panou/evenimente`) · Participări · Petiții · Contestații. Stilizat ca tab-uri cu `border-b`.

### `ProfileEditFormClient` — `profil/editare/_components/`
Client Component. Input `name` + buton Submit → `updateUserProfile()` Server Action → `toast.success` + `router.refresh()`. Validare client: min 2 caractere.

### `AvatarUploadClient` — `profil/editare/_components/`
Client Component. Input file (accept image/*) → preview local cu `URL.createObjectURL` → upload în Supabase Storage `avatars/{userId}/{timestamp}` → `updateAvatar(publicUrl)` → `router.refresh()`. Max 2MB validat client-side. `toast.error` la eșec.

---

## 4. Data Flow

### Overview `/panou`
```
page.tsx (Server)
  → Promise.all([
      getUserDashboardStats(),
      getUserCreatedEvents(3),
      getUserParticipations(3),
    ])
  → render:
      StatCardDashboard × 4
      DashboardEventRow × (max 3) + link "Vezi toate →" /panou/evenimente
      DashboardEventRow × (max 3) + link "Vezi toate →" /panou/participari
```

### Editare profil
```
ProfileEditFormClient
  → submit → updateUserProfile(name)
  → toast.success + router.refresh()

AvatarUploadClient
  → file select → preview local
  → supabase.storage.upload('avatars/...', file)
  → updateAvatar(publicUrl)
  → router.refresh()
```

---

## 5. Edge Cases

- **Liste goale:** `DashboardEventRow` list → `EmptyState` cu link contextual ("Creează primul eveniment" / "Explorează evenimente")
- **Avatar upload > 2MB:** `toast.error('Fișierul trebuie să fie mai mic de 2MB')`, fără upload
- **Avatar upload fail (Storage):** `toast.error`, preview revine la avatar curent
- **`updateUserProfile` name prea scurt:** `toast.error('Numele trebuie să aibă minim 2 caractere')`
- **Neautentificat:** middleware (`proxy.ts`) redirect spre `/autentificare` — nu poate ajunge la aceste pagini

---

## Fișiere create / modificate

| Operație | Fișier |
|---|---|
| CREATE | `services/user.service.ts` |
| CREATE | `components/shared/StatCardDashboard.tsx` |
| CREATE | `components/shared/DashboardEventRow.tsx` |
| CREATE | `app/(private)/panou/_components/PanouTabsClient.tsx` |
| CREATE | `app/(private)/panou/evenimente/page.tsx` |
| CREATE | `app/(private)/panou/participari/page.tsx` |
| CREATE | `app/(private)/panou/petitii/page.tsx` |
| CREATE | `app/(private)/panou/contestatii/page.tsx` |
| CREATE | `app/(private)/profil/page.tsx` |
| CREATE | `app/(private)/profil/editare/page.tsx` |
| CREATE | `app/(private)/profil/editare/_components/ProfileEditFormClient.tsx` |
| CREATE | `app/(private)/profil/editare/_components/AvatarUploadClient.tsx` |
| MODIFY | `app/(private)/panou/page.tsx` |
