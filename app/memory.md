# app/

Directorul principal al aplicatiei Next.js 15 App Router — contine layout-ul radacina, paginile globale si toate route group-urile.

## Fisiere

### layout.tsx
- **Scop:** Layout-ul radacina al intregii aplicatii — seteaza fonturile (Montserrat + Inter), providers globali (PostHog, Tooltip, Toaster), Vercel Analytics, si metadatele de baza
- **Tip:** Server Component / Root Layout
- **Exporturi principale:** `RootLayout` (default export), `metadata`
- **Providers montati:** `PostHogProvider`, `PostHogPageView` (in Suspense), `TooltipProvider`, `Toaster` (Sonner), `Analytics` (Vercel)
- **Fonturi:** `--font-montserrat` (Montserrat ExtraBold/Black, pentru heading), `--font-inter` (Inter, pentru body)
- **Apelează:** `@/components/ui/tooltip`, `@/components/ui/sonner`, `@/components/providers/PostHogProvider`, `@/components/providers/PostHogPageView`

### globals.css
- **Scop:** Stilurile globale ale aplicatiei — variabile CSS shadcn, animatii CSS, fonturi, cursor-default global, keyframes pentru `fadeInUp`, `fadeIn`
- **Tip:** CSS Global
- **Contine:** Token-uri CSS shadcn (`--primary` verde civic oklch, `--secondary` galben auriu, `--background`, etc.), `@keyframes fadeInUp`, `@keyframes fadeIn`, clase `.animate-fade-in-up`, `.animate-fade-in`, stiluri pentru auth panel

### not-found.tsx
- **Scop:** Pagina globala 404 cu stil editorial CIVICOM — titlu "Pagina nu exista", doua butoane CTA (Inapoi acasa / Explorează evenimente)
- **Tip:** Server Component
- **Exporturi principale:** `NotFound` (default export), `metadata`
- **Apelează:** `@/components/ui/button`, `@/lib/utils`

### robots.ts
- **Scop:** Genereaza `/robots.txt` — permite indexarea paginilor publice, disallow pe toate rutele private/auth
- **Tip:** Server / Route Handler
- **Exporturi principale:** `robots` (default export)

### sitemap.ts
- **Scop:** Genereaza `/sitemap.xml` dinamic — include rute statice publice + toate evenimentele approved/completed + toate organizatiile approved
- **Tip:** Server Component / Dynamic Route
- **Exporturi principale:** `sitemap` (default export)
- **Apelează:** `@/lib/supabase/server`

## Sub-directoare

- `(auth)/` — paginile de autentificare (layout propriu, robots noindex)
- `(public)/` — paginile publice (layout cu Navbar + Footer)
- `(private)/` — paginile private cu auth obligatorie
- `api/` — route handlers API
- `auth/` — callback OAuth Supabase

## Patterns & Conventii
- Route groups cu paranteze `(auth)`, `(public)`, `(private)` pentru izolarea layout-urilor
- Metadata globala in `layout.tsx`, metadata per pagina in fiecare `page.tsx`
- Enter animations exclusiv CSS (`animate-fade-in-up` din globals.css)

## Dependente
- **Importa din:** `@/components/ui/`, `@/components/providers/`, `@/lib/supabase/server`, `next/font/google`
- **Este importat de:** Next.js build system
