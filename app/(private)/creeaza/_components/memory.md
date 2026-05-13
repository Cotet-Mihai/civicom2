# app/(private)/creeaza/_components/

Componentele reutilizabile in toate stepper-urile de creare evenimente — UI stepper, picker locatie Leaflet, picker traseu, upload imagini.

## Fisiere

### StepperUI.tsx
- **Scop:** Componenta UI reutilizabila pentru stepper multi-pas — afiseaza indicatori de pas (numerotati, cu checkmark pentru pasi completi), randeaza continutul pasului curent via `children`, butoane Inapoi/Urmatorul/Trimite
- **Tip:** Server Component (nu are hooks proprii — e doar UI)
- **Exporturi principale:** `StepperUI`
- **Props:** `{ steps: string[], currentStep: number, onBack: () => void, onNext: () => void, onSubmit: () => void, isSubmitting?: boolean, children: React.ReactNode }`
- **Apelează:** `Button` din shadcn
- **Importat in:** Toate paginile stepper (protest, boycott, petitie, comunitar, caritabil)

### LocationPickerClient.tsx
- **Scop:** Picker de locatie pe harta Leaflet — click pe harta seteaza coordonatele `[lat, lng]`; centrat initial pe Bucuresti; afiseaza marker la pozitia selectata
- **Tip:** Client Component
- **Exporturi principale:** `LocationPickerClient`
- **Props:** `{ location: [number, number] | null, onChange: (loc: [number, number]) => void }`
- **Apelează:** `react-leaflet` (MapContainer, TileLayer, Marker, useMapEvents), `leaflet`
- **Nota:** Fix pentru iconul default Leaflet in Next.js (cale custom `/leaflet/marker-icon.png`)
- **Importat in:** `protest/page.tsx`, `comunitar/page.tsx`, `caritabil/page.tsx`

### RoutePickerClient.tsx
- **Scop:** Picker de traseu pe harta Leaflet (pentru protestele de tip mars) — permite adaugarea multipla de puncte `[lat, lng]` care formeaza traseul
- **Tip:** Client Component
- **Exporturi principale:** `RoutePickerClient`
- **Props:** `{ locations: [number, number][], onChange: (locs: [number, number][]) => void }`
- **Apelează:** `react-leaflet`, `leaflet`
- **Importat in:** `protest/page.tsx`

### ImageUploadClient.tsx
- **Scop:** Upload banner (crop inline obligatoriu) + galerie imagini; toate imaginile convertite automat la WebP
- **Tip:** Client Component
- **Exporturi principale:** `ImageUploadClient`
- **Props:** `{ userId, bannerUrl, galleryUrls, onBannerChange, onGalleryChange }`
- **Flux banner:** `BannerCropperClient` (self-contained) → crop confirmat → `uploadBanner` (WebP file)
- **Flux galerie:** file select → `uploadGalleryImages` (convertire WebP internă)
- **Apelează:** `uploadBanner`, `uploadGalleryImages` din `lib/upload`, `BannerCropperClient`
- **Importat in:** Toate paginile stepper

### BannerCropperClient.tsx
- **Scop:** Componentă inline self-contained pentru upload + crop banner — 3 stări: gol (drag & drop), editare (inline cropper react-easy-crop), preview (hover overlay)
- **Tip:** Client Component
- **Exporturi principale:** `BannerCropperClient`
- **Props:** `{ bannerUrl: string | null, isUploading?: boolean, onImageReady: (file: File) => void, onRemove?: () => void }`
- **Aspect ratio:** `21/9` — output fix 2100×900px WebP, quality 0.8
- **Librărie:** `react-easy-crop` v5 + `react-dropzone` v15 + `@/components/ui/slider`
- **Apelează:** `getCroppedWebP` din `lib/upload`
- **Importat in:** `ImageUploadClient`

### CalendarWithStartStopTime.tsx
- **Scop:** Selectie data + ora start + ora final — Calendar shadcn in Popover + doua Input type="time"; data intoarsa ca `Date | undefined`
- **Tip:** Client Component
- **Exporturi principale:** `CalendarWithStartStopTime`
- **Props:** `{ date: { value: Date | undefined; set: (v) => void }, fromTime: { value: string; set: (v) => void }, toTime: { value: string; set: (v) => void } }`
- **Apelează:** `Calendar`, `Popover`, `Button`, `Input`, `Label` din shadcn
- **Importat in:** `protest/page.tsx`

### BrandDialog.tsx
- **Scop:** Dialog adăugare/editare brand boicotat — nume, link (obligatorii + URL validation cu `checkURLAccessible`), alternative (opționale: nume, link, motiv); exportă tipurile `Brand` și `Alternative`
- **Tip:** Client Component
- **Exporturi principale:** `BrandDialog`, `Brand` (type), `Alternative` (type)
- **Props:** `{ open, onOpenChange, onSave, initialData? }`
- **Apelează:** `checkURLAccessible` din `services/url.service`, componente shadcn Dialog/Input/Textarea/Card
- **Importat in:** `boycott/page.tsx`

### BrandViewDialog.tsx
- **Scop:** Dialog vizualizare detalii brand boicotat — afișează link și alternative cu butoane Editează/Șterge
- **Tip:** Client Component
- **Exporturi principale:** `BrandViewDialog`
- **Props:** `{ open, onOpenChange, brand: Brand | null, onEdit, onDelete }`
- **Importat in:** `boycott/page.tsx`

### SuggestEventCardClient.tsx
- **Scop:** Card full-width cu border dashed la finalul grilei de selectie tip eveniment — deschide un Dialog shadcn cu Textarea pentru sugestii; la submit afiseaza toast Sonner si inchide dialogul (fara backend)
- **Tip:** Client Component
- **Exporturi principale:** `SuggestEventCardClient`
- **Apelează:** `Dialog`, `Textarea`, `Button` din shadcn, `toast` din Sonner, `createEventSuggestion` din `suggestion.service`
- **Importat in:** `creeaza/page.tsx`

## Patterns & Conventii
- `LocationPickerClient` si `RoutePickerClient` folosesc `react-leaflet` direct (nu shadcn-map) deoarece necesita interactivitate de click/drag
- `StepperUI` e pur UI — nu are state propriu, state-ul e gestionat de pagina parinte
- Upload-ul de imagini se face client-side direct la Supabase Storage, nu prin Server Action

## Dependente
- **Importa din:** `react-leaflet`, `leaflet`, `@/lib/upload`, `@/components/ui/button`
- **Este importat de:** Toate paginile stepper din `creeaza/`
