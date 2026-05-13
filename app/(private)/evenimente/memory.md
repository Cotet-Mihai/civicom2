# app/(private)/evenimente/

Paginile private legate de un eveniment specific — contestatie și editare.

## Fisiere

### layout.tsx
- **Scop:** Layout minimal pentru rutele private de eveniment
- **Tip:** Server Component / Layout
- **Exporturi principale:** `EventLayout` (default export)

### [id]/contestatie/page.tsx
- **Scop:** Pagina de contestatie `/evenimente/[id]/contestatie` — verifica ca utilizatorul este creatorul evenimentului si ca evenimentul e `rejected`; afiseaza detalii eveniment + motivul respingerii + formularul de contestatie
- **Tip:** Server Component
- **Exporturi principale:** `ContestatiePage` (default export), `metadata`
- **Verificari:** user autentificat, creator al evenimentului, status === 'rejected'
- **Apelează:** `createClient` (Supabase direct, nu service), `AppealFormClient`
- **Redirect:** la `/panou/evenimente` daca statusul nu e `rejected`, la `/autentificare` daca nu e autentificat

### [id]/contestatie/_components/AppealFormClient.tsx
- **Scop:** Formularul de contestatie — textarea cu motiv (minim 20 caractere), apeleaza `createAppeal`, redirect la `/panou/contestatii` dupa succes
- **Tip:** Client Component
- **Exporturi principale:** `AppealFormClient`
- **Props:** `{ eventId: string }`
- **Validare:** motiv minim 20 caractere (client + server)
- **Apelează:** `createAppeal` din `appeal.service`, `useRouter`, `toast`
- **State:** `reason` (string), `isLoading` (boolean)

### [id]/editare/page.tsx
- **Scop:** Pagina de editare `/evenimente/[id]/editare` — verifica ca utilizatorul este creatorul evenimentului si ca evenimentul nu e `completed`; paseaza datele complete la `EditEventFormClient`
- **Tip:** Server Component
- **Exporturi principale:** `EditarePage` (default export), `metadata`
- **Verificari:** user autentificat, creator al evenimentului, status !== 'completed'
- **Apelează:** `createClient`, `getEventForEdit` din `edit.service`
- **Redirect:** la `/panou/evenimente` daca status e `completed`, la `/autentificare` daca nu e autentificat

### [id]/editare/_components/EditEventFormClient.tsx
- **Scop:** Formular complet de editare a unui eveniment — gestioneaza toate categoriile (protest/petition/boycott/community/charity) si subcategoriile
- **Tip:** Client Component
- **Exporturi principale:** `EditEventFormClient`
- **Props:** `{ eventId: string; data: EditEventData; authUserId: string }`
- **State:** `form: FormState` (flat object cu toate campurile posibile), `submitting: boolean`
- **La submit:** construieste `UpdateEventPayload` pe baza `data.kind`, apeleaza `updateEvent`, redirect la `/panou/evenimente`
- **Nota:** locatia nu poate fi modificata (afiseaza note informativa); brandurile boycott sunt read-only

## Patterns & Conventii
- Pagina verifica proprietatea evenimentului direct in server component (nu via service) — pattern de verificare inline pentru simplitate
- Contestatia schimba statusul evenimentului din `rejected` in `contested`
- Editarea reseteaza statusul evenimentului la `pending` + sterge `rejection_note`

## Dependente
- **Importa din:** `@/lib/supabase/server`, `@/services/appeal.service`, `@/services/edit.service`, `@/components/ui/`, `@/app/(private)/creeaza/_components/ImageUploadClient`
- **Este importat de:** `EditEventWarningModalClient` (redirect la `/evenimente/[id]/editare` dupa confirmare)
