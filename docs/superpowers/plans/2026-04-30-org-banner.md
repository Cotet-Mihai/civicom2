# Org Banner Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adaugă un banner (imagine unică, wide) la organizații — uploadabil din formularele private, afișat pe cardurile din lista publică și pe pagina de detaliu ONG.

**Architecture:** Coloană `banner_url text` pe `organizations`, bucket Supabase `org-banners` public, funcție upload dedicată în `lib/upload.ts`, componentă `BannerUploadClient` (pattern identic cu `LogoUploadClient`), integrată în ambele formulare private și afișată pe cele două pagini publice.

**Tech Stack:** Next.js 15 App Router, Supabase Storage, shadcn/ui, Tailwind CSS, next/image

---

## Fișiere create / modificate

| Fișier | Acțiune |
|---|---|
| `supabase/migrations/0016_org_banner.sql` | creat |
| `lib/upload.ts` | modificat — adaugă `uploadOrgBanner` |
| `services/organization.service.ts` | modificat — tipuri + selects + mutations |
| `app/(private)/organizatie/_components/BannerUploadClient.tsx` | creat |
| `app/(private)/organizatie/creeaza/_components/OngCreateFormClient.tsx` | modificat |
| `app/(private)/organizatie/[id]/setari/_components/OngSettingsFormClient.tsx` | modificat |
| `app/(public)/organizatii/page.tsx` | modificat — banner ca header card |
| `app/(public)/organizatii/[id]/page.tsx` | modificat — banner deasupra header |

---

## Task 1: Migrație DB — coloană `banner_url` + bucket `org-banners`

**Files:**
- Create: `supabase/migrations/0016_org_banner.sql`

- [ ] **Step 1: Creează fișierul de migrație**

Conținut complet al `supabase/migrations/0016_org_banner.sql`:

```sql
ALTER TABLE organizations
  ADD COLUMN banner_url text;

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

- [ ] **Step 2: Aplică migrația prin Supabase MCP**

Folosește `mcp__supabase__apply_migration` cu:
- `name`: `"0016_org_banner"`
- `query`: conținutul SQL de mai sus

- [ ] **Step 3: Verifică coloana**

Folosește `mcp__supabase__execute_sql`:
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'organizations' AND column_name = 'banner_url';
```
Expected: un rând cu `data_type = 'text'`, `is_nullable = 'YES'`.

- [ ] **Step 4: Verifică bucket-ul**

Folosește `mcp__supabase__execute_sql`:
```sql
SELECT id, name, public FROM storage.buckets WHERE id = 'org-banners';
```
Expected: un rând cu `public = true`.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/0016_org_banner.sql
git commit -m "feat(db): add banner_url column to organizations and org-banners storage bucket"
```

---

## Task 2: Funcție upload `uploadOrgBanner` în `lib/upload.ts`

**Files:**
- Modify: `lib/upload.ts`

- [ ] **Step 1: Adaugă funcția la sfârșitul fișierului**

Fișierul curent se termină cu funcția `uploadLogo`. Adaugă după ea:

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

- [ ] **Step 2: Commit**

```bash
git add lib/upload.ts
git commit -m "feat(upload): add uploadOrgBanner function for org-banners bucket"
```

---

## Task 3: Actualizare `services/organization.service.ts`

**Files:**
- Modify: `services/organization.service.ts`

- [ ] **Step 1: Adaugă `banner_url: string | null` în tipurile publice**

Modifică `OrgListItem`:
```ts
export type OrgListItem = {
  id: string
  name: string
  description: string | null
  logo_url: string | null
  banner_url: string | null
  website: string | null
  rating: number
  created_at: string
  categories: string[]
}
```

Modifică `OrgDetail`:
```ts
export type OrgDetail = {
  id: string
  name: string
  description: string | null
  website: string | null
  iban: string | null
  logo_url: string | null
  banner_url: string | null
  status: string
  rating: number
  owner_id: string
  created_at: string
  members: OrgMember[]
  events_count: number
  categories: string[]
}
```

- [ ] **Step 2: Adaugă `banner_url` în tipurile interne**

Modifică `OrgRow`:
```ts
type OrgRow = {
  id: string; name: string; description: string | null
  logo_url: string | null; banner_url: string | null; website: string | null
  rating: number; created_at: string; categories: string[]
}
```

Modifică `OrgDetailRow`:
```ts
type OrgDetailRow = {
  id: string; name: string; description: string | null
  website: string | null; iban: string | null
  logo_url: string | null; banner_url: string | null; status: string; rating: number
  owner_id: string; created_at: string; categories: string[]
}
```

- [ ] **Step 3: Adaugă `banner_url` în select-urile de citire**

În `getOrganizations()`, schimbă `.select(...)` în:
```ts
.select('id, name, description, logo_url, banner_url, website, rating, created_at, categories')
```

În `getOrganizationById()`, schimbă `.select(...)` pe organizations în:
```ts
.select('id, name, description, website, iban, logo_url, banner_url, status, rating, owner_id, created_at, categories')
```

`banner_url` va fi inclus automat în `return { ...org, members, events_count }` via spread.

- [ ] **Step 4: Adaugă `banner_url` în `createOrganization()`**

Schimbă signatura `data`:
```ts
export async function createOrganization(data: {
  name: string
  description?: string
  iban?: string
  website?: string
  logo_url?: string
  banner_url?: string
  categories: string[]
}): Promise<{ ok: true; orgId: string } | { error: string }> {
```

Adaugă `banner_url: data.banner_url || null` în obiectul `.insert({...})`, după `logo_url`:
```ts
    .insert({
      name: data.name.trim(),
      description: data.description?.trim() || null,
      iban: data.iban?.trim() || null,
      website: data.website?.trim() || null,
      logo_url: data.logo_url || null,
      banner_url: data.banner_url || null,
      owner_id: userId,
      categories: data.categories,
    })
```

- [ ] **Step 5: Adaugă `banner_url` în `updateOrganization()`**

Schimbă tipul `data` să includă `banner_url?: string | null`:
```ts
export async function updateOrganization(
  orgId: string,
  data: {
    name?: string
    description?: string | null
    website?: string | null
    iban?: string | null
    logo_url?: string | null
    banner_url?: string | null
    categories?: string[]
  }
): Promise<{ ok: true } | { error: string }> {
```

Adaugă în blocul de construire al `update`, după linia cu `logo_url`:
```ts
  if (data.banner_url !== undefined) update.banner_url = data.banner_url || null
```

- [ ] **Step 6: Commit**

```bash
git add services/organization.service.ts
git commit -m "feat(service): add banner_url to organization types, queries, and mutations"
```

---

## Task 4: Componentă `BannerUploadClient`

**Files:**
- Create: `app/(private)/organizatie/_components/BannerUploadClient.tsx`

- [ ] **Step 1: Creează fișierul**

Conținut complet:

```tsx
'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { ImageIcon, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { uploadOrgBanner } from '@/lib/upload'

type Props = {
  orgId: string
  bannerUrl: string | null
  onBannerChange: (url: string | null) => void
}

export function BannerUploadClient({ orgId, bannerUrl, onBannerChange }: Props) {
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const url = await uploadOrgBanner(file, orgId)
    if (url) onBannerChange(url)
    setUploading(false)
  }

  return (
    <div className="space-y-2">
      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Banner organizație</p>
      <div
        onClick={() => inputRef.current?.click()}
        className="relative w-full aspect-video rounded-2xl overflow-hidden border-2 border-dashed border-border bg-muted/30 flex items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors"
      >
        {bannerUrl ? (
          <Image src={bannerUrl} alt="Banner" fill className="object-cover" unoptimized />
        ) : (
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            {uploading ? <ImageIcon size={28} className="animate-pulse" /> : <ImageIcon size={28} />}
            <span className="text-xs font-medium">{uploading ? 'Se încarcă...' : 'Adaugă banner'}</span>
            <span className="text-[10px] text-muted-foreground/60">Recomandat: 1920×1080px</span>
          </div>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      {bannerUrl && (
        <Button variant="ghost" size="sm" className="text-destructive text-xs h-7 px-2" onClick={() => onBannerChange(null)}>
          <X size={12} className="mr-1" /> Șterge banner
        </Button>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add "app/(private)/organizatie/_components/BannerUploadClient.tsx"
git commit -m "feat(ui): add BannerUploadClient component for org banner upload"
```

---

## Task 5: Actualizare `OngCreateFormClient.tsx`

**Files:**
- Modify: `app/(private)/organizatie/creeaza/_components/OngCreateFormClient.tsx`

- [ ] **Step 1: Înlocuiește tot conținutul fișierului**

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { createOrganization } from '@/services/organization.service'
import { BannerUploadClient } from '../../_components/BannerUploadClient'
import { LogoUploadClient } from '../../_components/LogoUploadClient'
import { ORG_CATEGORY_LABELS } from '@/lib/constants'

const TEMP_ORG_ID = 'new'

export function OngCreateFormClient() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [bannerUrl, setBannerUrl] = useState<string | null>(null)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [categories, setCategories] = useState<string[]>([])
  const [form, setForm] = useState({ name: '', description: '', website: '', iban: '' })

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) { toast.error('Numele organizației este obligatoriu'); return }
    if (categories.length === 0) { toast.error('Selectează cel puțin un domeniu de activitate'); return }
    setLoading(true)
    const result = await createOrganization({
      name: form.name,
      description: form.description || undefined,
      website: form.website || undefined,
      iban: form.iban || undefined,
      logo_url: logoUrl || undefined,
      banner_url: bannerUrl || undefined,
      categories,
    })
    setLoading(false)
    if ('error' in result) { toast.error(result.error); return }
    toast.success('Organizație creată! Acum este în așteptarea aprobării.')
    router.push(`/organizatie/${result.orgId}/panou`)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <BannerUploadClient orgId={TEMP_ORG_ID} bannerUrl={bannerUrl} onBannerChange={setBannerUrl} />
      <LogoUploadClient orgId={TEMP_ORG_ID} logoUrl={logoUrl} onLogoChange={setLogoUrl} />

      <div className="space-y-2">
        <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
          Nume organizație *
        </Label>
        <Input
          id="name"
          placeholder="Asociația Civică România"
          value={form.name}
          onChange={e => set('name', e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
          Descriere
        </Label>
        <Textarea
          id="description"
          placeholder="Descrieți misiunea și activitățile organizației..."
          value={form.description}
          onChange={e => set('description', e.target.value)}
          rows={4}
        />
      </div>

      <div className="space-y-3">
        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
          Domenii de activitate *
        </Label>
        <ToggleGroup
          multiple
          value={categories}
          onValueChange={(values) => setCategories(values)}
          className="flex flex-wrap justify-start gap-2"
        >
          {Object.entries(ORG_CATEGORY_LABELS).map(([value, label]) => (
            <ToggleGroupItem
              key={value}
              value={value}
              variant="outline"
              className="rounded-full px-4 text-sm font-medium data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:border-primary"
            >
              {label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="website" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            Website
          </Label>
          <Input
            id="website"
            type="url"
            placeholder="https://organizatia.ro"
            value={form.website}
            onChange={e => set('website', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="iban" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            IBAN donații
          </Label>
          <Input
            id="iban"
            placeholder="RO49AAAA1B31007593840000"
            value={form.iban}
            onChange={e => set('iban', e.target.value)}
          />
        </div>
      </div>

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? 'Se creează...' : 'Creează organizație'}
      </Button>
    </form>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add "app/(private)/organizatie/creeaza/_components/OngCreateFormClient.tsx"
git commit -m "feat(ui): add BannerUploadClient to org create form"
```

---

## Task 6: Actualizare `OngSettingsFormClient.tsx`

**Files:**
- Modify: `app/(private)/organizatie/[id]/setari/_components/OngSettingsFormClient.tsx`

- [ ] **Step 1: Înlocuiește tot conținutul fișierului**

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { updateOrganization } from '@/services/organization.service'
import { BannerUploadClient } from '../../../_components/BannerUploadClient'
import { LogoUploadClient } from '../../../_components/LogoUploadClient'
import { ORG_CATEGORY_LABELS } from '@/lib/constants'
import type { OrgDetail } from '@/services/organization.service'

type Props = { org: OrgDetail }

export function OngSettingsFormClient({ org }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [bannerUrl, setBannerUrl] = useState<string | null>(org.banner_url)
  const [logoUrl, setLogoUrl] = useState<string | null>(org.logo_url)
  const [categories, setCategories] = useState<string[]>(org.categories)
  const [form, setForm] = useState({
    name: org.name,
    description: org.description ?? '',
    website: org.website ?? '',
    iban: org.iban ?? '',
  })

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) { toast.error('Numele este obligatoriu'); return }
    if (categories.length === 0) { toast.error('Selectează cel puțin un domeniu de activitate'); return }
    setLoading(true)
    const result = await updateOrganization(org.id, {
      name: form.name,
      description: form.description || null,
      website: form.website || null,
      iban: form.iban || null,
      logo_url: logoUrl,
      banner_url: bannerUrl,
      categories,
    })
    setLoading(false)
    if ('error' in result) { toast.error(result.error); return }
    toast.success('Setări salvate!')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <BannerUploadClient orgId={org.id} bannerUrl={bannerUrl} onBannerChange={setBannerUrl} />
      <LogoUploadClient orgId={org.id} logoUrl={logoUrl} onLogoChange={setLogoUrl} />

      <div className="space-y-2">
        <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
          Nume *
        </Label>
        <Input id="name" value={form.name} onChange={e => set('name', e.target.value)} required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
          Descriere
        </Label>
        <Textarea
          id="description"
          value={form.description}
          onChange={e => set('description', e.target.value)}
          rows={4}
        />
      </div>

      <div className="space-y-3">
        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
          Domenii de activitate *
        </Label>
        <ToggleGroup
          multiple
          value={categories}
          onValueChange={(values) => setCategories(values)}
          className="flex flex-wrap justify-start gap-2"
        >
          {Object.entries(ORG_CATEGORY_LABELS).map(([value, label]) => (
            <ToggleGroupItem
              key={value}
              value={value}
              variant="outline"
              className="rounded-full px-4 text-sm font-medium data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:border-primary"
            >
              {label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="website" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            Website
          </Label>
          <Input id="website" type="url" value={form.website} onChange={e => set('website', e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="iban" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            IBAN donații
          </Label>
          <Input id="iban" value={form.iban} onChange={e => set('iban', e.target.value)} />
        </div>
      </div>

      <Button type="submit" disabled={loading}>
        {loading ? 'Se salvează...' : 'Salvează modificările'}
      </Button>
    </form>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add "app/(private)/organizatie/[id]/setari/_components/OngSettingsFormClient.tsx"
git commit -m "feat(ui): add BannerUploadClient to org settings form"
```

---

## Task 7: Banner pe carduri — `/organizatii/page.tsx`

**Files:**
- Modify: `app/(public)/organizatii/page.tsx`

- [ ] **Step 1: Adaugă banner-ul ca header al cardului**

Găsește blocul card în `OrganizatiiPage`. Structura curentă este:
```tsx
<Card key={org.id} className="group relative flex flex-col overflow-hidden rounded-xl ...">
  {/* Glow ambiental intern */}
  <div className="pointer-events-none absolute ..." />
  <CardContent className="relative flex flex-1 flex-col p-6 gap-5">
    ...
  </CardContent>
</Card>
```

Adaugă banner-ul **între** div-ul glow și `<CardContent>`:

```tsx
{/* Banner card */}
<div className="relative w-full aspect-video overflow-hidden">
  {org.banner_url ? (
    <Image
      src={org.banner_url}
      alt={`Banner ${org.name}`}
      fill
      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
      className="object-cover transition-transform duration-500 group-hover:scale-105"
    />
  ) : (
    <div className="w-full h-full bg-gradient-to-br from-primary/10 to-primary/5" />
  )}
</div>
```

- [ ] **Step 2: Commit**

```bash
git add "app/(public)/organizatii/page.tsx"
git commit -m "feat(ui): add banner header to org list cards"
```

---

## Task 8: Banner pe pagina detaliu — `/organizatii/[id]/page.tsx`

**Files:**
- Modify: `app/(public)/organizatii/[id]/page.tsx`

- [ ] **Step 1: Adaugă banner deasupra header-ului în coloana stângă**

Găsește în coloana stângă blocul `{/* Header */}` care conține logo-ul și numele organizației. Adaugă banner-ul **imediat înainte** de acel bloc:

```tsx
{/* Banner */}
{org.banner_url && (
  <div className="relative w-full aspect-[21/9] rounded-2xl overflow-hidden border border-border">
    <Image
      src={org.banner_url}
      alt={`Banner ${org.name}`}
      fill
      sizes="(max-width: 1024px) 100vw, 66vw"
      className="object-cover"
      priority
    />
  </div>
)}
```

- [ ] **Step 2: Commit**

```bash
git add "app/(public)/organizatii/[id]/page.tsx"
git commit -m "feat(ui): add banner above org detail header"
```

---

## Self-review checklist

- [x] Migrație: coloană `banner_url text` nullable + bucket `org-banners` public ✅
- [x] `uploadOrgBanner` în `lib/upload.ts` — același pattern ca `uploadLogo` ✅
- [x] Toate tipurile (`OrgListItem`, `OrgDetail`, `OrgRow`, `OrgDetailRow`) au `banner_url: string | null` ✅
- [x] `getOrganizations()` și `getOrganizationById()` includ `banner_url` în select ✅
- [x] `createOrganization()` acceptă `banner_url?: string` și îl include în insert ✅
- [x] `updateOrganization()` acceptă `banner_url?: string | null` și îl include în update ✅
- [x] `BannerUploadClient` — pattern identic cu `LogoUploadClient`, wide (`aspect-video`) ✅
- [x] Formular creare: `BannerUploadClient` deasupra `LogoUploadClient`, state init `null` ✅
- [x] Formular setări: `BannerUploadClient` deasupra `LogoUploadClient`, state init `org.banner_url` ✅
- [x] Lista `/organizatii`: banner `aspect-video` ca header card, fallback gradient ✅
- [x] Detaliu `/organizatii/[id]`: banner `aspect-[21/9]` deasupra header, afișat doar dacă există ✅
- [x] Niciun placeholder / TBD ✅
- [x] Tipuri consistente între taskuri (`banner_url: string | null` peste tot) ✅
