# app/(private)/(dashboard)/organizatie/[id]/

Paginile panoului de administrare ONG — acces restrictionat la membri, panou principal, membri, setari, evenimente.

## Fisiere

### [id]/layout.tsx
- **Scop:** Layout de protectie pentru toate paginile ONG — verifica ca utilizatorul curent este membru al organizatiei (`getOrgMemberRole`), redirecteaza la `/panou` daca nu e
- **Tip:** Server Component / Layout
- **Exporturi principale:** `OrgLayout` (default export)
- **Apelează:** `getOrgMemberRole` din `organization.service`

### [id]/panou/page.tsx
- **Scop:** Panoul principal ONG — fetch stats (membri, events, rating) + evenimentele recente ale organizatiei, randeaza `StatsBanner` + lista de evenimente
- **Tip:** Server Component
- **Exporturi principale:** `OrgPanouPage` (default export), `metadata`
- **Apelează:** `getOrgDashboardStats`, `getOrganizationEvents`, `StatsBanner`, `DashboardEventRow`

### [id]/panou/loading.tsx
- **Scop:** Skeleton pentru pagina panou ONG

### [id]/evenimente/page.tsx
- **Scop:** Lista evenimentelor organizatiei — afiseaza toate evenimentele create de ONG cu status si statistici
- **Tip:** Server Component
- **Exporturi principale:** `OrgEvenimentePage` (default export), `metadata`
- **Apelează:** `getOrganizationEvents`, `DashboardEventRow`

### [id]/evenimente/loading.tsx
- **Scop:** Skeleton pentru pagina evenimente ONG

### [id]/membri/page.tsx
- **Scop:** Pagina de gestionare membri — lista membri cu roluri, formular de invitare (admin only)
- **Tip:** Server Component
- **Exporturi principale:** `OrgMembriPage` (default export), `metadata`
- **Apelează:** `getOrganizationById`, `getOrgMemberRole`, `InviteMemberFormClient`, `MemberActionsClient`

### [id]/membri/loading.tsx
- **Scop:** Skeleton pentru pagina membri

### [id]/membri/_components/InviteMemberFormClient.tsx
- **Scop:** Formular de invitare membri noi — input email, apeleaza server action de invitare
- **Tip:** Client Component
- **Exporturi principale:** `InviteMemberFormClient`

### [id]/membri/_components/MemberActionsClient.tsx
- **Scop:** Actiuni pe membrii existenti — schimbare rol, eliminare din organizatie (admin only)
- **Tip:** Client Component
- **Exporturi principale:** `MemberActionsClient`
- **Props:** `{ member: OrgMember, orgId: string, currentUserRole: string }`

### [id]/setari/page.tsx
- **Scop:** Pagina de setari ONG (doar admin) — fetch date complete org, randeaza `OngSettingsFormClient`; redirecteaza non-admin
- **Tip:** Server Component
- **Exporturi principale:** `OrgSetariPage` (default export), `metadata`
- **Apelează:** `getOrganizationById`, `getOrgMemberRole`, `OngSettingsFormClient`

### [id]/contestatii/page.tsx
- **Scop:** Pagina contestațiilor ONG — lista contestațiilor depuse pentru evenimentele organizației, cu statusuri
- **Tip:** Server Component
- **Exporturi principale:** `OrgContestatiePage` (default export), `metadata`
- **Apelează:** `getOrgAppeals` din `organization.service`

### [id]/setari/loading.tsx
- **Scop:** Skeleton pentru pagina setari ONG

### [id]/setari/_components/OngSettingsFormClient.tsx
- **Scop:** Formular complet de editare ONG — toate campurile (nume, descriere, website, IBAN, CUI, tip, contact, adresa), categorii (ToggleGroup), upload logo/banner/documente; apeleaza `updateOrganization`
- **Tip:** Client Component
- **Exporturi principale:** `OngSettingsFormClient`
- **Props:** `{ org: OrgDetail }`
- **Apelează:** `updateOrganization` din `organization.service`, `LogoUploadClient`, `BannerUploadClient`, `DocumentsUploadClient`
- **State:** `form` (obiect cu toate campurile), `logoUrl`, `bannerUrl`, `documents`, `categories`, `loading`

### [id]/_components/OrgTabsClient.tsx
- **Scop:** Tabs de navigatie in cadrul paginilor ONG (Panou / Evenimente / Membri / Contestații / Setari)
- **Tip:** Client Component
- **Exporturi principale:** `OrgTabsClient`
- **Props:** `{ orgId: string }`

## Patterns & Conventii
- Layout `[id]/layout.tsx` verifica membership-ul — orice pagina ONG e protejata la nivel de layout
- Setarile ONG sunt accesibile doar `admin`-ilor (verificare in `setari/page.tsx`)
- Upload-uri ONG (logo, banner, documente) sunt componente separate din `app/(private)/organizatie/_components/`

## Dependente
- **Importa din:** `@/services/organization.service`, `@/services/user.service`, `@/components/shared/`, `@/app/(private)/organizatie/_components/`, `@/lib/constants`
- **Este importat de:** Dashboard layout, sidebar navigation
