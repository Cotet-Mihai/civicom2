# Org Categories Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adaugă câmpul multi-select `categories` pe organizații (educatie, mediu, sanatate, social, animale, cultura), obligatoriu la creare, editabil din setări, afișat pe paginile publice.

**Architecture:** Enum PostgreSQL array pe tabelul `organizations`, expus prin serviciul existent, selectat cu `ToggleGroup` shadcn în formulare, afișat ca badge-uri pe paginile publice.

**Tech Stack:** Next.js 15 App Router, Supabase PostgreSQL, shadcn/ui (ToggleGroup), Tailwind CSS tokens

---

## Fișiere create / modificate

| Fișier | Acțiune |
|---|---|
| `supabase/migrations/0015_org_categories.sql` | creat |
| `lib/constants.ts` | modificat — adaugă `ORG_CATEGORY_LABELS` |
| `services/organization.service.ts` | modificat — tipuri + queries + validări |
| `app/(private)/organizatie/creeaza/_components/OngCreateFormClient.tsx` | modificat |
| `app/(private)/organizatie/[id]/setari/_components/OngSettingsFormClient.tsx` | modificat |
| `app/(public)/organizatii/page.tsx` | modificat — badge-uri categorii pe card |
| `app/(public)/organizatii/[id]/page.tsx` | modificat — secțiune categorii în coloana stângă |

---

## Task 1: Instalare shadcn toggle-group

**Files:**
- Modify: `components/ui/toggle-group.tsx` (generat automat de shadcn)

- [ ] **Step 1: Instalează componenta**

```bash
pnpm dlx shadcn@latest add toggle-group
```

Expected: fișierele `components/ui/toggle.tsx` și `components/ui/toggle-group.tsx` apar în proiect.

- [ ] **Step 2: Verifică că fișierele există**

```bash
ls components/ui/toggle-group.tsx components/ui/toggle.tsx
```

Expected: ambele fișiere listate fără eroare.

---

## Task 2: Migrație DB — enum `org_category` + coloană `categories`

**Files:**
- Create: `supabase/migrations/0015_org_categories.sql`

- [ ] **Step 1: Creează fișierul de migrație**

Conținut complet al fișierului `supabase/migrations/0015_org_categories.sql`:

```sql
CREATE TYPE org_category AS ENUM (
  'educatie',
  'mediu',
  'sanatate',
  'social',
  'animale',
  'cultura'
);

ALTER TABLE organizations
  ADD COLUMN categories org_category[] NOT NULL DEFAULT '{}';
```

- [ ] **Step 2: Aplică migrația prin Supabase MCP**

Folosește tool-ul `mcp__supabase__apply_migration` cu:
- `name`: `"0015_org_categories"`
- `query`: conținutul SQL de mai sus

- [ ] **Step 3: Verifică că migrația a rulat**

Folosește `mcp__supabase__execute_sql` cu query-ul:

```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'organizations' AND column_name = 'categories';
```

Expected: un rând cu `data_type = 'ARRAY'`, `is_nullable = 'NO'`, `column_default = '{}'`.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/0015_org_categories.sql
git commit -m "feat(db): add org_category enum and categories column to organizations"
```

---

## Task 3: Constantă partajată `ORG_CATEGORY_LABELS`

**Files:**
- Modify: `lib/constants.ts`

- [ ] **Step 1: Adaugă constantele în `lib/constants.ts`**

Adaugă la sfârșitul fișierului (după `CATEGORY_ROUTES`):

```ts
export const ORG_CATEGORY_LABELS: Record<string, string> = {
  educatie: 'Educație',
  mediu: 'Mediu',
  sanatate: 'Sănătate',
  social: 'Social',
  animale: 'Animale',
  cultura: 'Cultură',
}

export const ORG_CATEGORIES = Object.keys(ORG_CATEGORY_LABELS) as string[]
```

- [ ] **Step 2: Commit**

```bash
git add lib/constants.ts
git commit -m "feat(constants): add ORG_CATEGORY_LABELS and ORG_CATEGORIES"
```

---

## Task 4: Actualizare `services/organization.service.ts`

**Files:**
- Modify: `services/organization.service.ts`

- [ ] **Step 1: Adaugă `categories: string[]` în tipurile publice**

Modifică `OrgListItem` (linia 10):

```ts
export type OrgListItem = {
  id: string
  name: string
  description: string | null
  logo_url: string | null
  website: string | null
  rating: number
  created_at: string
  categories: string[]
}
```

Modifică `OrgDetail` (linia 27):

```ts
export type OrgDetail = {
  id: string
  name: string
  description: string | null
  website: string | null
  iban: string | null
  logo_url: string | null
  status: string
  rating: number
  owner_id: string
  created_at: string
  members: OrgMember[]
  events_count: number
  categories: string[]
}
```

- [ ] **Step 2: Adaugă `categories` în tipul intern `OrgRow`**

Modifică `OrgRow` (linia 63):

```ts
type OrgRow = {
  id: string; name: string; description: string | null
  logo_url: string | null; website: string | null
  rating: number; created_at: string; categories: string[]
}
```

- [ ] **Step 3: Adaugă `categories` în `getOrganizations()` select**

Modifică linia cu `.select(...)` în `getOrganizations()`:

```ts
.select('id, name, description, logo_url, website, rating, created_at, categories')
```

- [ ] **Step 4: Adaugă `categories` în `getOrganizationById()` select**

Modifică linia cu `.select(...)` pe `organizations` în `getOrganizationById()`:

```ts
.select('id, name, description, website, iban, logo_url, status, rating, owner_id, created_at, categories')
```

Și adaugă `categories` la tipul intern `OrgDetailRow`:

```ts
type OrgDetailRow = {
  id: string; name: string; description: string | null
  website: string | null; iban: string | null
  logo_url: string | null; status: string; rating: number
  owner_id: string; created_at: string; categories: string[]
}
```

Asigură-te că `categories` e inclus în spread-ul final: `return { ...org, members, events_count: events_count ?? 0 }` — `categories` vine automat din `...org`.

- [ ] **Step 5: Actualizează `createOrganization()` să accepte și valideze `categories`**

Modifică signatura funcției:

```ts
export async function createOrganization(data: {
  name: string
  description?: string
  iban?: string
  website?: string
  logo_url?: string
  categories: string[]
}): Promise<{ ok: true; orgId: string } | { error: string }> {
```

Adaugă validarea imediat după validarea numelui (după linia `if (data.name.trim().length < 2)`):

```ts
if (!data.categories || data.categories.length === 0)
  return { error: 'Selectează cel puțin un domeniu de activitate' }
```

Adaugă `categories` în obiectul `.insert({...})`:

```ts
const { data: org, error: orgErr } = await supabase
  .from('organizations')
  .insert({
    name: data.name.trim(),
    description: data.description?.trim() || null,
    iban: data.iban?.trim() || null,
    website: data.website?.trim() || null,
    logo_url: data.logo_url || null,
    owner_id: userId,
    categories: data.categories,
  })
  .select('id')
  .single()
```

- [ ] **Step 6: Actualizează `updateOrganization()` să accepte și valideze `categories`**

Modifică signatura funcției pentru `data`:

```ts
export async function updateOrganization(
  orgId: string,
  data: {
    name?: string
    description?: string | null
    website?: string | null
    iban?: string | null
    logo_url?: string | null
    categories?: string[]
  }
): Promise<{ ok: true } | { error: string }> {
```

Adaugă validarea și actualizarea câmpului `categories` în corpul funcției, după blocul de construire al `update`:

```ts
if (data.categories !== undefined) {
  if (data.categories.length === 0)
    return { error: 'Selectează cel puțin un domeniu de activitate' }
  update.categories = data.categories
}
```

- [ ] **Step 7: Commit**

```bash
git add services/organization.service.ts
git commit -m "feat(service): add categories to organization types, queries, and mutations"
```

---

## Task 5: Actualizare `OngCreateFormClient.tsx`

**Files:**
- Modify: `app/(private)/organizatie/creeaza/_components/OngCreateFormClient.tsx`

- [ ] **Step 1: Înlocuiește tot conținutul fișierului cu versiunea actualizată**

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
import { LogoUploadClient } from '../../_components/LogoUploadClient'
import { ORG_CATEGORY_LABELS } from '@/lib/constants'

const TEMP_ORG_ID = 'new'

export function OngCreateFormClient() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
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
      categories,
    })
    setLoading(false)
    if ('error' in result) { toast.error(result.error); return }
    toast.success('Organizație creată! Acum este în așteptarea aprobării.')
    router.push(`/organizatie/${result.orgId}/panou`)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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
          type="multiple"
          value={categories}
          onValueChange={setCategories}
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
git commit -m "feat(ui): add categories ToggleGroup to org create form"
```

---

## Task 6: Actualizare `OngSettingsFormClient.tsx`

**Files:**
- Modify: `app/(private)/organizatie/[id]/setari/_components/OngSettingsFormClient.tsx`

- [ ] **Step 1: Înlocuiește tot conținutul fișierului cu versiunea actualizată**

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
import { LogoUploadClient } from '../../../_components/LogoUploadClient'
import { ORG_CATEGORY_LABELS } from '@/lib/constants'
import type { OrgDetail } from '@/services/organization.service'

type Props = { org: OrgDetail }

export function OngSettingsFormClient({ org }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
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
      categories,
    })
    setLoading(false)
    if ('error' in result) { toast.error(result.error); return }
    toast.success('Setări salvate!')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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
          type="multiple"
          value={categories}
          onValueChange={setCategories}
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
git commit -m "feat(ui): add categories ToggleGroup to org settings form"
```

---

## Task 7: Afișare categorii pe `/organizatii` (lista publică)

**Files:**
- Modify: `app/(public)/organizatii/page.tsx`

- [ ] **Step 1: Adaugă importul `ORG_CATEGORY_LABELS` și `Badge`**

La secțiunea de importuri, adaugă:

```ts
import { Badge } from '@/components/ui/badge'
import { ORG_CATEGORY_LABELS } from '@/lib/constants'
```

- [ ] **Step 2: Adaugă badge-urile de categorii în card, după `StarRating`**

În interiorul cardului, după blocul `<div className="mt-1.5"><StarRating ... /></div>`, adaugă badge-urile imediat sub `StarRating`, în același div părinte (`flex flex-1 flex-col`):

```tsx
<div className="mt-1.5">
  <StarRating rating={org.rating} />
</div>
{org.categories.length > 0 && (
  <div className="mt-2 flex flex-wrap gap-1">
    {org.categories.map(cat => (
      <Badge key={cat} variant="secondary" className="text-[10px] px-2 py-0.5 font-semibold">
        {ORG_CATEGORY_LABELS[cat] ?? cat}
      </Badge>
    ))}
  </div>
)}
```

- [ ] **Step 3: Commit**

```bash
git add "app/(public)/organizatii/page.tsx"
git commit -m "feat(ui): show category badges on org list cards"
```

---

## Task 8: Afișare categorii pe `/organizatii/[id]` (pagina publică ONG)

**Files:**
- Modify: `app/(public)/organizatii/[id]/page.tsx`

- [ ] **Step 1: Adaugă importul `ORG_CATEGORY_LABELS`**

La secțiunea de importuri existente, adaugă:

```ts
import { ORG_CATEGORY_LABELS } from '@/lib/constants'
```

- [ ] **Step 2: Adaugă secțiunea „Domenii de activitate" în coloana stângă**

Adaugă blocul după secțiunea de descriere (`{org.description && (...)}`) și înainte de secțiunea IBAN (`{org.iban && (...)}`):

```tsx
{/* Categories */}
{org.categories.length > 0 && (
  <div>
    <h2 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3">
      Domenii de activitate
    </h2>
    <div className="flex flex-wrap gap-2">
      {org.categories.map(cat => (
        <Badge key={cat} variant="secondary" className="text-xs px-3 py-1 font-semibold">
          {ORG_CATEGORY_LABELS[cat] ?? cat}
        </Badge>
      ))}
    </div>
  </div>
)}
```

- [ ] **Step 3: Commit**

```bash
git add "app/(public)/organizatii/[id]/page.tsx"
git commit -m "feat(ui): show categories section on org detail page"
```

---

## Self-review checklist

- [x] Migrație DB acoperă cerința — enum + coloană NOT NULL ✅
- [x] Serviciu: toate tipurile au `categories: string[]` ✅
- [x] `createOrganization` validează minim 1 categorie ✅
- [x] `updateOrganization` validează minim 1 categorie dacă furnizat ✅
- [x] Formularul de creare trimite `categories` ✅
- [x] Formularul de setări inițializează `categories` din `org.categories` ✅
- [x] Badge-uri afișate pe `/organizatii` ✅
- [x] Secțiune categorii afișată pe `/organizatii/[id]` ✅
- [x] `ORG_CATEGORY_LABELS` partajat dintr-un singur loc (`lib/constants.ts`) ✅
- [x] Niciun placeholder / TBD ✅
- [x] Tipuri consistente între taskuri (toate folosesc `categories: string[]`) ✅
