# app/(auth)/

Route group pentru paginile de autentificare — layout cu split panel (formular stanga, imagine dreapta pe desktop), noindex pe toate paginile.

## Fisiere

### layout.tsx
- **Scop:** Layout-ul comun tuturor paginilor de autentificare — split panel 50/50 cu logo CIVICOM si formular in stanga, imagine `/auth_panel.webp` in dreapta (desktop only)
- **Tip:** Server Component / Layout
- **Exporturi principale:** `AuthLayout` (default export), `metadata` (robots noindex)
- **Props:** `{ children: React.ReactNode }`

### autentificare/page.tsx
- **Scop:** Pagina `/autentificare` — wrapper server cu metadata, randeaza `SignInFormClient`
- **Tip:** Server Component
- **Exporturi principale:** `AutentificarePage` (default export), `metadata` (title: 'Autentificare')

### autentificare/SignInFormClient.tsx
- **Scop:** Formular de autentificare cu email + parola, tratare erori cu mesaje in romana, link catre forgot password si inregistrare
- **Tip:** Client Component
- **Exporturi principale:** `SignInFormClient`
- **Apelează:** `useSignIn` hook, `Input`, `InputPassword`, `Button`, `Label`
- **State:** `email`, `password` (string)
- **Functie helper locala:** `translateError(error)` — translateaza mesajele Supabase in romana

### inregistrare/page.tsx
- **Scop:** Pagina `/inregistrare` — wrapper server cu metadata, randeaza `SignUpFormClient`
- **Tip:** Server Component
- **Exporturi principale:** `InregistrarePage` (default export), `metadata` (title: 'Inregistrare')

### inregistrare/SignUpFormClient.tsx
- **Scop:** Formular de inregistrare cu nume complet, email, parola (cu indicator de forta), confirmare parola; afiseaza mesaj de confirmare email dupa succes
- **Tip:** Client Component
- **Exporturi principale:** `SignUpFormClient`
- **Apelează:** `useSignUp` hook, `Input`, `InputPassword`, `InputPasswordStrength`, `Button`, `Label`
- **State:** `name`, `email`, `password`, `confirmPassword` (string)
- **Functie helper locala:** `translateError(error)`

### reseteaza-parola/page.tsx
- **Scop:** Pagina `/reseteaza-parola` — wrapper server cu metadata, randeaza `ResetPasswordFormClient`
- **Tip:** Server Component
- **Exporturi principale:** `ResetPasswordPage` (default export), `metadata`

### reseteaza-parola/ResetPasswordFormClient.tsx
- **Scop:** Formular de resetare parola — trimite email de resetare; dupa succes afiseaza confirmare cu adresa email
- **Tip:** Client Component
- **Exporturi principale:** `ResetPasswordFormClient`
- **Apelează:** `useResetPassword` hook, `Input`, `Button`, `Label`
- **State:** `email` (string)

## Patterns & Conventii
- Toate paginile sunt noindex (set in layout.tsx)
- Fiecare pagina = un fisier `page.tsx` (Server Component cu metadata) + un fisier `*FormClient.tsx` (Client Component cu logica)
- Erorile Supabase se translateaza in romana cu functii locale `translateError`
- Animatia de intrare: clasa CSS `animate-fade-in-up` (fara useState)

## Dependente
- **Importa din:** `@/hooks/useSignIn`, `@/hooks/useSignUp`, `@/hooks/useResetPassword`, `@/components/ui/`, `@/services/auth.service`
- **Este importat de:** Next.js routing
