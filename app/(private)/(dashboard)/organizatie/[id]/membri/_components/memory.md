# app/(private)/(dashboard)/organizatie/[id]/membri/_components/

Componente client pentru gestionarea membrilor unui ONG.

## Fisiere

### InviteMemberFormClient.tsx
- **Scop:** Formular pentru invitarea unui nou membru prin email — input email + buton submit, cu toast la succes/eroare și refresh după invite
- **Tip:** Client Component
- **Exporturi principale:** `InviteMemberFormClient`
- **Props:** `{ orgId: string }`
- **Apelează:** `inviteMember` din `organization.service`; `useRouter` (refresh), `toast` din sonner
- **Note:** Afișat doar dacă `isAdmin === true` în pagina membri

### MemberActionsClient.tsx
- **Scop:** Butoane de acțiune per membru — toggle rol (admin ↔ member) și eliminare din organizație, cu toast la rezultat și refresh
- **Tip:** Client Component
- **Exporturi principale:** `MemberActionsClient`
- **Props:** `{ orgId: string; userId: string; currentRole: string }`
- **Apelează:** `removeMember`, `updateMemberRole` din `organization.service`; `useRouter` (refresh), `toast` din sonner
- **Note:** Afișat doar pentru admini; `handleToggleRole` alternează `admin` ↔ `member`

## Patterns & Conventii
- Pattern consistent cu restul componentelor client de mutație: loading state + toast eroare + router.refresh()

## Dependente
- **Importa din:** `@/services/organization.service`, `next/navigation`, `sonner`, `@/components/ui/`
- **Este importat de:** `app/(private)/(dashboard)/organizatie/[id]/membri/page.tsx`
