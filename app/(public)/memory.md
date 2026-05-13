# app/(public)/

Route group pentru paginile publice — layout cu Navbar + Footer, indexabile de motoarele de cautare.

## Fisiere

### layout.tsx
- **Scop:** Layout-ul comun paginilor publice — monteaza `Navbar` si `Footer`; dacă utilizatorul e autentificat și `is_profile_complete = false` → redirect la `/completeaza-profil`
- **Tip:** Server Component / Layout (async)
- **Exporturi principale:** `PublicLayout` (default export)
- **Apelează:** `@/components/layout/Navbar`, `@/components/layout/Footer`, `@/lib/supabase/server`
- **Nota:** Check-ul de profil se aplică DOAR utilizatorilor autentificați; utilizatorii neautentificați văd paginile publice normal

### page.tsx (Homepage `/`)
- **Scop:** Pagina principala — fetch paralel stats + recent events + orgs aprobate, randeaza sectiunile homepage, include JSON-LD WebSite + SearchAction
- **Tip:** Server Component
- **Exporturi principale:** `HomePage` (default export), `metadata`
- **Apelează:** `getHomepageStats`, `getRecentEvents` (6 evenimente), `getApprovedOrgs` din services
- **Sectiuni randate:** HeroSection, StatsSection, ActionTypesSection, OrganizationsSection, EventsSection, FaqSection, CtaSection

## Sub-directoare

- `_components/` — componentele sectiunilor homepage (HeroSection, StatsSection, etc.)
- `evenimente/` — pagina lista + paginile detail per tip eveniment
- `organizatii/` — pagina lista + pagina detail organizatie

## Patterns & Conventii
- Paginile publice sunt indexabile — fiecare `page.tsx` defineste propria `metadata` si `alternates.canonical`
- Datele se fetch-uiesc in `page.tsx` (Server Component) si se paseaza ca props componentelor

## Dependente
- **Importa din:** `@/components/layout/Navbar`, `@/components/layout/Footer`, `@/services/homepage.service`, `@/services/event.service`
- **Este importat de:** Next.js routing
