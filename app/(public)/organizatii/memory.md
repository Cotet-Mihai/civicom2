# app/(public)/organizatii/

Paginile publice pentru organizatii — lista cu filtre/cautare + pagina de detaliu cu rating, membri si evenimente.

## Fisiere

### page.tsx (Lista `/organizatii`)
- **Scop:** Pagina listei de ONG-uri — fetch toate org aprobate, randeaza grid cu `OrgsGridClient`, bare de cautare, filtre categorii, FAB mobil
- **Tip:** Server Component
- **Exporturi principale:** `OrganizatiiPage` (default export), `metadata`
- **Apelează:** `getOrganizations`, `getPopularOrgSearches` din `organization.service`, `OrgsSearchBarClient`, `OrgsCategoryFilterClient`, `OrgsMobileFABClient`, `OrgsPendingProvider`, `OrgsGridClient`
- **Componenta locala:** `StarRating` — afiseaza stele de rating

### loading.tsx
- **Scop:** Skeleton pentru loading-ul paginii de organizatii
- **Tip:** Server Component / Loading UI
- **Exporturi principale:** `Loading` (default export)

### [id]/page.tsx (Detaliu `/organizatii/[id]`)
- **Scop:** Pagina de detaliu a unui ONG — fetch org + events publice + ratings, randeaza: banner, logo, informatii contact/legal, membri, evenimente, JSON-LD Organization
- **Tip:** Server Component
- **Exporturi principale:** `OrganizatieDetailPage` (default export), `generateMetadata`
- **Apelează:** `getOrganizationById`, `getOrganizationPublicEvents`, `getOrganizationRatings`, `getUserRatingForOrganization`, `getAuthUser`, `EventCard`, `OrgRatingClient`
- **JSON-LD:** Schema.org `Organization`

### [id]/_components/OrgRatingClient.tsx
- **Scop:** Widget de rating pentru o organizatie — 5 stele interactive, permite utilizatorilor autentificati sa evalueze
- **Tip:** Client Component
- **Exporturi principale:** `OrgRatingClient`
- **Props:** `{ orgId: string, isAuthenticated: boolean, initialRating: number | null, allRatings: OrgRating[] }`

## Sub-directoare

- `_components/` — componentele specifice listei de organizatii

## Patterns & Conventii
- `generateMetadata` async — fetch-uieste titlul/descrierea org din DB
- Pagina de detaliu afiseaza JSON-LD Organization pentru SEO
- Rating-ul este interactiv (Client) dar lista de ratings este server-randata

## Dependente
- **Importa din:** `@/services/organization.service`, `@/services/auth.service`, `@/components/shared/EventCard`, `@/components/ui/`, `@/lib/constants`
- **Este importat de:** Next.js routing, `sitemap.ts`
