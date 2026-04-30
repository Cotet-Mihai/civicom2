# Design: Categorii ONG

**Data:** 2026-04-30  
**Status:** Aprobat

## Cerință

Organizațiile pot selecta unul sau mai multe domenii de activitate din o listă fixă. Selecția este obligatorie la creare. Informația se stochează în tabelul `organizations`.

**Categorii disponibile:** `educatie`, `mediu`, `sanatate`, `social`, `animale`, `cultura`

---

## 1. Baza de date

### Migrație nouă: `0015_org_categories.sql`

```sql
CREATE TYPE org_category AS ENUM (
  'educatie', 'mediu', 'sanatate', 'social', 'animale', 'cultura'
);

ALTER TABLE organizations
  ADD COLUMN categories org_category[] NOT NULL DEFAULT '{}';
```

- `NOT NULL` — coloana nu poate fi nulă
- `DEFAULT '{}'` — necesar tehnic pentru rândurile existente la momentul migrației
- Validarea „minim 1 categorie" se face în serviciu, nu la nivel de DB constraint

---

## 2. Serviciu (`services/organization.service.ts`)

### Tipuri actualizate

`OrgListItem`, `OrgDetail`, `OrgRow` primesc câmpul:
```ts
categories: string[]
```

### Funcții modificate

| Funcție | Modificare |
|---|---|
| `getOrganizations()` | adaugă `categories` în `.select()` |
| `getOrganizationById()` | adaugă `categories` în `.select()` |
| `createOrganization()` | acceptă `categories: string[]`, validează `categories.length >= 1`, salvează în insert |
| `updateOrganization()` | acceptă `categories?: string[]`, dacă furnizat validează `categories.length >= 1`, salvează în update |

### Validare în `createOrganization`

```ts
if (!data.categories || data.categories.length === 0)
  return { error: 'Selectează cel puțin un domeniu de activitate' }
```

---

## 3. UI

### Componentă de selecție

Secțiune nouă **„Domenii de activitate"** adăugată în ambele formulare, folosind `ToggleGroup` + `ToggleGroupItem` din shadcn:

```tsx
<ToggleGroup type="multiple" value={categories} onValueChange={setCategories} className="flex flex-wrap gap-2">
  <ToggleGroupItem value="educatie">Educație</ToggleGroupItem>
  <ToggleGroupItem value="mediu">Mediu</ToggleGroupItem>
  <ToggleGroupItem value="sanatate">Sănătate</ToggleGroupItem>
  <ToggleGroupItem value="social">Social</ToggleGroupItem>
  <ToggleGroupItem value="animale">Animale</ToggleGroupItem>
  <ToggleGroupItem value="cultura">Cultură</ToggleGroupItem>
</ToggleGroup>
```

- Selectat: `bg-primary text-primary-foreground` (din token-urile shadcn)
- Neselectat: `variant="outline"`
- Layout: `flex-wrap` — se adaptează pe orice lățime, mobile-first
- Validare submit: dacă `categories.length === 0` → `toast.error('Selectează cel puțin un domeniu')`

### Formulare afectate

1. **`OngCreateFormClient.tsx`** — state nou `categories: string[]`, inițializat `[]`
2. **`OngSettingsFormClient.tsx`** — state nou `categories: string[]`, inițializat din `org.categories`

### Unde apare în UI (read-only)

- **`/organizatii`** (lista publică) — badge-uri pe card per categorie
- **`/organizatii/[id]`** (pagina publică ONG) — secțiune „Domenii de activitate"

---

## 4. Fișiere de modificat

| Fișier | Tip modificare |
|---|---|
| `supabase/migrations/0015_org_categories.sql` | nou |
| `services/organization.service.ts` | modificat |
| `app/(private)/organizatie/creeaza/_components/OngCreateFormClient.tsx` | modificat |
| `app/(private)/organizatie/[id]/setari/_components/OngSettingsFormClient.tsx` | modificat |

## 5. Fișiere de instalat (shadcn)

```bash
pnpm dlx shadcn@latest add toggle-group
```

---

## Excluderi din scope

- Nu se adaugă filtrare după categorie pe `/organizatii` (scope separat, legat de redesign-ul paginii)
- Nu se adaugă categorii noi față de cele 6 definite
- Nu există limită maximă de categorii selectate
