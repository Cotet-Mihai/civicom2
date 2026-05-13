# app/api/

Route handlers API pentru operatiuni server-side ce necesita redirect sau raspuns HTTP direct.

## Fisiere

### signout/route.ts
- **Scop:** GET handler pentru `/api/signout` — apeleaza `supabase.auth.signOut()` si redirecteaza la `/autentificare`; folosit ca fallback sau din link-uri directe
- **Tip:** Route Handler (API)
- **Exporturi principale:** `GET` (functie handler)
- **Apelează:** `@/lib/supabase/server` createClient
- **Nota:** Deconectarea din UI foloseste de obicei `signOut()` din `auth.service.ts` (Server Action), nu acest route

### confirm-sign-up/route.ts
- **Scop:** GET handler pentru `/api/confirm-sign-up` — verifică `token_hash` + `type` din link-ul de confirmare email (Email OTP flow) folosind `supabase.auth.verifyOtp()` și redirecționează la `/panou` sau la `next` param
- **Tip:** Route Handler (API)
- **Exporturi principale:** `GET` (funcție handler)
- **Apelează:** `@/lib/supabase/server` createClient, `supabase.auth.verifyOtp`
- **Nota:** Diferit de `/auth/callback` care folosește `exchangeCodeForSession` pentru codul PKCE OAuth; acesta tratează confirmarea prin email (token_hash)

## Patterns & Conventii
- Redirecteaza la `NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'` + `/autentificare`

## Dependente
- **Importa din:** `@/lib/supabase/server`, `next/server`
- **Este importat de:** Link-uri directe de deconectare (rare)
