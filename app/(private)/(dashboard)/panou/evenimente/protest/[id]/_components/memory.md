# memory.md — panou/evenimente/protest/[id]/_components

Componente pentru pagina de statistici per eveniment (protest).

## Componente Server
- **ProtestStatsHeader.tsx** — header cu buton înapoi, titlu, badge subtip, badge status, dată/orar. Props: `{ data: ProtestStatsData, backHref: string }`
- **StatsKpiBanner.tsx** — wrapper `StatsBanner` cu 4 KPI-uri (vizualizări, participanți, fill rate, rating). Props: `{ data: ProtestStatsData }`
- **FillRateCard.tsx** — progress bar fill rate + 3 cifre secundare (joined, anulat, rămase). Props: `{ data: ProtestStatsData }`
- **DemographicsSection.tsx** — wrapper server care filtrează `joined` și transmite spre `DemographicsChartsClient`. Props: `{ participants: ProtestParticipant[] }`
- **FeedbackStatsSection.tsx** — rating mediu + distribuție 5 bare + lista comentarii. Randează `null` dacă `status !== 'completed'`. Props: `{ feedback, averageRating, status }`

## Componente Client
- **DemographicsChartsClient.tsx** — 4 carduri în grid 2 coloane (gap-6), toate stilizate ca `EventsChartsSection`. `IdentityCard` = tab switcher (Sex Biologic / Gen / Orientare) cu `InteractiveDonut` (innerRadius=45, outerRadius=78, activeShape, center value selector pills); `VerticalBarCard` = bare verticale cu Cell per entry (Grupă de Vârstă, Nivel Studii); `LocationCard` = tab switcher (Județe / Orașe) cu `InteractiveDonut`. Props: `{ participants: ProtestParticipant[] }` (pre-filtrat pe joined)
- **RegistrationsChartsClient.tsx** — AreaChart înscrieri pe zile + BarChart distribuție pe ore. ReferenceLine pe data protestului dacă e viitor. Props: `{ participants, createdAt, protestDate }`
- **SingleEventViewsChartClient.tsx** — AreaChart vizualizări single event cu selector Azi/7 zile/30 zile. Pulsing dot la capăt. Props: `{ eventId: string, initialData: SingleEventViewsData }`
- **ParticipantsListClient.tsx** — Lista paginată (20/pagină) cu toggle Joined/Anulat. Props: `{ participants: ProtestParticipant[] }`

## Dependențe principale
- `services/stats.service.ts` — tipuri `ProtestStatsData`, `ProtestParticipant`, `ProtestFeedbackItem`, `SingleEventViewsData`; funcții `getEventViewsEvolution`
- `components/shared/StatsBanner.tsx` — folosit în StatsKpiBanner
- Recharts — PieChart, BarChart, AreaChart
