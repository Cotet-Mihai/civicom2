# app/(public)/evenimente/

Paginile publice legate de evenimente — lista cu filtre + paginile de detaliu per tip eveniment.

## Fisiere

### page.tsx (Lista `/evenimente`)
- **Scop:** Pagina listei de evenimente — parsare searchParams (cauta, categorie, sort, data_de, data_pana), fetch initial cu `getEvents`, randeaza FilterPanel + EventsListClient + EmptyState
- **Tip:** Server Component
- **Exporturi principale:** `EventsPage` (default export), `metadata`
- **Apelează:** `getEvents` din `event.service`, `FilterPanel`, `FilterFABClient`, `FiltersPendingProvider`, `ActiveFiltersBarClient`, `MobileSearchBarClient`, `ResultsCount`, `EventsListClient`, `EmptyState`

### loading.tsx
- **Scop:** Skeleton-ul de loading pentru pagina de liste in timp ce se fetch-uiesc datele
- **Tip:** Server Component / Loading UI
- **Exporturi principale:** `Loading` (default export)

### boycott/[id]/page.tsx
- **Scop:** Pagina de detaliu pentru evenimentele de tip boycott — fetch date din `getBoycottById`, randeaza layout 8/4 cu componente specifice
- **Tip:** Server Component
- **Exporturi principale:** `BoycottPage` (default export), `generateMetadata`

### caritabil/[id]/page.tsx
- **Scop:** Pagina de detaliu pentru evenimentele caritabile — fetch din `getCharityById`
- **Tip:** Server Component
- **Exporturi principale:** `CaritabilPage` (default export), `generateMetadata`

### comunitar/[id]/page.tsx
- **Scop:** Pagina de detaliu pentru activitatile comunitare — fetch din `getCommunityById`
- **Tip:** Server Component
- **Exporturi principale:** `ComunutarPage` (default export), `generateMetadata`

### petitie/[id]/page.tsx
- **Scop:** Pagina de detaliu pentru petitii — fetch din `getPetitionById`, randeaza `SignatureCardClient` si `RecentSignersClient`
- **Tip:** Server Component
- **Exporturi principale:** `PetitiePage` (default export), `generateMetadata`

### petitie/[id]/_components/RecentSignersClient.tsx
- **Scop:** Afiseaza ultimii semnatari ai petitiei cu avatare si nume
- **Tip:** Client Component
- **Exporturi principale:** `RecentSignersClient`
- **Props:** `{ signers: RecentSigner[] }`

### protest/[id]/page.tsx
- **Scop:** Pagina de detaliu pentru proteste — fetch din `getProtestById`, include harta leaflet cu locatia
- **Tip:** Server Component
- **Exporturi principale:** `ProtestPage` (default export), `generateMetadata`

### protest/[id]/_components/ProtestMapClient.tsx
- **Scop:** Harta Leaflet specifica protestului — afiseaza locatia (gathering/picket: un marker, march: traseu)
- **Tip:** Client Component
- **Exporturi principale:** `ProtestMapClient`
- **Props:** `{ subcategory: string, location?: [number, number], locations?: [number,number][] }`

## Sub-directoare

- `_components/` — componentele specifice paginii de lista

## Patterns & Conventii
- Fiecare tip de eveniment are propria ruta `/evenimente/[tip]/[id]` (nu o singura pagina generica)
- `generateMetadata` e async si fetch-uieste titlul evenimentului din DB
- Layout 8/4: coloana stanga (col-span-8) pentru content, sidebar dreapta (col-span-4)

## Dependente
- **Importa din:** `@/services/event.service`, `@/services/protest.service`, `@/services/petition.service`, `@/services/boycott.service`, `@/services/community.service`, `@/services/charity.service`, `@/services/participation.service`, `@/services/feedback.service`, `@/components/shared/`
- **Este importat de:** Next.js routing, `sitemap.ts`
