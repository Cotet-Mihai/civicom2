# app/(public)/organizatii/_components/

Componentele paginii de lista organizatii — cautare, filtrare pe categorii, grid cu rezultate.

## Fisiere

### OrgsSearchBarClient.tsx
- **Scop:** Bara de cautare pentru organizatii — input cu debounce, sincronizeaza cu searchParam `cauta` din URL
- **Tip:** Client Component
- **Exporturi principale:** `OrgsSearchBarClient`
- **Props:** valoarea curenta de cautare

### OrgsCategoryFilterClient.tsx
- **Scop:** Filtre pe categorii de organizatii (educatie, mediu, sanatate, etc.) — toggle buttons, sincronizeaza cu searchParam `categorie`
- **Tip:** Client Component
- **Exporturi principale:** `OrgsCategoryFilterClient`
- **Props:** categoriile selectate curent

### OrgsMobileFABClient.tsx
- **Scop:** Buton flotant mobil (FAB) care deschide drawer cu filtrele de organizatii
- **Tip:** Client Component
- **Exporturi principale:** `OrgsMobileFABClient`

### OrgsPendingContext.tsx
- **Scop:** Context React pentru starea de tranzitie a filtrelor — permite skeleton-ului sa apara in timp ce se aplica filtrele
- **Tip:** Client Component / Context
- **Exporturi principale:** `OrgsPendingProvider`, `useOrgsPending`

### OrgsGridClient.tsx
- **Scop:** Grid-ul de carduri pentru organizatii — primeste lista de orgs si le afiseaza, cu filtrare client-side bazata pe searchParams
- **Tip:** Client Component
- **Exporturi principale:** `OrgsGridClient`
- **Props:** `{ orgs: OrgListItem[] }`

### OrgsGridSkeleton.tsx
- **Scop:** Skeleton grid pentru loading state-ul listei de organizatii
- **Tip:** Server Component
- **Exporturi principale:** `OrgsGridSkeleton`

### ExtraCategoriesBadge.tsx
- **Scop:** Badge care afiseaza "+N" cand un ONG are mai multe categorii decat se pot afisa
- **Tip:** Server Component
- **Exporturi principale:** `ExtraCategoriesBadge`
- **Props:** `{ extra: number }`

## Patterns & Conventii
- Pattern identic cu filtrele de evenimente — filtrele sunt in URL searchParams
- `OrgsPendingContext` conecteaza schimbarea URL cu skeleton-ul din grid

## Dependente
- **Importa din:** `@/components/ui/`, `@/lib/constants`, `@/services/organization.service`
- **Este importat de:** `app/(public)/organizatii/page.tsx`
