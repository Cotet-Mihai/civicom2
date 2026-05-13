# Root (civicom2)

Radacina proiectului CIVICOM — platforma de implicare civica Next.js 15 App Router cu Supabase backend.

## Fisiere

### next.config.ts
- **Scop:** Configuratie Next.js — permite imagini de pe domeniul Supabase (bslgppjjtfropjzccetj.supabase.co)
- **Tip:** Config
- **Exporturi principale:** `nextConfig` (default export)

### proxy.ts
- **Scop:** Middleware de autentificare — verifica sesiunea Supabase si redirecteaza: rutele private fara sesiune → `/autentificare`, rutele auth cu sesiune → `/panou`
- **Tip:** Middleware / Util
- **Exporturi principale:** `proxy` (functia middleware), `config` (matcher pattern)
- **Rute private protejate:** `/panou`, `/profil`, `/creeaza`, `/organizatie`, `/admin`, `/completeaza-profil`
- **Rute auth redirectate daca autentificat:** `/autentificare`, `/inregistrare`, `/reseteaza-parola`
- **Apelează:** `@supabase/ssr` createServerClient

### middleware.ts
- **Scop:** Punct de intrare Next.js middleware — re-exportă `proxy` ca `middleware` și `config` din `proxy.ts`
- **Tip:** Next.js Middleware entry point
- **Exporturi principale:** `middleware` (re-export din proxy), `config` (matcher)
- **Nota:** Fișierul trebuie să se numească exact `middleware.ts` pentru ca Next.js să îl recunoască

### next-env.d.ts
- **Scop:** Tipuri TypeScript generate automat de Next.js
- **Tip:** Type declaration

## Patterns & Conventii
- Middleware pattern: functia se numeste `proxy` (nu `middleware`) si este importata in `middleware.ts` (nu exista in root)
- Configuratia Next.js permite doar imagini de pe Supabase storage

## Dependente
- **Importa din:** `@supabase/ssr`, `next/server`
- **Logic suplimentară:** Dacă user autentificat este pe rută privată (alta decât `/completeaza-profil`) și `is_profile_complete = false` în `users` → redirect la `/completeaza-profil`
- **Este importat de:** `middleware.ts` (root) — re-exportă ca `middleware` pentru Next.js
