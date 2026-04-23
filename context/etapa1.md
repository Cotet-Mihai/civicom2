# Etapa 1 — Autentificare (COMPLETATĂ)

**Data:** 2026-04-22
**Branch:** `feat/auth` (creat din `feat/setup-infrastructure`)
**Status:** ✅ Implementare tehnică + design finalizate

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

> **IMPORTANT:** `signIn`, `signOut` și `updatePassword` folosesc `redirect()` din next/navigation direct în server action — nu returnează erori în caz de succes, returnează `{ error: string }` doar la eșec.

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

### 4. Route Group `(auth)` — Design final

#### `app/(auth)/layout.tsx`
- `metadata robots: { index: false, follow: false }` — moștenit de toate paginile auth
- **Layout split-screen:**
  - Stânga: panou alb cu logo `CIVICOM✨` + formular centrat + footer "Termeni de utilizare"
  - Dreapta (doar desktop `lg:`): imagine `public/auth_panel.webp` cu `next/image fill` + gradient overlay la bază cu tagline „Fii vocea schimbării."
  - Mobil: doar panoul cu formularul, imaginea ascunsă (`hidden lg:block`)
- Structura layout cu clase Tailwind native (nu custom CSS) pentru a garanta că `next/image fill` are container cu dimensiuni corecte

> **Lecție:** `next/image fill` necesită parent cu `position: relative` + height definit. Folosind clase Tailwind (`relative hidden overflow-hidden lg:block lg:flex-1`) în loc de custom CSS se evită probleme de încărcare a stilurilor.

#### `app/(auth)/autentificare/page.tsx` + `SignInFormClient.tsx`
- Form: Email + Parolă (InputPassword) + link "Ai uitat parola?"
- Link spre `/inregistrare`
- Animație intrare: `animate-fade-in-up`
- Traducere erori Supabase în română: `translateError()` local în fișier
- Erori traduse: "Invalid login credentials" · "Email not confirmed" · "Too many requests"
- Buton submit: shadcn `Button` cu `bg-green-600 hover:bg-green-700 text-white`
- Subtitle afișează: `CIVICOM✨`

#### `app/(auth)/inregistrare/page.tsx` + `SignUpFormClient.tsx`
- Form: Nume complet + Email + Parolă (InputPasswordStrength)
- La succes → ecran confirmare email cu icon `<Mail>` în cerc verde, fără redirect
- Animație: `animate-fade-in-up` (form) · `animate-fade-in` (ecran confirmare)
- Erori traduse: "User already registered" · "Password should be" · "Unable to validate email"
- Subtitle afișează: `CIVICOM✨`

#### `app/(auth)/reseteaza-parola/page.tsx` + `ResetPasswordFormClient.tsx`
- Form: doar Email
- La succes → ecran confirmare (mesaj neutru — nu dezvăluie dacă emailul există)
- Icon `<Mail>` cu cerc verde pe ecranul de succes
- Link înapoi la `/autentificare` cu `<ArrowLeft>`

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

### 7. Asset adăugat

#### `public/auth_panel.webp`
- Copiat din proiectul vechi (`civicom/public/images/signin_page.webp`)
- Imagine cu voluntari în tricouri verzi — folosit ca panou decorativ pe desktop în toate paginile auth

---

### 8. Reguli adăugate în `CLAUDE.md`

- **Brand:** `CIVICOM✨` oriunde în UI vizibil; fără emoji în metadata SEO
- **Pagini noi:** Consultă obligatoriu Notion → Pagini & Rute înainte de implementare

---

## Structura fișierelor create/modificate

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

public/
  auth_panel.webp    ← imagine panou decorativ desktop

app/
  globals.css        ← animații fadeInUp, fadeIn + secțiune auth CSS (clase decorative)
  (auth)/
    layout.tsx       ← split-screen: form stânga + imagine dreapta
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
├ ƒ /api/signout
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
- **Fix:** Creat `/api/signout` route pentru delogare directă.

### `next/image fill` acoperea tot ecranul
- **Problemă:** Custom CSS classes din `globals.css` nu garantau că `position: relative` și `height` erau aplicate pe containerul imaginii — imaginea se poziționa absolut față de viewport
- **Fix:** Structura layout-ului rescrisă cu clase Tailwind native (`relative hidden overflow-hidden lg:block lg:flex-1`) care sunt compilate garantat în bundle-ul CSS

### Formulare fără stilizare
- **Problemă:** Formularele foloseau clase CSS custom (`auth-form-wrap`, `auth-submit-btn` etc.) care nu se aplicau corect
- **Fix:** Rescrise cu shadcn `Button` / `Input` / `Label` + Tailwind classes directe

---

## Note arhitecturale importante

- Server Actions din `auth.service.ts` folosesc `redirect()` direct → nu pot fi testate cu `await` simplu (throw la redirect în test environment)
- `sendPasswordResetEmail` folosește `process.env.NEXT_PUBLIC_SITE_URL` cu fallback `http://localhost:3000` — în producție trebuie setat `NEXT_PUBLIC_SITE_URL=https://civicom.ro` în Vercel
- `updatePassword` este apelat din `/reseteaza-parola/actualizeaza` — această pagină **NU există încă**, va fi creată în etapa dedicată
- Componentele `SignInFormClient`, `SignUpFormClient`, `ResetPasswordFormClient` sunt locale în folderele paginilor (nu în `/components/shared`) — conform regulii arhitecturale
- Clasele CSS custom din `globals.css` (secțiunea `/* AUTH PAGES */`) rămân pentru elementele pur decorative (overlay imagine, tagline), nu pentru structura de layout
