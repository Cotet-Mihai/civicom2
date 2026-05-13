# app/(private)/(dashboard)/panou/_components/

Componentele locale ale paginii principale dashboard — butonul de finalizare manuala a evenimentelor.

## Fisiere

### CompleteEventButtonClient.tsx
- **Scop:** Buton "Marcheaza finalizat" pentru evenimentele cu finalizare manuala (boycott, petition, donations, livestream) — apare doar pentru evenimentele `approved` de tipul potrivit
- **Tip:** Client Component
- **Exporturi principale:** `CompleteEventButtonClient`
- **Props:** `{ eventId: string, category: string, subcategory: string | null, status: string }`
- **Logica:** Functia `isManualComplete` determina daca tipul de eveniment suporta finalizare manuala; returneaza `null` daca nu e cazul
- **Apelează:** `completeEvent` din `completion.service`, `toast` (Sonner), `useRouter` (pentru refresh)
- **State:** `loading` (boolean)
- **Importat in:** `panou/page.tsx` pentru fiecare rand de eveniment din lista recenta

## Patterns & Conventii
- Returneaza `null` (fara render) daca evenimentul nu e `approved` sau nu suporta finalizare manuala
- Dupa succes: `toast.success` + `router.refresh()` pentru a actualiza datele

## Dependente
- **Importa din:** `@/services/completion.service`, `@/components/ui/button`, `sonner`
- **Este importat de:** `panou/page.tsx`
