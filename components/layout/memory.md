# components/layout/

Componente de layout global — două sisteme de navigație separate (PublicNavbar pentru paginile publice, DashboardSidebar pentru dashboard), footer și tipuri partajate.

## Fisiere

### dashboard-types.ts
- **Scop:** Tipuri TypeScript partajate între componentele de dashboard layout
- **Exporturi principale:** `DashboardOrg = { id: string; name: string; logo_url: string | null }`
- **Importat in:** `DashboardSidebar`, `DashboardSidebarNavClient`, `DashboardContextSwitcherClient`, `DashboardMobileSheetClient`

### Navbar.tsx
- **Scop:** PublicNavbar — bara de navigație pentru paginile publice `(public)/`; Server Component care fetchează user, orgId și avatarUrl în paralel
- **Tip:** Server Component
- **Exporturi principale:** `Navbar`
- **Props:** niciuna (fetchează datele intern)
- **Apelează:** `getAuthUser`, `getUserOrgId`, `getUserAvatarUrl`; randeaza `NavbarActionsClient` (desktop authenticated), `NavbarMobileClient` (mobile unauthenticated), `NavbarMobileActionsClient` (mobile authenticated)
- **Note:** Logo centrat pe mobil, stânga pe desktop; navigatie Desktop: Evenimente + Organizații; sticky top-0 cu backdrop-blur

### NavbarActionsClient.tsx
- **Scop:** Dropdown desktop pentru utilizator autentificat în PublicNavbar — avatar + meniu cu link-uri dashboard + AlertDialog deconectare
- **Tip:** Client Component
- **Exporturi principale:** `NavbarActionsClient`
- **Props:** `{ userName, userEmail, orgId: string | null, avatarUrl: string | null }`
- **Apelează:** `signOut`, shadcn `DropdownMenu`, `AlertDialog`
- **Note:** Link "Organizația mea" dacă `orgId !== null`, altfel "Solicită creare ONG"

### NavbarMobileClient.tsx
- **Scop:** Sheet mobil pentru utilizator neautentificat în PublicNavbar — hamburger + Sheet cu link-uri Autentificare/Înregistrare
- **Tip:** Client Component
- **Exporturi principale:** `NavbarMobileClient`
- **Apelează:** shadcn `Sheet`

### NavbarMobileActionsClient.tsx
- **Scop:** Sheet mobil pentru utilizator autentificat în PublicNavbar — hamburger + Sheet cu toate link-urile dashboard + AlertDialog deconectare
- **Tip:** Client Component
- **Exporturi principale:** `NavbarMobileActionsClient`
- **Props:** `{ orgId: string | null }`
- **Apelează:** `signOut`, shadcn `Sheet`, `AlertDialog`

### DashboardSidebar.tsx
- **Scop:** Sidebar desktop pentru dashboard — logo + context switcher + navigație; vizibil doar pe desktop (`hidden md:flex`), sticky pe toata înălțimea ecranului
- **Tip:** Server Component
- **Exporturi principale:** `DashboardSidebar`
- **Props:** `{ userName, userEmail, avatarUrl: string | null, org: DashboardOrg | null }`
- **Apelează:** `DashboardContextSwitcherClient`, `DashboardSidebarNavClient`
- **Importat in:** `app/(private)/(dashboard)/layout.tsx`

### DashboardSidebarNavClient.tsx
- **Scop:** Navigația din sidebar dashboard — grupuri de link-uri (Activitate user / Cont / Platforma sau ONG dacă e în context org), stare activă via `usePathname`/`useSearchParams`, AlertDialog deconectare
- **Tip:** Client Component
- **Exporturi principale:** `DashboardSidebarNavClient`
- **Props:** `{ org: DashboardOrg | null; onClose?: () => void }`
- **Apelează:** `usePathname`, `useSearchParams`, `signOut`, shadcn `AlertDialog`, `cn`
- **Note:** Detectează contextul ONG dacă `searchParams.get('context') === 'org'` sau `pathname.startsWith('/organizatie/')`; acceptă `onClose` pentru a închide Sheet-ul mobil după navigare; link-uri ONG includ: Panou ONG, Evenimente, Membri, Setari

### DashboardContextSwitcherClient.tsx
- **Scop:** Dropdown din sidebar pentru switch context user ↔ org — afișează avatar/logo + nume + email, permite schimbarea contextului
- **Tip:** Client Component
- **Exporturi principale:** `DashboardContextSwitcherClient`
- **Props:** `{ userName, userEmail, avatarUrl: string | null, org: DashboardOrg | null }`
- **Apelează:** `useSearchParams`, `usePathname`, `useRouter`, shadcn `DropdownMenu`, `Avatar`
- **Note:** Dacă `org === null` → afișează doar user fără dropdown; `switchTo('org')` → `router.push('/panou?context=org')`; `switchTo('user')` → `router.push('/panou')`

### DashboardMobileSheetClient.tsx
- **Scop:** Versiunea mobilă a sidebar-ului dashboard — buton hamburger în header mobil care deschide un Sheet cu același conținut ca sidebar-ul
- **Tip:** Client Component
- **Exporturi principale:** `DashboardMobileSheetClient`
- **Props:** `{ userName, userEmail, avatarUrl: string | null, org: DashboardOrg | null }`
- **Apelează:** shadcn `Sheet`, `DashboardContextSwitcherClient`, `DashboardSidebarNavClient`
- **Importat in:** `app/(private)/(dashboard)/layout.tsx`
- **Note:** Trece `onClose={() => setOpen(false)}` la `DashboardSidebarNavClient` pentru închidere automată la navigare

### Footer.tsx
- **Scop:** Footer global pentru paginile publice — dark background, 4 coloane (brand + 3 secțiuni cu link-uri) + social icons (inline SVG)
- **Tip:** Server Component
- **Exporturi principale:** `Footer`
- **Props:** niciuna
- **Importat in:** `app/(public)/layout.tsx`

## Patterns & Conventii
- **Două sisteme separate:** `Navbar` (public) vs `DashboardSidebar` + `DashboardMobileSheetClient` (private) — niciodată o singură componentă condițională
- Server Components (`Navbar`, `DashboardSidebar`, `Footer`) fetchează datele și pasează ca props la Client Components
- Client Components cu suffix `Client` se ocupă de interactivitate (dropdown-uri, sheet-uri, AlertDialog-uri)
- `DashboardSidebarNavClient` acceptă `onClose` pentru a fi refolosit atât în sidebar (fără) cât și în mobile sheet (cu)
- Signout foloseste `AlertDialog` pentru confirmare — nu direct call la `signOut`

## Dependente
- **Importa din:** `@/services/auth.service`, `@/services/user.service`, `@/services/organization.service`, `@/components/ui/`, `@/lib/utils`, `next/navigation`, `next/link`, `lucide-react`
- **Este importat de:** `app/(public)/layout.tsx` (Navbar, Footer), `app/(private)/(dashboard)/layout.tsx` (DashboardSidebar, DashboardMobileSheetClient)
