# Etapa 1 — Autentificare (COMPLETATĂ PARȚIAL)

**Data:** 2026-04-22
**Branch:** `feat/auth` (creat din `feat/setup-infrastructure`)
**Status:** Implementată tehnic 100%, design pagini de refăcut după restart sesiune (skill `frontend-design` instalat, necesar restart)

---

## Ce s-a făcut

### 1. `services/auth.service.ts`

Server Actions pentru toate operațiunile de autentificare:

```typescript
'use server'
// Funcții exportate:
signUp({ name, email, password })       // Înregistrare + metadata name
signIn({ email, password })              // Login → redirect('/panou') la succes
signOut()                                // Delogare → redirect('/autentificare')
sendPasswordResetEmail(email)            // Email resetare cu redirectTo spre /auth/callback
updatePassword(password)                 // Actualizare parolă → redirect('/panou')
getSession()                             // Returnează sesiunea curentă
```

> **IMPORTANT:** `signIn` și `signOut` și `updatePassword` folosesc `redirect()` din next/navigation direct în server action — nu returnează erori în caz de succes, returnează `{ error: string }` doar la eșec.

---

### 2. Hooks

#### `hooks/useSignIn.ts`
```typescript
const { handleSignIn, isLoading, error } = useSignIn()
// handleSignIn({ email, password }) → apelează signIn server action
// La eroare → setează error string, oprește loading
// La succes → redirect-ul se face din server action, nu din hook
```

#### `hooks/useSignUp.ts`
```typescript
const { handleSignUp, isLoading, error, success } = useSignUp()
// handleSignUp({ name, email, password })
// La succes → success = true (afișează ecran confirmare email)
```

#### `hooks/useResetPassword.ts`
```typescript
const { handleSendReset, handleUpdatePassword, isLoading, error, success } = useResetPassword()
// handleSendReset(email) → trimite email resetare
// handleUpdatePassword(password) → actualizează parola (după callback OAuth)
```

---

### 3. Componente UI

#### `components/ui/InputPassword.tsx`
- Wrapper peste shadcn `<Input>` cu toggle vizibilitate parolă
- Iconiță Eye/EyeOff din lucide-react
- `tabIndex={-1}` pe butonul de toggle (nu intră în tab order)
- Props: extinde `React.InputHTMLAttributes<HTMLInputElement>` + `className`

#### `components/ui/InputPasswordStrength.tsx`
- Wrapper peste `InputPassword` cu indicator putere parolă
- 4 nivele: Slabă (roșu) · Medie (galben) · Bună (albastru) · Puternică (verde)
- Scor calculat pe: lungime ≥8 · majuscule · cifre · caractere speciale
- Bara de progres: 4 segmente colorate + label text
- Apare doar când `password.length > 0`

#### Shadcn componente adăugate
- `components/ui/input.tsx` — instalat via `pnpm dlx shadcn@latest add input`
- `components/ui/label.tsx` — instalat via `pnpm dlx shadcn@latest add label`

---

### 4. Route Group `(auth)`

#### `app/(auth)/layout.tsx`
- `metadata robots: { index: false, follow: false }` — moștenit de toate paginile auth
- Layout centrat: `min-h-screen flex items-center justify-center bg-muted/30 p-4`

#### `app/(auth)/autentificare/page.tsx` + `SignInFormClient.tsx`
- Form: Email + Parolă (InputPassword) + link "Ai uitat parola?"
- Link spre `/inregistrare`
- Animație intrare: `animate-fade-in-up` (CSS din globals.css)
- Traducere erori Supabase în română: `translateError()` local în fișier
- Erori traduse: "Invalid login credentials" · "Email not confirmed" · "Too many requests"

#### `app/(auth)/inregistrare/page.tsx` + `SignUpFormClient.tsx`
- Form: Nume complet + Email + Parolă (InputPasswordStrength)
- La succes → ecran confirmare email (fără redirect, arată mesaj cu adresa)
- Animație: `animate-fade-in-up` (form) · `animate-fade-in` (ecran confirmare)
- Erori traduse: "User already registered" · "Password should be" · "Unable to validate email"

#### `app/(auth)/reseteaza-parola/page.tsx` + `ResetPasswordFormClient.tsx`
- Form: doar Email
- La succes → ecran confirmare (mesaj neutru — nu dezvăluie dacă emailul există)
- Link înapoi la `/autentificare`

---

### 5. OAuth Callback

#### `app/auth/callback/route.ts`
```typescript
// GET handler — apelat de Supabase după confirmare email / OAuth
// Parametri: ?code=... &next=... (default: /panou)
// exchangeCodeForSession(code) → redirect la `next`
// La eroare → redirect la /autentificare?error=auth
```

---

### 6. Endpoint utilitar

#### `app/api/signout/route.ts`
- GET handler pentru delogare directă din browser (fără UI)
- Util în development: navighează la `http://localhost:3000/api/signout`
- Redirect la `/autentificare` după signOut

---

## Structura fișierelor create

```
services/
  auth.service.ts

hooks/
  useSignIn.ts
  useSignUp.ts
  useResetPassword.ts

components/ui/
  InputPassword.tsx
  InputPasswordStrength.tsx
  input.tsx          ← shadcn
  label.tsx          ← shadcn

app/
  (auth)/
    layout.tsx
    autentificare/
      page.tsx
      SignInFormClient.tsx
    inregistrare/
      page.tsx
      SignUpFormClient.tsx
    reseteaza-parola/
      page.tsx
      ResetPasswordFormClient.tsx
  auth/
    callback/
      route.ts
  api/
    signout/
      route.ts
```

---

## Build & TypeScript

```
pnpm tsc --noEmit   → 0 erori
pnpm build          → succes

Route (app)
┌ ○ /
├ ○ /_not-found
├ ○ /autentificare
├ ƒ /auth/callback
├ ○ /inregistrare
└ ○ /reseteaza-parola

ƒ Proxy (Middleware)
```

---

## Probleme întâlnite și rezolvate

### Sesiune Supabase rămasă din Etapa 0
- **Problemă:** `proxy.ts` detecta sesiunea veche → redirect la `/panou` (inexistent) când se accesa `/autentificare`
- **Fix:** Creat `/api/signout` route pentru delogare directă. Utilizatorul poate naviga la `http://localhost:3000/api/signout` sau poate șterge cookie-urile `sb-*` pentru localhost din DevTools.

---

## Ce rămâne de făcut în această etapă

### Design pages — DE REFĂCUT
Paginile de autentificare au un design minimal. Skill-ul `frontend-design` (instalat din marketplace-ul oficial Anthropic) trebuie invocat după restart sesiune pentru a reproiecta paginile conform indicațiilor de design.

**Skill instalat:** `frontend-design@claude-plugins-official`
**Locație skill:** `C:\Users\mc_mi\.claude\plugins\cache\claude-plugins-official\frontend-design\unknown\skills\frontend-design`

> La restart sesiune: invocă skill-ul `plugin:frontend-design:frontend-design` înainte de a reproiecta paginile de autentificare.

---

## Note arhitecturale importante

- Server Actions din `auth.service.ts` folosesc `redirect()` direct → nu pot fi testate cu `await` simplu (throw la redirect în test environment)
- `sendPasswordResetEmail` folosește `process.env.NEXT_PUBLIC_SITE_URL` cu fallback `http://localhost:3000` — în producție trebuie setat `NEXT_PUBLIC_SITE_URL=https://civicom.ro` în Vercel
- `updatePassword` este apelat din `/reseteaza-parola/actualizeaza` — această pagină NU există încă, va fi creată când se reproiectează secțiunea
- Componentele `SignInFormClient`, `SignUpFormClient`, `ResetPasswordFormClient` sunt locale în folderele paginilor (nu în `/components/shared`) — conform regulii arhitecturale: componente locale până când sunt necesare pe altă pagină
