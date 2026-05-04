# SEO & Performance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add robots.txt, sitemap.xml, Vercel Analytics, PostHog, remove `unoptimized` from public org images, and complete metadata (canonical + openGraph) across public pages.

**Architecture:** Next.js App Router file-based SEO (`robots.ts`, `sitemap.ts`) — no external sitemap library. Analytics via `@vercel/analytics` (zero-config) and PostHog (client-side provider wrapped around root layout children). Metadata gaps patched directly in the relevant `page.tsx` files.

**Tech Stack:** Next.js 15 App Router, Supabase (for sitemap DB queries), `@vercel/analytics`, `posthog-js`

---

## File Map

| Status | File | Responsibility |
|---|---|---|
| Create | `app/robots.ts` | Static robots rules + sitemap pointer |
| Create | `app/sitemap.ts` | Dynamic sitemap — events (approved/completed) + orgs (approved) |
| Create | `components/providers/PostHogProvider.tsx` | Client-side PostHog init + `<PHProvider>` wrapper |
| Modify | `app/layout.tsx` | Add `<Analytics />` (Vercel) + `<PostHogProvider>` |
| Modify | `app/(public)/page.tsx` | Add `canonical` + `openGraph` to homepage metadata |
| Modify | `app/(public)/události/page.tsx` | Add `openGraph` |
| Modify | `app/(public)/organizatii/page.tsx` | Add `openGraph`, remove `unoptimized` from Image |
| Modify | `app/(public)/organizatii/[id]/page.tsx` | Remove `unoptimized` from Image, add `sizes` |
| Modify | `CLAUDE.md` | Mark Etapa 13 ✅ |

---

### Task 1: robots.ts

**Files:**
- Create: `app/robots.ts`

- [ ] **Step 1: Create robots.ts**

```typescript
// app/robots.ts
import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/události', '/organizatii'],
        disallow: ['/panou', '/profil', '/creeaza', '/organizatie', '/admin', '/autentificare', '/inregistrare', '/reseteaza-parola'],
      },
    ],
    sitemap: 'https://civicom.ro/sitemap.xml',
  }
}
```

- [ ] **Step 2: Verify output**

Start the dev server (`pnpm dev`) and visit `http://localhost:3000/robots.txt`. Expected output:
```
User-agent: *
Allow: /
Allow: /události
Allow: /organizatii
Disallow: /panou
Disallow: /profil
...
Sitemap: https://civicom.ro/sitemap.xml
```

- [ ] **Step 3: Commit**

```bash
git add app/robots.ts
git commit -m "feat(seo): add robots.ts"
```

---

### Task 2: sitemap.ts

**Files:**
- Create: `app/sitemap.ts`

- [ ] **Step 1: Create sitemap.ts**

The sitemap maps event category to the URL slug:
- `protest` → `protest`
- `boycott` → `boycott`
- `petition` → `petitie`
- `community` → `comunitar`
- `charity` → `caritabil`

```typescript
// app/sitemap.ts
import type { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'

const CATEGORY_SLUG: Record<string, string> = {
  protest: 'protest',
  boycott: 'boycott',
  petition: 'petitie',
  community: 'comunitar',
  charity: 'caritabil',
}

const BASE = 'https://civicom.ro'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient()

  const [{ data: events }, { data: orgs }] = await Promise.all([
    supabase
      .from('events')
      .select('id, category, updated_at')
      .in('status', ['approved', 'completed'])
      .order('updated_at', { ascending: false }),
    supabase
      .from('organizations')
      .select('id, updated_at')
      .eq('status', 'approved')
      .order('updated_at', { ascending: false }),
  ])

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE}/`, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${BASE}/události`, lastModified: new Date(), changeFrequency: 'hourly', priority: 0.9 },
    { url: `${BASE}/organizatii`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
  ]

  const eventRoutes: MetadataRoute.Sitemap = (events ?? [])
    .filter(e => CATEGORY_SLUG[e.category])
    .map(e => ({
      url: `${BASE}/události/${CATEGORY_SLUG[e.category]}/${e.id}`,
      lastModified: new Date(e.updated_at),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))

  const orgRoutes: MetadataRoute.Sitemap = (orgs ?? []).map(o => ({
    url: `${BASE}/organizatii/${o.id}`,
    lastModified: new Date(o.updated_at),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }))

  return [...staticRoutes, ...eventRoutes, ...orgRoutes]
}
```

- [ ] **Step 2: Verify output**

Visit `http://localhost:3000/sitemap.xml`. Expected: valid XML with static routes + event + org URLs. Check that event URLs use the correct slug (e.g. `/události/protest/...`, `/události/petitie/...`).

- [ ] **Step 3: Commit**

```bash
git add app/sitemap.ts
git commit -m "feat(seo): add sitemap.ts with events and orgs"
```

---

### Task 3: Vercel Analytics

**Files:**
- Modify: `app/layout.tsx`

- [ ] **Step 1: Install @vercel/analytics**

```bash
pnpm add @vercel/analytics
```

- [ ] **Step 2: Add Analytics to root layout**

Open `app/layout.tsx`. Current content ends at line 40. Add the import and `<Analytics />` component:

```typescript
// app/layout.tsx
import type { Metadata } from 'next'
import { Montserrat, Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import { TooltipProvider } from "@/components/ui/tooltip"

const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-montserrat',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://civicom.ro'),
  title: {
    default: 'CIVICOM — Implicare Civică',
    template: '%s | CIVICOM',
  },
  description: 'Platforma de implicare civică. Creează și participă la proteste, petiții, boicoturi și activități comunitare.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="ro"
      className={`${montserrat.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <TooltipProvider>{children}</TooltipProvider>
        <Analytics />
      </body>
    </html>
  )
}
```

- [ ] **Step 3: Verify**

Run `pnpm dev`. No TS errors. In browser DevTools → Network, after page load, you should see a request to `/_vercel/insights/...` (only on Vercel deployment; locally it may be a no-op — that's expected).

- [ ] **Step 4: Commit**

```bash
git add app/layout.tsx
git commit -m "feat(analytics): add Vercel Analytics"
```

---

### Task 4: PostHog

**Files:**
- Create: `components/providers/PostHogProvider.tsx`
- Modify: `app/layout.tsx`

PostHog requires client-side initialization. We create a thin `"use client"` provider that wraps children, then add it to the root layout.

- [ ] **Step 1: Install posthog-js**

```bash
pnpm add posthog-js
```

- [ ] **Step 2: Create PostHogProvider component**

```typescript
// components/providers/PostHogProvider.tsx
'use client'

import posthog from 'posthog-js'
import { PostHogProvider as PHProvider } from 'posthog-js/react'
import { useEffect } from 'react'

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://eu.i.posthog.com',
      capture_pageview: false,
      capture_pageleave: true,
    })
  }, [])

  return <PHProvider client={posthog}>{children}</PHProvider>
}
```

Note: `capture_pageview: false` because Next.js App Router does not fire standard browser navigation events — PostHog's auto-capture would fire on every RSC re-render. Page views can be tracked manually if needed.

- [ ] **Step 3: Add env vars to .env.local**

Open `.env.local` and add (use your actual PostHog project key and host):
```
NEXT_PUBLIC_POSTHOG_KEY=phc_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
NEXT_PUBLIC_POSTHOG_HOST=https://eu.i.posthog.com
```

- [ ] **Step 4: Add PostHogProvider to root layout**

Update `app/layout.tsx` (building on Task 3 result):

```typescript
// app/layout.tsx
import type { Metadata } from 'next'
import { Montserrat, Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { PostHogProvider } from '@/components/providers/PostHogProvider'
import './globals.css'
import { TooltipProvider } from "@/components/ui/tooltip"

const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-montserrat',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://civicom.ro'),
  title: {
    default: 'CIVICOM — Implicare Civică',
    template: '%s | CIVICOM',
  },
  description: 'Platforma de implicare civică. Creează și participă la proteste, petiții, boicoturi și activități comunitare.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="ro"
      className={`${montserrat.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <PostHogProvider>
          <TooltipProvider>{children}</TooltipProvider>
        </PostHogProvider>
        <Analytics />
      </body>
    </html>
  )
}
```

- [ ] **Step 5: Verify**

Run `pnpm dev`. No TS errors. Check browser DevTools → Network for requests to `eu.i.posthog.com` (only if `NEXT_PUBLIC_POSTHOG_KEY` is set to a real key; if placeholder, errors are expected but should not break the app).

- [ ] **Step 6: Commit**

```bash
git add components/providers/PostHogProvider.tsx app/layout.tsx
git commit -m "feat(analytics): add PostHog provider"
```

---

### Task 5: next/image optimization — remove unoptimized

**Files:**
- Modify: `app/(public)/organizatii/page.tsx`
- Modify: `app/(public)/organizatii/[id]/page.tsx`

The `unoptimized` prop was added as a shortcut. `next.config.ts` already has the Supabase hostname in `remotePatterns`, so Next.js can optimize these images. Remove `unoptimized` and add proper `sizes` for each image's layout context.

- [ ] **Step 1: Fix organizatii/page.tsx**

In `app/(public)/organizatii/page.tsx`, find the `<Image>` at line 57:
```tsx
<Image src={org.logo_url} alt={org.name} fill className="object-cover" unoptimized />
```
Replace with:
```tsx
<Image src={org.logo_url} alt={org.name} fill sizes="48px" className="object-cover" />
```

The image renders at `size-12` (48px). `sizes="48px"` tells Next.js exactly how wide the slot is so it generates an appropriate srcset.

- [ ] **Step 2: Fix organizatii/[id]/page.tsx**

In `app/(public)/organizatii/[id]/page.tsx`, find the `<Image>` at line ~90:
```tsx
<Image src={org.logo_url} alt={org.name} fill className="object-cover" unoptimized />
```
Replace with:
```tsx
<Image src={org.logo_url} alt={org.name} fill sizes="(max-width: 1024px) 80px, 96px" className="object-cover" />
```

The detail page renders at `size-20 lg:size-24` (80px mobile / 96px desktop).

- [ ] **Step 3: Verify**

Run `pnpm dev`. Visit `/organizatii` and `/organizatii/[id]` for an approved org with a logo. Confirm images load without error. In DevTools → Network filter `img`, confirm the image URLs go through `/_next/image` (not the raw Supabase URL directly) — that confirms optimization is active.

- [ ] **Step 4: Commit**

```bash
git add "app/(public)/organizatii/page.tsx" "app/(public)/organizatii/[id]/page.tsx"
git commit -m "fix(images): remove unoptimized from org images, add sizes"
```

---

### Task 6: Metadata improvements

**Files:**
- Modify: `app/(public)/page.tsx`
- Modify: `app/(public)/události/page.tsx`
- Modify: `app/(public)/organizatii/page.tsx`

All three public static pages are missing `openGraph`. The homepage is also missing `canonical`. These are important for social sharing and search ranking.

- [ ] **Step 1: Fix homepage metadata**

In `app/(public)/page.tsx`, replace the `metadata` export (lines 15–18):
```typescript
export const metadata: Metadata = {
    title: 'Acasă',
    description: 'CIVICOM — platforma civică unde găsești și creezi proteste, petiții, boicoturi și acțiuni comunitare din România.',
}
```
With:
```typescript
export const metadata: Metadata = {
    title: 'Acasă',
    description: 'CIVICOM — platforma civică unde găsești și creezi proteste, petiții, boicoturi și acțiuni comunitare din România.',
    alternates: { canonical: '/' },
    openGraph: {
        title: 'CIVICOM — Implicare Civică',
        description: 'Platforma civică unde găsești și creezi proteste, petiții, boicoturi și acțiuni comunitare din România.',
        url: 'https://civicom.ro/',
        siteName: 'CIVICOM',
        locale: 'ro_RO',
        type: 'website',
    },
}
```

- [ ] **Step 2: Fix /události metadata**

In `app/(public)/události/page.tsx`, replace the `metadata` export (lines 10–15):
```typescript
export const metadata: Metadata = {
  title: 'Evenimente',
  description:
    'Descoperă proteste, petiții, boicoturi și activități comunitare din România.',
  alternates: { canonical: '/události' },
}
```
With:
```typescript
export const metadata: Metadata = {
  title: 'Evenimente',
  description: 'Descoperă proteste, petiții, boicoturi și activități comunitare din România.',
  alternates: { canonical: '/události' },
  openGraph: {
    title: 'Evenimente — CIVICOM',
    description: 'Descoperă proteste, petiții, boicoturi și activități comunitare din România.',
    url: 'https://civicom.ro/události',
    siteName: 'CIVICOM',
    locale: 'ro_RO',
    type: 'website',
  },
}
```

- [ ] **Step 3: Fix /organizatii metadata**

In `app/(public)/organizatii/page.tsx`, replace the `metadata` export (lines 9–13):
```typescript
export const metadata: Metadata = {
  title: 'Organizații',
  description: 'Descoperă organizațiile non-guvernamentale verificate pe CIVICOM care coordonează acțiuni civice.',
  alternates: { canonical: '/organizatii' },
}
```
With:
```typescript
export const metadata: Metadata = {
  title: 'Organizații',
  description: 'Descoperă organizațiile non-guvernamentale verificate pe CIVICOM care coordonează acțiuni civice.',
  alternates: { canonical: '/organizatii' },
  openGraph: {
    title: 'Organizații — CIVICOM',
    description: 'Descoperă organizațiile non-guvernamentale verificate pe CIVICOM care coordonează acțiuni civice.',
    url: 'https://civicom.ro/organizatii',
    siteName: 'CIVICOM',
    locale: 'ro_RO',
    type: 'website',
  },
}
```

- [ ] **Step 4: Verify**

Run `pnpm dev`. Visit each page and view page source (Ctrl+U). Confirm:
- `<link rel="canonical" href="https://civicom.ro/" />` present on homepage
- `<meta property="og:title" content="CIVICOM — Implicare Civică" />` present on homepage
- `<meta property="og:url" content="https://civicom.ro/události" />` present on events list
- `<meta property="og:url" content="https://civicom.ro/organizatii" />` present on orgs list

- [ ] **Step 5: Commit**

```bash
git add "app/(public)/page.tsx" "app/(public)/události/page.tsx" "app/(public)/organizatii/page.tsx"
git commit -m "feat(seo): add openGraph and canonical to public list pages"
```

---

### Task 7: Mark Etapa 13 complete in CLAUDE.md

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Update roadmap**

In `CLAUDE.md`, find:
```
### ⬜ Etapa 13 — SEO & Performance (`feat/seo-performance`)
```
Replace with:
```
### ✅ Etapa 13 — SEO & Performance (`feat/seo-performance`)
```

- [ ] **Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: mark Etapa 13 complete"
```

---

## Self-Review

**Spec coverage:**
- `robots.ts` ✅ Task 1
- `sitemap.ts` (events approved/completed + orgs approved) ✅ Task 2
- Vercel Analytics ✅ Task 3
- PostHog ✅ Task 4
- Lazy loading Leaflet/carusele — already done in prior etape (map.tsx uses `createLazyComponent`, create pages use `dynamic({ ssr: false })`). No work needed.
- Optimizare `next/image` ✅ Task 5
- JSON-LD on all pages — already done in prior etape (WebSite on homepage, Event on all 5 detail pages, Organization on org detail). No work needed.
- Metadata gaps (canonical + openGraph) ✅ Task 6
- `robots: noindex` on auth/private routes — already present in route group layouts from prior etape.

**Placeholder scan:** No TBD, no "implement later", no missing code — every step has exact code.

**Type consistency:**
- `MetadataRoute.Sitemap` used consistently in Tasks 1 and 2
- `PostHogProvider` export name matches import in layout
- `sizes` prop values are concrete strings, not placeholders
