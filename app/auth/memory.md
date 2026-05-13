# app/auth/

Route handler pentru callback-ul OAuth Supabase — schimba codul de autentificare cu o sesiune si redirecteaza.

## Fisiere

### callback/route.ts
- **Scop:** GET handler pentru `/auth/callback` — primeste `code` si `next` din query params, schimba codul cu o sesiune Supabase, redirecteaza la `next` (default `/panou`) sau la `/autentificare?error=auth` in caz de eroare
- **Tip:** Route Handler (API)
- **Exporturi principale:** `GET` (functie handler)
- **Apelează:** `@/lib/supabase/server` createClient, `supabase.auth.exchangeCodeForSession`

## Patterns & Conventii
- Folosit pentru confirmarea email-ului la inregistrare si pentru resetarea parolei
- Parametrul `next` permite redirect personalizat dupa autentificare (ex: `/reseteaza-parola/actualizeaza`)

## Dependente
- **Importa din:** `@/lib/supabase/server`, `next/server`
- **Este importat de:** Supabase Auth redirect URL
