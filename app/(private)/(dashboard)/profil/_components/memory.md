# app/(private)/(dashboard)/profil/_components/

Componentele paginii de profil — view mode server + edit mode client cu upload avatar si editare nume.

## Fisiere

### ProfileViewMode.tsx
- **Scop:** Modul de vizualizare al profilului — avatar cu initiale fallback, gradient banner, informatii cont (email, telefon, locatie, data nasterii, data inregistrarii), card "Identitate & Educatie" (gen, studii), buton "Editeaza profil" (link la `?edit=true`)
- **Tip:** Server Component
- **Exporturi principale:** `ProfileViewMode`
- **Props:** `{ profile: UserProfile }`
- **Subcomponenta locala:** `InfoRow` — un rand cu icon + label + valoare
- **Importat in:** `profil/page.tsx`

### ProfileEditModeClient.tsx
- **Scop:** Modul de editare al profilului — compune `AvatarUploadClient` + `ProfileEditFormClient` intr-un layout cu back button
- **Tip:** Client Component
- **Exporturi principale:** `ProfileEditModeClient`
- **Props:** `{ profile: UserProfile }`
- **Apelează:** `AvatarUploadClient`, `ProfileEditFormClient`
- **Importat in:** `profil/page.tsx`

### AvatarUploadClient.tsx
- **Scop:** Upload avatar — click pe imagine deschide file picker, upload direct la Supabase Storage (bucket `avatars`), preview blob local, apeleaza `updateAvatar` pentru a salva URL-ul in DB
- **Tip:** Client Component
- **Exporturi principale:** `AvatarUploadClient`
- **Props:** `{ currentAvatarUrl: string | null, name: string, userId: string }`
- **Validare:** max 2MB, tipuri acceptate: jpg/png/webp/gif
- **Apelează:** `createBrowserClient` (@supabase/ssr), `updateAvatar` din `user.service`, `useRouter`, `toast`
- **State:** `preview` (URL string | null), `isLoading` (boolean)

### ProfileEditFormClient.tsx
- **Scop:** Formular complet de editare profil — nume, telefon (+40 badge), data nasterii (Calendar picker), judet+oras, sex biologic, gen, orientare sexuala, nivel studii; apeleaza `updateUserProfile`, redirect la `/profil` dupa succes
- **Tip:** Client Component
- **Exporturi principale:** `ProfileEditFormClient`
- **Props:** `{ profile: UserProfile }`
- **Apelează:** `updateUserProfile` din `user.service`, `useRouter`, `toast`
- **Pattern Select:** dicționare LABELS + children explicit pe SelectValue + alignItemWithTrigger=false (Base UI pattern)

## Patterns & Conventii
- Upload avatar: browser client Supabase direct (nu Server Action) — pentru a putea face upload din browser
- Dupa modificari: `router.refresh()` pentru a re-fetch datele server-side

## Dependente
- **Importa din:** `@/services/user.service`, `@supabase/ssr`, `@/components/ui/`, `sonner`, `next/navigation`
- **Este importat de:** `profil/page.tsx`
