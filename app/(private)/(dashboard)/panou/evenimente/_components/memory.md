# app/(private)/(dashboard)/panou/evenimente/_components/

Componentele sectiunilor paginii de analiza evenimente din dashboard — statistici, grafice Recharts, lista filtrabila, grafic evolutie.

## Fisiere

### EventsStatsSection.tsx
- **Scop:** Sectiunea de statistici sumar — afiseaza `StatsBanner` cu reach total (views, participanti, % aprobare) + badge-uri per status (total, aprobate, finalizate, in asteptare, respinse)
- **Tip:** Server Component
- **Exporturi principale:** `EventsStatsSection`
- **Props:** `{ stats: EventsStats }` din `user.service`
- **Apelează:** `StatsBanner` (shared)

### EventsChartsSection.tsx
- **Scop:** Sectiunea cu 4 grafice Recharts — Bar charts (top vizualizari, top participanti) + Pie/Donut charts (distributie categorii, distributie statusuri); filtre per grafic via `SelectorPopover`
- **Tip:** Client Component (uses useState pentru selected, center value)
- **Exporturi principale:** `EventsChartsSection`
- **Props:** `{ data: EventsChartData }` din `user.service`
- **Subcomponente locale:** `SelectorPopover` (popover cu checkboxuri), `useSelector` hook
- **Apelează:** Recharts (`Bar`, `BarChart`, `Pie`, `PieChart`, `Cell`, `Sector`, `Label`), `ChartContainer`, `ChartTooltip` din shadcn

### EventsEvolutionChartClient.tsx
- **Scop:** Grafic de evolutie in timp (Area chart) — permite selectia intervalului de timp (24h/7d/30d/3m/6m/all) si metricii (participanti/vizualizari/semnaturi); re-fetch server action la schimbarea parametrilor; selector de serii vizibile
- **Tip:** Client Component
- **Exporturi principale:** `EventsEvolutionChartClient`
- **Props:** `{ initialData: EvolutionData, context?: 'user' | 'org', orgId?: string }` — context/orgId permit refolosirea la dashboard ONG
- **Apelează:** `getEvolutionData` (participanți/semnături), `getViewsEvolution` (vizualizări din snapshots), Recharts `Area`, `AreaChart`, shadcn `ChartContainer`
- **State:** `timeRange` (pentru participants/signatures), `viewRange` (pentru views: today/7d/30d), `metric`, `data`, `selectedIds`, `isPending`
- **Comportament views:** când metrica e 'views', butoanele de interval se schimbă la Azi/7 zile/30 zile și datele vin din `event_view_snapshots` (totaluri cumulate)

### EventsListSection.tsx
- **Scop:** Lista completa a evenimentelor cu filtrare pe status si categorie — randeaza `EventsFilterTabsClient` care primeste o render prop cu lista filtrata; helper intern `getStatsHref` rezolva ruta statistici pentru toate tipurile (protest, boycott, petitie, comunitar/outdoor/workshop/donations, caritabil/concert/meet_greet/livestream/sport)
- **Tip:** Client Component
- **Exporturi principale:** `EventsListSection`
- **Props:** `{ events: DashboardEvent[] }`
- **Apelează:** `EventsFilterTabsClient`, `CompleteEventButtonClient` (din panou/_components), `EditEventWarningModalClient`, `EventCard`-like custom render

### EventsFilterTabsClient.tsx
- **Scop:** Tabs de filtrare pentru lista de evenimente — filtrare client-side pe status (toate, active, finalizate, respinse) si categorie
- **Tip:** Client Component
- **Exporturi principale:** `EventsFilterTabsClient`
- **Props:** `{ events: DashboardEvent[], children: (filtered: DashboardEvent[]) => React.ReactNode }` (render prop)

### EditEventWarningModalClient.tsx
- **Scop:** Modal de avertizare inainte de editarea unui eveniment — afiseaza mesaj despre implicatiile editarii unui eveniment aprobat
- **Tip:** Client Component
- **Exporturi principale:** `EditEventWarningModalClient`
- **Props:** `{ eventId: string }`

## Patterns & Conventii
- `EventsChartsSection` este Client Component din cauza state-ului pentru filtrele graficelor si valorile centrale donut
- `EventsEvolutionChartClient` face re-fetch la schimbarea parametrilor via `useTransition` (Server Action)
- Graficele Recharts folosesc `ChartContainer` din shadcn (wraps ResponsiveContainer)

## Dependente
- **Importa din:** `@/services/user.service`, `@/components/shared/StatsBanner`, `@/components/ui/`, recharts
- **Este importat de:** `panou/evenimente/page.tsx`
