# Design: Banner ONG

**Data:** 2026-04-30
**Status:** Aprobat

## Cerință

Organizațiile pot încărca un banner (imagine unică, format wide). Bannerul apare pe pagina publică a ONG-ului și pe cardurile din lista `/organizatii`. Implementarea urmează exact același pattern ca logo-ul.

---

## 1. Baza de date

### Migrație nouă: `0016_org_banner.sql`

```sql
ALTER TABLE organizations
  ADD COLUMN banner_url text;
```

- `text`, nullable — un ONG fără banner afișează fallback (gradient sau placeholder)
- Nu există constraint NOT NULL — bannerul este opțional

---

## 2. Storage

### Bucket nou: `org-banners`

Migrație `0016_org_banner.sql` include și:

```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('org-banners', 'org-banners', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Org banners are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'org-banners');

CREATE POLICY "Authenticated users can upload org banners"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'org-banners' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update org banners"
ON storage.objects FOR UPDATE
USING (bucket_id = 'org-banners' AND auth.uid() IS NOT NULL);
```

- Path fișier: `{orgId}/{timestamp}.{ext}`
- Identic cu pattern-ul bucketului `logos`

---

## 3. Upload utility (`lib/upload.ts`)

Adaugă funcție nouă:

```ts
export async function uploadOrgBanner(file: File, orgId: string): Promise<string | null> {
  const supabase = getClient()
  const ext = file.name.split('.').pop()
  const path = `${orgId}/${Date.now()}.${ext}`
  const { error } = await supabase.storage.from('org-banners').upload(path, file, { upsert: true })
  if (error) { console.error('[uploadOrgBanner]', error.message); return null }
  const { data } = supabase.storage.from('org-banners').getPublicUrl(path)
  return data.publicUrl
}
```

---

## 4. Serviciu (`services/organization.service.ts`)

- `OrgListItem` primește `banner_url: string | null`
- `OrgDetail` primește `banner_url: string | null`
- Tipurile interne `OrgRow` și `OrgDetailRow` primesc `banner_url: string | null`
- `getOrganizations()` adaugă `banner_url` în select
- `getOrganizationById()` adaugă `banner_url` în select
- `createOrganization()` acceptă `banner_url?: string` și îl include în insert
- `updateOrganization()` acceptă `banner_url?: string | null` și îl include în update

---

## 5. Componentă upload (`BannerUploadClient`)

**Fișier nou:** `app/(private)/organizatie/_components/BannerUploadClient.tsx`

- Pattern identic cu `LogoUploadClient`, dar zona de upload e wide (`aspect-video`, `w-full`)
- Placeholder: icon `ImageIcon` + text „Banner organizație"
- Preview: `next/image` cu `fill` + `object-cover`
- Buton „Șterge banner" dacă există un banner încărcat
- Props: `orgId: string`, `bannerUrl: string | null`, `onBannerChange: (url: string | null) => void`
- Apelează `uploadOrgBanner(file, orgId)` din `lib/upload.ts`

---

## 6. Formulare

### `OngCreateFormClient.tsx`

- State nou: `const [bannerUrl, setBannerUrl] = useState<string | null>(null)`
- `<BannerUploadClient>` adăugat **deasupra** `<LogoUploadClient>` (bannerul e primul element vizual)
- `banner_url: bannerUrl || undefined` transmis la `createOrganization()`

### `OngSettingsFormClient.tsx`

- State nou: `const [bannerUrl, setBannerUrl] = useState<string | null>(org.banner_url)`
- `<BannerUploadClient>` adăugat **deasupra** `<LogoUploadClient>`
- `banner_url: bannerUrl` transmis la `updateOrganization()`

---

## 7. UI — Afișare publică

### `/organizatii/[id]` (pagina detaliu ONG)

Dacă există `banner_url`, se afișează un banner full-width **deasupra** header-ului (logo + nume):

```tsx
{org.banner_url && (
  <div className="relative w-full aspect-[21/9] rounded-2xl overflow-hidden border border-border mb-6">
    <Image src={org.banner_url} alt={`Banner ${org.name}`} fill className="object-cover" />
  </div>
)}
```

Dacă nu există banner → secțiunea lipsește complet (fără placeholder).

### `/organizatii` (lista carduri)

Bannerul devine header-ul cardului (deasupra conținutului cu logo + nume):

- Dacă există `banner_url`: `<Image>` cu `aspect-video`, `object-cover`, zoom subtil la hover (`group-hover:scale-105`)
- Dacă nu există: gradient placeholder `bg-gradient-to-br from-primary/10 to-primary/5` cu același `aspect-video`

---

## 8. Fișiere create / modificate

| Fișier | Acțiune |
|---|---|
| `supabase/migrations/0016_org_banner.sql` | creat |
| `lib/upload.ts` | modificat — adaugă `uploadOrgBanner` |
| `services/organization.service.ts` | modificat — tipuri + selects + mutations |
| `app/(private)/organizatie/_components/BannerUploadClient.tsx` | creat |
| `app/(private)/organizatie/creeaza/_components/OngCreateFormClient.tsx` | modificat |
| `app/(private)/organizatie/[id]/setari/_components/OngSettingsFormClient.tsx` | modificat |
| `app/(public)/organizatii/[id]/page.tsx` | modificat — banner deasupra header |
| `app/(public)/organizatii/page.tsx` | modificat — banner ca header card |

---

## Excluderi din scope

- Nu se adaugă validare dimensiune/format fișier (identic cu logo)
- Nu se adaugă crop/resize
- Bannerul nu apare în JSON-LD / SEO (logo-ul deja acoperă `logo` în schema Organization)
