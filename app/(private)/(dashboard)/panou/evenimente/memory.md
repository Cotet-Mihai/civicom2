# app/(private)/(dashboard)/panou/evenimente/

Pagina detaliata de analiza a evenimentelor din dashboard — statistici, grafice, lista cu filtre si grafic de evolutie.

## Fisiere

### page.tsx
- **Scop:** Pagina `/panou/evenimente` — exclusiv evenimente personale ale userului, fetch paralel stats + chart data + lista events + evolution data
- **Tip:** Server Component
- **Exporturi principale:** `PanouEvenimentePage` (default export), `metadata`
- **Apelează:** `getMyEventsStats`, `getMyEventsChartData`, `getUserCreatedEvents`, `getEvolutionData`
- **Randeaza:** `EventsStatsSection`, `EventsChartsSection`, `EventsEvolutionChartClient`, `EventsListSection`

### loading.tsx
- **Scop:** Skeleton pentru pagina de evenimente din dashboard

## Sub-directoare

- `_components/` — sectiunile paginii (stats, charts, list, evolution)

## Dependente
- **Importa din:** `@/services/user.service`, `@/services/auth.service`, `@/lib/server-cache`
- **Este importat de:** Dashboard layout
