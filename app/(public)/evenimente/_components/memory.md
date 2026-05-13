# app/(public)/evenimente/_components/

Componentele paginii de lista de evenimente `/evenimente` — filtre, lista cu infinite scroll, skeletons.

## Fisiere

### FilterPanel.tsx
- **Scop:** Panoul de filtre (desktop) — wrapper server care randeaza `FilterPanelClient`
- **Tip:** Server Component
- **Exporturi principale:** `FilterPanel`
- **Apelează:** `FilterPanelClient`

### FilterPanelClient.tsx
- **Scop:** Panoul de filtre interactiv — checkboxuri categorii, selectie sort, date range; sincronizeaza cu searchParams URL via `useRouter`
- **Tip:** Client Component
- **Exporturi principale:** `FilterPanelClient`
- **Props:** filtrele curente (categorii, sort, data_de, data_pana)
- **Apelează:** `useRouter`, `usePathname`, `useFiltersPending`

### ActiveFiltersBarClient.tsx
- **Scop:** Bara cu filtrele active — afiseaza badge-uri pentru fiecare filtru activ, buton de reset
- **Tip:** Client Component
- **Exporturi principale:** `ActiveFiltersBarClient`
- **Props:** filtrele curente

### FilterFABClient.tsx
- **Scop:** Buton flotant de filtre pe mobil (FAB) — deschide drawer cu FilterPanel
- **Tip:** Client Component
- **Exporturi principale:** `FilterFABClient`

### FiltersPendingContext.tsx
- **Scop:** Context React pentru starea de pending a filtrelor — folosit de `EventsListClient` sa afiseze skeleton in timp ce filtrele se aplica
- **Tip:** Client Component / Context
- **Exporturi principale:** `FiltersPendingProvider`, `useFiltersPending`

### MobileSearchBarClient.tsx
- **Scop:** Bara de cautare pe mobil — input cu debounce, sincronizeaza cu searchParam `cauta`
- **Tip:** Client Component
- **Exporturi principale:** `MobileSearchBarClient`

### ResultsCount.tsx
- **Scop:** Afiseaza numarul total de rezultate gasite pentru filtrele curente
- **Tip:** Server Component
- **Exporturi principale:** `ResultsCount`
- **Props:** `{ total: number, filters: EventFilters }`

### EventsListClient.tsx
- **Scop:** Lista de evenimente cu infinite scroll — incarca pagina initiala (SSR), adauga pagini noi la scroll via `getEvents`, afiseaza skeleton in timp ce se filtreaza
- **Tip:** Client Component
- **Exporturi principale:** `EventsListClient`
- **Props:** `{ initialEvents: EventPreview[], total: number, filters: EventFilters }`
- **Apelează:** `getEvents` (Server Action), `InfiniteScrollTrigger`, `EventListItem`, `EventsListSkeleton`, `useFiltersPending`
- **State:** `events` (array), `page` (number), `isLoadingMore` (useTransition)

### EventListItem.tsx
- **Scop:** Un rand de eveniment in lista — layout orizontal cu banner thumbnail, titlu, categorie, data, participanti
- **Tip:** Server Component (sau Client, verificati fisierul)
- **Exporturi principale:** `EventListItem`
- **Props:** `{ event: EventPreview }`

### EventListItemSkeleton.tsx
- **Scop:** Skeleton pentru un rand de eveniment in loading state
- **Tip:** Server/Client Component
- **Exporturi principale:** `EventListItemSkeleton`, `EventsListSkeleton`
- **Props:** `{ count?: number }`

### EventsGridSkeleton.tsx
- **Scop:** Skeleton grid pentru loading state-ul initial al listei de evenimente (forma de grid de carduri)
- **Tip:** Server Component
- **Exporturi principale:** `EventsGridSkeleton`

### EmptyState.tsx
- **Scop:** Componenta de stare vida — afisata cand nu exista evenimente care sa corespunda filtrelor
- **Tip:** Server Component
- **Exporturi principale:** `EmptyState`

### InfiniteScrollTrigger.tsx
- **Scop:** Element invizibil care triggereaza `loadMore` cand devine vizibil in viewport (Intersection Observer)
- **Tip:** Client Component
- **Exporturi principale:** `InfiniteScrollTrigger`
- **Props:** `{ onIntersect: () => void, hasMore: boolean }`

## Patterns & Conventii
- Filtrele sunt in URL (searchParams) nu in useState — permite SSR si share-uire link
- `FiltersPendingContext` conecteaza schimbarea filtrelor din URL cu afisarea skeleton-ului in lista
- Infinite scroll cu `useTransition` pentru a evita blocarea UI

## Dependente
- **Importa din:** `@/services/event.service`, `@/components/ui/`, `@/lib/constants`, `@/components/shared/EventCard`
- **Este importat de:** `app/(public)/evenimente/page.tsx`
