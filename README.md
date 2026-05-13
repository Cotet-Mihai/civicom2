# CIVICOM✨ — Platforma de Implicare Civică

**CIVICOM** este o platformă web care centralizează acțiunile civice din România. Cetățenii și organizațiile non-guvernamentale pot crea, administra și participa la evenimente civice de orice tip — dintr-un singur loc.

> „Toate acțiunile civice sunt evenimente unificate, nu sisteme separate."

---

## Ce poți face pe CIVICOM

- **Proteste** — organizează adunări, marșuri sau pichete cu hartă interactivă și logistică completă
- **Boycotturi** — coordonează boicoturi de branduri cu liste de alternative
- **Petiții** — strânge semnături cu target personalizat și urmărire în timp real
- **Activități comunitare** — activități în aer liber, donații (materiale sau monetare), workshop-uri
- **Evenimente caritabile** — concerte, meet & greet, livestream-uri, activități sportive cu colectare de fonduri

---

## Stack Tehnologic

| Layer | Tehnologie |
|---|---|
| Framework | Next.js 15+ (App Router) |
| Backend & Auth | Supabase (PostgreSQL + Auth + Storage) |
| Logică server | Server Actions |
| UI | shadcn/ui + Tailwind CSS |
| Hărți | shadcn-map (Leaflet + React Leaflet) |
| Notificări UI | Sonner |
| Analytics | Vercel Analytics + PostHog |
| Deploy | Vercel |

---

## Arhitectura Aplicației

```
app/
  (auth)/          → /autentificare · /inregistrare · /reseteaza-parola
  (public)/        → / · /evenimente · /organizatii
  (private)/
    panou/         → dashboard utilizator
    profil/        → profil și editare
    creeaza/       → creare evenimente (5 tipuri cu stepper)
    organizatie/   → management ONG
    evenimente/    → editare și contestații
    admin/         → moderare (role=admin)

services/          → Server Actions — toată logica de business
components/
  ui/              → design system (shadcn)
  shared/          → componente reutilizabile
  layout/          → navbar, sidebar, footer
```

---

## Funcționalități Principale

### Pentru cetățeni
- Creare și gestionare evenimente civice în 5 categorii distincte
- Participare la evenimente și semnare petiții
- Urmărire dashboard personal (statistici, participări, contestații)
- Feedback și rating pentru evenimentele finalizate
- Contestarea deciziilor de respingere

### Pentru ONG-uri
- Profil organizație cu logo, banner și membri
- Creare evenimente în numele organizației
- Statistici și rapoarte de activitate
- Gestionare membri cu roluri (admin / member)

### Pentru moderatori
- Panou admin cu statistici în timp real
- Aprobare / respingere evenimente și organizații
- Vizualizare comparativă a evenimentelor editate (versiunea veche vs. nouă)
- Gestionare contestații

---

## Modelul de Date

```
events (tabel central)
├── protests ────── gatherings / marches / pickets
├── boycotts ────── boycott_brands → boycott_alternatives
├── petitions
├── community_activities ── outdoor_activities / donations / workshops
└── charity_events ──────── charity_concerts / meet_greets / charity_livestreams / sports_activities
```

### Statusuri evenimente
```
pending → approved | rejected → contested → approved | rejected
approved → completed
```

---

## Rulare Locală

### Cerințe
- Node.js 18+
- pnpm
- Cont Supabase

### Pași

```bash
# Clonează repository-ul
git clone https://github.com/Cotet-Mihai/civicom2.git
cd civicom2

# Instalează dependențele
pnpm install

# Configurează variabilele de mediu
cp .env.example .env.local
# completează NEXT_PUBLIC_SUPABASE_URL și NEXT_PUBLIC_SUPABASE_ANON_KEY

# Pornește serverul de dezvoltare
pnpm dev
```

Deschide [http://localhost:3000](http://localhost:3000) în browser.

---

## Design System

CIVICOM folosește un design **civic, bold și autentic**:

- **Culoare principală:** verde civic (`oklch(0.52 0.18 145)`)
- **Accent:** galben strălucitor pentru elemente active
- **Tipografie:** Montserrat ExtraBold pentru titluri, Inter pentru body
- **Mobile-first:** proiectat și testat întâi pe mobil

---

## Licență

Proiect privat — © 2025 CIVICOM. Toate drepturile rezervate.
