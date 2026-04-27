# Etapa 10 — Contestații: Context

## Ce s-a implementat

### services/appeal.service.ts
- `createAppeal(eventId, reason)` — inserează appeal, tranziționează evenimentul din `rejected` → `contested`
- `getAllAppeals()` — admin-only (guard checkIsAdmin), returnează appeals cu status pending/under_review + info eveniment și creator
- `resolveAppeal(appealId, decision, adminNote)` — admin aprobă/respinge: actualizează event status, marchează appeal resolved, trimite notificare creator

### Pagini utilizator
- `/evenimente/[id]/contestatie` — formular contestație; guards: auth, ownership, status=rejected; min 20 caractere
- `/panou/contestatii` — lista contestațiilor utilizatorului (exista deja din Etapa 8)

### Pagini admin
- `/admin/contestatii` — lista contestațiilor active cu inline approve/reject
- AdminTabsClient actualizat cu tab "Contestații"
- getAdminStats extins cu pendingAppeals

### Dashboard utilizator
- `panou/evenimente/page.tsx` — link "Contestează decizia →" apare sub evenimentele cu status `rejected`

## Decizii arhitecturale

- Re-appeal permis: dacă adminul respinge contestația (event → rejected), userul poate depune o nouă contestație — conform flow-ului din CLAUDE.md (`rejected → contested → reanaliză`)
- `under_review` status există în DB enum dar nu e folosit în flow-ul curent — placeholder pentru moderare în mai mulți pași (viitor)
- Fără tranzacții DB: createAppeal și resolveAppeal au mai mulți pași fără rollback — limitare acceptată consistent cu restul serviciilor din codebase

## Tipuri cheie
- `AdminAppeal` (exportat din appeal.service.ts): id, event_id, event_title, event_status, event_rejection_note, creator_name, reason, status, admin_note, created_at
- `DashboardAppeal` (în user.service.ts): id, event_id, event_title, status, created_at
