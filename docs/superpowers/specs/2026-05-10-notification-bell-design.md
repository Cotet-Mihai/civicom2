# Notification Bell — Design Spec
**Date:** 2026-05-10  
**Status:** Approved

---

## Overview

Add a notification bell icon to the `Navbar` that, when clicked, opens a Sheet drawer from the right showing the user's notifications. Unread notifications are visually highlighted and can be marked as read in bulk.

---

## Data Layer

### `notification.service.ts` additions

**`getUserNotifications(userId: string)`**
- Queries `notifications` table filtered by `user_id`
- Returns last 20 rows ordered by `created_at DESC`
- Returns `{ id, title, message, type, read, created_at }[]`
- Uses `createClient()` (server client, respects RLS)

**`markAllNotificationsAsRead(userId: string)`**
- Updates all rows where `user_id = userId AND read = false` → `read = true`
- Uses `createClient()` (server client)
- Returns `void`

### Database schema (existing)

```
notifications
  id          uuid PK
  user_id     uuid FK → users
  type        text nullable
  title       text
  message     text
  read        boolean default false
  created_at  timestamptz default now()
```

---

## Component Architecture

### `Navbar.tsx` (server component — existing, modified)

Fetches notification data server-side alongside existing `orgId` and `avatarUrl` fetches:

```ts
const [orgId, avatarUrl, notifications] = user
  ? await Promise.all([
      getUserOrgId(user.id),
      getUserAvatarUrl(user.id),
      getUserNotifications(user.id),
    ])
  : [null, null, []]

const unreadCount = notifications.filter(n => !n.read).length
```

Passes `notifications` and `unreadCount` as props to:
- `NavbarActionsClient` (desktop)
- `NavbarMobileActionsClient` (mobile)

### `NotificationBellClient.tsx` (new client component)

**Props:**
```ts
type Props = {
  notifications: Notification[]
  unreadCount: number
}
```

**Bell button:**
- Icon: `Bell` from lucide-react
- Variant: `ghost`, size: `icon`
- Badge: red dot with `unreadCount` number, hidden when `unreadCount === 0`
- Badge position: absolute top-right of the button

**Sheet (right side):**
- Width: `w-96` on desktop, full width on mobile (`sm:max-w-sm`)
- Header: "Notificări" title + "Marchează toate ca citite" button (visible only when `unreadCount > 0`)
- Body: scrollable list of notification items
- Empty state: centered text "Nu ai notificări noi"

**Notification item:**
- Unread: `bg-primary/5` background, title `font-bold`, green dot indicator
- Read: normal background, normal title, muted dot
- Content: dot + title + message (text-sm text-muted-foreground) + relative time (e.g., "acum 2 ore")
- No individual mark-as-read on click (bulk only, keeps UI simple)

**Mark all as read interaction:**
- Calls `markAllNotificationsAsRead` Server Action
- Calls `router.refresh()` to re-fetch data and update badge count
- Button becomes disabled/hidden immediately after click (optimistic)

---

## Placement

### Desktop — `NavbarActionsClient.tsx` (modified)

New props added: `notifications`, `unreadCount`

Bell placed between the "Creează eveniment" button and the Avatar dropdown:
```
[+ Creează eveniment]  [🔔 badge]  [Avatar ▾]
```

### Mobile — `NavbarMobileActionsClient.tsx` (modified)

New props added: `notifications`, `unreadCount`

Bell placed next to the hamburger trigger button:
```
[☰ hamburger]  [🔔 badge]   ...logo...
```

---

## Error Handling

- If `getUserNotifications` fails, default to empty array — bell renders without badge, no crash
- `markAllNotificationsAsRead` failure: no optimistic update, show toast error via Sonner

---

## Out of Scope

- Individual per-notification mark-as-read
- Notification types with different icons
- Real-time updates (Supabase Realtime subscription)
- Pagination beyond the last 20 notifications
- Dedicated `/panou/notificari` page
