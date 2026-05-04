# Teste manuale CIVICOM

> Parcurge lista în ordine. Bifează fiecare punct după ce l-ai verificat.
> Ai nevoie de: **2 conturi de user** (userA, userB) + **1 cont de admin**.

---

## 0. Pregătire

- [ ] Rulează `pnpm dev` și confirmă că serverul pornește fără erori în terminal
- [ ] Deschide DevTools → Console și menține-l vizibil pe tot parcursul testelor
- [ ] Setează rolul unui cont la `admin` direct în Supabase Dashboard → Table editor → `users` → câmpul `role`
- [ ] Autentifică-te cu **userA** într-un browser normal și cu **userB** într-un browser incognito (sau alt browser)

---

## 1. Pagini publice — fără autentificare

### 1.1 Homepage `/`
- [ ] Pagina se încarcă fără erori în consolă
- [ ] Secțiunea Hero este vizibilă cu cele 2 butoane (Descoperă evenimente / Creează un eveniment)
- [ ] Secțiunea Stats afișează numere (chiar și 0)
- [ ] Secțiunea Organizații / carusel funcționează (swipe/click pe săgeți)
- [ ] Secțiunea Evenimente / carusel funcționează
- [ ] Secțiunea FAQ — accordion se deschide și se închide la click
- [ ] Secțiunea CTA e vizibilă cu butoanele
- [ ] Footer e vizibil

### 1.2 Lista evenimente `/evenimente`
- [ ] Pagina se încarcă și afișează evenimentele aprobate
- [ ] Searchbar — scrie ceva și apasă Enter; lista se filtrează
- [ ] Filtru categorie — selectează „Protest"; lista se actualizează
- [ ] Filtru dată — setează interval; lista se actualizează
- [ ] Buton „Resetează filtrele" curăță toate filtrele
- [ ] Scroll până jos — se încarcă automat mai multe evenimente (infinite scroll)
- [ ] Stare goală — dacă nu există evenimente cu un filtru foarte specific, apare mesajul „Niciun eveniment găsit"
- [ ] Click pe un card duce la pagina evenimentului

### 1.3 Lista organizații `/organizatii`
- [ ] Pagina se încarcă fără erori
- [ ] Cardurile organizațiilor aprobate sunt vizibile cu logo / inițiale fallback
- [ ] Click pe „Află mai mult" duce la pagina organizației

### 1.4 Detaliu organizație `/organizatii/[id]`
- [ ] Datele organizației sunt afișate (nume, descriere, website, IBAN dacă există)
- [ ] Secțiunea Membri e vizibilă
- [ ] Secțiunea Evenimente afișează evenimentele organizației
- [ ] Rating mediu și număr evaluări afișate corect
- [ ] Fără autentificare — widget-ul de rating afișează „Autentifică-te pentru a evalua"
- [ ] Link „← Toate organizațiile" funcționează

### 1.5 Pagina 404
- [ ] Accesează `/orice-url-inexistent` → apare pagina 404 custom (nu eroarea Next.js default)
- [ ] Butonul „Înapoi acasă" duce la `/`
- [ ] Butonul „Explorează evenimente" duce la `/evenimente`

### 1.6 SEO
- [ ] Accesează `/robots.txt` — apare fișierul cu regulile corecte și linkul spre sitemap
- [ ] Accesează `/sitemap.xml` — apare XML-ul cu rutele statice + eventuale evenimente/organizații

---

## 2. Autentificare

### 2.1 Înregistrare `/inregistrare`
- [ ] Completează toate câmpurile și trimite → succes (mesaj sau redirect)
- [ ] Trimite cu parolă prea scurtă → eroare de validare
- [ ] Trimite cu email deja înregistrat → eroare
- [ ] Indicator de putere parolă funcționează (slab / mediu / puternic)
- [ ] Utilizatorul autentificat care accesează `/inregistrare` este redirecționat la `/panou`

### 2.2 Autentificare `/autentificare`
- [ ] Login cu credențiale corecte → redirect la `/panou`
- [ ] Login cu parolă greșită → eroare
- [ ] Link „Ai uitat parola?" duce la `/reseteaza-parola`
- [ ] Utilizatorul deja autentificat este redirecționat la `/panou`

### 2.3 Reset parolă `/reseteaza-parola`
- [ ] Trimite email valid → mesaj de confirmare
- [ ] Trimite email inexistent → eroare sau mesaj generic (nu expune dacă există)

### 2.4 Deconectare
- [ ] Click pe Avatar → Dropdown → „Deconectare" → redirect la `/autentificare`
- [ ] După deconectare, accesul direct la `/panou` redirecționează la `/autentificare`

---

## 3. Dashboard utilizator

### 3.1 Panou principal `/panou`
- [ ] Afișează statistici: evenimente create, participări, petiții semnate, contestații
- [ ] Secțiunea „Evenimentele mele recente" listează evenimentele userA
- [ ] Pe evenimentele cu status `approved` și tip manual-complete (boycott, petiție, donații, livestream) apare butonul „Marchează ca finalizat"
- [ ] Pe evenimentele cu alt status sau tip auto-complete, butonul NU apare

### 3.2 Evenimentele mele `/panou/evenimente`
- [ ] Lista completă a evenimentelor create de userA
- [ ] Badge-uri de status vizibile (Pending / Aprobat / Respins / Contestat / Finalizat)
- [ ] Pe evenimentele `rejected` apare linkul „Contestează decizia →"
- [ ] Pe evenimentele `approved` + tip manual-complete apare butonul „Marchează ca finalizat"

### 3.3 Participările mele `/panou/participari`
- [ ] Lista evenimentelor la care userA participă

### 3.4 Petiții semnate `/panou/petitii`
- [ ] Lista petițiilor semnate de userA

### 3.5 Contestații `/panou/contestatii`
- [ ] Lista contestațiilor depuse de userA cu status și eveniment aferent

---

## 4. Profil utilizator

### 4.1 Vizualizare profil `/profil`
- [ ] Afișează numele, emailul și avatarul (sau placeholder)
- [ ] Afișează data înregistrării

### 4.2 Editare profil `/profil/editare`
- [ ] Schimbă numele și salvează → succes toast, navbar se actualizează cu noul nume
- [ ] Trimite nume cu mai puțin de 2 caractere → eroare
- [ ] Upload avatar — selectează o imagine → apare preview → salvează → avatarul se actualizează

---

## 5. Creare evenimente

> Autentificat ca userA. Creează câte un eveniment din fiecare tip.

### 5.1 Selector tip `/creeaza`
- [ ] Grid cu 5 tipuri vizibil
- [ ] Click pe fiecare tip duce la stepperul corespunzător

### 5.2 Protest `/creeaza/protest`
- [ ] Pasul 1: completează titlu, descriere, selectează subtip (adunare / marș / pichet)
- [ ] Pasul 2: Leaflet map se încarcă, poți plasa un marker / trasa rută
- [ ] Pasul 3: completează logistică (reguli, echipament)
- [ ] Pasul 4: upload banner (opțional) → Submit
- [ ] Redirect după creare → toast „Eveniment creat"
- [ ] Evenimentul apare în `/panou/evenimente` cu status `pending`

### 5.3 Boycott `/creeaza/boycott`
- [ ] Pasul 1: completează info
- [ ] Pasul 2: adaugă minim un brand; alternativele sunt opționale
- [ ] Pasul 3: media → Submit

### 5.4 Petiție `/creeaza/petitie`
- [ ] Pasul 1: info
- [ ] Pasul 2: detalii (target, contact, de ce e important, ce se cere)
- [ ] Pasul 3: media → Submit

### 5.5 Comunitar `/creeaza/comunitar`
- [ ] Alege subtip „Activitate în aer liber" → locație pe hartă apare la pasul 2
- [ ] Alege subtip „Donații" → câmpuri pentru tip donație (material / monetar)
- [ ] Alege subtip „Workshop" → locație pe hartă
- [ ] Submit → eveniment creat

### 5.6 Caritabil `/creeaza/caritabil`
- [ ] Alege subtip „Concert" → locație + detalii artiști
- [ ] Alege subtip „Livestream" → fără locație, link stream
- [ ] Submit → eveniment creat

---

## 6. Admin — moderare

> Autentificat ca admin.

### 6.1 Dashboard admin `/admin`
- [ ] Pagina se încarcă (dacă ești user normal → redirect la `/panou`)
- [ ] 3 carduri statistici: Evenimente în așteptare / Organizații în așteptare / Contestații active
- [ ] Tabelul cu evenimente recente pending e vizibil
- [ ] Taburi: Evenimente / Organizații / Contestații funcționează

### 6.2 Moderare evenimente `/admin/evenimente`
- [ ] Lista evenimentelor cu status `pending`
- [ ] Click „Revizuiește →" → pagina de detaliu admin

### 6.3 Detaliu eveniment admin `/admin/evenimente/[id]`
- [ ] Datele evenimentului sunt afișate
- [ ] Buton „Aprobă" → toast succes, evenimentul dispare din lista pending
- [ ] Buton „Respinge" → apare câmp pentru motiv → confirmă → evenimentul e respins
- [ ] Evenimentul aprobat devine vizibil public la `/evenimente/[tip]/[id]`

### 6.4 Moderare organizații `/admin/organizatii`
- [ ] Lista organizațiilor pending
- [ ] Aprobă o organizație → apare la `/organizatii`
- [ ] Respinge o organizație → status devine `rejected`

### 6.5 Contestații `/admin/contestatii`
- [ ] Lista contestațiilor active (pending / under_review)
- [ ] „Aprobă evenimentul" → toast succes, evenimentul devine `approved`, contestația dispare din listă
- [ ] „Respinge contestația" → apare textarea pentru motiv (minim 10 caractere) → confirmă → evenimentul rămâne `rejected`
- [ ] Link „Vezi evenimentul →" duce la pagina de detaliu admin

---

## 7. Pagini detaliu eveniment — participare

> Eveniment `approved` necesar. Autentificat ca userB.

### 7.1 Protest `/evenimente/protest/[id]`
- [ ] Banner, badge subtip, titlu, descriere vizibile
- [ ] Card participare: buton „Participă" activ
- [ ] Click „Participă" → buton se schimbă în „Renunț", counter crește
- [ ] Click „Renunț" → revine la „Participă", counter scade
- [ ] Harta cu locația se încarcă corect
- [ ] Butonul Share funcționează

### 7.2 Petiție `/evenimente/petitie/[id]`
- [ ] Progress bar cu numărul de semnături vizibil
- [ ] Buton „Semnează" → devine „Ai semnat ✓"
- [ ] Nu poți semna de două ori (butonul rămâne dezactivat)
- [ ] Secțiunea „Semnatari recenți" se actualizează

### 7.3 Boycott `/evenimente/boycott/[id]`
- [ ] Lista brandurilor și alternativelor vizibilă
- [ ] Card participare funcționează (Participă / Renunț)

### 7.4 Comunitar `/evenimente/comunitar/[id]`
- [ ] Conținut specific subtipului vizibil (locație pe hartă pentru outdoor/workshop, progress donații pentru donații)
- [ ] Participare funcționează

### 7.5 Caritabil `/evenimente/caritabil/[id]`
- [ ] Conținut specific subtipului (artiști pentru concert, link live pentru livestream)
- [ ] Participare funcționează

---

## 8. Finalizare evenimente și feedback

### 8.1 Finalizare manuală
- [ ] Ca userA: intră în `/panou/evenimente` → pe un eveniment `approved` de tip boycott/petiție/donații/livestream → click „Marchează ca finalizat"
- [ ] Toast succes → statusul se schimbă în `completed`
- [ ] Evenimentul apare cu badge „Finalizat" pe pagina publică

### 8.2 Feedback (ca userB participant)
- [ ] Accesează un eveniment `completed` la care userB a participat
- [ ] Apare butonul „Evaluează evenimentul" în sidebar
- [ ] Click → apare formularul cu stele și câmp comentariu
- [ ] Selectează rating (1-5 stele) → submit → toast succes
- [ ] `FeedbackSection` se actualizează cu noul rating
- [ ] Nu poți lăsa feedback de două ori (butonul dispare după submit)
- [ ] UserA (creatorul, dar nu participant) NU vede butonul de evaluare
- [ ] User neautentificat NU vede butonul de evaluare

---

## 9. Organizații — flux complet

### 9.1 Creare organizație `/organizatie/creeaza`
- [ ] Formularul se încarcă
- [ ] Upload logo funcționează
- [ ] Submit → toast „Organizație creată, în așteptarea aprobării"
- [ ] Redirect la `/organizatie/[id]/panou`

### 9.2 Panou organizație `/organizatie/[id]/panou`
- [ ] Datele organizației sunt vizibile
- [ ] Status `pending` afișat clar

### 9.3 Membri `/organizatie/[id]/membri`
- [ ] Lista membrilor actuali
- [ ] Adaugă un nou membru după email → apare în listă
- [ ] Schimbă rolul unui membru (admin / member)
- [ ] Elimină un membru

### 9.4 Setări `/organizatie/[id]/setari`
- [ ] Editează numele / descrierea / website / IBAN → salvează → datele se actualizează
- [ ] Upload logo nou → se actualizează

### 9.5 Pagina publică după aprobare
- [ ] Admin aprobă organizația
- [ ] Organizația apare la `/organizatii`
- [ ] Pagina `/organizatii/[id]` afișează toate datele
- [ ] Ca userB autentificat: evaluează organizația cu 1-5 stele → rating se actualizează

---

## 10. Contestații — flux complet

- [ ] Admin respinge un eveniment al userA (cu motiv)
- [ ] UserA primește notificare (verifică în DB sau interfață dacă există)
- [ ] UserA intră în `/panou/evenimente` → vede linkul „Contestează decizia →" sub evenimentul respins
- [ ] Click → pagina `/evenimente/[id]/contestatie` se încarcă cu motivul respingerii vizibil
- [ ] Trimite contestație cu mai puțin de 20 caractere → eroare
- [ ] Trimite contestație validă → toast succes → redirect la `/panou/contestatii`
- [ ] Statusul evenimentului devine `contested`
- [ ] Admin intră în `/admin/contestatii` → contestația apare
- [ ] Admin aprobă → evenimentul devine `approved`, contestația dispare
- [ ] Admin respinge contestația → evenimentul rămâne `rejected`, userA poate contesta din nou

---

## 11. Navbar și navigație

### 11.1 PublicNavbar (pagini publice)
- [ ] Logo duce la `/`
- [ ] Link „Evenimente" duce la `/evenimente`
- [ ] Link „Organizații" duce la `/organizatii`
- [ ] Buton „Autentificare" duce la `/autentificare`
- [ ] Buton „Înregistrare" duce la `/inregistrare`

### 11.2 DashboardNavbar (pagini private)
- [ ] Logo duce la `/`
- [ ] Buton „+ Creează eveniment" duce la `/creeaza`
- [ ] Click pe avatar → dropdown cu opțiunile corecte
- [ ] Dropdown: „Panou" → `/panou`
- [ ] Dropdown: „Evenimentele mele" → `/panou/evenimente`
- [ ] Dropdown: „Participări" → `/panou/participari`
- [ ] Dropdown: „Petiții semnate" → `/panou/petitii`
- [ ] Dropdown: „Contestații" → `/panou/contestatii`
- [ ] Dropdown: dacă userA e în ONG → „Organizația mea" → `/organizatie/[id]/panou`
- [ ] Dropdown: dacă userA nu e în ONG → „Solicită creare ONG" → `/organizatie/creeaza`
- [ ] Dropdown: „Profil" → `/profil`
- [ ] Dropdown: „Deconectare" → sign out + redirect
- [ ] **Mobil**: dropdown-ul devine Sheet (drawer lateral) — testează pe viewport îngust

---

## 12. Teste de securitate de bază

- [ ] Accesează `/panou` fără autentificare → redirect la `/autentificare`
- [ ] Accesează `/admin` ca user normal → redirect la `/panou`
- [ ] Accesează `/creeaza` fără autentificare → redirect la `/autentificare`
- [ ] Accesează `/organizatie/creeaza` fără autentificare → redirect
- [ ] Accesează `/wydarzenia/[id]/contestatie` al altui user → 404
- [ ] Accesează `/autentificare` deja autentificat → redirect la `/panou`

---

## 13. Comportament mobil

> Redimensionează browserul la ~390px lățime sau folosește DevTools device emulator.

- [ ] Homepage — toate secțiunile lizibile, fără overflow orizontal
- [ ] `/události` — filtrele sunt accesibile (drawer sau collapse)
- [ ] Card eveniment — imaginea și textul se afișează corect
- [ ] Pagina detaliu eveniment — layout coloană unică, sidebar sub conținut
- [ ] Stepper creare eveniment — pașii sunt navigabili
- [ ] DashboardNavbar — Sheet-ul (drawer) se deschide și închide corect
- [ ] Formularul de contestație — textarea și butonul sunt utilizabile

---

## 14. Verificări finale

- [ ] Nu există erori roșii în consola browser-ului pe nicio pagină parcursă
- [ ] Nu există warning-uri `getSession` în terminalul serverului
- [ ] Imaginile organizațiilor se încarcă prin `/_next/image` (nu direct din Supabase Storage) — verifică în DevTools → Network → Img
- [ ] `/robots.txt` conține `Sitemap: https://civicom.ro/sitemap.xml`
- [ ] `/sitemap.xml` conține cel puțin rutele statice (`/`, `/události`, `/organizatii`)
