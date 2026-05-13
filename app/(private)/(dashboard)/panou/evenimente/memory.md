# app/(private)/(dashboard)/panou/evenimente/

Pagina detaliata de analiza a evenimentelor din dashboard — statistici, grafice, lista cu filtre si grafic de evolutie.

## Fisiere

### page.tsx
- **Scop:** Pagina `/panou/evenimente` — suport context user/org, fetch paralel stats + chart data + lista events + evolution data, compune sectiunile
- **Tip:** Server Component
- **Exporturi principale:** `PanouEvenimentePage` (default export), `metadata`
- **SearchParams:** `{ context?: 'org' }` — determina context user sau org
- **Apelează:** `getMyEventsStats`, `getMyEventsChartData`, `getUserCreatedEvents`, `getOrgCreatedEvents`, `getEvolutionData`, `getUserOrgByAuthId`
- **Randeaza:** `EventsStatsSection`, `EventsChartsSection`, `EventsEvolutionChartClient`, `EventsListSection`

### loading.tsx
- **Scop:** Skeleton pentru pagina de evenimente din dashboard

## Sub-directoare

- `_components/` — sectiunile paginii (stats, charts, list, evolution)

## Dependente
- **Importa din:** `@/services/user.service`, `@/services/auth.service`, `@/lib/server-cache`
- **Este importat de:** Dashboard layout
