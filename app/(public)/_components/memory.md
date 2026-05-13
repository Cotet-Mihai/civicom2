# app/(public)/_components/

Componentele sectiunilor homepage-ului CIVICOM — fiecare sectiune e un Server Component; partile interactive sunt extrase in Client Components cu sufixul `Client`.

## Fisiere

### HeroSection.tsx
- **Scop:** Sectiunea hero a homepage-ului — grid 2 coloane (text + imagine), titlu editorial cu 3 linii, doua butoane CTA (Descopera evenimente / Creeaza eveniment), cercuri ambient de fundal
- **Tip:** Server Component
- **Exporturi principale:** `HeroSection`
- **Apelează:** `Button`, `Link`, `Image` (next/image), icoane Lucide

### StatsSection.tsx
- **Scop:** Sectiunea de statistici pe fundal dark (bg-foreground) — afiseaza 4 metrici (events, users, orgs, cities) cu animatie counter
- **Tip:** Server Component
- **Exporturi principale:** `StatsSection`
- **Props:** `{ stats: HomepageStats }` — primit din `page.tsx`
- **Apelează:** `StatsCounterClient` pentru animatia counter

### StatsCounterClient.tsx
- **Scop:** Animatie counter — numara de la 0 la valoarea finala la mount, folosind `useEffect` cu `requestAnimationFrame`
- **Tip:** Client Component
- **Exporturi principale:** `StatsCounterClient`
- **Props:** `{ value: number }`
- **Importat in:** `StatsSection.tsx`

### ActionTypesSection.tsx
- **Scop:** Sectiunea cu cele 5 tipuri de actiuni civice (Protest, Boycott, Petitie, Comunitar, Caritabil) — grid de carduri cu icon, titlu, descriere si link
- **Tip:** Server Component
- **Exporturi principale:** `ActionTypesSection`

### OrganizationsSection.tsx
- **Scop:** Sectiunea cu ONG-urile aprobate — titlu editorial + carusel client
- **Tip:** Server Component
- **Exporturi principale:** `OrganizationsSection`
- **Props:** `{ orgs: OrgPreview[] }` — primit din `page.tsx`
- **Apelează:** `OrgsCarouselClient`

### OrgsCarouselClient.tsx
- **Scop:** Carusel Embla cu logo-urile ONG-urilor aprobate — autoplay, loop
- **Tip:** Client Component
- **Exporturi principale:** `OrgsCarouselClient`
- **Props:** `{ orgs: OrgPreview[] }`
- **Apelează:** `Carousel`, `CarouselContent`, `CarouselItem` din shadcn

### EventsSection.tsx
- **Scop:** Sectiunea cu evenimente recente — titlu editorial + carusel de `EventCard`
- **Tip:** Server Component
- **Exporturi principale:** `EventsSection`
- **Props:** `{ events: EventPreview[] }` — primit din `page.tsx`
- **Apelează:** `EventsCarouselClient`

### EventsCarouselClient.tsx
- **Scop:** Carusel Embla cu carduri de evenimente (`EventCard`) — loop, drag
- **Tip:** Client Component
- **Exporturi principale:** `EventsCarouselClient`
- **Props:** `{ events: EventPreview[] }`
- **Apelează:** `EventCard` (shared), `Carousel` din shadcn

### FaqSection.tsx
- **Scop:** Sectiunea FAQ — titlu editorial + accordion cu intrebari frecvente
- **Tip:** Server Component
- **Exporturi principale:** `FaqSection`
- **Apelează:** `FaqAccordionClient`

### FaqAccordionClient.tsx
- **Scop:** Accordion interactiv cu intrebarile FAQ — foloseste shadcn Accordion
- **Tip:** Client Component
- **Exporturi principale:** `FaqAccordionClient`
- **Apelează:** `Accordion`, `AccordionItem`, `AccordionTrigger`, `AccordionContent` din shadcn

### CtaSection.tsx
- **Scop:** Sectiunea de call-to-action de final — titlu mare, subtitlu, butoane Inregistrare + Explorare
- **Tip:** Server Component
- **Exporturi principale:** `CtaSection`

## Patterns & Conventii
- Pattern Server + Client split: sectiunile sunt Server Components, partile cu `useState`/hooks sunt extrase in `*Client` components
- Client components primesc datele ca props de la Server Component parinte
- Animatii de intrare: exclusiv clase CSS `animate-fade-in-up` (fara useState)

## Dependente
- **Importa din:** `@/components/shared/EventCard`, `@/components/ui/`, `@/services/homepage.service`, `@/services/event.service`
- **Este importat de:** `app/(public)/page.tsx`
