# hooks/

Hook-uri React pentru logică de stare pe partea de client — wrappere peste Server Actions cu state management (loading, error, success).

## Fisiere

### useSignIn.ts
- **Scop:** Wrapper peste `signIn` din auth.service — gestionează loading + error state pentru formularul de autentificare
- **Exporturi principale:** `useSignIn()`
- **Returnează:** `{ handleSignIn(formData), isLoading, error }`
- **Apelează:** `signIn` din `services/auth.service`
- **Importat in:** `SignInFormClient`
- **Note:** Nu gestionează redirectul după succes — `signIn` face redirect intern spre `/panou`; loading-ul rămâne `true` dacă loginul reușește (din cauza redirectului)

### useSignUp.ts
- **Scop:** Wrapper peste `signUp` din auth.service — validare locală (parole coincide), gestionează loading/error/success state
- **Exporturi principale:** `useSignUp()`
- **Returnează:** `{ handleSignUp(formData), isLoading, error, success }`
- **Apelează:** `signUp` din `services/auth.service`
- **Importat in:** `SignUpFormClient`
- **Note:** `success=true` declanșează afișarea mesajului de confirmare email în `SignUpFormClient`; validează `password === confirmPassword` local înainte de a apela server action

### useResetPassword.ts
- **Scop:** Wrapper dual — `handleSendReset` (trimite email reset) + `handleUpdatePassword` (setează parola nouă după click link email)
- **Exporturi principale:** `useResetPassword()`
- **Returnează:** `{ handleSendReset(email), handleUpdatePassword(password), isLoading, error, success }`
- **Apelează:** `sendPasswordResetEmail`, `updatePassword` din `services/auth.service`
- **Importat in:** `ResetPasswordFormClient`

### useEventParticipation.ts
- **Scop:** Gestionează participarea la un eveniment — fetch status inițial, join, leave, cu toast la erori și refresh după mutații
- **Exporturi principale:** `useEventParticipation(eventId: string)`
- **Returnează:** `{ isJoined, isLoading, join(), leave() }`
- **Apelează:** `getParticipationStatus`, `joinEvent`, `leaveEvent` din `services/participation.service`; `useRouter`, `toast` din sonner
- **Importat in:** `ParticipationCardClient`
- **Note:** Fetch status în `useEffect` la mount; `router.refresh()` după join/leave pentru a reîncărca Server Components cu date actualizate

### usePetitionSign.ts
- **Scop:** Gestionează semnarea unei petiții — fetch status inițial, sign, cu toast la erori și refresh după semnare
- **Exporturi principale:** `usePetitionSign(eventId: string)`
- **Returnează:** `{ isSigned, isLoading, sign() }`
- **Apelează:** `getSignatureStatus`, `signPetition` din `services/participation.service`; `useRouter`, `toast` din sonner
- **Importat in:** `SignatureCardClient`
- **Note:** Nu există unsign — petiția odată semnată rămâne semnată; aceeași structură ca `useEventParticipation` fără `leave()`

## Patterns & Conventii
- Toate hook-urile au `'use client'` la prima linie
- Pattern consistent: `useState(false/true)` pentru loading + `useState(null)` pentru error + `useEffect` pentru fetch inițial
- Erorile de la server actions sunt afișate via `toast.error()` (sonner) — nu inline în UI
- `router.refresh()` după orice mutație reușită pentru a sincroniza Server Components cu noua stare din DB

## Dependente
- **Importa din:** `@/services/auth.service`, `@/services/participation.service`, `next/navigation`, `sonner`
- **Este importat de:** `app/(auth)/_components/SignInFormClient`, `SignUpFormClient`, `ResetPasswordFormClient`; `components/shared/ParticipationCardClient`, `SignatureCardClient`
