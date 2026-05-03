# Design Spec — Redesign /panou (Settings-style Dashboard)

**Data:** 2026-05-03  
**Status:** Aprobat de utilizator

---

## Rezumat

Redesignul transformă `/panou` și paginile asociate dintr-un dashboard clasic într-un layout de tip **settings page** cu sidebar stânga persistent, context switcher pentru identitate (personal / ONG) și panel de preview dreapta pe pagina principală. Scopul este să ofere utilizatorului o interfață unificată pentru vizualizare, statistici și editare a activității sale civice.

---

## 1. Arhitectură & Restructurare Foldere

### Abordare aleasă: Route group `(dashboard)` în `(private)`

```
app/(private)/
  (dashboard)/
    layout.tsx          ← sidebar layout comun pentru toate paginile de mai jos
    panou/
      page.tsx          ← /panou (overview + preview panel)
      evenimente/
        page.tsx        ← /panou/evenimente
      participari/
        page.tsx        ← /panou/participari
      petitii/
        page.tsx        ← /panou/petitii
      contestatii/
        page.tsx        ← /panou/contestatii
    profil/
      page.tsx          ← /profil (view + edit, merge cu fostul /profil/editare)
```

- `/profil/editare` dispare complet — funcționalitatea se integrează în `/profil`
- Restul paginilor private (`/creeaza`, `/organizatie`, `/admin`) rămân în afara route group-ului, fără sidebar

### Layout `(dashboard)/layout.tsx`

Două zone:
- **Sidebar stânga** — 260px lățime, fix pe desktop
- **Conținut principal** — flex-1 (`{children}`)

Pe mobil (< md): sidebar ascuns, buton hamburger deschide un Sheet (shadcn) din stânga.

**Panel dreapta:** Nu face parte din layout — este responsabilitatea exclusivă a `app/(private)/(dashboard)/panou/page.tsx`. Pagina `/panou` își gestionează intern layout-ul în două coloane (conținut + preview). Celelalte sub-pagini ocupă toată lățimea disponibilă.

---

## 2. Sidebar

### Header — Context Switcher

- Dacă utilizatorul **nu are ONG**: afișează static avatar + nume + email (fără dropdown)
- Dacă utilizatorul **are ONG asociat**: afișează un `DropdownMenu` (shadcn) cu:
  - Avatar + "Contul meu" (context personal)
  - Logo ONG + "Numele ONG-ului" (context ONG)
- Contextul activ se transmite prin search param: `?context=user` / `?context=org`
- La schimbarea contextului, pagina se reîncarcă cu datele identității selectate

```
┌──────────────────────────────┐
│ [Avatar] Mihai Cotet      ▾  │  ← DropdownMenu (doar dacă are ONG)
│ mihai@gmail.com              │
└──────────────────────────────┘
```

### Navigație — Context `user`

```
ACTIVITATE
  Panou                → /panou
  Evenimentele mele    → /panou/evenimente
  Participări          → /panou/participari
  Petiții semnate      → /panou/petitii
  Contestații          → /panou/contestatii

CONT
  Profil               → /profil
  [Numele ONG]         → /organizatie/[id]/panou  (doar dacă are ONG)
```

### Navigație — Context `org`

```
ACTIVITATE
  Panou                        → /panou?context=org
  Evenimente [Numele ONG]      → /panou/evenimente?context=org
  Participări                  → /panou/participari
  Petiții semnate              → /panou/petitii
  Contestații                  → /panou/contestatii

ORGANIZAȚIE
  Panou ONG            → /organizatie/[id]/panou
  Membri               → /organizatie/[id]/membri
  Setări ONG           → /organizatie/[id]/setari
```

### Stilizare item activ
- Item activ: `border-left-2 border-primary text-primary bg-primary/5`
- Rest: `text-muted-foreground hover:text-foreground`

### Comportament mobil
- Sidebar se ascunde complet sub breakpoint `md`
- Buton hamburger (Sheet trigger) fix în colț
- Sheet din shadcn, slide din stânga, conținut identic cu sidebar-ul desktop

---

## 3. Pagina principală `/panou`

### Layout
Două coloane pe desktop: conținut principal (flex-1) + panel preview (300px).  
Pe mobil: o singură coloană, panelul preview se mută sub conținut.

### Conținut principal

**4 stat cards:**
- Evenimente create
- Participări
- Petiții semnate
- Contestații

Când contextul e `org`: stat cards și activitate recentă afișează datele ONG-ului (evenimente create de ONG, nu de user personal).

**Activitate recentă:**
- Card "Evenimentele mele recente" (3 intrări) + link "Vezi toate →"
- Card "Participările mele recente" (3 intrări) + link "Vezi toate →"
- Empty states cu CTA când nu există date

### Panel dreapta — Preview

**Fără ONG:** Preview profil personal (avatar, nume, email, oraș, dată înregistrare, statistici activitate).

**Cu ONG:** Două butoane toggle deasupra preview-ului:
- `Profil` / `[Numele ONG]`
- La "Profil" → afișează toate datele profilului personal
- La "[Numele ONG]" → afișează toate datele ONG-ului (nume, descriere, website, categorii, logo, membri, rating)
- Toggle-ul e independent de context switcher-ul din sidebar

---

## 4. Pagina `Evenimentele mele` (`/panou/evenimente`)

Când contextul e `org`, pagina afișează evenimentele ONG-ului, nu cele personale.

### Statistici (sus)

5 stat cards:
- Total evenimente
- Aprobate
- În așteptare
- Finalizate
- Respinse

### Charts (shadcn charts — recharts)

Grid 2 coloane:
1. **Bar chart** — Top 5 evenimente după vizualizări (`view_count`)
2. **Bar chart** — Top 5 evenimente după participanți (`participants_count`)
3. **Donut chart** — Distribuție pe categorii (protest / boycott / petiție / comunitar / caritabil)
4. **Donut chart** — Distribuție pe statusuri (aprobat / în așteptare / finalizat / respins)
5. **Line chart** — Activitate lunară: evenimente create în ultimele 6 luni (full width)

Date suplimentare calculate:
- **Rată de conversie** per eveniment: `participants_count / view_count * 100`
- **Rating mediu** per eveniment (din `event_feedback`)
- **Progres donații** pentru `charity_events`: `collected_amount / target_amount`
- **Progres petiții**: `participants_count / target_signatures`

### Lista evenimentelor

Filter tabs: `Toate · Aprobate · În așteptare · Finalizate · Respinse`

Fiecare rând:
```
[Banner 48px] Titlu eveniment              [Badge status]
              Categorie · Subcategorie · Dată
              [👁 views] [👥 participanți]
                                [Editează] [Marchează finalizat*]
```
*"Marchează finalizat" apare doar pentru tipuri manuale (`boycott`, `petition`, `donations`, `charity_livestream`) cu `status = approved`.

### Modal avertizare la editare

Apare înainte de a naviga spre `/evenimente/[id]/editare`:

> **⚠️ Atenție**  
> Dacă editezi acest eveniment, el va reveni în starea **„În așteptare"** și nu va mai fi vizibil public până la revalidarea de către un administrator.  
> `[Anulează]` `[Da, continuă]`

---

## 5. Pagina `Profil` (`/profil`)

### Mod vizualizare (default)

```
┌─ Header profil ───────────────────────────┐
│  [Avatar 80px]  Mihai Cotet               │
│                 mihai@gmail.com           │
│                 Membru din: Ianuarie 2024 │
└────────────────────────────────────────────┘

┌─ Informații ──────────────────────────────┐
│  Nume          Mihai Cotet                │
│  Email         mihai@gmail.com  (read-only)│
│  Telefon       —                          │
│  Țară          —                          │
│  Oraș          —                          │
└────────────────────────────────────────────┘

                         [✏️ Editează profil]
```

### Mod editare

Activat prin click pe "Editează profil". Câmpurile devin inputuri:
- Nume (text input)
- Telefon (text input, opțional)
- Țară (text input, opțional)
- Oraș (text input, opțional)
- Avatar (upload button → Supabase Storage)
- Email: **read-only** (legat de auth, nu se poate schimba din UI)

Butoane jos: `[Anulează]` `[Salvează modificările]`  
După save cu succes: revenire la mod vizualizare + toast confirmare.

---

## 6. Pagini nemodificate în acest scope

- `/panou/participari` — rămâne ca este, beneficiază doar de noul sidebar layout
- `/panou/petitii` — idem
- `/panou/contestatii` — idem

---

## 7. Date necesare în layout

`(dashboard)/layout.tsx` trebuie să fetch-uiască server-side:
- `getAuthUser()` — pentru avatar, nume, email în sidebar header
- `getUserAvatarUrl(user.id)` — poza de profil
- `getUserOrgId(user.id)` — pentru a ști dacă arată context switcher și item ONG în nav
- Numele ONG-ului (dacă există) — query suplimentar sau extins în `getUserOrgId`

---

## 8. Componente noi

| Componentă | Locație | Tip |
|---|---|---|
| `DashboardSidebar` | `components/layout/` | Server + Client pentru nav activ |
| `DashboardSidebarNav` | `components/layout/` | Client (usePathname + useSearchParams) |
| `DashboardContextSwitcher` | `components/layout/` | Client |
| `DashboardMobileSheet` | `components/layout/` | Client |
| `ProfilePreviewPanel` | `app/(private)/(dashboard)/panou/_components/` | Server |
| `ProfileOrgToggle` | `app/(private)/(dashboard)/panou/_components/` | Client |
| `EventsStatsSection` | `app/(private)/(dashboard)/panou/evenimente/_components/` | Server |
| `EventsChartsSection` | `app/(private)/(dashboard)/panou/evenimente/_components/` | Client |
| `EventsListSection` | `app/(private)/(dashboard)/panou/evenimente/_components/` | Server |
| `EditEventWarningModal` | `app/(private)/(dashboard)/panou/evenimente/_components/` | Client |
| `ProfileViewMode` | `app/(private)/(dashboard)/profil/_components/` | Server |
| `ProfileEditMode` | `app/(private)/(dashboard)/profil/_components/` | Client |
