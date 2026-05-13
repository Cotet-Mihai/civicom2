# app/(private)/creeaza/

Fluxul de creare evenimente — selector tip pe pagina principala + 5 stepper-uri individuale (cate unul per tip de eveniment).

## Fisiere

### layout.tsx
- **Scop:** Layout pentru paginile de creare — layout split (imagine stanga sticky 30% + stepper dreapta 70%) pe desktop
- **Tip:** Server Component / Layout
- **Exporturi principale:** `CreeazaLayout` (default export)

### page.tsx (Selector tip)
- **Scop:** Pagina `/creeaza` — grid cu 5 carduri pentru selectia tipului de eveniment (Protest, Boycott, Petitie, Comunitar, Caritabil); fiecare card este un link catre stepper-ul specific
- **Tip:** Server Component
- **Exporturi principale:** `CreateSelectPage` (default export), `metadata` (robots noindex)

### protest/page.tsx
- **Scop:** Stepper 4 pasi pentru crearea unui protest — Info+subtip, Locatie Leaflet, Logistica, Media
- **Tip:** Client Component (intreaga pagina)
- **Exporturi principale:** default export
- **Apelează:** `createProtest` din `protest.service`, `StepperUI`, `LocationPickerClient`, `RoutePickerClient`, `ImageUploadClient`, `useRouter`, `toast`

### boycott/page.tsx
- **Scop:** Stepper 3 pasi pentru boycott — Info, Branduri+Alternative, Media
- **Tip:** Client Component
- **Apelează:** `createBoycott`, `StepperUI`, `ImageUploadClient`

### petitie/page.tsx
- **Scop:** Stepper 3 pasi pentru petitie — Info, Detalii (target, contact), Media
- **Tip:** Client Component
- **Apelează:** `createPetition`, `StepperUI`, `ImageUploadClient`

### comunitar/page.tsx
- **Scop:** Stepper 3-4 pasi pentru activitate comunitara — Info+subtip, Locatie/Detalii, Media
- **Tip:** Client Component
- **Apelează:** `createCommunityActivity`, `StepperUI`, `LocationPickerClient`, `ImageUploadClient`

### caritabil/page.tsx
- **Scop:** Stepper 3-4 pasi pentru eveniment caritabil — Info+subtip, Locatie/Detalii, Detalii suplimentare, Media
- **Tip:** Client Component
- **Apelează:** `createCharityEvent`, `StepperUI`, `LocationPickerClient`, `ImageUploadClient`

## Sub-directoare

- `_components/` — componentele reutilizabile in stepper-uri

## Patterns & Conventii
- Paginile stepper sunt **Client Components** (toata pagina) din cauza state-ului complex de multi-step
- Dupa submit cu succes: `toast.success` + `router.push('/panou/evenimente')`
- `useEffect` pentru a initializa userId-ul din sesiunea clientului
- `organization_id` se poate pasa pentru evenimentele create de un ONG

## Dependente
- **Importa din:** `@/services/protest.service`, `@/services/boycott.service`, `@/services/petition.service`, `@/services/community.service`, `@/services/charity.service`, `@/app/(private)/creeaza/_components/`
- **Este importat de:** Next.js routing, linkuri din navbar (+ Creaza eveniment)
