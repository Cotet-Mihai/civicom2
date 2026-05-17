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
- `protest/[id]/` — statistici protest. Contine si componentele partajate (FillRateCard, DemographicsSection, RegistrationsChartsClient, SingleEventViewsChartClient, ParticipantsListClient, FeedbackStatsSection)
- `boycott/[id]/` — statistici boycott
- `petitie/[id]/` — statistici petitie (converteste signers in ProtestParticipant[] pentru DemographicsSection)
- `comunitar/outdoor/[id]/` — statistici activitate aer liber (FillRateCard + eventDate)
- `comunitar/workshop/[id]/` — statistici workshop (FillRateCard + eventDate, KPIBanner din outdoor/_components)
- `comunitar/donations/[id]/` — statistici donații (fara FillRateCard, fara eventDate)
- `caritabil/concert/[id]/` — statistici concert (FillRateCard + DonationsProgressCard + eventDate)
- `caritabil/meet_greet/[id]/` — statistici meet & greet (FillRateCard + DonationsProgressCard + eventDate)
- `caritabil/livestream/[id]/` — statistici livestream (DonationsProgressCard, fara FillRateCard)
- `caritabil/sport/[id]/` — statistici sport (FillRateCard + DonationsProgressCard + eventDate)

## Dependente
- **Importa din:** `@/services/user.service`, `@/services/auth.service`, `@/lib/server-cache`
- **Este importat de:** Dashboard layout
