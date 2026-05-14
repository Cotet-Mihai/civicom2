# Pagină Statistici Per Eveniment — Tip Protest

**Data:** 2026-05-14
**Scope:** Primul tip de eveniment din seria de pagini de statistici per eveniment. Celelalte tipuri (boycott, petiție, comunitar, caritabil) urmează în iterații separate.

---

## 1. Rute & Acces

| Context | Rută |
|---|---|
| Eveniment personal | `/panou/evenimente/[id]` |
| Eveniment ONG | `/organizatie/[id]/evenimente/[eventId]` |

**Protecție acces:**
- Eveniment personal: `creator_id === userId` AND `creator_type === 'user'`
- Eveniment ONG: utilizatorul trebuie să fie membru al organizației (`organization_members`)
- Dacă nu e autorizat → redirect `/panou`
- Dacă evenimentul nu există sau nu e de tip `protest` → `notFound()`

---

## 2. Date Necesare

### Surse DB

| Tabel | Date folosite |
|---|---|
| `events` | title, subcategory, status, view_count, participants_count, created_at |
| `protests` | date, time_start, time_end, max_participants |
| `gatherings / marches / pickets` | subtip specific |
| `event_participants` | user_id, status (joined/cancelled), joined_at |
| `users` | name, avatar_url, biological_sex, gender, birth_date, education_level, county, city |
| `event_feedback` | rating, comment, created_at, user_id (doar dacă status = completed) |
| `event_view_snapshots` | taken_at, view_count |

### Funcție serviciu nouă

`getProtestStats(eventId: string)` în `services/stats.service.ts`:
- Verifică proprietarul (creator_id sau org member)
- Fetch paralel: event + protest data, participants cu join la users, feedback (dacă completed), view snapshots
- Returnează toate datele necesare pentru pagină

---

## 3. Layout — Single Page Scroll

Structura paginii, de sus în jos:

### 3.1 Header
- Buton `← Înapoi` (link spre lista evenimentelor)
- Titlu eveniment (font-black uppercase italic, stilul existent)
- Badge subtip: `Adunare` / `Marș` / `Pichet`
- Badge status: `Aprobat` / `În așteptare` / `Finalizat` etc.
- Data și intervalul orar al protestului

### 3.2 KPI Banner
`StatsBanner` cu 4 itemi:

| Valoare | Label | Condiție |
|---|---|---|
| `view_count` | Vizualizări | mereu |
| `participants_count` (joined) | Participanți | mereu |
| `X%` din max_participants | Fill Rate | mereu |
| Rating mediu ★ | Rating | doar dacă `completed`, altfel `—` |

### 3.3 Fill Rate Card
- Progress bar mare: `participants_count / max_participants`
- Procent vizibil: ex. `47 / 100 — 47%`
- 3 cifre secundare: `Joined`, `Anulat`, `Locuri rămase`
- Dacă fill rate ≥ 90% → bara verde intens + badge „Aproape complet"

### 3.4 Demografice Participanți
Grid 2 coloane (1 coloană mobil), 6 carduri:

| Card | Tip grafic | Date |
|---|---|---|
| Sex biologic | Donut chart | M / F / Altul / Necunoscut |
| Grupă de vârstă | Bar chart vertical | 18-24 / 25-34 / 35-44 / 45-54 / 55+ / Necunoscut |
| Gen | Donut chart | valori din `gender` |
| Nivel studii | Donut chart | valori din `education_level` |
| Top județe | Bar chart orizontal | top 5 județe |
| Top orașe | Bar chart orizontal | top 5 orașe |

**Regulă procente:** calculate din totalul participanților cu `status = joined`, inclusiv cei fără date (`Necunoscut`).

### 3.5 Grafice Temporale Înscrieri
Două carduri:

**Card A — Înscrieri pe zile**
- AreaChart, axa X = zile de la `created_at` până azi
- Axa Y = număr de înscrieri noi per zi (din `joined_at`)
- Linie verticală punctată pe data protestului dacă e în viitor

**Card B — Distribuție pe ore din zi**
- BarChart, axa X = 00:00 → 23:00 (24 coloane)
- Axa Y = număr total de înscrieri în acea oră (agregat din toate zilele)
- Bara maximă colorată în `primary`, restul în `primary/40`

### 3.6 Evoluție Vizualizări
Componentă nouă dedicată `SingleEventViewsChartClient` (nu reutilizează `EventsEvolutionChartClient` care e pentru multiple serii):
- O singură serie (evenimentul curent), AreaChart simplu
- Intervalele: Azi / 7 zile / 30 zile
- Date din `event_view_snapshots` filtrate pe `event_id` — funcție separată `getEventViewsEvolution(eventId, range)` în `stats.service.ts`
- Dot pulsant la capătul liniei (același pattern ca graficul existent)
- Punct final „Acum" cu `view_count` curent din `events`

### 3.7 Lista Participanților
- Header: „Participanți (X)" + toggle `Joined` / `Anulat` (filtru client-side)
- Fiecare rând: Avatar + Nume + Județ + Data înscrierii + Badge status
- Paginare: 20 per pagină, butoane Înainte/Înapoi

### 3.8 Feedback *(doar dacă `status === 'completed'`)*
- Rating mediu mare cu stele vizuale
- Distribuție stele: 5 bare orizontale cu procente (1★ → 5★)
- Lista comentariilor: avatar + nume + rating + comentariu + dată, ordonate descrescător

---

## 4. Arhitectură Cod

### Fișiere noi
```
services/
  stats.service.ts              ← getProtestStats(), getEventViewsEvolution() + tipuri

app/(private)/(dashboard)/panou/evenimente/[id]/
  page.tsx                      ← Server Component, fetch + render
  loading.tsx                   ← Skeleton
  _components/
    ProtestStatsHeader.tsx          ← Header + badge subtip/status + dată (Server)
    StatsKpiBanner.tsx              ← 4 KPI-uri (Server, wrapper StatsBanner)
    FillRateCard.tsx                ← Progress bar + joined/cancelled/rămase (Server)
    DemographicsSection.tsx         ← Grid 6 carduri wrapper (Server)
    DemographicsChartsClient.tsx    ← 6 Recharts charts (Client)
    RegistrationsChartsClient.tsx   ← AreaChart zilnic + BarChart pe ore (Client)
    SingleEventViewsChartClient.tsx ← AreaChart vizualizări single event (Client)
    ParticipantsListClient.tsx      ← Lista paginată + toggle joined/anulat (Client)
    FeedbackStatsSection.tsx        ← Rating mediu + distribuție + comentarii (Server)

app/(private)/(dashboard)/organizatie/[id]/evenimente/[eventId]/
  page.tsx                      ← Același conținut, context ONG
  loading.tsx
```

### Reutilizare
- `StatsBanner` din `components/shared/`
- `EventsEvolutionChartClient` din `panou/evenimente/_components/` — adaptat cu `eventId` prop
- `FeedbackSection` din `components/shared/` — refolosit direct

---

## 5. Securitate

- `getProtestStats` verifică proprietatea înainte de orice fetch de date
- Datele demografice ale participanților (gen, vârstă etc.) sunt afișate **numai agregat** — niciodată individual
- Lista nominală (secțiunea 3.7) este vizibilă doar creatorului/membrilor ONG

---

## 6. Iterații Ulterioare

Această pagină acoperă **doar protestele**. Paginile pentru celelalte tipuri (boycott, petiție, comunitar, caritabil) urmează același pattern arhitectural cu secțiuni specifice tipului respectiv.
