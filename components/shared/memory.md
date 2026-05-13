# components/shared/

Componente reutilizabile de business — folosite în mai mult de o pagină sau layout. Amestec de Server Components și Client Components.

## Fisiere

### EventCard.tsx
- **Scop:** Card vizual pentru un eveniment în liste publice (grid /evenimente, carusel homepage) — banner cu zoom, badge categorie, titlu, descriere, dată, participanți, views, link spre detaliu
- **Tip:** Server Component
- **Exporturi principale:** `EventCard`
- **Props:** `{ event: EventPreview }`
- **Apelează:** `CATEGORY_LABELS`, `CATEGORY_ROUTES` din `lib/constants`; `next/image`, shadcn `Card`, `Badge`
- **Importat in:** Homepage (`EventsCarouselClient`), `/evenimente` (grid cu infinite scroll)
- **Note:** URL-ul linkului construit din `CATEGORY_ROUTES[event.category]` → `/evenimente/protest/[id]`; zoom agresiv `group-hover:scale-105` pe banner

### DashboardEventRow.tsx
- **Scop:** Rând orizontal pentru un eveniment în dashboard — thumbnail mic (aspect-video), titlu, dată, badge categorie, badge status, săgeată navigare
- **Tip:** Server Component
- **Exporturi principale:** `DashboardEventRow`
- **Props:** `{ event: DashboardEvent; showStatus?: boolean }`
- **Apelează:** shadcn `Badge`; `next/image`, `next/link`
- **Importat in:** `/panou`, `/panou/participari`, `/panou/petitii`, paginile ONG dashboard
- **Note:** Labels și culori status definite local (nu din constants); `showStatus` default true; link la `/evenimente/{category_path}/{id}`

### StatsBanner.tsx
- **Scop:** Banner dark cu statistici configurabile — titlu + badge opțional + grid de stat items (icon + valoare + label)
- **Tip:** Server Component
- **Exporturi principale:** `StatsBanner`, `StatBannerItem` (tip)
- **Props:** `{ badge?: string; title: string; subtitle?: string; items: StatBannerItem[] }`
- **Importat in:** `/panou` (user dashboard), `/organizatie/[id]/panou`
- **Note:** Fundal `bg-foreground` (dark); valori numerice formatate cu `toLocaleString('ro-RO')`; suportă orice icon LucideIcon via `item.icon`

### EventBanner.tsx
- **Scop:** Banner principal 21:9 al paginilor de detaliu eveniment — imagine cu hover zoom subtil, badge tip/subtip stânga sus, view count dreapta sus, badge "Finalizat" jos stânga dacă status=completed
- **Tip:** Server Component
- **Exporturi principale:** `EventBanner`
- **Props:** `{ bannerUrl: string | null; title: string; category: string; subcategory: string | null; status: string; viewCount: number }`
- **Apelează:** `CATEGORY_LABELS`, `SUBCATEGORY_LABELS` local; `next/image`
- **Importat in:** Toate paginile de detaliu eveniment (protest, boycott, petition, community, charity)

### ActionButtons.tsx
- **Scop:** Butoane Share/Calendar/Print pentru paginile de detaliu eveniment
- **Tip:** Client Component
- **Exporturi principale:** `ActionButtons`
- **Props:** `{ title: string; date?: string; timeStart?: string }`
- **Note:** Share → `navigator.share()` cu fallback la clipboard; Calendar → generare `.ics` download; butonul Calendar apare doar dacă `date && timeStart` sunt furnizate; `window.print()` pentru print
- **Importat in:** Toate paginile de detaliu eveniment

### ParticipationCardClient.tsx
- **Scop:** Card sidebar pentru participare la eveniment — dată/ora, progress bar participanți, buton Participă/Renunță; stare completă afișează contor fără buton
- **Tip:** Client Component
- **Exporturi principale:** `ParticipationCardClient`
- **Props:** `{ eventId: string; participantsCount: number; maxParticipants?: number; date?: string; timeStart?: string; timeEnd?: string | null; status: string }`
- **Apelează:** `useEventParticipation` din hooks
- **Importat in:** Paginile de detaliu protest, community, boycott, charity
- **Note:** `date` și `timeStart` opționale — componenta le afișează dacă există; `status=completed` → afișează contor final fără buton; `isFull && !isJoined` → butonul e dezactivat

### SignatureCardClient.tsx
- **Scop:** Card sidebar pentru semnare petitie — progress bar semnături (current/target), buton Semnează/Ai semnat; stare completă afișează contor final
- **Tip:** Client Component
- **Exporturi principale:** `SignatureCardClient`
- **Props:** `{ eventId: string; signaturesCount: number; targetSignatures: number; status: 'pending' | 'approved' | 'rejected' | 'contested' | 'completed' }`
- **Apelează:** `usePetitionSign` din hooks
- **Importat in:** Pagina detaliu petitie

### FeedbackSection.tsx
- **Scop:** Secțiune cu feedback-urile participanților pentru evenimente finalizate — rating mediu + lista feedback-uri cu avatar + comentariu
- **Tip:** Server Component (async)
- **Exporturi principale:** `FeedbackSection`
- **Props:** `{ eventId: string; status: string }`
- **Apelează:** `getFeedback` din `services/feedback.service`
- **Importat in:** Toate paginile de detaliu eveniment
- **Note:** Returnează `null` dacă `status !== 'completed'`; rating mediu afișat cu stele

### FeedbackFormClient.tsx
- **Scop:** Formular de feedback — selecție stele hover (1-5) + comentariu opțional + submit; apare doar pentru participanți fără feedback trimis
- **Tip:** Client Component
- **Exporturi principale:** `FeedbackFormClient`
- **Props:** `{ eventId: string; isParticipant: boolean; hasSubmitted: boolean }`
- **Apelează:** `submitFeedback` din `services/feedback.service`; `useRouter` pentru refresh; `toast` din sonner
- **Importat in:** Paginile de detaliu eveniment (după FeedbackSection)
- **Note:** Returnează `null` dacă `!isParticipant || hasSubmitted`; `router.refresh()` după submit

### LocationMapClient.tsx
- **Scop:** Hartă read-only Leaflet pentru afișarea locației unui eveniment în sidebar
- **Tip:** Client Component (Leaflet necesită browser)
- **Exporturi principale:** `LocationMapClient`
- **Props:** `{ location: [number, number] }` — `[lat, lng]`
- **Apelează:** `Map`, `MapMarker`, `MapTileLayer`, `MapZoomControl` din `@/components/ui/map` (shadcn-map)
- **Importat in:** Paginile de detaliu protest, community outdoor/workshop, charity concert/meet_greet/sport

## Patterns & Conventii
- Server Components primesc date ca props și nu au interactivitate — `EventCard`, `DashboardEventRow`, `StatsBanner`, `EventBanner`, `FeedbackSection`
- Client Components au sufixul `Client` și gestionează interactivitate — `ParticipationCardClient`, `SignatureCardClient`, `ActionButtons`, `FeedbackFormClient`, `LocationMapClient`
- `router.refresh()` după orice mutație pentru a reîncărca Server Components
- Cards de sidebar cu pattern consistent: `shadow-lg shadow-black/5 border-border`

## Dependente
- **Importa din:** `@/hooks/`, `@/services/feedback.service`, `@/services/event.service` (tipuri), `@/services/user.service` (tipuri), `@/lib/constants`, `@/components/ui/`, `next/image`, `next/link`, `lucide-react`, `sonner`
- **Este importat de:** Paginile de detaliu eveniment, paginile de dashboard, homepage
