# app/(private)/(dashboard)/panou/

Paginile principale ale dashboard-ului utilizator — sumar activitate, evenimente, participari, petitii, contestatii.

## Fisiere

### page.tsx (Dashboard principal `/panou`)
- **Scop:** Pagina principala dashboard — suport dual context (user/org via `?context=org`), fetch stats + recent events + participari, randeaza `StatsBanner` + grid 2 coloane cu `DashboardEventRow` + `CompleteEventButtonClient`
- **Tip:** Server Component
- **Exporturi principale:** `PanouPage` (default export), `metadata`
- **SearchParams:** `{ context?: 'org' }` — determina daca se afiseaza date user sau org
- **Apelează:** `getUserDashboardStats`, `getUserCreatedEvents`, `getUserParticipations`, `getOrgCreatedEvents`, `getOrgDashboardStats`, `getUserOrgByAuthId`, `StatsBanner`, `DashboardEventRow`, `CompleteEventButtonClient`

### loading.tsx
- **Scop:** Skeleton pentru pagina principala dashboard
- **Tip:** Loading UI

### contestatii/page.tsx
- **Scop:** Lista contestatiilor utilizatorului — afiseaza toate contestatiile cu status si link catre eveniment
- **Tip:** Server Component
- **Exporturi principale:** `ContestatiilePage` (default export), `metadata`
- **Apelează:** `getUserAppeals` din `user.service`

### contestatii/loading.tsx
- **Scop:** Skeleton pentru pagina contestatii

### participari/page.tsx
- **Scop:** Lista participarilor utilizatorului — toate evenimentele la care a participat (status=joined)
- **Tip:** Server Component
- **Exporturi principale:** `ParticipariPage` (default export), `metadata`
- **Apelează:** `getUserParticipations` din `user.service`, `DashboardEventRow`

### participari/loading.tsx
- **Scop:** Skeleton pentru pagina participari

### petitii/page.tsx
- **Scop:** Lista petitiilor semnate de utilizator
- **Tip:** Server Component
- **Exporturi principale:** `PetitiiPage` (default export), `metadata`
- **Apelează:** `getUserPetitionsSigned` din `user.service`, `DashboardEventRow`

### petitii/loading.tsx
- **Scop:** Skeleton pentru pagina petitii

## Sub-directoare

- `_components/` — CompleteEventButtonClient
- `evenimente/` — pagina detaliata de analiza a evenimentelor (stats + charts)

## Patterns & Conventii
- Toate paginile suporta dual context: user personal (`/panou`) vs ONG (`/panou?context=org`)
- `getAuthUser` + redirect la `/autentificare` in fiecare page (safety net dupa layout)
- `loading.tsx` in fiecare subfolder pentru UX instant

## Dependente
- **Importa din:** `@/services/user.service`, `@/services/organization.service`, `@/services/auth.service`, `@/lib/server-cache`, `@/components/shared/`, `@/components/ui/`
- **Este importat de:** Dashboard layout
