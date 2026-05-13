# lib/supabase/

Cei trei clienți Supabase — browser, server (async cu cookies), admin (service_role, bypass RLS).

## Fisiere

### client.ts
- **Scop:** Client Supabase pentru componente client (browser) — folosit în hooks și funcții de upload
- **Exporturi principale:** `createClient()` — returnează un `BrowserClient` sincron
- **Apelează:** `createBrowserClient` din `@supabase/ssr`
- **Variabile de mediu:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Importat in:** Nicio componentă nu importă direct — `lib/upload.ts` foloseste intern `createBrowserClient`; hook-urile apelează Server Actions
- **Note:** Funcție sincronă (nu async); creează clientul cu anon key — supus RLS

### server.ts
- **Scop:** Client Supabase pentru Server Components, Server Actions și Route Handlers — citește/scrie cookies pentru sesiune
- **Exporturi principale:** `createClient()` — returnează un `ServerClient` **async** (require `await`)
- **Apelează:** `createServerClient` din `@supabase/ssr`, `cookies` din `next/headers`
- **Variabile de mediu:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Importat in:** Toate fișierele din `services/` (cu excepția `notification.service.ts`)
- **Note:** Funcție async — trebuie apelată cu `await createClient()`; `setAll` în try/catch pentru că Server Components nu pot seta cookies (doar Server Actions pot); supus RLS

### admin.ts
- **Scop:** Client Supabase cu service_role — bypass complet RLS, folosit pentru operații privilegiate
- **Exporturi principale:** `createAdminClient()` — returnează un `SupabaseClient` sincron cu service_role
- **Apelează:** `createClient` din `@supabase/supabase-js` (nu din `@supabase/ssr`)
- **Variabile de mediu:** `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (secret, nu expus clientului)
- **Importat in:** `notification.service.ts`, `completion.service.ts`, `organization.service.ts`
- **Note:** `autoRefreshToken: false, persistSession: false` — nu gestionează sesiunea utilizatorului; utilizat exclusiv server-side; NICIODATĂ importat în componente client

## Patterns & Conventii
- **Regula de bază:** client.ts = browser, server.ts = server/actions, admin.ts = bypass RLS
- `createClient` din `server.ts` este async (await) — nu confundati cu `createClient` din `client.ts` (sync)
- Ambele `createClient` din client.ts și server.ts folosesc anon key (RLS activ)
- Doar `admin.ts` foloseste `SUPABASE_SERVICE_ROLE_KEY` — cheia nu trebuie expusă în cod client

## Dependente
- **Importa din:** `@supabase/ssr` (client.ts, server.ts), `@supabase/supabase-js` (admin.ts), `next/headers` (server.ts)
- **Este importat de:** `lib/upload.ts` (browser client), toate `services/*.ts` (server client sau admin client)
