# app/(private)/admin/

Paginile de administrare CIVICOM — acces exclusiv pentru utilizatorii cu `role=admin`; moderare evenimente, organizatii si contestatii.

## Fisiere

### layout.tsx
- **Scop:** Layout de protectie admin — verifica `role=admin` via `checkIsAdmin()`, redirecteaza non-admini la `/panou`; monteaza `Navbar` (nu DashboardSidebar)
- **Tip:** Server Component / Layout
- **Exporturi principale:** `AdminLayout` (default export)
- **Apelează:** `checkIsAdmin` din `admin.service`

### page.tsx (Dashboard Admin `/admin`)
- **Scop:** Pagina principala admin — afiseaza stats (events/orgs/appeals in asteptare) + tabel cu evenimentele recente pending
- **Tip:** Server Component
- **Exporturi principale:** `AdminPage` (default export), `metadata`
- **Apelează:** `getAdminStats`, `getPendingEvents`, `AdminTabsClient`, `StatsBanner`

### _components/AdminTabsClient.tsx
- **Scop:** Tabs de navigatie admin (Evenimente / Organizatii / Contestatii / Sugestii) cu indicatori de count
- **Tip:** Client Component
- **Exporturi principale:** `AdminTabsClient`

### evenimente/page.tsx
- **Scop:** Lista completa a evenimentelor pending pentru moderare
- **Tip:** Server Component
- **Exporturi principale:** `AdminEvenimentePage` (default export), `metadata`
- **Apelează:** `getAllPendingEvents` din `admin.service`

### evenimente/[id]/page.tsx
- **Scop:** Pagina de detaliu eveniment pentru admin — afiseaza toate detaliile tehnice ale evenimentului + `AdminActionBarClient` pentru aprobare/respingere
- **Tip:** Server Component
- **Exporturi principale:** `AdminEventDetailPage` (default export), `metadata`
- **Apelează:** `getAdminEventDetail` din `admin.service`, `AdminActionBarClient`

### evenimente/[id]/_components/AdminActionBarClient.tsx
- **Scop:** Bara de actiuni admin — butoane Aproba / Respinge cu modal de confirmare si camp pentru nota de respingere
- **Tip:** Client Component
- **Exporturi principale:** `AdminActionBarClient`
- **Props:** `{ eventId: string, currentStatus: string }`
- **Apelează:** `approveEvent`, `rejectEvent` din `admin.service`

### organizatii/page.tsx
- **Scop:** Lista organizatiilor pending și contested pentru aprobare/respingere; fiecare card are buton "Vezi detalii" spre pagina de detaliu
- **Tip:** Server Component
- **Exporturi principale:** `AdminOrganizatiiPage` (default export), `metadata`
- **Apelează:** `getPendingOrgs` din `admin.service`
- **Note:** `getPendingOrgs` returnează acum status `pending` și `contested`; cardurile afișează badge "Editat" dacă `org.is_edited`

### organizatii/[id]/page.tsx
- **Scop:** Pagina de detaliu organizatie pentru admin — afisează toate câmpurile, membrii, documentele; comparatie Înainte/Acum dacă `is_edited && previous_snapshot`
- **Tip:** Server Component
- **Exporturi principale:** `AdminOrgDetailPage` (default export), `metadata`
- **Apelează:** `getAdminOrgDetail` din `admin.service`, `AdminOrgDetailActionBarClient`

### organizatii/[id]/_components/AdminOrgDetailActionBarClient.tsx
- **Scop:** Bara de actiuni admin pentru detaliu org — butoane Aprobă/Respinge (pentru status `pending` și `contested`), textarea motiv respingere
- **Tip:** Client Component
- **Exporturi principale:** `AdminOrgDetailActionBarClient`
- **Props:** `{ orgId, currentStatus, rejectionNote }`
- **Apelează:** `approveOrg`, `rejectOrg` din `admin.service`

### organizatii/_components/AdminOrgActionBarClient.tsx
- **Scop:** Bara de actiuni inline pe cardurile din lista orgs — butoane Aprobă/Respinge (pentru status `pending` și `contested`)
- **Tip:** Client Component
- **Exporturi principale:** `AdminOrgActionBarClient`
- **Apelează:** `approveOrg`, `rejectOrg` din `admin.service`

### contestatii/page.tsx
- **Scop:** Lista contestatiilor active (pending + under_review)
- **Tip:** Server Component
- **Exporturi principale:** `AdminContestatiPage` (default export), `metadata`
- **Apelează:** `getAllAppeals` din `appeal.service`

### sugestii/page.tsx
- **Scop:** Lista tuturor sugestiilor de tip eveniment trimise de utilizatori — afiseaza numele, email-ul, data și conținutul sugestiei
- **Tip:** Server Component
- **Exporturi principale:** `AdminSugestiiPage` (default export), `metadata`
- **Apelează:** `getSuggestions` din `suggestion.service`

### contestatii/_components/AdminAppealActionBarClient.tsx
- **Scop:** Bara de actiuni pentru rezolvarea contestatiilor — aproba/respinge cu nota obligatorie la respingere
- **Tip:** Client Component
- **Exporturi principale:** `AdminAppealActionBarClient`
- **Apelează:** `resolveAppeal` din `appeal.service`

## Patterns & Conventii
- Toate paginile admin sunt protejate in layout (verifica `role=admin`)
- Admin foloseste `Navbar` (public navbar) nu `DashboardSidebar`
- Actiunile de moderare declanseaza notificari catre creatori (prin `notification.service`)

## Dependente
- **Importa din:** `@/services/admin.service`, `@/services/appeal.service`, `@/components/layout/Navbar`, `@/components/shared/StatsBanner`
- **Este importat de:** Next.js routing
