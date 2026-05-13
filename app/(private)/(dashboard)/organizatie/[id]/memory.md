# app/(private)/(dashboard)/organizatie/[id]/

Paginile și layout-ul panoului de administrare al unui ONG specific — panou, evenimente, membri, setari.

## Fisiere

### layout.tsx
- **Scop:** Layout pentru rutele ONG — verifică apartenența utilizatorului la organizație (via `getOrgMemberRole`), redirectează la `/panou` dacă nu este membru
- **Tip:** Server Component / Layout
- **Exporturi principale:** `OrgLayout` (default export)
- **Apelează:** `getOrgMemberRole` din `organization.service`; redirect la `/panou` dacă `role === null`
- **Note:** Verificare suplimentară față de layout-ul general `(dashboard)` — garantează că doar membrii pot accesa rutele ONG

### panou/page.tsx
- **Scop:** Pagina principală a panoului ONG — statistici (membri, evenimente, rating) + lista ultimelor 5 evenimente
- **Tip:** Server Component
- **Exporturi principale:** `OrgPanouPage` (default export), `metadata`
- **Apelează:** `getOrgDashboardStats`, `getOrganizationEvents` în paralel; randeaza `StatsBanner`, `DashboardEventRow`

### evenimente/page.tsx
- **Scop:** Lista completă a evenimentelor organizației cu buton „+ Eveniment nou"
- **Tip:** Server Component
- **Exporturi principale:** `OrgEvenimentePage` (default export), `metadata`
- **Apelează:** `getOrganizationEvents` din `organization.service`; randeaza `DashboardEventRow`

### membri/page.tsx
- **Scop:** Lista membrilor organizației cu formularul de invitare (doar admin) și acțiuni per membru (schimbare rol, eliminare)
- **Tip:** Server Component
- **Exporturi principale:** `OrgMembriPage` (default export), `metadata`
- **Apelează:** `getOrganizationMembers`, `getOrgMemberRole` în paralel; randeaza `InviteMemberFormClient`, `MemberActionsClient`
- **Note:** Formularul de invitare și acțiunile de management sunt vizibile doar dacă `isAdmin === true`

### setari/page.tsx
- **Scop:** Setările organizației — redirect la panou dacă userul nu e admin; afișează `OngSettingsFormClient` cu datele complete ale organizației
- **Tip:** Server Component
- **Exporturi principale:** `OrgSetariPage` (default export), `metadata`
- **Apelează:** `getOrganizationById`, `getOrgMemberRole` în paralel; redirect la `panou` dacă `role !== 'admin'`

## Sub-directoare

- `_components/` — `OrgTabsClient`
- `panou/` — pagina panou ONG + loading.tsx
- `evenimente/` — lista evenimente ONG + loading.tsx
- `membri/` — lista membri + `_components/` (InviteMemberFormClient, MemberActionsClient) + loading.tsx
- `setari/` — setări ONG + `_components/` (OngSettingsFormClient) + loading.tsx

## Patterns & Conventii
- Toate paginile au `loading.tsx` pentru skeleton instant la navigare
- Verificarea rolului (`admin` vs `member`) se face în fiecare pagină care restricționează accesul admin
- Toate paginile fetchează `id` din `params` async (`await params`)
- Animație de intrare `animate-fade-in-up` pe wrapper-ul principal

## Dependente
- **Importa din:** `@/services/organization.service`, `@/services/user.service` (tipuri), `@/components/shared/`, `@/components/ui/`
- **Este importat de:** Sidebar ONG (link-uri navigație), `DashboardSidebarNavClient`
