# lib/

Utilitare, constante, cache server și funcții de upload — infrastructură transversală folosită în toată aplicația.

## Fisiere

### utils.ts
- **Scop:** Utilitar unic — funcția `cn()` pentru combinare clase Tailwind cu clsx + twMerge
- **Exporturi principale:** `cn(...inputs: ClassValue[])`
- **Note:** Folosit în aproape orice componentă care are clase Tailwind condiționate; eliminat la clasele conflictuale (ex: `text-sm text-lg` → rămâne `text-lg`)

### constants.ts
- **Scop:** Constante globale pentru labels și routes ale categoriilor de evenimente și organizații
- **Exporturi principale:**
  - `CATEGORY_LABELS` — `{ protest: 'Protest', boycott: 'Boycott', ... }` (5 categorii)
  - `CATEGORY_ROUTES` — `{ protest: 'protest', petition: 'petitie', ... }` (sluguri URL în română)
  - `ORG_CATEGORY_LABELS` — `{ educatie: 'Educație', mediu: 'Mediu', ... }` (6 categorii ONG)
  - `ORG_CATEGORY_BADGE_CLASSES` — clase Tailwind per categorie ONG (excepție permisă de la regula token-uri shadcn — sunt culori semantice per categorie)
  - `ORG_CATEGORIES` — array de chei din `ORG_CATEGORY_LABELS`
  - `ORG_TYPE_LABELS` — `{ asociatie, fundatie, federatie, cooperativa }`
  - `ORG_DOC_TYPE_LABELS` — `{ certificat_inregistrare, statut, act_constitutiv, dovada_sediu }`
- **Importat in:** Componente de filtrare (events, orgs), `EventCard`, pagini organizatie, formulare creare/editare

### server-cache.ts
- **Scop:** Deduplică apelul `getUserOrgByAuthId` per request folosind `cache()` din React — funcția poate fi apelată din layout + children fără query duplicat
- **Exporturi principale:** `getUserOrgByAuthId` (wrappat în `cache()`)
- **Apelează:** `getUserOrgByAuthId` din `services/organization.service`
- **Importat in:** `app/(private)/(dashboard)/layout.tsx`, paginile dashboard care au nevoie de org context
- **Note:** `cache()` din React funcționează per request pe server; fără acest wrapper, layout + children care cer org-ul ar face query de 2+ ori

### upload.ts
- **Scop:** Funcții de upload client-side la Supabase Storage — banner eveniment, galerie, logo ONG, banner ONG, document ONG
- **Exporturi principale:**
  - `uploadBanner(file, userId)` → `string | null` — bucket `banners`, path `userId/timestamp.ext`
  - `uploadGalleryImages(files, userId)` → `string[]` — bucket `gallery`, cu random suffix
  - `uploadLogo(file, orgId)` → `string | null` — bucket `logos`, path `orgId/timestamp.ext`
  - `uploadOrgBanner(file, orgId)` → `string | null` — bucket `org-banners`, path `orgId/timestamp.ext`
  - `uploadOrgDocument(file, orgId)` → `string | null` — bucket `org-documents`, returnează `path` (nu URL public)
- **Apelează:** `createBrowserClient` din `@supabase/ssr` cu anon key (client-side)
- **Importat in:** `ImageUploadClient` (create events), `AvatarUploadClient` (profil), `LogoUploadClient`, `BannerUploadClient`, `DocumentsUploadClient`
- **Note:** Toate funcțiile sunt async și rulează în browser; `uploadOrgDocument` returnează path (nu publicUrl) — documentele nu sunt publice; `uploadGalleryImages` procesează fișierele în loop secvențial

## Sub-directoare

- `supabase/` — cei trei clienți Supabase (browser, server, admin)

## Patterns & Conventii
- `utils.ts` este cel mai importat fișier din `lib/` — prezent în aproape orice componentă
- Upload-ul se face exclusiv client-side (browser); niciodată server-side upload la Storage
- `server-cache.ts` este singurul loc unde se foloseste `cache()` din React în proiect

## Dependente
- **Importa din:** `clsx`, `tailwind-merge`, `@supabase/ssr`, React `cache`, `@/services/organization.service`
- **Este importat de:** Componente (utils, constants, upload), servicii (server-cache), layout (server-cache)
