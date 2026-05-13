# services/

Server Actions — toată logica de business a aplicației CIVICOM. Niciun fișier nu conține JSX. Toate funcțiile sunt marcate cu `'use server'`.

## Fisiere

### auth.service.ts
- **Scop:** Autentificare — sign up, sign in, sign out, reset parolă, get user curent
- **Exporturi principale:** `signUp`, `signIn`, `signOut`, `sendPasswordResetEmail`, `updatePassword`, `getSession`, `getAuthUser`
- **Apelează:** `createClient` din `lib/supabase/server`
- **Note:** `signIn` redirect la `/panou` după succes; `signOut` redirect la `/autentificare`; `sendPasswordResetEmail` folosește `NEXT_PUBLIC_SITE_URL`

### user.service.ts
- **Scop:** Dashboard utilizator — stats, liste evenimente create/participări/petiții/contestații, profil, avatar, date grafice (charts + evolutie)
- **Exporturi principale:** `getUserDashboardStats`, `getUserCreatedEvents`, `getUserParticipations`, `getUserPetitionsSigned`, `getUserAppeals`, `getUserProfile`, `updateUserProfile`, `updateAvatar`, `getUserAvatarUrl`, `getOrgDashboardStats`, `getOrgCreatedEvents`, `getEventsChartData`, `getEvolutionData`, `completeProfile`
- **Tipuri exportate:** `DashboardEvent`, `DashboardAppeal`, `UserProfile`, `CompleteProfileData`
- **Apelează:** `createClient` din `lib/supabase/server`
- **Helper intern:** `getUserId()` — rezolvă auth.users id → users.id
- **Note:** `getEvolutionData` este Server Action apelat dinamic de `EventsEvolutionChartClient`; `getOrgDashboardStats` și `getOrgCreatedEvents` suportă contextul ONG (`?context=org`)

### event.service.ts
- **Scop:** Citire evenimente publice — lista paginata cu filtre, detalii complete per tip (protest/boycott/petition/community/charity), incrementare view count
- **Exporturi principale:** `getEvents`, `getRecentEvents`, `getProtestById`, `getBoycottById`, `getCommunityById`, `getCharityById`, `getPetitionById`, `incrementViewCount`
- **Tipuri exportate:** `EventPreview`, `EventFilters`, `ProtestDetail`, `BoycottDetail`, `BoycottBrand`, `CommunityDetail`, `CharityDetail`, `PetitionDetail`
- **Apelează:** `createClient` din `lib/supabase/server`
- **Note:** `getProtestById`, `getBoycottById`, `getCommunityById`, `getCharityById`, `getPetitionById` sunt wrapped în `cache()` din React pentru deduplicare per request; `extractDate()` helper intern pentru a rezolva data din subtabelul corect (fallback la `created_at`); `getEvents` returnează doar `status IN ('approved', 'completed')`

### organization.service.ts
- **Scop:** CRUD complet pentru organizații — lista publică, detaliu, membership, creare, editare, gestionare membri, evenimente org, stats, documente
- **Exporturi principale:** `getUserOrgId`, `getUserOrg`, `getUserOrgByAuthId`, `getOrgMemberRole`, `getOrganizations`, `getOrganizationById`, `getOrgMembers`, `getOrgEvents`, `getOrgStats`, `getOrgDocuments`, `createOrganization`, `updateOrganization`, `addOrgMember`, `removeOrgMember`, `updateMemberRole`, `getOrgDashboardStats`, `getOrgCreatedEvents`, `getOrgAppeals`
- **Tipuri exportate:** `OrgListItem`, `OrgMember`, `OrgDetail`, `OrgEvent`, `OrgStats`, `OrgDocument`, `OrgAppeal`
- **Apelează:** `createClient` din `lib/supabase/server`, `createAdminClient` din `lib/supabase/admin` (pentru `getOrganizations`, `getOrganizationById` — bypass RLS)
- **Note:** `getUserOrgByAuthId` este re-exportat și din `lib/server-cache.ts` wrapped în `cache()` pentru deduplicare; `getOrganizations` foloseste admin client pentru a evita recursivitate RLS

### admin.service.ts
- **Scop:** Moderare admin — stats pendinte, liste evenimente/orgs pendinte, detaliu eveniment pentru review, aprobare/respingere evenimente și organizații
- **Exporturi principale:** `checkIsAdmin`, `getAdminStats`, `getPendingEvents`, `getPendingOrgs`, `getAdminEventDetail`, `approveEvent`, `rejectEvent`, `approveOrg`, `rejectOrg`
- **Tipuri exportate:** `AdminEvent`, `AdminOrg`, `AdminEventDetail`
- **Apelează:** `createClient`, `createNotification`
- **Note:** `getAdminEventDetail` face query-uri secvențiale (event → subtabel specific categoriei → subtabel specific subcategoriei); `approveEvent`/`rejectEvent` trimit notificare creatorului; acceptă status `pending` și `contested` la aprobare/respingere; `AdminEvent` conține `is_edited: boolean` și `previous_snapshot: Record<string, unknown> | null` pentru funcționalitatea de comparație; `approveEvent` resetează `is_edited = false` și `previous_snapshot = null`

### appeal.service.ts
- **Scop:** Contestații — creare contestație (user), listare toate contestatiile active (admin), rezolvare contestatie (admin)
- **Exporturi principale:** `createAppeal`, `getAllAppeals`, `resolveAppeal`
- **Tipuri exportate:** `AdminAppeal`
- **Apelează:** `createClient`, `createNotification`
- **Note:** `createAppeal` setează evenimentul pe `status=contested`; `resolveAppeal` setează evenimentul pe `approved` sau `rejected` și marchează contestatia ca `resolved`; trimite notificare creatorului la rezolutie

### feedback.service.ts
- **Scop:** Feedback evenimente finalizate — citire feedback (cu medie rating), feedback utilizator curent, verificare dacă utilizatorul a trimis deja, submit feedback
- **Exporturi principale:** `getFeedback`, `getUserFeedback`, `hasCurrentUserSubmittedFeedback`, `submitFeedback`
- **Tipuri exportate:** `EventFeedback`, `FeedbackSummary`
- **Apelează:** `createClient`
- **Note:** `submitFeedback` validează rating 1-5 integer; `hasCurrentUserSubmittedFeedback` folosit în `FeedbackSection` pentru a decide dacă afișează butonul de feedback

### participation.service.ts
- **Scop:** Participare la evenimente și semnare petiții
- **Exporturi principale:** `getParticipationStatus`, `joinEvent`, `leaveEvent`, `getSignatureStatus`, `signPetition`
- **Apelează:** `createClient`
- **Note:** `joinEvent` foloseste `upsert` cu `onConflict: 'event_id,user_id'`; `leaveEvent` setează `status=cancelled` (nu sterge rândul); `signPetition` tratează eroarea `23505` (unique_violation) ca succes

### notification.service.ts
- **Scop:** Creare notificări — funcție singulară apelată din alte servicii
- **Exporturi principale:** `createNotification(userId, title, message, type?)`
- **Apelează:** `createAdminClient` (bypass RLS pentru insert în `notifications`)
- **Note:** Foloseste admin client deoarece RLS pe `notifications` permite INSERT doar via service_role

### completion.service.ts
- **Scop:** Finalizare manuală evenimente (boycott, petition, donations, livestream)
- **Exporturi principale:** `completeEvent(eventId)`
- **Apelează:** `createClient` (verificare creator), `createAdminClient` (update status + insert notificări)
- **Note:** Foloseste admin client pentru update `status=completed` și pentru a insera notificări în bulk la toți participanții; validează că evenimentul e de tip manual-complete

### homepage.service.ts
- **Scop:** Date pentru homepage — statistici globale și lista organizații aprobate pentru carusel
- **Exporturi principale:** `getHomepageStats`, `getApprovedOrgs`
- **Tipuri exportate:** `HomepageStats`, `OrgPreview`; re-exportă `EventPreview` din `event.service`
- **Apelează:** `createClient`
- **Note:** `citiesCount` este hardcodat la 12 (tabelul events nu are câmp city normalizat)

### petition.service.ts
- **Scop:** Creare petiție și citire semnatari recenți pentru sidebar
- **Exporturi principale:** `createPetition`, `getRecentSigners`
- **Tipuri exportate:** `RecentSigner`
- **Apelează:** `createClient`
- **Note:** `createPetition` inserează în `events` → `petitions` în secvență; `getRecentSigners` folosit de `RecentSignersClient` din pagina de petitie

### protest.service.ts
- **Scop:** Creare protest cu subtip (gathering/march/picket) — inserare în 3 tabele în secvență
- **Exporturi principale:** `createProtest(eventBase, protestData, subtypeData)`
- **Apelează:** `createClient`
- **Note:** Inserare în ordine: `events` → `protests` → `gatherings`/`marches`/`pickets` în funcție de subtip

### boycott.service.ts
- **Scop:** Creare boycott cu branduri și alternative — inserare în 4 tabele în secvență
- **Exporturi principale:** `createBoycott(eventBase, boycottData)`
- **Apelează:** `createClient`
- **Note:** Brandurile și alternativele sunt inserate în loop; `boycott_alternatives` pointează la `brand_id`

### community.service.ts
- **Scop:** Creare activitate comunitară cu subtip (outdoor/donations/workshop)
- **Exporturi principale:** `createCommunityActivity(eventBase, communityData, subtypeData)`
- **Apelează:** `createClient`
- **Note:** Inserare în ordine: `events` → `community_activities` → `outdoor_activities`/`donations`/`workshops`

### charity.service.ts
- **Scop:** Creare eveniment caritabil cu subtip (concert/meet_greet/livestream/sport)
- **Exporturi principale:** `createCharityEvent(eventBase, charityMeta, subtypeData)`
- **Apelează:** `createClient`
- **Note:** Inserare în ordine: `events` → `charity_events` → subtabelul specific subcategoriei

### edit.service.ts
- **Scop:** Editare evenimente — fetch date complete pentru editare + update cu resetare status la `pending`
- **Exporturi principale:** `getEventForEdit`, `updateEvent`
- **Tipuri exportate:** `EditEventBase`, `EditEventData`, `UpdateEventPayload`
- **Apelează:** `createClient` din `lib/supabase/server`, `createAdminClient` din `lib/supabase/admin` (bypass RLS pentru update events)
- **Note:** `getEventForEdit` face query secvential pentru toate categoriile; `updateEvent` verifica proprietatea si blocheaza `completed`; locatia NU este editabila; `updateEvent` salveaza `is_edited: true` si `previous_snapshot` (snapshot al datelor curente inainte de editare) via admin client; `buildSnapshot` este helper privat

## Patterns & Conventii
- Toate fișierele au `'use server'` la prima linie — sunt exclusiv Server Actions
- Niciun fișier nu conține JSX
- Helper `getUserId()` (pattern repetat în user.service, feedback.service, participation.service): `auth.getUser()` → query `users` table → returnează `users.id` (nu `auth_users_id`)
- Returnare uniformă pentru mutatii: `{ ok: true }` sau `{ error: string }`
- Erori loggate cu `console.error('[numeServicu]', ...)` — nu throw
- Funcțiile de detaliu per eveniment tip (getProtestById etc.) sunt wrapped în `cache()` din React
- Serviciile de creare eveniment urmează pattern consistent: verificare autentificare → get userId din DB → insert events → insert subtabel nivel 1 → insert subtabel nivel 2

## Dependente
- **Importa din:** `@/lib/supabase/server`, `@/lib/supabase/admin`, alte servicii (notification.service)
- **Este importat de:** Toate paginile private și publice care necesită date; hooks-urile din `/hooks`; componente client care apelează Server Actions
