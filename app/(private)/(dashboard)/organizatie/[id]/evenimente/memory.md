# app/(private)/(dashboard)/organizatie/[id]/evenimente/

Pagina evenimentelor ONG cu statistici detaliate per eveniment — ruta statistica accesibila pentru toti membrii organizatiei.

## Fisiere

### page.tsx
- **Scop:** Pagina completa de evenimente ONG — statistici sumar + grafice + evolutie + lista tuturor evenimentelor; helper intern `getOrgStatsHref` rezolva ruta de statistici pentru toate tipurile/subtipurile
- **Tip:** Server Component
- **Exporturi principale:** `OrgEvenimentePage` (default export), `metadata`
- **Apeleaza:** `getOrganizationEvents`, `getMyEventsStats('org', id)`, `getMyEventsChartData('org', id)`, `getViewsEvolution('org', 'today', id)` in paralel

### loading.tsx
- **Scop:** Skeleton pentru pagina de evenimente ONG

## Sub-directoare (pagini statistici per tip)

- `protest/[eventId]/` — statistici protest ONG
- `boycott/[eventId]/` — statistici boycott ONG
- `petitie/[eventId]/` — statistici petitie ONG
- `comunitar/outdoor/[eventId]/` — statistici activitate aer liber ONG
- `comunitar/workshop/[eventId]/` — statistici workshop ONG
- `comunitar/donations/[eventId]/` — statistici donatii ONG
- `caritabil/concert/[eventId]/` — statistici concert ONG
- `caritabil/meet_greet/[eventId]/` — statistici meet & greet ONG
- `caritabil/livestream/[eventId]/` — statistici livestream ONG
- `caritabil/sport/[eventId]/` — statistici sport ONG

## Patterns & Conventii
- Parametrii: `{ id: string }` (orgId) + `{ eventId: string }` (eveniment) in paginile de statistici
- Servicii apelate cu context 'org' si orgId: ex. `getBoycottStats(eventId, 'org', id)`
- `backHref` pe toate paginile statistici: `/organizatie/${id}/evenimente`
- Componentele UI importate din `panou/evenimente/<tip>/[id]/_components/`
- Fiecare pagina are `loading.tsx` cu skeleton identic

## Dependente
- **Importa din:** `@/services/*.service`, componente din `panou/evenimente/`
- **Este importat de:** Sidebar ONG, `DashboardEventRow` (statsHref via `getOrgStatsHref`)
