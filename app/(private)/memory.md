# app/(private)/

Route group pentru toate paginile care necesita autentificare — layout cu redirect la /autentificare daca sesiunea lipseste.

## Fisiere

### layout.tsx
- **Scop:** Layout minimal pentru rutele private — verifica sesiunea si redirecteaza daca lipseste (double-check dupa middleware)
- **Tip:** Server Component / Layout
- **Exporturi principale:** `PrivateLayout` (default export)
- **Nota:** Protectia principala e in `proxy.ts` (middleware); acest layout e un safety net

## Sub-directoare

- `(dashboard)/` — dashboard-ul utilizatorului si al ONG-ului (sidebar layout)
- `admin/` — paginile de administrare (role=admin)
- `creeaza/` — stepper-ele de creare evenimente
- `completeaza-profil/` — formular onboarding completare profil (afișat imediat după confirmare email și la orice acces dacă `is_profile_complete = false`)
- `evenimente/[id]/contestatie/` — formularul de contestatie
- `organizatie/` — creare ONG si upload assets ONG

## Patterns & Conventii
- Toate paginile din `(private)/` sunt protejate de middleware (`proxy.ts`)
- Metadatele din layout-ul `(private)/layout.tsx` nu includ robots (paginile private nu sunt indexabile)

## Dependente
- **Importa din:** Next.js navigation
- **Este importat de:** Next.js routing
