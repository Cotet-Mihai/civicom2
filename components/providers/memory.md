# components/providers/

Provideri React pentru analytics — inițializare PostHog și tracking pageview.

## Fisiere

### PostHogProvider.tsx
- **Scop:** Inițializează PostHog în browser și wrappează aplicația în `PHProvider` (context React pentru hook-ul `usePostHog`)
- **Tip:** Client Component
- **Exporturi principale:** `PostHogProvider`
- **Props:** `{ children: React.ReactNode }`
- **Apelează:** `posthog.init()` în `useEffect` — inițializare o singură dată la mount
- **Variabile de mediu:** `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST`
- **Importat in:** `app/layout.tsx` (root layout, wrappează toată aplicația)
- **Note:** `capture_pageview: false` — pageview-urile sunt capturate manual de `PostHogPageView` pentru compatibilitate cu Next.js App Router; `capture_pageleave: true` pentru tracking timp pe pagină

### PostHogPageView.tsx
- **Scop:** Componenta care trimite evenimentul `$pageview` la PostHog la fiecare schimbare de rută (pathname sau searchParams)
- **Tip:** Client Component (returnează `null` — nicio UI)
- **Exporturi principale:** `PostHogPageView`
- **Props:** niciuna
- **Apelează:** `usePostHog()`, `usePathname()`, `useSearchParams()`
- **Importat in:** `app/layout.tsx` (montat în interiorul `PostHogProvider` și `Suspense`)
- **Note:** Construit în `Suspense` în root layout deoarece `useSearchParams` necesită Suspense boundary în Next.js App Router; URL-ul include searchParams complet

## Patterns & Conventii
- `PostHogProvider` wrappează, `PostHogPageView` trackează — separare clară de responsabilități
- Ambele componente returnează/renderează minimal (wrapper transparent sau null)
- Inițializarea PostHog se face o singură dată în `useEffect` cu array de dependențe gol

## Dependente
- **Importa din:** `posthog-js`, `posthog-js/react`, `next/navigation`
- **Este importat de:** `app/layout.tsx`
