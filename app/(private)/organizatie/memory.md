# app/(private)/organizatie/

Paginile pentru crearea unui ONG si componentele de upload specifice organizatiilor (logo, banner, documente).

## Fisiere

### layout.tsx
- **Scop:** Layout minimal pentru rutele de organizatie privata
- **Tip:** Server Component / Layout
- **Exporturi principale:** `OrganizatieLayout` (default export)

### creeaza/page.tsx
- **Scop:** Pagina `/organizatie/creeaza` — grid 2 coloane (formular stanga + sidebar informativ sticky dreapta); prezinta procesul de aprobare, beneficiile unui cont ONG
- **Tip:** Server Component
- **Exporturi principale:** `OrganizatieCreeazaPage` (default export), `metadata`
- **Apelează:** `OngCreateFormClient`

### creeaza/_components/OngCreateFormClient.tsx
- **Scop:** Formularul de creare ONG — toate campurile necesare (nume, CUI, tip, descriere, website, categorii, contact, adresa), upload logo + banner + documente, submit via `createOrganization`
- **Tip:** Client Component
- **Exporturi principale:** `OngCreateFormClient`
- **Apelează:** `createOrganization` din `organization.service`, `LogoUploadClient`, `BannerUploadClient`, `DocumentsUploadClient`

## _components/ (componente reutilizabile pentru ONG)

### _components/LogoUploadClient.tsx
- **Scop:** Upload logo ONG — zona circulara click-to-upload, preview imagine, upload la Supabase Storage (bucket `logos`)
- **Tip:** Client Component
- **Exporturi principale:** `LogoUploadClient`
- **Props:** `{ orgId: string, logoUrl: string | null, onLogoChange: (url: string | null) => void }`
- **Apelează:** `uploadLogo` din `lib/upload`
- **Importat in:** `OngCreateFormClient`, `OngSettingsFormClient`

### _components/BannerUploadClient.tsx
- **Scop:** Upload banner ONG — zona dreptunghiulara (aspect-video) click-to-upload, preview, upload la Supabase Storage (bucket `org-banners`)
- **Tip:** Client Component
- **Exporturi principale:** `BannerUploadClient`
- **Props:** `{ orgId: string, bannerUrl: string | null, onBannerChange: (url: string | null) => void }`
- **Apelează:** `uploadOrgBanner` din `lib/upload`
- **Importat in:** `OngCreateFormClient`, `OngSettingsFormClient`

### _components/DocumentsUploadClient.tsx
- **Scop:** Upload documente ONG (statut, certificat, etc.) — permite upload multiplu de fisiere PDF, afiseaza lista fisierelor uploadate cu posibilitate de stergere
- **Tip:** Client Component
- **Exporturi principale:** `DocumentsUploadClient`
- **Props:** `{ orgId: string, documents: OrgDocument[], onDocumentsChange: (docs: OrgDocument[]) => void }`
- **Apelează:** `uploadOrgDocument`, `deleteOrgDocument` din `lib/upload` / `organization.service`
- **Importat in:** `OngCreateFormClient`, `OngSettingsFormClient`

## Patterns & Conventii
- Componentele de upload sunt in `_components/` la nivel de `/organizatie/` (nu in `creeaza/`) pentru ca sunt reutilizate si in setari ONG
- Upload-ul se face client-side direct la Supabase Storage

## Dependente
- **Importa din:** `@/lib/upload`, `@/services/organization.service`, `@/components/ui/`
- **Este importat de:** `organizatie/creeaza/page.tsx`, `organizatie/[id]/setari/_components/OngSettingsFormClient.tsx`
