# CIVICOM✨ — Civic Engagement Platform

**CIVICOM** is a web platform that centralizes civic actions in Romania. Citizens and non-governmental organizations can create, manage, and participate in civic events of any type — all from one place.

> "All civic actions are unified events, not separate systems."

---

## What You Can Do on CIVICOM

- **Protests** — organize gatherings, marches, or pickets with an interactive map and full logistics
- **Boycotts** — coordinate brand boycotts with lists of alternatives
- **Petitions** — collect signatures with a custom target and real-time tracking
- **Community Activities** — outdoor activities, donations (material or monetary), workshops
- **Charity Events** — concerts, meet & greets, livestreams, sports activities with fundraising

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15+ (App Router) |
| Backend & Auth | Supabase (PostgreSQL + Auth + Storage) |
| Server Logic | Server Actions |
| UI | shadcn/ui + Tailwind CSS |
| Maps | shadcn-map (Leaflet + React Leaflet) |
| UI Notifications | Sonner |
| Analytics | Vercel Analytics + PostHog |
| Deployment | Vercel |

---

## Application Architecture

```
app/
  (auth)/          → /autentificare · /inregistrare · /reseteaza-parola
  (public)/        → / · /evenimente · /organizatii
  (private)/
    panou/         → user dashboard
    profil/        → profile and editing
    creeaza/       → event creation (5 types with stepper)
    organizatie/   → NGO management
    evenimente/    → event editing and appeals
    admin/         → moderation panel (role=admin)

services/          → Server Actions — all business logic
components/
  ui/              → design system (shadcn)
  shared/          → reusable components
  layout/          → navbar, sidebar, footer
```

---

## Key Features

### For Citizens
- Create and manage civic events across 5 distinct categories
- Participate in events and sign petitions
- Personal dashboard with statistics, participations, and appeals
- Feedback and ratings for completed events
- Appeal rejected decisions

### For NGOs
- Organization profile with logo, banner, and members
- Create events on behalf of the organization
- Activity statistics and reports
- Member management with roles (admin / member)

### For Moderators
- Admin panel with real-time statistics
- Approve / reject events and organizations
- Side-by-side comparison view for edited events (old vs. new version)
- Manage appeals

---

## Data Model

```
events (central table)
├── protests ────── gatherings / marches / pickets
├── boycotts ────── boycott_brands → boycott_alternatives
├── petitions
├── community_activities ── outdoor_activities / donations / workshops
└── charity_events ──────── charity_concerts / meet_greets / charity_livestreams / sports_activities
```

### Event Statuses
```
pending → approved | rejected → contested → approved | rejected
approved → completed
```

---

## Local Development

### Requirements
- Node.js 18+
- pnpm
- Supabase account

### Steps

```bash
# Clone the repository
git clone https://github.com/Cotet-Mihai/civicom2.git
cd civicom2

# Install dependencies
pnpm install

# Configure environment variables
cp .env.example .env.local
# fill in NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY

# Start the development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Design System

CIVICOM uses a **civic, bold, and authentic** design language:

- **Primary color:** civic green (`oklch(0.52 0.18 145)`)
- **Accent:** bright yellow for active elements
- **Typography:** Montserrat ExtraBold for headings, Inter for body text
- **Mobile-first:** designed and tested on mobile first

---

## License

Private project — © 2025 CIVICOM. All rights reserved.
