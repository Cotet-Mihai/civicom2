# app/(private)/(dashboard)/

Layout-ul dashboard-ului — sidebar persistent cu navigatie + context switcher user/org, mobile header cu drawer.

## Fisiere

### layout.tsx
- **Scop:** Layout-ul principal al dashboard-ului — autentificare obligatorie, fetch user data + org + avatar, randeaza `DashboardSidebar` (desktop) si `DashboardMobileSheetClient` (mobil)
- **Tip:** Server Component / Layout
- **Exporturi principale:** `DashboardLayout` (default export)
- **Apelează:** `getAuthUser`, `getUserAvatarUrl`, `getUserOrgByAuthId` (cached), `DashboardSidebar`, `DashboardMobileSheetClient`
- **Redirect:** la `/autentificare` daca user lipseste

## Sub-directoare

- `panou/` — pagina principala dashboard + sub-paginile (evenimente, participari, petitii, contestatii)
- `profil/` — pagina de profil utilizator
- `organizatie/[id]/` — panou ONG, membri, setari

## Patterns & Conventii
- `getUserOrgByAuthId` e wrapped in `cache()` din `lib/server-cache.ts` — apelat o singura data per request chiar daca e folosit in layout + children
- Layout fetches: user (getAuthUser), avatar (getUserAvatarUrl), org (getUserOrgByAuthId) — toate in paralel cu `Promise.all`
- Mobile: top bar cu hamburger care deschide `DashboardMobileSheetClient` (Sheet cu acelasi continut ca sidebar-ul)

## Dependente
- **Importa din:** `@/services/auth.service`, `@/services/user.service`, `@/lib/server-cache`, `@/components/layout/DashboardSidebar`, `@/components/layout/DashboardMobileSheetClient`
- **Este importat de:** Toate paginile din `(dashboard)/`
