# components/

Componente React reutilizabile — design system, layout, shared business components și provideri.

## Sub-directoare

### ui/
Design system CIVICOM — componente primitive shadcn/ui (accordion, badge, button, card, dialog, dropdown-menu, input, progress, select, sheet, skeleton, toast etc.) + componente custom (`InputPassword`, `InputPasswordStrength`, `Spinner`, `chart.tsx` pentru Recharts, `map.tsx` pentru Leaflet/shadcn-map).

### layout/
Componente de navigație globală — `Navbar` (public, Server Component), `DashboardSidebar` (private, Server Component), `DashboardContextSwitcherClient`, `DashboardSidebarNavClient`, `DashboardMobileSheetClient`, `NavbarActionsClient`, `NavbarMobileClient`, `NavbarMobileActionsClient`, `Footer`, `dashboard-types.ts`.

### shared/
Componente reutilizabile de business folosite în mai multe pagini — `EventCard`, `DashboardEventRow`, `StatsBanner`, `EventBanner`, `ActionButtons`, `ParticipationCardClient`, `SignatureCardClient`, `FeedbackSection`, `FeedbackFormClient`, `LocationMapClient`.

### providers/
Provideri React pentru analytics — `PostHogProvider` (inițializare PostHog), `PostHogPageView` (tracking pageview la schimbare rută).

## Reguli

- **`ui/`** — nicio logică de business, doar prezentare și interactivitate UI de bază
- **`layout/`** — navigatie și structura paginilor
- **`shared/`** — componente cu logică de business reutilizate în 2+ pagini; dacă e folosita o singura dată rămâne în folderul paginii; dacă e necesară pe altă pagină se mută **aici** (nu se duplică)
- **`providers/`** — wrappere pentru provideri context/library de la nivel de root

## Dependente
- **Importa din:** `@/lib/utils`, `@/lib/constants`, `@/services/*`, `@/hooks/*`, `next/*`, `lucide-react`, `recharts`, `@shadcn-map/map`
- **Este importat de:** Toate paginile din `app/`
