# app/(private)/creeaza/protest/

Stepper de creare eveniment de tip Protest — 4 pași: Info, Locație, Logistică, Media.

## Fișiere

### page.tsx
- **Scop:** Pagina de creare protest — formular multi-pas cu StepperUI
- **Tip:** Client Component
- **Pași:**
  1. Info — ToggleGroup (Adunare/Marș/Pichet) + titlu + descriere + CalendarWithStartStopTime
  2. Locație — LocationPickerClient (gathering/picket) sau RoutePickerClient (march)
  3. Logistică — ToggleGroup Limitat/Nelimitat + tag-uri echipament + Textarea reguli + Dialog contacte
  4. Media — ImageUploadClient
- **Form state:** `{ title, description, subcategory, date: Date|undefined, time_start, time_end, location, locations, isLimited, max_participants, equipment: string[], safety_rules, contacts: Contact[], banner_url, gallery_urls }`
- **Submit:** Converteste `date` → string ISO, `contacts[]` → string CSV, `equipment[]` → string CSV; apelează `createProtest`
- **Apelează:** `createProtest` din `services/protest.service`, `CalendarWithStartStopTime`, `StepperUI`, `ImageUploadClient`, `LocationPickerClient`, `RoutePickerClient`
- **Shadcn utilizat:** `ToggleGroup`, `ToggleGroupItem`, `Dialog`, `Input`, `Textarea`, `Label`, `Button`

## Convenții
- Data returnată de Calendar (Date object) e convertită la `YYYY-MM-DD` manual la submit
- Contactele multiple sunt serializate ca `"Prenume Nume <email>, ..."` în `contact_person`
- Echipamentul e serializat cu join(', ') în `recommended_equipment`
- Număr nelimitat de participanți = 0 în DB
