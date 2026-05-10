# Notification Bell Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a bell icon to the Navbar that opens a right-side Sheet showing the user's notifications, with unread badge and bulk mark-as-read.

**Architecture:** `Navbar.tsx` (server component) fetches notifications server-side and passes them as props to `NotificationBellClient` (new client component). The bell is rendered in both desktop (`NavbarActionsClient`) and mobile (`NavbarMobileActionsClient`) navbars. Mark-as-read uses a Server Action + `router.refresh()`.

**Tech Stack:** Next.js 15 App Router, Supabase (PostgreSQL + RLS), shadcn/ui (Sheet, Button), lucide-react (Bell), Sonner (toast errors)

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Modify | `services/notification.service.ts` | Add `getUserNotifications` + `markAllNotificationsAsRead` |
| Create | `components/layout/NotificationBellClient.tsx` | Bell button + Sheet with notification list |
| Modify | `components/layout/Navbar.tsx` | Fetch notifications server-side, pass to children |
| Modify | `components/layout/NavbarActionsClient.tsx` | Accept + render bell (desktop) |
| Modify | `components/layout/NavbarMobileActionsClient.tsx` | Accept + render bell (mobile, next to hamburger) |

---

## Task 1: Extend `notification.service.ts`

**Files:**
- Modify: `services/notification.service.ts`

- [ ] **Step 1: Add `getUserNotifications` and `markAllNotificationsAsRead`**

Replace the entire file with:

```ts
'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export type Notification = {
  id: string
  title: string
  message: string
  type: string | null
  read: boolean
  created_at: string
}

export async function createNotification(
  userId: string,
  title: string,
  message: string,
  type?: string
): Promise<void> {
  const supabase = createAdminClient()
  await supabase.from('notifications').insert({ user_id: userId, title, message, type })
}

export async function getUserNotifications(userId: string): Promise<Notification[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('notifications')
    .select('id, title, message, type, read, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) return []
  return data ?? []
}

export async function markAllNotificationsAsRead(): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', user.id)
    .eq('read', false)
}
```

- [ ] **Step 2: Commit**

```bash
git add services/notification.service.ts
git commit -m "feat(notifications): add getUserNotifications and markAllNotificationsAsRead"
```

---

## Task 2: Create `NotificationBellClient`

**Files:**
- Create: `components/layout/NotificationBellClient.tsx`

- [ ] **Step 1: Create the component**

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bell } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet'
import { toast } from 'sonner'
import { markAllNotificationsAsRead, type Notification } from '@/services/notification.service'

type Props = {
    notifications: Notification[]
    unreadCount: number
}

function formatRelativeTime(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime()
    const minutes = Math.floor(diff / 60000)
    if (minutes < 1) return 'acum'
    if (minutes < 60) return `acum ${minutes} min`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `acum ${hours}h`
    const days = Math.floor(hours / 24)
    return `acum ${days}z`
}

export function NotificationBellClient({ notifications, unreadCount }: Props) {
    const [open, setOpen] = useState(false)
    const [allRead, setAllRead] = useState(false)
    const router = useRouter()

    const effectiveUnread = allRead ? 0 : unreadCount

    async function handleMarkAllRead() {
        setAllRead(true)
        try {
            await markAllNotificationsAsRead()
            router.refresh()
        } catch {
            setAllRead(false)
            toast.error('Nu s-a putut marca ca citit')
        }
    }

    return (
        <>
            <button
                className={`${buttonVariants({ variant: 'ghost', size: 'icon' })} relative`}
                aria-label="Notificări"
                onClick={() => setOpen(true)}
            >
                <Bell className="size-5" />
                {effectiveUnread > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white leading-none">
                        {effectiveUnread > 9 ? '9+' : effectiveUnread}
                    </span>
                )}
            </button>

            <Sheet open={open} onOpenChange={setOpen}>
                <SheetContent side="right" className="flex w-full flex-col p-0 sm:max-w-sm">
                    <SheetHeader className="flex flex-row items-center justify-between border-b border-border px-4 py-3">
                        <SheetTitle className="font-heading font-black">Notificări</SheetTitle>
                        {effectiveUnread > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-xs text-primary hover:bg-primary/5 hover:text-primary"
                                onClick={handleMarkAllRead}
                            >
                                Marchează toate ca citite
                            </Button>
                        )}
                    </SheetHeader>

                    <div className="flex-1 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="flex h-full items-center justify-center py-16 text-sm text-muted-foreground">
                                Nu ai notificări noi
                            </div>
                        ) : (
                            <ul className="divide-y divide-border">
                                {notifications.map((n) => {
                                    const isRead = allRead || n.read
                                    return (
                                        <li
                                            key={n.id}
                                            className={`flex gap-3 px-4 py-3 transition-colors ${isRead ? '' : 'bg-primary/5'}`}
                                        >
                                            <span className={`mt-1.5 size-2 shrink-0 rounded-full ${isRead ? 'bg-muted-foreground/40' : 'bg-primary'}`} />
                                            <div className="min-w-0 flex-1">
                                                <p className={`text-sm leading-tight ${isRead ? 'font-medium' : 'font-bold'}`}>
                                                    {n.title}
                                                </p>
                                                <p className="mt-0.5 text-xs text-muted-foreground leading-snug">
                                                    {n.message}
                                                </p>
                                                <p className="mt-1 text-[10px] text-muted-foreground/70">
                                                    {formatRelativeTime(n.created_at)}
                                                </p>
                                            </div>
                                        </li>
                                    )
                                })}
                            </ul>
                        )}
                    </div>
                </SheetContent>
            </Sheet>
        </>
    )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/layout/NotificationBellClient.tsx
git commit -m "feat(notifications): add NotificationBellClient component"
```

---

## Task 3: Wire notifications into `Navbar.tsx`

**Files:**
- Modify: `components/layout/Navbar.tsx`

- [ ] **Step 1: Import `getUserNotifications` and update data fetching**

Add `getUserNotifications` to the import from `notification.service` and update the `Promise.all` call:

```tsx
import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { getAuthUser } from '@/services/auth.service'
import { getUserOrgId } from '@/services/organization.service'
import { getUserAvatarUrl } from '@/services/user.service'
import { getUserNotifications } from '@/services/notification.service'
import { NavbarMobileClient } from './NavbarMobileClient'
import { NavbarMobileActionsClient } from './NavbarMobileActionsClient'
import { NavbarActionsClient } from './NavbarActionsClient'

export async function Navbar() {
    const user = await getAuthUser()

    const userName = user?.user_metadata?.display_name ?? user?.user_metadata?.name ?? 'Utilizator'
    const userEmail = user?.email ?? ''
    const [orgId, avatarUrl, notifications] = user
        ? await Promise.all([
              getUserOrgId(user.id),
              getUserAvatarUrl(user.id),
              getUserNotifications(user.id),
          ])
        : [null, null, []]

    const unreadCount = notifications.filter((n) => !n.read).length

    return (
        <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md shadow-sm transition-all duration-300">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 lg:px-8">

                {/* Stânga: hamburger mobil | logo desktop */}
                <div className="flex items-center gap-2">
                    <div className="md:hidden">
                        {user
                            ? <NavbarMobileActionsClient orgId={orgId} notifications={notifications} unreadCount={unreadCount} />
                            : <NavbarMobileClient />
                        }
                    </div>
                    <Link
                        href="/"
                        className="hidden md:block font-heading text-2xl font-black uppercase tracking-tighter text-primary transition-opacity hover:opacity-80"
                    >
                        CIVICOM<span className="text-primary">✨</span>
                    </Link>
                </div>

                {/* Centru: navigație desktop */}
                <nav className="hidden items-center gap-2 md:flex">
                    <Link
                        href="/evenimente"
                        className={`${buttonVariants({ variant: 'ghost', size: 'sm' })} font-semibold text-muted-foreground transition-colors hover:text-foreground`}
                    >
                        Evenimente
                    </Link>
                    <Link
                        href="/organizatii"
                        className={`${buttonVariants({ variant: 'ghost', size: 'sm' })} font-semibold text-muted-foreground transition-colors hover:text-foreground`}
                    >
                        Organizații
                    </Link>
                </nav>

                {/* Dreapta: logo mobil | actions desktop */}
                <div className="flex items-center gap-3">
                    <Link
                        href="/"
                        className="md:hidden font-heading text-2xl font-black uppercase tracking-tighter text-primary transition-opacity hover:opacity-80"
                    >
                        CIVICOM<span className="text-primary">✨</span>
                    </Link>
                    {user ? (
                        <NavbarActionsClient
                            userName={userName}
                            userEmail={userEmail}
                            orgId={orgId}
                            avatarUrl={avatarUrl}
                            notifications={notifications}
                            unreadCount={unreadCount}
                        />
                    ) : (
                        <div className="hidden items-center gap-3 md:flex">
                            <Link
                                href="/autentificare"
                                className={`${buttonVariants({ variant: 'outline', size: 'sm' })} font-semibold transition-all hover:border-primary/50 hover:bg-transparent hover:text-primary`}
                            >
                                Autentifică-te
                            </Link>
                            <Link
                                href="/inregistrare"
                                className={`${buttonVariants({ variant: 'default', size: 'sm' })} font-bold shadow-sm transition-all hover:ring-2 hover:ring-primary/20`}
                            >
                                Înregistrează-te
                            </Link>
                        </div>
                    )}
                </div>

            </div>
        </header>
    )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/layout/Navbar.tsx
git commit -m "feat(notifications): fetch notifications server-side in Navbar"
```

---

## Task 4: Add bell to desktop navbar (`NavbarActionsClient`)

**Files:**
- Modify: `components/layout/NavbarActionsClient.tsx`

- [ ] **Step 1: Add new props and render bell between "Creează eveniment" and Avatar**

Replace the entire file:

```tsx
'use client'

import Link from 'next/link'
import { useState } from 'react'
import {
    Plus, LogOut, User, LayoutDashboard,
    Calendar, FileText, AlertCircle, Building2,
} from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { signOut } from '@/services/auth.service'
import { NotificationBellClient } from './NotificationBellClient'
import type { Notification } from '@/services/notification.service'

type Props = {
    userName: string
    userEmail: string
    orgId: string | null
    avatarUrl: string | null
    notifications: Notification[]
    unreadCount: number
}

const navItems = [
    { label: 'Panou', href: '/panou', Icon: LayoutDashboard },
    { label: 'Evenimentele mele', href: '/panou/evenimente', Icon: Calendar },
    { label: 'Participări', href: '/panou/participari', Icon: Calendar },
    { label: 'Petiții semnate', href: '/panou/petitii', Icon: FileText },
    { label: 'Contestații', href: '/panou/contestatii', Icon: AlertCircle },
]

export function NavbarActionsClient({ userName, userEmail, orgId, avatarUrl, notifications, unreadCount }: Props) {
    const initial = userName?.charAt(0).toUpperCase() ?? 'U'
    const orgHref = orgId ? `/organizatie/${orgId}/panou` : '/organizatie/creeaza'
    const orgLabel = orgId ? 'Organizația mea' : 'Solicită creare ONG'
    const [signOutOpen, setSignOutOpen] = useState(false)

    return (
        <>
            <AlertDialog open={signOutOpen} onOpenChange={setSignOutOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Ieși din cont?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Vei fi deconectat și redirecționat spre pagina principală.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Anulează</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => signOut()}
                            className="bg-destructive text-white hover:bg-destructive/90"
                        >
                            Da, deconectează-mă
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* ─── Desktop ─── */}
            <div className="hidden items-center gap-3 md:flex">
                <Link
                    href="/creeaza"
                    className={`${buttonVariants({ size: 'sm' })} gap-1.5 font-bold shadow-sm transition-all hover:ring-2 hover:ring-primary/20`}
                >
                    <Plus className="size-4" />
                    Creează eveniment
                </Link>

                <NotificationBellClient notifications={notifications} unreadCount={unreadCount} />

                <DropdownMenu>
                    <DropdownMenuTrigger
                        className="rounded-full ring-2 ring-transparent transition-all hover:ring-primary/50 focus:outline-none focus:ring-primary"
                        aria-label="Meniu utilizator"
                    >
                        <Avatar className="size-8 cursor-pointer border border-border/50">
                            <AvatarImage src={avatarUrl ?? undefined} alt={userName} />
                            <AvatarFallback className="bg-primary/10 text-sm font-bold text-primary">
                                {initial}
                            </AvatarFallback>
                        </Avatar>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent align="end" className="w-64 rounded-xl p-2 shadow-lg">
                        <div className="flex flex-col gap-0.5 px-2 py-2 pb-3">
                            <span className="font-heading text-sm font-bold tracking-tight">{userName}</span>
                            <span className="text-xs font-medium text-muted-foreground">{userEmail}</span>
                        </div>

                        <DropdownMenuSeparator />

                        <DropdownMenuGroup className="py-1">
                            {navItems.map(({ label, href, Icon }) => (
                                <DropdownMenuItem key={href} render={<Link href={href} />} className="flex cursor-pointer items-center gap-2 rounded-md font-medium">
                                    <Icon className="size-4 text-muted-foreground" />
                                    {label}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuGroup>

                        <DropdownMenuSeparator />

                        <DropdownMenuGroup className="py-1">
                            <DropdownMenuItem render={<Link href={orgHref} />} className="flex cursor-pointer items-center gap-2 rounded-md font-medium">
                                <Building2 className="size-4 text-muted-foreground" />
                                {orgLabel}
                            </DropdownMenuItem>
                            <DropdownMenuItem render={<Link href="/creeaza" />} className="flex cursor-pointer items-center gap-2 rounded-md font-medium text-primary focus:bg-primary/5 focus:text-primary">
                                <Plus className="size-4" />
                                Creează eveniment
                            </DropdownMenuItem>
                        </DropdownMenuGroup>

                        <DropdownMenuSeparator />

                        <DropdownMenuGroup className="pt-1">
                            <DropdownMenuItem render={<Link href="/profil" />} className="flex cursor-pointer items-center gap-2 rounded-md font-medium">
                                <User className="size-4 text-muted-foreground" />
                                Profil
                            </DropdownMenuItem>
                            <DropdownMenuItem variant="destructive" className="mt-1 cursor-pointer rounded-md font-bold focus:bg-destructive/10" onClick={() => setSignOutOpen(true)}>
                                <LogOut className="size-4" />
                                Deconectare
                            </DropdownMenuItem>
                        </DropdownMenuGroup>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </>
    )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/layout/NavbarActionsClient.tsx
git commit -m "feat(notifications): add bell to desktop navbar"
```

---

## Task 5: Add bell to mobile navbar (`NavbarMobileActionsClient`)

**Files:**
- Modify: `components/layout/NavbarMobileActionsClient.tsx`

- [ ] **Step 1: Add new props and render bell next to hamburger trigger**

Replace the entire file:

```tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
    Menu, Plus, LogOut, User, LayoutDashboard,
    Calendar, FileText, AlertCircle, Building2, MapPin,
} from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import { signOut } from '@/services/auth.service'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { NotificationBellClient } from './NotificationBellClient'
import type { Notification } from '@/services/notification.service'

type Props = {
    orgId: string | null
    notifications: Notification[]
    unreadCount: number
}

const navItems = [
    { label: 'Panou', href: '/panou', Icon: LayoutDashboard },
    { label: 'Evenimentele mele', href: '/panou/evenimente', Icon: Calendar },
    { label: 'Participări', href: '/panou/participari', Icon: Calendar },
    { label: 'Petiții semnate', href: '/panou/petitii', Icon: FileText },
    { label: 'Contestații', href: '/panou/contestatii', Icon: AlertCircle },
]

export function NavbarMobileActionsClient({ orgId, notifications, unreadCount }: Props) {
    const [open, setOpen] = useState(false)
    const [signOutOpen, setSignOutOpen] = useState(false)

    const orgHref = orgId ? `/organizatie/${orgId}/panou` : '/organizatie/creeaza'
    const orgLabel = orgId ? 'Organizația mea' : 'Solicită creare ONG'

    function close() {
        setOpen(false)
    }

    return (
        <>
            <div className="flex items-center gap-1">
                <button
                    className={`${buttonVariants({ variant: 'ghost', size: 'icon' })} md:hidden hover:bg-primary/5 hover:text-primary`}
                    aria-label="Deschide meniul"
                    onClick={() => setOpen(true)}
                >
                    <Menu className="size-5" />
                </button>
                <NotificationBellClient notifications={notifications} unreadCount={unreadCount} />
            </div>

            <Sheet open={open} onOpenChange={setOpen}>
                <SheetContent side="left" className="flex w-[300px] flex-col border-r-border/50 bg-background/95 backdrop-blur-md sm:w-[350px] p-2">
                    <SheetHeader className="pb-2">
                        <SheetTitle className="text-left font-heading text-2xl font-black uppercase tracking-tighter text-primary">
                            CIVICOM<span className="text-primary">✨</span>
                        </SheetTitle>
                    </SheetHeader>

                    <div className="mt-4 flex flex-1 flex-col gap-1 overflow-y-auto">
                        <p className="px-2 pb-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                            Explorează
                        </p>
                        <Link href="/evenimente" onClick={close} className={`${buttonVariants({ variant: 'ghost', size: 'default' })} justify-start gap-3 font-semibold`}>
                            <MapPin className="size-4 text-primary" />
                            Evenimente
                        </Link>
                        <Link href="/organizatii" onClick={close} className={`${buttonVariants({ variant: 'ghost', size: 'default' })} justify-start gap-3 font-semibold`}>
                            <Building2 className="size-4 text-primary" />
                            Organizații
                        </Link>

                        <Separator className="my-4 opacity-50" />

                        <p className="px-2 pb-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                            Contul meu
                        </p>
                        {navItems.map(({ label, href, Icon }) => (
                            <Link key={href} href={href} onClick={close} className={`${buttonVariants({ variant: 'ghost', size: 'default' })} justify-start gap-3 font-medium text-muted-foreground hover:text-foreground`}>
                                <Icon className="size-4" />
                                {label}
                            </Link>
                        ))}

                        <Separator className="my-4 opacity-50" />

                        <Link href={orgHref} onClick={close} className={`${buttonVariants({ variant: 'ghost', size: 'default' })} justify-start gap-3 font-medium text-muted-foreground hover:text-foreground`}>
                            <Building2 className="size-4" />
                            {orgLabel}
                        </Link>
                        <Link href="/creeaza" onClick={close} className={`${buttonVariants({ variant: 'secondary', size: 'default' })} mt-2 justify-start gap-3 font-bold text-primary hover:bg-primary/10`}>
                            <Plus className="size-4" />
                            Creează eveniment
                        </Link>

                        <Separator className="my-4 opacity-50" />

                        <Link href="/profil" onClick={close} className={`${buttonVariants({ variant: 'ghost', size: 'default' })} justify-start gap-3 font-medium text-muted-foreground hover:text-foreground`}>
                            <User className="size-4" />
                            Profil
                        </Link>
                    </div>

                    <div className="border-t border-border/50 pt-4">
                        <Button
                            variant="destructive"
                            className="w-full gap-2 font-bold"
                            onClick={() => { close(); setSignOutOpen(true) }}
                        >
                            <LogOut className="size-4" />
                            Deconectare
                        </Button>
                    </div>
                </SheetContent>
            </Sheet>

            <AlertDialog open={signOutOpen} onOpenChange={setSignOutOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Ieși din cont?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Vei fi deconectat și redirecționat spre pagina principală.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Anulează</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => signOut()}
                            className="bg-destructive text-white hover:bg-destructive/90"
                        >
                            Da, deconectează-mă
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/layout/NavbarMobileActionsClient.tsx
git commit -m "feat(notifications): add bell to mobile navbar"
```

---

## Verification

After all tasks are complete:

- [ ] Start dev server: `pnpm dev`
- [ ] Log in as a user that has existing notifications in the DB
- [ ] **Desktop:** confirm bell appears between "Creează eveniment" and avatar; badge shows unread count
- [ ] **Desktop:** click bell → Sheet slides from right; notifications listed with correct read/unread styles
- [ ] **Desktop:** click "Marchează toate ca citite" → badge disappears, dots turn muted, button hides
- [ ] **Mobile:** confirm bell appears next to hamburger icon
- [ ] **Mobile:** click bell → same Sheet behavior as desktop
- [ ] Log in as a user with zero notifications → bell has no badge; Sheet shows empty state text
