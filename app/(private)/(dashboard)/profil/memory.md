# app/(private)/(dashboard)/profil/

Pagina de profil a utilizatorului — view mode si edit mode (toggle prin searchParam `?edit=true`).

## Fisiere

### page.tsx
- **Scop:** Pagina `/profil` — fetch profil user, randeaza `ProfileViewMode` sau `ProfileEditModeClient` bazat pe `?edit=true`
- **Tip:** Server Component
- **Exporturi principale:** `ProfilPage` (default export), `metadata`
- **SearchParams:** `{ edit?: 'true' }` — selecteaza modul de afisare
- **Apelează:** `getUserProfile` din `user.service`, `ProfileViewMode`, `ProfileEditModeClient`

### loading.tsx
- **Scop:** Skeleton pentru pagina de profil

## Sub-directoare

- `_components/` — componentele modului de vizualizare si editare

## Patterns & Conventii
- Toggle view/edit via URL searchParam (nu useState) — permite SSR si back navigation corecta
- `notFound()` daca profilul nu se gaseste (user neautentificat care a trecut de middleware)

## Dependente
- **Importa din:** `@/services/user.service`
- **Este importat de:** Dashboard layout
