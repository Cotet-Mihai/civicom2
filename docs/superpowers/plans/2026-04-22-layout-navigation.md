# Layout & Navigație — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementarea componentelor globale `PublicNavbar`, `DashboardNavbar`, `Footer` și a layout-urilor pentru route group-urile `(public)` și `(private)`.

**Architecture:** Server Components pentru navbar/footer cu date; Client Components granulare extrase pentru interactivitate (Sheet, DropdownMenu). `DashboardNavbar` fetch-uiește sesiunea + apartenența ONG pe server, pasează props la client. Paginile placeholder `/` și `/panou` înlocuiesc `app/page.tsx`.

**Tech Stack:** Next.js 15 App Router, Supabase SSR, shadcn/ui (Sheet, DropdownMenu, Avatar, Separator), Tailwind CSS, lucide-react

---

## File Map

| Fișier | Acțiune | Responsabilitate |
|---|---|---|
| `components/layout/Footer.tsx` | Creat | Footer dark, 4 coloane, server |
| `components/layout/PublicNavbarMobileClient.tsx` | Creat | Sheet mobil pentru public navbar, client |
| `components/layout/PublicNavbar.tsx` | Creat | Header public, sticky, server |
| `components/layout/DashboardNavbarActionsClient.tsx` | Creat | Dropdown + Sheet dashboard, client |
| `components/layout/DashboardNavbar.tsx` | Creat | Header dashboard, fetch sesiune+ONG, server |
| `services/organization.service.ts` | Creat | `getUserOrgId` — query membership ONG |
| `app/(public)/layout.tsx` | Creat | PublicNavbar + Footer wrap |
| `app/(private)/layout.tsx` | Creat | DashboardNavbar wrap + robots noindex |
| `app/(public)/page.tsx` | Creat | Placeholder `/` |
| `app/(private)/panou/page.tsx` | Creat | Placeholder `/panou` |
| `app/page.tsx` | Șters | Înlocuit de `app/(public)/page.tsx` |

---

## Task 1: Branch + Instalare shadcn

**Files:**
- Niciun fișier de cod modificat; componente shadcn generate automat

- [ ] **Creare branch**

```bash
git checkout -b feat/layout-navigation
```

- [ ] **Instalare componente shadcn**

```bash
pnpm dlx shadcn@latest add sheet
pnpm dlx shadcn@latest add dropdown-menu
pnpm dlx shadcn@latest add avatar
pnpm dlx shadcn@latest add separator
```

- [ ] **Verificare componente generate**

```bash
ls components/ui/
```

Așteptat: `sheet.tsx`, `dropdown-menu.tsx`, `avatar.tsx`, `separator.tsx` prezente alături de cele existente.

- [ ] **TypeScript check**

```bash
pnpm tsc --noEmit
```

Așteptat: 0 erori.

---

## Task 2: Footer

**Files:**
- Create: `components/layout/Footer.tsx`

- [ ] **Creare director**

```bash
mkdir -p components/layout
```

- [ ] **Creare `components/layout/Footer.tsx`**

```tsx
import Link from 'next/link'

const footerSections = {
  Platformă: [
    { label: 'Acasă', href: '/' },
    { label: 'Evenimente', href: '/evenimente' },
    { label: 'Organizații', href: '/organizatii' },
  ],
  Resurse: [
    { label: 'Cum funcționează', href: '#' },
    { label: 'Ghid voluntari', href: '#' },
    { label: 'Întrebări frecvente', href: '#' },
  ],
  Legal: [
    { label: 'Termeni și condiții', href: '#' },
    { label: 'Politică confidențialitate', href: '#' },
    { label: 'Cookies', href: '#' },
    { label: 'Contact', href: '#' },
  ],
}

export function Footer() {
  return (
    <footer className="border-t border-border bg-foreground">
      <div className="mx-auto max-w-7xl px-4 py-12 lg:px-8 lg:py-16">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">

          {/* Brand */}
          <div className="lg:col-span-1">
            <Link
              href="/"
              className="font-heading text-xl font-extrabold tracking-tight text-background"
            >
              CIVICOM✨
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-background/60">
              Platforma care conectează cetățenii și ONG-urile pentru a construi
              comunități mai puternice.
            </p>
            <div className="mt-6 flex gap-3">
              {socialLinks.map((s) => (
                <a
                  key={s.name}
                  href={s.href}
                  aria-label={s.name}
                  className="flex size-9 items-center justify-center rounded-lg bg-background/10 text-background/70 transition-colors hover:bg-green-600 hover:text-white"
                >
                  <s.Icon />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerSections).map(([title, links]) => (
            <div key={title}>
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-background/60">
                {title}
              </h3>
              <ul className="flex flex-col gap-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-background/60 transition-colors hover:text-green-400"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-background/10 pt-8 md:flex-row">
          <p className="text-xs text-background/40">
            &copy; {new Date().getFullYear()} CIVICOM✨. Toate drepturile rezervate.
          </p>
          <p className="text-xs text-background/40">
            Construit cu încredere pentru comunitate.
          </p>
        </div>
      </div>
    </footer>
  )
}

/* SVG icons inline — fără dependențe extra */
const socialLinks = [
  {
    name: 'Facebook',
    href: '#',
    Icon: () => (
      <svg className="size-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
  {
    name: 'Instagram',
    href: '#',
    Icon: () => (
      <svg className="size-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
      </svg>
    ),
  },
  {
    name: 'Twitter / X',
    href: '#',
    Icon: () => (
      <svg className="size-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    name: 'LinkedIn',
    href: '#',
    Icon: () => (
      <svg className="size-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
  },
]
```

- [ ] **TypeScript check**

```bash
pnpm tsc --noEmit
```

Așteptat: 0 erori.

---

## Task 3: PublicNavbarMobileClient

**Files:**
- Create: `components/layout/PublicNavbarMobileClient.tsx`

- [ ] **Creare `components/layout/PublicNavbarMobileClient.tsx`**

```tsx
'use client'

import Link from 'next/link'
import { Menu } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'

export function PublicNavbarMobileClient() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label="Deschide meniul"
        >
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>

      <SheetContent side="left" className="flex w-72 flex-col">
        <SheetHeader>
          <SheetTitle className="text-left font-heading text-xl font-extrabold text-green-700">
            CIVICOM✨
          </SheetTitle>
        </SheetHeader>

        <nav className="mt-6 flex flex-1 flex-col gap-1">
          <Link
            href="/"
            className={buttonVariants({ variant: 'ghost', size: 'default' }) + ' justify-start'}
          >
            Acasă
          </Link>
          <Link
            href="/evenimente"
            className={buttonVariants({ variant: 'ghost', size: 'default' }) + ' justify-start'}
          >
            Evenimente
          </Link>
          <Link
            href="/organizatii"
            className={buttonVariants({ variant: 'ghost', size: 'default' }) + ' justify-start'}
          >
            Organizații
          </Link>
        </nav>

        <div className="flex flex-col gap-2 border-t border-border pt-4">
          <Link
            href="/autentificare"
            className={buttonVariants({ variant: 'outline' }) + ' w-full justify-center'}
          >
            Autentifică-te
          </Link>
          <Link
            href="/inregistrare"
            className={buttonVariants({ variant: 'default' }) + ' w-full justify-center bg-green-600 hover:bg-green-700 text-white'}
          >
            Înregistrează-te
          </Link>
        </div>
      </SheetContent>
    </Sheet>
  )
}
```

- [ ] **TypeScript check**

```bash
pnpm tsc --noEmit
```

Așteptat: 0 erori.

---

## Task 4: PublicNavbar

**Files:**
- Create: `components/layout/PublicNavbar.tsx`

- [ ] **Creare `components/layout/PublicNavbar.tsx`**

```tsx
import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { PublicNavbarMobileClient } from './PublicNavbarMobileClient'

export function PublicNavbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 lg:px-8">

        {/* Stânga: hamburger mobil + logo */}
        <div className="flex items-center gap-1">
          <PublicNavbarMobileClient />
          <Link
            href="/"
            className="font-heading text-xl font-extrabold tracking-tight text-green-700"
          >
            CIVICOM✨
          </Link>
        </div>

        {/* Centru: navigație desktop */}
        <nav className="hidden items-center gap-1 md:flex">
          <Link
            href="/evenimente"
            className={buttonVariants({ variant: 'ghost', size: 'sm' })}
          >
            Evenimente
          </Link>
          <Link
            href="/organizatii"
            className={buttonVariants({ variant: 'ghost', size: 'sm' })}
          >
            Organizații
          </Link>
        </nav>

        {/* Dreapta: butoane auth desktop */}
        <div className="hidden items-center gap-2 md:flex">
          <Link
            href="/autentificare"
            className={buttonVariants({ variant: 'outline', size: 'sm' })}
          >
            Autentifică-te
          </Link>
          <Link
            href="/inregistrare"
            className={buttonVariants({ variant: 'default', size: 'sm' }) + ' bg-green-600 hover:bg-green-700 text-white'}
          >
            Înregistrează-te
          </Link>
        </div>

      </div>
    </header>
  )
}
```

- [ ] **TypeScript check**

```bash
pnpm tsc --noEmit
```

Așteptat: 0 erori.

---

## Task 5: Organization Service

**Files:**
- Create: `services/organization.service.ts`

- [ ] **Creare `services/organization.service.ts`**

```ts
'use server'

import { createClient } from '@/lib/supabase/server'

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
```

> **Notă:** `.maybeSingle()` returnează `null` (fără eroare) când nu există niciun rând — corect pentru cazul în care userul nu e în niciun ONG.

- [ ] **TypeScript check**

```bash
pnpm tsc --noEmit
```

Așteptat: 0 erori.

---

## Task 6: DashboardNavbarActionsClient

**Files:**
- Create: `components/layout/DashboardNavbarActionsClient.tsx`

- [ ] **Creare `components/layout/DashboardNavbarActionsClient.tsx`**

```tsx
'use client'

import Link from 'next/link'
import {
  Menu, Plus, LogOut, User, LayoutDashboard,
  Calendar, FileText, AlertCircle, Building2,
} from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import { signOut } from '@/services/auth.service'

type Props = {
  userName: string
  userEmail: string
  orgId: string | null
}

const navItems = [
  { label: 'Panou', href: '/panou', Icon: LayoutDashboard },
  { label: 'Evenimentele mele', href: '/panou/evenimente', Icon: Calendar },
  { label: 'Participări', href: '/panou/participari', Icon: Calendar },
  { label: 'Petiții semnate', href: '/panou/petitii', Icon: FileText },
  { label: 'Contestații', href: '/panou/contestatii', Icon: AlertCircle },
]

export function DashboardNavbarActionsClient({ userName, userEmail, orgId }: Props) {
  const initial = userName?.charAt(0).toUpperCase() ?? 'U'
  const orgHref = orgId ? `/organizatie/${orgId}/panou` : '/organizatie/creeaza'
  const orgLabel = orgId ? 'Organizația mea' : 'Solicită creare ONG'

  async function handleSignOut() {
    await signOut()
  }

  return (
    <>
      {/* ─── Desktop ─── */}
      <div className="hidden items-center gap-3 md:flex">
        <Link
          href="/creeaza"
          className={buttonVariants({ size: 'sm' }) + ' gap-1.5 bg-green-600 hover:bg-green-700 text-white'}
        >
          <Plus className="size-4" />
          Creează eveniment
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Avatar className="size-8 cursor-pointer ring-2 ring-transparent hover:ring-green-500 transition-all">
              <AvatarFallback className="bg-green-100 text-sm font-semibold text-green-700">
                {initial}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="flex flex-col gap-0.5">
              <span className="font-semibold">{userName}</span>
              <span className="text-xs font-normal text-muted-foreground">{userEmail}</span>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              {navItems.map(({ label, href, Icon }) => (
                <DropdownMenuItem key={href} asChild>
                  <Link href={href} className="flex items-center gap-2 cursor-pointer">
                    <Icon className="size-4" />
                    {label}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link href={orgHref} className="flex items-center gap-2 cursor-pointer">
                  <Building2 className="size-4" />
                  {orgLabel}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/creeaza" className="flex items-center gap-2 cursor-pointer">
                  <Plus className="size-4" />
                  Creează eveniment
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link href="/profil" className="flex items-center gap-2 cursor-pointer">
                  <User className="size-4" />
                  Profil
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive focus:text-destructive cursor-pointer"
                onClick={handleSignOut}
              >
                <LogOut className="size-4" />
                Deconectare
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* ─── Mobil ─── */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden" aria-label="Deschide meniul">
            <Menu className="size-5" />
          </Button>
        </SheetTrigger>

        <SheetContent side="left" className="flex w-72 flex-col">
          <SheetHeader>
            <SheetTitle className="text-left font-heading text-xl font-extrabold text-green-700">
              CIVICOM✨
            </SheetTitle>
          </SheetHeader>

          <div className="mt-4 flex flex-1 flex-col gap-0.5 overflow-y-auto">
            <p className="px-2 pb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Navigare
            </p>
            {navItems.map(({ label, href, Icon }) => (
              <Link
                key={href}
                href={href}
                className={buttonVariants({ variant: 'ghost', size: 'default' }) + ' justify-start gap-2'}
              >
                <Icon className="size-4" />
                {label}
              </Link>
            ))}

            <Separator className="my-2" />

            <Link
              href={orgHref}
              className={buttonVariants({ variant: 'ghost', size: 'default' }) + ' justify-start gap-2'}
            >
              <Building2 className="size-4" />
              {orgLabel}
            </Link>
            <Link
              href="/creeaza"
              className={buttonVariants({ variant: 'ghost', size: 'default' }) + ' justify-start gap-2'}
            >
              <Plus className="size-4" />
              Creează eveniment
            </Link>

            <Separator className="my-2" />

            <Link
              href="/profil"
              className={buttonVariants({ variant: 'ghost', size: 'default' }) + ' justify-start gap-2'}
            >
              <User className="size-4" />
              Profil
            </Link>
          </div>

          <div className="border-t border-border pt-4">
            <Button
              variant="destructive"
              className="w-full gap-2"
              onClick={handleSignOut}
            >
              <LogOut className="size-4" />
              Deconectare
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
```

- [ ] **TypeScript check**

```bash
pnpm tsc --noEmit
```

Așteptat: 0 erori.

---

## Task 7: DashboardNavbar

**Files:**
- Create: `components/layout/DashboardNavbar.tsx`

- [ ] **Creare `components/layout/DashboardNavbar.tsx`**

```tsx
import Link from 'next/link'
import { getSession } from '@/services/auth.service'
import { getUserOrgId } from '@/services/organization.service'
import { DashboardNavbarActionsClient } from './DashboardNavbarActionsClient'

export async function DashboardNavbar() {
  const session = await getSession()
  const user = session?.user

  const userName: string = user?.user_metadata?.name ?? user?.email ?? 'Utilizator'
  const userEmail: string = user?.email ?? ''
  const orgId: string | null = user ? await getUserOrgId(user.id) : null

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 lg:px-8">

        <Link
          href="/"
          className="font-heading text-xl font-extrabold tracking-tight text-green-700"
        >
          CIVICOM✨
        </Link>

        <DashboardNavbarActionsClient
          userName={userName}
          userEmail={userEmail}
          orgId={orgId}
        />

      </div>
    </header>
  )
}
```

- [ ] **TypeScript check**

```bash
pnpm tsc --noEmit
```

Așteptat: 0 erori.

---

## Task 8: Route Group Layouts

**Files:**
- Create: `app/(public)/layout.tsx`
- Create: `app/(private)/layout.tsx`

- [ ] **Creare `app/(public)/layout.tsx`**

```tsx
import type { Metadata } from 'next'
import { PublicNavbar } from '@/components/layout/PublicNavbar'
import { Footer } from '@/components/layout/Footer'

export const metadata: Metadata = {
  // Paginile publice sunt indexabile — fiecare page.tsx definește propria metadata
}

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PublicNavbar />
      <main className="flex flex-1 flex-col">{children}</main>
      <Footer />
    </>
  )
}
```

- [ ] **Creare director `app/(private)/`**

```bash
mkdir -p "app/(private)"
```

- [ ] **Creare `app/(private)/layout.tsx`**

```tsx
import type { Metadata } from 'next'
import { DashboardNavbar } from '@/components/layout/DashboardNavbar'

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function PrivateLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <DashboardNavbar />
      <main className="flex flex-1 flex-col">{children}</main>
    </>
  )
}
```

- [ ] **TypeScript check**

```bash
pnpm tsc --noEmit
```

Așteptat: 0 erori.

---

## Task 9: Pagini Placeholder + Restructurare

**Files:**
- Create: `app/(public)/page.tsx`
- Create: `app/(private)/panou/page.tsx`
- Delete: `app/page.tsx`

- [ ] **Creare `app/(public)/page.tsx`**

```tsx
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Acasă',
}

export default function HomePage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <p className="text-muted-foreground">Homepage — în curând (Etapa 4)</p>
    </div>
  )
}
```

- [ ] **Creare director + `app/(private)/panou/page.tsx`**

```bash
mkdir -p "app/(private)/panou"
```

```tsx
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Panou',
}

export default function PanouPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <p className="text-muted-foreground">Panou utilizator — în curând (Etapa 9)</p>
    </div>
  )
}
```

- [ ] **Ștergere `app/page.tsx`**

```bash
rm "app/page.tsx"
```

> **Atenție:** Verifică că `app/(public)/page.tsx` există înainte să ștergi `app/page.tsx`. Ambele servesc ruta `/` — Next.js rezolvă `(public)/page.tsx` corect fără conflicte.

- [ ] **TypeScript check**

```bash
pnpm tsc --noEmit
```

Așteptat: 0 erori.

---

## Task 10: Build Final + Commit

- [ ] **Build complet**

```bash
pnpm build
```

Așteptat:
```
Route (app)
┌ ○ /
├ ○ /autentificare
├ ƒ /auth/callback
├ ○ /inregistrare
├ ○ /panou
└ ○ /reseteaza-parola
```

- [ ] **Commit**

```bash
git add -A
git commit -m "feat(layout): PublicNavbar, DashboardNavbar, Footer + route group layouts"
```

---

## Note de implementare

- `buttonVariants` exportat din `components/ui/button.tsx` — folosit pe `<Link>` în loc de `<Button asChild>` pentru compatibilitate cu base-ui primitives
- `getUserOrgId` folosește `.maybeSingle()` — returnează `null` fără eroare când userul nu e în niciun ONG
- `signOut()` din server action are `redirect()` intern — nu este nevoie de `router.push` în client
- Toate componentele server (`PublicNavbar`, `DashboardNavbar`, `Footer`) sunt lipsite de `'use client'` — default server în Next.js App Router
