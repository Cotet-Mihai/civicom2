# app/(private)/(dashboard)/organizatie/[id]/setari/_components/

Componenta de editare setări ONG.

## Fisiere

### OngSettingsFormClient.tsx
- **Scop:** Formularul complet de editare al unui ONG — toate câmpurile (nume, CUI, tip, descriere, website, categorii, contact, adresă, IBAN), upload logo + banner + documente, submit via `updateOrganization`
- **Tip:** Client Component
- **Exporturi principale:** `OngSettingsFormClient`
- **Props:** `{ org: OrgDetail }` — tipul complet din `organization.service`
- **Apelează:** `updateOrganization` din `organization.service`; `LogoUploadClient`, `BannerUploadClient`, `DocumentsUploadClient` din `app/(private)/organizatie/_components/`; `toast` din sonner, `useRouter`
- **Note:** Prefillat cu datele existente ale organizației; aceleași componente de upload ca la creare ONG (`OngCreateFormClient`); după submit reușit → toast + router.refresh()

## Patterns & Conventii
- Aceleași componente de upload reutilizate și în `OngCreateFormClient` — plasate în `app/(private)/organizatie/_components/`
- Formularul e un Client Component deoarece gestionează state local pentru toate câmpurile + upload

## Dependente
- **Importa din:** `@/services/organization.service`, `@/app/(private)/organizatie/_components/`, `sonner`, `next/navigation`, `@/components/ui/`
- **Este importat de:** `app/(private)/(dashboard)/organizatie/[id]/setari/page.tsx`
