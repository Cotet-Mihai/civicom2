# Etapa 6 — Creare Evenimente Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the full event creation flow — 5 typed steppers under `/creeaza/` with form state, location pickers, media upload, and server actions that persist to Supabase.

**Architecture:** Each event type is a single `"use client"` stepper page managing multi-step form state with `useState`. Shared utilities handle file upload (Supabase Storage buckets: `banners`, `gallery`) and location picking (Leaflet via shadcn-map + `useMapEvents`). Server Actions in type-specific service files create all DB records sequentially. On success, redirect to the new event's detail page.

**Tech Stack:** Next.js 15 App Router · Supabase (DB + Storage browser client) · shadcn-map / react-leaflet · shadcn/ui · Sonner toasts

---

## File Map

**New files to create:**
- `services/protest.service.ts` — `createProtest`
- `services/boycott.service.ts` — `createBoycott`
- `services/community.service.ts` — `createCommunityActivity`
- `services/charity.service.ts` — `createCharityEvent`
- `lib/upload.ts` — `uploadBanner`, `uploadGalleryImages`
- `app/(private)/creeaza/_components/StepperUI.tsx`
- `app/(private)/creeaza/_components/ImageUploadClient.tsx`
- `app/(private)/creeaza/_components/LocationPickerClient.tsx`
- `app/(private)/creeaza/_components/RoutePickerClient.tsx`
- `app/(private)/creeaza/page.tsx`
- `app/(private)/creeaza/protest/page.tsx`
- `app/(private)/creeaza/boycott/page.tsx`
- `app/(private)/creeaza/petitie/page.tsx`
- `app/(private)/creeaza/comunitar/page.tsx`
- `app/(private)/creeaza/caritabil/page.tsx`

**Files to modify:**
- `services/petition.service.ts` — add `createPetition`

---

## Task 1: Upload utility — `lib/upload.ts`

**Files:**
- Create: `lib/upload.ts`

Uses `createBrowserClient` (client-side) to upload files to Supabase Storage. Must run in `"use client"` context. Returns public URLs.

- [ ] **Step 1: Create `lib/upload.ts`**

```ts
import { createBrowserClient } from '@supabase/ssr'

function getClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export async function uploadBanner(file: File, userId: string): Promise<string | null> {
  const supabase = getClient()
  const ext = file.name.split('.').pop()
  const path = `${userId}/${Date.now()}.${ext}`
  const { error } = await supabase.storage.from('banners').upload(path, file, { upsert: true })
  if (error) { console.error('[uploadBanner]', error.message); return null }
  const { data } = supabase.storage.from('banners').getPublicUrl(path)
  return data.publicUrl
}

export async function uploadGalleryImages(files: File[], userId: string): Promise<string[]> {
  const supabase = getClient()
  const urls: string[] = []
  for (const file of files) {
    const ext = file.name.split('.').pop()
    const path = `${userId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
    const { error } = await supabase.storage.from('gallery').upload(path, file, { upsert: true })
    if (error) { console.error('[uploadGallery]', error.message); continue }
    const { data } = supabase.storage.from('gallery').getPublicUrl(path)
    urls.push(data.publicUrl)
  }
  return urls
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/upload.ts
git commit -m "feat: add Supabase Storage upload utilities"
```

---

## Task 2: `StepperUI` component

**Files:**
- Create: `app/(private)/creeaza/_components/StepperUI.tsx`

Renders step indicator dots + Back/Next/Submit buttons. Fully controlled — parent manages `currentStep`.

- [ ] **Step 1: Create `StepperUI.tsx`**

```tsx
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Send } from 'lucide-react'

type Props = {
  steps: string[]           // step labels, e.g. ['Info', 'Locație', 'Logistică', 'Media']
  currentStep: number       // 1-indexed
  onBack: () => void
  onNext: () => void
  onSubmit: () => void
  isSubmitting?: boolean
  children: React.ReactNode // the current step's form content
}

export function StepperUI({ steps, currentStep, onBack, onNext, onSubmit, isSubmitting, children }: Props) {
  const isFirst = currentStep === 1
  const isLast = currentStep === steps.length

  return (
    <div className="flex flex-col h-full">
      {/* Step indicators */}
      <div className="flex items-center gap-2 mb-8">
        {steps.map((label, i) => {
          const idx = i + 1
          const isActive = idx === currentStep
          const isDone = idx < currentStep
          return (
            <div key={i} className="flex items-center gap-2">
              <div className={`flex items-center justify-center size-7 rounded-full text-xs font-black transition-colors
                ${isActive ? 'bg-primary text-primary-foreground' : isDone ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                {isDone ? '✓' : idx}
              </div>
              <span className={`text-xs font-semibold hidden sm:block
                ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                {label}
              </span>
              {i < steps.length - 1 && (
                <div className={`h-px w-6 sm:w-10 transition-colors ${isDone ? 'bg-primary/40' : 'bg-border'}`} />
              )}
            </div>
          )
        })}
      </div>

      {/* Step content */}
      <div className="flex-1 overflow-y-auto space-y-6">
        {children}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-6 mt-6 border-t border-border">
        <Button variant="ghost" onClick={onBack} disabled={isFirst} className="gap-1">
          <ChevronLeft size={16} />
          Înapoi
        </Button>
        {isLast ? (
          <Button onClick={onSubmit} disabled={isSubmitting} className="gap-1">
            <Send size={16} />
            {isSubmitting ? 'Se trimite...' : 'Creează eveniment'}
          </Button>
        ) : (
          <Button onClick={onNext} className="gap-1">
            Continuă
            <ChevronRight size={16} />
          </Button>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add app/(private)/creeaza/_components/StepperUI.tsx
git commit -m "feat: add shared StepperUI component"
```

---

## Task 3: `ImageUploadClient` component

**Files:**
- Create: `app/(private)/creeaza/_components/ImageUploadClient.tsx`

Renders file input for banner (single) + gallery (multiple). Shows preview thumbnails. Calls upload utilities and returns URLs to parent via `onChange` callbacks.

- [ ] **Step 1: Create `ImageUploadClient.tsx`**

```tsx
'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { Upload, X, ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { uploadBanner, uploadGalleryImages } from '@/lib/upload'

type Props = {
  userId: string
  bannerUrl: string | null
  galleryUrls: string[]
  onBannerChange: (url: string | null) => void
  onGalleryChange: (urls: string[]) => void
}

export function ImageUploadClient({ userId, bannerUrl, galleryUrls, onBannerChange, onGalleryChange }: Props) {
  const [uploadingBanner, setUploadingBanner] = useState(false)
  const [uploadingGallery, setUploadingGallery] = useState(false)
  const bannerRef = useRef<HTMLInputElement>(null)
  const galleryRef = useRef<HTMLInputElement>(null)

  async function handleBanner(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingBanner(true)
    const url = await uploadBanner(file, userId)
    if (url) onBannerChange(url)
    setUploadingBanner(false)
  }

  async function handleGallery(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    setUploadingGallery(true)
    const urls = await uploadGalleryImages(files, userId)
    onGalleryChange([...galleryUrls, ...urls])
    setUploadingGallery(false)
  }

  function removeGalleryImage(index: number) {
    onGalleryChange(galleryUrls.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="space-y-2">
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
          Banner eveniment *
        </p>
        <div
          onClick={() => bannerRef.current?.click()}
          className="relative w-full aspect-[21/9] rounded-2xl overflow-hidden border-2 border-dashed border-border bg-muted/30 flex items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors"
        >
          {bannerUrl ? (
            <Image src={bannerUrl} alt="Banner" fill className="object-cover" />
          ) : (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <ImageIcon size={32} />
              <span className="text-sm font-medium">
                {uploadingBanner ? 'Se încarcă...' : 'Click pentru a adăuga banner'}
              </span>
            </div>
          )}
        </div>
        <input ref={bannerRef} type="file" accept="image/*" className="hidden" onChange={handleBanner} />
        {bannerUrl && (
          <Button variant="ghost" size="sm" className="text-destructive" onClick={() => onBannerChange(null)}>
            <X size={14} className="mr-1" /> Șterge banner
          </Button>
        )}
      </div>

      {/* Gallery */}
      <div className="space-y-2">
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
          Galerie foto (opțional)
        </p>
        {galleryUrls.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {galleryUrls.map((url, i) => (
              <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-border group">
                <Image src={url} alt={`Foto ${i + 1}`} fill className="object-cover" />
                <button
                  onClick={() => removeGalleryImage(i)}
                  className="absolute top-1 right-1 size-5 rounded-full bg-destructive text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={10} />
                </button>
              </div>
            ))}
          </div>
        )}
        <Button variant="outline" size="sm" onClick={() => galleryRef.current?.click()} disabled={uploadingGallery} className="gap-1.5">
          <Upload size={14} />
          {uploadingGallery ? 'Se încarcă...' : 'Adaugă fotografii'}
        </Button>
        <input ref={galleryRef} type="file" accept="image/*" multiple className="hidden" onChange={handleGallery} />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add app/(private)/creeaza/_components/ImageUploadClient.tsx
git commit -m "feat: add ImageUploadClient with Supabase Storage upload"
```

---

## Task 4: Location pickers

**Files:**
- Create: `app/(private)/creeaza/_components/LocationPickerClient.tsx`
- Create: `app/(private)/creeaza/_components/RoutePickerClient.tsx`

Both are interactive Leaflet maps. `LocationPickerClient` places a single marker on click. `RoutePickerClient` adds multiple waypoints with delete support.

- [ ] **Step 1: Create `LocationPickerClient.tsx`**

```tsx
'use client'

import { useCallback } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import { MapPin } from 'lucide-react'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Fix Leaflet default icon in Next.js
const icon = L.icon({ iconUrl: '/leaflet/marker-icon.png', iconRetinaUrl: '/leaflet/marker-icon-2x.png', shadowUrl: '/leaflet/marker-shadow.png', iconSize: [25, 41], iconAnchor: [12, 41] })

type Props = {
  location: [number, number] | null
  onChange: (loc: [number, number]) => void
}

function ClickHandler({ onChange }: { onChange: (loc: [number, number]) => void }) {
  useMapEvents({ click(e) { onChange([e.latlng.lat, e.latlng.lng]) } })
  return null
}

const BUCHAREST: [number, number] = [44.4268, 26.1025]

export function LocationPickerClient({ location, onChange }: Props) {
  return (
    <div className="space-y-2">
      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
        <MapPin size={14} /> Click pe hartă pentru a seta locația *
      </p>
      {location && (
        <p className="text-xs text-muted-foreground font-mono">
          {location[0].toFixed(5)}, {location[1].toFixed(5)}
        </p>
      )}
      <div className="h-[320px] rounded-xl overflow-hidden border border-border">
        <MapContainer center={location ?? BUCHAREST} zoom={13} style={{ height: '100%', width: '100%' }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <ClickHandler onChange={onChange} />
          {location && <Marker position={location} icon={icon} />}
        </MapContainer>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create `RoutePickerClient.tsx`**

```tsx
'use client'

import { MapContainer, TileLayer, Marker, Polyline, useMapEvents } from 'react-leaflet'
import { MapPin, X } from 'lucide-react'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

const icon = L.icon({ iconUrl: '/leaflet/marker-icon.png', iconRetinaUrl: '/leaflet/marker-icon-2x.png', shadowUrl: '/leaflet/marker-shadow.png', iconSize: [25, 41], iconAnchor: [12, 41] })

type Props = {
  locations: [number, number][]
  onChange: (locs: [number, number][]) => void
}

function ClickHandler({ onAdd }: { onAdd: (loc: [number, number]) => void }) {
  useMapEvents({ click(e) { onAdd([e.latlng.lat, e.latlng.lng]) } })
  return null
}

const BUCHAREST: [number, number] = [44.4268, 26.1025]

export function RoutePickerClient({ locations, onChange }: Props) {
  function addPoint(loc: [number, number]) { onChange([...locations, loc]) }
  function removePoint(i: number) { onChange(locations.filter((_, idx) => idx !== i)) }

  return (
    <div className="space-y-2">
      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
        <MapPin size={14} /> Click pe hartă pentru a adăuga puncte de traseu (min. 2) *
      </p>
      <div className="h-[320px] rounded-xl overflow-hidden border border-border">
        <MapContainer center={locations[0] ?? BUCHAREST} zoom={13} style={{ height: '100%', width: '100%' }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <ClickHandler onAdd={addPoint} />
          {locations.map((loc, i) => <Marker key={i} position={loc} icon={icon} />)}
          {locations.length >= 2 && <Polyline positions={locations} pathOptions={{ color: '#16a34a', weight: 4 }} />}
        </MapContainer>
      </div>
      {locations.length > 0 && (
        <div className="space-y-1">
          {locations.map((loc, i) => (
            <div key={i} className="flex items-center justify-between text-xs font-mono text-muted-foreground bg-muted/50 rounded px-2 py-1">
              <span>Punct {i + 1}: {loc[0].toFixed(5)}, {loc[1].toFixed(5)}</span>
              <button onClick={() => removePoint(i)} className="hover:text-destructive">
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Add Leaflet marker assets to `/public/leaflet/`**

Download the 3 Leaflet marker assets and place in `public/leaflet/`:
```bash
mkdir -p public/leaflet
curl -o public/leaflet/marker-icon.png https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png
curl -o public/leaflet/marker-icon-2x.png https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png
curl -o public/leaflet/marker-shadow.png https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png
```

- [ ] **Step 4: Commit**

```bash
git add app/(private)/creeaza/_components/LocationPickerClient.tsx app/(private)/creeaza/_components/RoutePickerClient.tsx public/leaflet/
git commit -m "feat: add interactive location + route pickers using react-leaflet"
```

---

## Task 5: Server Actions — toate 5 servicii

**Files:**
- Create: `services/protest.service.ts`
- Create: `services/boycott.service.ts`
- Create: `services/community.service.ts`
- Create: `services/charity.service.ts`
- Modify: `services/petition.service.ts`

All actions: get session → validate user → insert records → return `{ id }` or `{ error }`.

- [ ] **Step 1: Create `services/protest.service.ts`**

```ts
'use server'

import { createClient } from '@/lib/supabase/server'

type EventBase = {
  title: string
  description: string
  banner_url: string | null
  gallery_urls: string[]
  subcategory: 'gathering' | 'march' | 'picket'
  organization_id?: string | null
}

type ProtestData = {
  date: string
  time_start: string
  time_end?: string | null
  max_participants: number
  recommended_equipment?: string | null
  safety_rules?: string | null
  contact_person?: string | null
}

type GatheringData = { location: [number, number] }
type MarchData = { locations: [number, number][] }
type PicketData = { location: [number, number] }

type SubtypeData = GatheringData | MarchData | PicketData

export async function createProtest(
  eventBase: EventBase,
  protestData: ProtestData,
  subtypeData: SubtypeData
): Promise<{ id: string } | { error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Neautentificat' }

  const { data: userData } = await supabase.from('users').select('id').eq('auth_users_id', user.id).single()
  if (!userData) return { error: 'Utilizator negăsit' }

  const creatorType = eventBase.organization_id ? 'ngo' : 'user'

  const { data: evt, error: evtErr } = await supabase.from('events').insert({
    title: eventBase.title,
    description: eventBase.description,
    banner_url: eventBase.banner_url,
    gallery_urls: eventBase.gallery_urls,
    category: 'protest',
    subcategory: eventBase.subcategory,
    status: 'pending',
    creator_id: userData.id,
    creator_type: creatorType,
    organization_id: eventBase.organization_id ?? null,
  }).select('id').single()

  if (evtErr || !evt) return { error: evtErr?.message ?? 'Eroare creare eveniment' }

  const { data: pr, error: prErr } = await supabase.from('protests').insert({
    event_id: evt.id,
    date: protestData.date,
    time_start: protestData.time_start,
    time_end: protestData.time_end ?? null,
    max_participants: protestData.max_participants,
    recommended_equipment: protestData.recommended_equipment ?? null,
    safety_rules: protestData.safety_rules ?? null,
    contact_person: protestData.contact_person ?? null,
  }).select('id').single()

  if (prErr || !pr) return { error: prErr?.message ?? 'Eroare creare protest' }

  if (eventBase.subcategory === 'gathering') {
    const d = subtypeData as GatheringData
    await supabase.from('gatherings').insert({ protest_id: pr.id, location: d.location })
  } else if (eventBase.subcategory === 'march') {
    const d = subtypeData as MarchData
    await supabase.from('marches').insert({ protest_id: pr.id, locations: d.locations })
  } else {
    const d = subtypeData as PicketData
    await supabase.from('pickets').insert({ protest_id: pr.id, location: d.location })
  }

  return { id: evt.id }
}
```

- [ ] **Step 2: Create `services/boycott.service.ts`**

```ts
'use server'

import { createClient } from '@/lib/supabase/server'

type BrandInput = {
  name: string
  link?: string | null
  alternatives?: Array<{ name: string; link: string; reason?: string | null }>
}

type EventBase = {
  title: string
  description: string
  banner_url: string | null
  gallery_urls: string[]
  organization_id?: string | null
}

type BoycottData = {
  reason: string
  method: string
  brands: BrandInput[]
}

export async function createBoycott(
  eventBase: EventBase,
  boycottData: BoycottData
): Promise<{ id: string } | { error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Neautentificat' }

  const { data: userData } = await supabase.from('users').select('id').eq('auth_users_id', user.id).single()
  if (!userData) return { error: 'Utilizator negăsit' }

  const creatorType = eventBase.organization_id ? 'ngo' : 'user'

  const { data: evt, error: evtErr } = await supabase.from('events').insert({
    title: eventBase.title,
    description: eventBase.description,
    banner_url: eventBase.banner_url,
    gallery_urls: eventBase.gallery_urls,
    category: 'boycott',
    subcategory: null,
    status: 'pending',
    creator_id: userData.id,
    creator_type: creatorType,
    organization_id: eventBase.organization_id ?? null,
  }).select('id').single()

  if (evtErr || !evt) return { error: evtErr?.message ?? 'Eroare creare eveniment' }

  const { data: bo, error: boErr } = await supabase.from('boycotts').insert({
    event_id: evt.id,
    reason: boycottData.reason,
    method: boycottData.method,
  }).select('id').single()

  if (boErr || !bo) return { error: boErr?.message ?? 'Eroare creare boycott' }

  for (const brand of boycottData.brands) {
    const { data: b } = await supabase.from('boycott_brands').insert({
      boycott_id: bo.id,
      name: brand.name,
      link: brand.link ?? null,
    }).select('id').single()

    if (b && brand.alternatives?.length) {
      await supabase.from('boycott_alternatives').insert(
        brand.alternatives.map(a => ({ brand_id: b.id, name: a.name, link: a.link, reason: a.reason ?? null }))
      )
    }
  }

  return { id: evt.id }
}
```

- [ ] **Step 3: Add `createPetition` to `services/petition.service.ts`**

Append at the end of the file:

```ts
type PetitionEventBase = {
  title: string
  description: string
  banner_url: string | null
  gallery_urls: string[]
  organization_id?: string | null
}

type PetitionData = {
  what_is_requested: string
  requested_from: string
  target_signatures: number
  why_important: string
  contact_person?: string | null
}

export async function createPetition(
  eventBase: PetitionEventBase,
  petitionData: PetitionData
): Promise<{ id: string } | { error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Neautentificat' }

  const { data: userData } = await supabase.from('users').select('id').eq('auth_users_id', user.id).single()
  if (!userData) return { error: 'Utilizator negăsit' }

  const creatorType = eventBase.organization_id ? 'ngo' : 'user'

  const { data: evt, error: evtErr } = await supabase.from('events').insert({
    title: eventBase.title,
    description: eventBase.description,
    banner_url: eventBase.banner_url,
    gallery_urls: eventBase.gallery_urls,
    category: 'petition',
    subcategory: null,
    status: 'pending',
    creator_id: userData.id,
    creator_type: creatorType,
    organization_id: eventBase.organization_id ?? null,
  }).select('id').single()

  if (evtErr || !evt) return { error: evtErr?.message ?? 'Eroare creare eveniment' }

  const { error: petErr } = await supabase.from('petitions').insert({
    event_id: evt.id,
    what_is_requested: petitionData.what_is_requested,
    requested_from: petitionData.requested_from,
    target_signatures: petitionData.target_signatures,
    why_important: petitionData.why_important,
    contact_person: petitionData.contact_person ?? null,
  })

  if (petErr) return { error: petErr.message }
  return { id: evt.id }
}
```

- [ ] **Step 4: Create `services/community.service.ts`**

```ts
'use server'

import { createClient } from '@/lib/supabase/server'

type EventBase = {
  title: string
  description: string
  banner_url: string | null
  gallery_urls: string[]
  subcategory: 'outdoor' | 'donations' | 'workshop'
  organization_id?: string | null
}

type CommunityData = { contact_person?: string | null }

type OutdoorData = {
  location: [number, number]
  date: string; time_start: string; time_end?: string | null
  max_participants?: number | null
  recommended_equipment?: string | null
  what_organizer_offers?: string | null
}

type DonationData = {
  donation_type: 'material' | 'monetary'
  what_is_needed?: string[] | null
  target_amount?: number | null
}

type WorkshopData = {
  location: [number, number]
  date: string; time_start: string; time_end?: string | null
  max_participants?: number | null
  recommended_equipment?: string | null
  what_organizer_offers?: string | null
}

type SubtypeData = OutdoorData | DonationData | WorkshopData

export async function createCommunityActivity(
  eventBase: EventBase,
  communityData: CommunityData,
  subtypeData: SubtypeData
): Promise<{ id: string } | { error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Neautentificat' }

  const { data: userData } = await supabase.from('users').select('id').eq('auth_users_id', user.id).single()
  if (!userData) return { error: 'Utilizator negăsit' }

  const { data: evt, error: evtErr } = await supabase.from('events').insert({
    title: eventBase.title, description: eventBase.description,
    banner_url: eventBase.banner_url, gallery_urls: eventBase.gallery_urls,
    category: 'community', subcategory: eventBase.subcategory, status: 'pending',
    creator_id: userData.id,
    creator_type: eventBase.organization_id ? 'ngo' : 'user',
    organization_id: eventBase.organization_id ?? null,
  }).select('id').single()
  if (evtErr || !evt) return { error: evtErr?.message ?? 'Eroare creare eveniment' }

  const { data: ca, error: caErr } = await supabase.from('community_activities').insert({
    event_id: evt.id, contact_person: communityData.contact_person ?? null,
  }).select('id').single()
  if (caErr || !ca) return { error: caErr?.message ?? 'Eroare creare activitate' }

  if (eventBase.subcategory === 'outdoor') {
    const d = subtypeData as OutdoorData
    await supabase.from('outdoor_activities').insert({ community_activity_id: ca.id, location: d.location, date: d.date, time_start: d.time_start, time_end: d.time_end ?? null, max_participants: d.max_participants ?? null, recommended_equipment: d.recommended_equipment ?? null, what_organizer_offers: d.what_organizer_offers ?? null })
  } else if (eventBase.subcategory === 'donations') {
    const d = subtypeData as DonationData
    await supabase.from('donations').insert({ community_activity_id: ca.id, donation_type: d.donation_type, what_is_needed: d.what_is_needed ?? null, target_amount: d.target_amount ?? null })
  } else {
    const d = subtypeData as WorkshopData
    await supabase.from('workshops').insert({ community_activity_id: ca.id, location: d.location, date: d.date, time_start: d.time_start, time_end: d.time_end ?? null, max_participants: d.max_participants ?? null, recommended_equipment: d.recommended_equipment ?? null, what_organizer_offers: d.what_organizer_offers ?? null })
  }

  return { id: evt.id }
}
```

- [ ] **Step 5: Create `services/charity.service.ts`**

```ts
'use server'

import { createClient } from '@/lib/supabase/server'

type EventBase = {
  title: string; description: string
  banner_url: string | null; gallery_urls: string[]
  subcategory: 'concert' | 'meet_greet' | 'livestream' | 'sport'
  organization_id?: string | null
}

type CharityMeta = { target_amount?: number | null; collected_amount?: number | null }

type ConcertData = { location: [number, number]; date: string; time_start: string; time_end?: string | null; performers: string[]; ticket_price?: number | null; ticket_link?: string | null; max_participants?: number | null }
type MeetGreetData = { location: [number, number]; date: string; time_start: string; time_end?: string | null; guests: string[]; ticket_price?: number | null; ticket_link?: string | null; max_participants?: number | null }
type LivestreamData = { stream_link: string; cause: string; time_start: string; time_end?: string | null; guests?: string[] | null }
type SportData = { location: [number, number]; date: string; time_start: string; time_end?: string | null; guests?: string[] | null; ticket_price?: number | null; ticket_link?: string | null; max_participants?: number | null }

type SubtypeData = ConcertData | MeetGreetData | LivestreamData | SportData

export async function createCharityEvent(
  eventBase: EventBase,
  charityMeta: CharityMeta,
  subtypeData: SubtypeData
): Promise<{ id: string } | { error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Neautentificat' }

  const { data: userData } = await supabase.from('users').select('id').eq('auth_users_id', user.id).single()
  if (!userData) return { error: 'Utilizator negăsit' }

  const { data: evt, error: evtErr } = await supabase.from('events').insert({
    title: eventBase.title, description: eventBase.description,
    banner_url: eventBase.banner_url, gallery_urls: eventBase.gallery_urls,
    category: 'charity', subcategory: eventBase.subcategory, status: 'pending',
    creator_id: userData.id,
    creator_type: eventBase.organization_id ? 'ngo' : 'user',
    organization_id: eventBase.organization_id ?? null,
  }).select('id').single()
  if (evtErr || !evt) return { error: evtErr?.message ?? 'Eroare creare eveniment' }

  const { data: ce, error: ceErr } = await supabase.from('charity_events').insert({
    event_id: evt.id,
    target_amount: charityMeta.target_amount ?? null,
    collected_amount: charityMeta.collected_amount ?? 0,
  }).select('id').single()
  if (ceErr || !ce) return { error: ceErr?.message ?? 'Eroare creare charity' }

  if (eventBase.subcategory === 'concert') {
    const d = subtypeData as ConcertData
    await supabase.from('charity_concerts').insert({ charity_event_id: ce.id, location: d.location, date: d.date, time_start: d.time_start, time_end: d.time_end ?? null, performers: d.performers, ticket_price: d.ticket_price ?? null, ticket_link: d.ticket_link ?? null, max_participants: d.max_participants ?? null })
  } else if (eventBase.subcategory === 'meet_greet') {
    const d = subtypeData as MeetGreetData
    await supabase.from('meet_greets').insert({ charity_event_id: ce.id, location: d.location, date: d.date, time_start: d.time_start, time_end: d.time_end ?? null, guests: d.guests, ticket_price: d.ticket_price ?? null, ticket_link: d.ticket_link ?? null, max_participants: d.max_participants ?? null })
  } else if (eventBase.subcategory === 'livestream') {
    const d = subtypeData as LivestreamData
    await supabase.from('charity_livestreams').insert({ charity_event_id: ce.id, stream_link: d.stream_link, cause: d.cause, time_start: d.time_start, time_end: d.time_end ?? null, guests: d.guests ?? null })
  } else {
    const d = subtypeData as SportData
    await supabase.from('sports_activities').insert({ charity_event_id: ce.id, location: d.location, date: d.date, time_start: d.time_start, time_end: d.time_end ?? null, guests: d.guests ?? null, ticket_price: d.ticket_price ?? null, ticket_link: d.ticket_link ?? null, max_participants: d.max_participants ?? null })
  }

  return { id: evt.id }
}
```

- [ ] **Step 6: Commit all services**

```bash
git add services/protest.service.ts services/boycott.service.ts services/community.service.ts services/charity.service.ts services/petition.service.ts
git commit -m "feat: add createProtest/Boycott/Petition/Community/Charity server actions"
```

---

## Task 6: Pagina selector `/creeaza`

**Files:**
- Create: `app/(private)/creeaza/page.tsx`

Grid 5 carduri: Protest · Boycott · Petiție · Comunitar · Caritabil. Fiecare card = link spre stepper-ul respectiv.

- [ ] **Step 1: Create `app/(private)/creeaza/page.tsx`**

```tsx
import Link from 'next/link'
import type { Metadata } from 'next'
import { Megaphone, ShoppingBag, FileText, Users, Heart } from 'lucide-react'

export const metadata: Metadata = { title: 'Creează eveniment', robots: { index: false } }

const TYPES = [
  {
    href: '/creeaza/protest',
    label: 'Protest',
    description: 'Adunare, marș sau pichet pentru a susține o cauză',
    icon: Megaphone,
    bg: 'from-red-500/20 to-orange-500/10',
    accent: 'text-red-600',
  },
  {
    href: '/creeaza/boycott',
    label: 'Boycott',
    description: 'Organizează un boicot și propune alternative',
    icon: ShoppingBag,
    bg: 'from-amber-500/20 to-yellow-500/10',
    accent: 'text-amber-600',
  },
  {
    href: '/creeaza/petitie',
    label: 'Petiție',
    description: 'Strânge semnături pentru o schimbare concretă',
    icon: FileText,
    bg: 'from-blue-500/20 to-sky-500/10',
    accent: 'text-blue-600',
  },
  {
    href: '/creeaza/comunitar',
    label: 'Comunitar',
    description: 'Activitate în aer liber, workshop sau colectă donații',
    icon: Users,
    bg: 'from-primary/20 to-primary/5',
    accent: 'text-primary',
  },
  {
    href: '/creeaza/caritabil',
    label: 'Caritabil',
    description: 'Concert, meet & greet, livestream sau activitate sportivă',
    icon: Heart,
    bg: 'from-pink-500/20 to-rose-500/10',
    accent: 'text-pink-600',
  },
]

export default function CreateSelectPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 lg:px-8 py-12">
      <div className="mb-10 space-y-2">
        <h1 className="text-3xl font-black tracking-tighter text-foreground">
          Ce tip de eveniment creezi?
        </h1>
        <p className="text-muted-foreground">
          Alege categoria potrivită pentru acțiunea ta civică.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {TYPES.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className={`group relative flex flex-col gap-4 rounded-2xl border border-border bg-gradient-to-br ${t.bg} p-6 transition-all hover:shadow-lg hover:scale-[1.02]`}
          >
            <div className={`size-12 rounded-xl bg-white/60 flex items-center justify-center ${t.accent}`}>
              <t.icon size={24} />
            </div>
            <div>
              <p className={`text-lg font-black ${t.accent}`}>{t.label}</p>
              <p className="text-sm text-muted-foreground mt-1 leading-snug">{t.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add "app/(private)/creeaza/page.tsx"
git commit -m "feat: add event type selector page /creeaza"
```

---

## Task 7: Stepper Protest — 4 pași

**Files:**
- Create: `app/(private)/creeaza/protest/page.tsx`

**Pași:** 1. Info + subtip → 2. Locație → 3. Logistică → 4. Media

State shape:
```ts
type ProtestForm = {
  // Step 1
  title: string; description: string; subcategory: 'gathering' | 'march' | 'picket'
  // Step 2
  location: [number, number] | null   // gathering / picket
  locations: [number, number][]        // march
  // Step 3
  date: string; time_start: string; time_end: string
  max_participants: string
  safety_rules: string; recommended_equipment: string; contact_person: string
  // Step 4
  banner_url: string | null; gallery_urls: string[]
  organization_id: string | null
}
```

- [ ] **Step 1: Create `app/(private)/creeaza/protest/page.tsx`**

```tsx
'use client'

import dynamic from 'next/dynamic'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { StepperUI } from '../_components/StepperUI'
import { ImageUploadClient } from '../_components/ImageUploadClient'
import { createProtest } from '@/services/protest.service'
import { createClient } from '@/lib/supabase/client'

const LocationPickerClient = dynamic(() => import('../_components/LocationPickerClient').then(m => m.LocationPickerClient), { ssr: false })
const RoutePickerClient = dynamic(() => import('../_components/RoutePickerClient').then(m => m.RoutePickerClient), { ssr: false })

const STEPS = ['Info', 'Locație', 'Logistică', 'Media']

type Form = {
  title: string; description: string; subcategory: 'gathering' | 'march' | 'picket'
  location: [number, number] | null; locations: [number, number][]
  date: string; time_start: string; time_end: string
  max_participants: string; safety_rules: string; recommended_equipment: string; contact_person: string
  banner_url: string | null; gallery_urls: string[]
}

const INITIAL: Form = {
  title: '', description: '', subcategory: 'gathering',
  location: null, locations: [],
  date: '', time_start: '', time_end: '',
  max_participants: '', safety_rules: '', recommended_equipment: '', contact_person: '',
  banner_url: null, gallery_urls: [],
}

export default function CreateProtestPage() {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState<Form>(INITIAL)
  const [submitting, setSubmitting] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const router = useRouter()

  // Fetch userId once for upload
  useState(() => {
    createClient().auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null))
  })

  function set<K extends keyof Form>(key: K, val: Form[K]) {
    setForm(f => ({ ...f, [key]: val }))
  }

  function validateStep(): string | null {
    if (step === 1) {
      if (!form.title.trim()) return 'Titlul este obligatoriu'
      if (!form.description.trim()) return 'Descrierea este obligatorie'
    }
    if (step === 2) {
      if (form.subcategory === 'march' && form.locations.length < 2) return 'Adaugă minim 2 puncte de traseu'
      if (form.subcategory !== 'march' && !form.location) return 'Selectează o locație pe hartă'
    }
    if (step === 3) {
      if (!form.date) return 'Data este obligatorie'
      if (!form.time_start) return 'Ora de început este obligatorie'
      if (!form.max_participants || Number(form.max_participants) < 1) return 'Numărul maxim de participanți este obligatoriu'
    }
    if (step === 4) {
      if (!form.banner_url) return 'Bannerul este obligatoriu'
    }
    return null
  }

  function handleNext() {
    const err = validateStep()
    if (err) { toast.error(err); return }
    setStep(s => s + 1)
  }

  async function handleSubmit() {
    const err = validateStep()
    if (err) { toast.error(err); return }

    setSubmitting(true)
    const subtypeData = form.subcategory === 'march'
      ? { locations: form.locations }
      : { location: form.location! }

    const result = await createProtest(
      { title: form.title, description: form.description, banner_url: form.banner_url, gallery_urls: form.gallery_urls, subcategory: form.subcategory, organization_id: null },
      { date: form.date, time_start: form.time_start, time_end: form.time_end || null, max_participants: Number(form.max_participants), recommended_equipment: form.recommended_equipment || null, safety_rules: form.safety_rules || null, contact_person: form.contact_person || null },
      subtypeData
    )

    setSubmitting(false)
    if ('error' in result) { toast.error(result.error); return }
    toast.success('Eveniment creat! Urmează validarea de către admin.')
    router.push(`/evenimente/protest/${result.id}`)
  }

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[30%_70%]">
      {/* Left sticky image */}
      <div className="hidden lg:flex sticky top-0 h-screen bg-gradient-to-br from-red-600/80 to-orange-600/60 items-end p-10">
        <div className="text-white space-y-2">
          <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Creează</p>
          <h2 className="text-4xl font-black leading-tight">PROTEST</h2>
          <p className="text-sm opacity-70">Adunare, marș sau pichet</p>
        </div>
      </div>

      {/* Right stepper */}
      <div className="px-4 py-8 lg:px-12 lg:py-12">
        <StepperUI steps={STEPS} currentStep={step} onBack={() => setStep(s => s - 1)} onNext={handleNext} onSubmit={handleSubmit} isSubmitting={submitting}>

          {step === 1 && (
            <div className="space-y-5">
              <div className="space-y-2">
                <Label>Subtip protest *</Label>
                <RadioGroup value={form.subcategory} onValueChange={v => set('subcategory', v as Form['subcategory'])} className="flex gap-4">
                  {([['gathering', 'Adunare'], ['march', 'Marș'], ['picket', 'Pichet']] as const).map(([val, label]) => (
                    <div key={val} className="flex items-center gap-2">
                      <RadioGroupItem value={val} id={val} />
                      <Label htmlFor={val}>{label}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">Titlu *</Label>
                <Input id="title" value={form.title} onChange={e => set('title', e.target.value)} placeholder="ex: Protest pentru Justiție" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="desc">Descriere *</Label>
                <Textarea id="desc" value={form.description} onChange={e => set('description', e.target.value)} rows={5} placeholder="Descrieți scopul protestului..." />
              </div>
            </div>
          )}

          {step === 2 && (
            form.subcategory === 'march'
              ? <RoutePickerClient locations={form.locations} onChange={v => set('locations', v)} />
              : <LocationPickerClient location={form.location} onChange={v => set('location', v)} />
          )}

          {step === 3 && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Data *</Label>
                  <Input id="date" type="date" value={form.date} onChange={e => set('date', e.target.value)} min={new Date().toISOString().split('T')[0]} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max">Max. participanți *</Label>
                  <Input id="max" type="number" min="1" value={form.max_participants} onChange={e => set('max_participants', e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ts">Ora start *</Label>
                  <Input id="ts" type="time" value={form.time_start} onChange={e => set('time_start', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="te">Ora final (opțional)</Label>
                  <Input id="te" type="time" value={form.time_end} onChange={e => set('time_end', e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="safety">Reguli de siguranță (opțional)</Label>
                <Textarea id="safety" value={form.safety_rules} onChange={e => set('safety_rules', e.target.value)} rows={3} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="equip">Echipament recomandat (opțional)</Label>
                <Textarea id="equip" value={form.recommended_equipment} onChange={e => set('recommended_equipment', e.target.value)} rows={3} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact">Persoană de contact (opțional)</Label>
                <Input id="contact" value={form.contact_person} onChange={e => set('contact_person', e.target.value)} placeholder="Nume — telefon" />
              </div>
            </div>
          )}

          {step === 4 && userId && (
            <ImageUploadClient
              userId={userId}
              bannerUrl={form.banner_url}
              galleryUrls={form.gallery_urls}
              onBannerChange={v => set('banner_url', v)}
              onGalleryChange={v => set('gallery_urls', v)}
            />
          )}

        </StepperUI>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add "app/(private)/creeaza/protest/page.tsx"
git commit -m "feat: add protest creation stepper (4 steps)"
```

---

## Task 8: Stepper Boycott — 3 pași

**Files:**
- Create: `app/(private)/creeaza/boycott/page.tsx`

**Pași:** 1. Info → 2. Branduri → 3. Media

- [ ] **Step 1: Create `app/(private)/creeaza/boycott/page.tsx`**

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Plus, X, ChevronDown, ChevronUp } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { StepperUI } from '../_components/StepperUI'
import { ImageUploadClient } from '../_components/ImageUploadClient'
import { createBoycott } from '@/services/boycott.service'
import { createClient } from '@/lib/supabase/client'

const STEPS = ['Info', 'Branduri', 'Media']

type Alternative = { name: string; link: string; reason: string }
type Brand = { name: string; link: string; alternatives: Alternative[]; expanded: boolean }
type Form = {
  title: string; description: string; reason: string; method: string
  brands: Brand[]
  banner_url: string | null; gallery_urls: string[]
}

const INITIAL: Form = {
  title: '', description: '', reason: '', method: '',
  brands: [{ name: '', link: '', alternatives: [], expanded: true }],
  banner_url: null, gallery_urls: [],
}

export default function CreateBoycottPage() {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState<Form>(INITIAL)
  const [submitting, setSubmitting] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const router = useRouter()

  useState(() => { createClient().auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null)) })

  function set<K extends keyof Form>(key: K, val: Form[K]) { setForm(f => ({ ...f, [key]: val })) }

  function updateBrand(i: number, field: keyof Omit<Brand, 'alternatives' | 'expanded'>, val: string) {
    const brands = [...form.brands]
    brands[i] = { ...brands[i], [field]: val }
    set('brands', brands)
  }

  function addBrand() { set('brands', [...form.brands, { name: '', link: '', alternatives: [], expanded: true }]) }

  function removeBrand(i: number) { set('brands', form.brands.filter((_, idx) => idx !== i)) }

  function addAlternative(brandIdx: number) {
    const brands = [...form.brands]
    brands[brandIdx].alternatives.push({ name: '', link: '', reason: '' })
    set('brands', brands)
  }

  function updateAlt(brandIdx: number, altIdx: number, field: keyof Alternative, val: string) {
    const brands = [...form.brands]
    brands[brandIdx].alternatives[altIdx] = { ...brands[brandIdx].alternatives[altIdx], [field]: val }
    set('brands', brands)
  }

  function removeAlt(brandIdx: number, altIdx: number) {
    const brands = [...form.brands]
    brands[brandIdx].alternatives = brands[brandIdx].alternatives.filter((_, i) => i !== altIdx)
    set('brands', brands)
  }

  function validateStep(): string | null {
    if (step === 1) {
      if (!form.title.trim()) return 'Titlul este obligatoriu'
      if (!form.description.trim()) return 'Descrierea este obligatorie'
      if (!form.reason.trim()) return 'Motivul boicotului este obligatoriu'
      if (!form.method.trim()) return 'Metoda boicotului este obligatorie'
    }
    if (step === 2) {
      if (form.brands.length === 0) return 'Adaugă cel puțin un brand'
      if (form.brands.some(b => !b.name.trim())) return 'Completează numele tuturor brandurilor'
      for (const b of form.brands) {
        for (const a of b.alternatives) {
          if (!a.name.trim() || !a.link.trim()) return 'Completează numele și link-ul alternativelor'
        }
      }
    }
    if (step === 3 && !form.banner_url) return 'Bannerul este obligatoriu'
    return null
  }

  function handleNext() { const e = validateStep(); if (e) { toast.error(e); return }; setStep(s => s + 1) }

  async function handleSubmit() {
    const e = validateStep(); if (e) { toast.error(e); return }
    setSubmitting(true)
    const result = await createBoycott(
      { title: form.title, description: form.description, banner_url: form.banner_url, gallery_urls: form.gallery_urls, organization_id: null },
      { reason: form.reason, method: form.method, brands: form.brands.map(b => ({ name: b.name, link: b.link || null, alternatives: b.alternatives.map(a => ({ name: a.name, link: a.link, reason: a.reason || null })) })) }
    )
    setSubmitting(false)
    if ('error' in result) { toast.error(result.error); return }
    toast.success('Boicot creat! Urmează validarea de către admin.')
    router.push(`/evenimente/boycott/${result.id}`)
  }

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[30%_70%]">
      <div className="hidden lg:flex sticky top-0 h-screen bg-gradient-to-br from-amber-600/80 to-yellow-600/60 items-end p-10">
        <div className="text-white space-y-2">
          <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Creează</p>
          <h2 className="text-4xl font-black">BOYCOTT</h2>
          <p className="text-sm opacity-70">Branduri & alternative</p>
        </div>
      </div>

      <div className="px-4 py-8 lg:px-12 lg:py-12">
        <StepperUI steps={STEPS} currentStep={step} onBack={() => setStep(s => s - 1)} onNext={handleNext} onSubmit={handleSubmit} isSubmitting={submitting}>

          {step === 1 && (
            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="title">Titlu *</Label>
                <Input id="title" value={form.title} onChange={e => set('title', e.target.value)} placeholder="ex: Boicot Fast Fashion" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="desc">Descriere *</Label>
                <Textarea id="desc" value={form.description} onChange={e => set('description', e.target.value)} rows={5} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reason">Motivul boicotului *</Label>
                <Input id="reason" value={form.reason} onChange={e => set('reason', e.target.value)} placeholder="ex: Poluare masivă" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="method">Metoda boicotului *</Label>
                <Input id="method" value={form.method} onChange={e => set('method', e.target.value)} placeholder="ex: Refuză cumpărăturile" />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              {form.brands.map((brand, bi) => (
                <div key={bi} className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold">Brand {bi + 1}</p>
                    <div className="flex gap-2">
                      <button onClick={() => { const b = [...form.brands]; b[bi].expanded = !b[bi].expanded; set('brands', b) }}>
                        {brand.expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                      {form.brands.length > 1 && <button onClick={() => removeBrand(bi)} className="text-destructive"><X size={16} /></button>}
                    </div>
                  </div>
                  {brand.expanded && (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Nume brand *</Label>
                          <Input value={brand.name} onChange={e => updateBrand(bi, 'name', e.target.value)} placeholder="ex: H&M" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Link (opțional)</Label>
                          <Input value={brand.link} onChange={e => updateBrand(bi, 'link', e.target.value)} placeholder="https://" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Alternative</p>
                        {brand.alternatives.map((alt, ai) => (
                          <div key={ai} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-start">
                            <Input placeholder="Nume alternativă *" value={alt.name} onChange={e => updateAlt(bi, ai, 'name', e.target.value)} />
                            <Input placeholder="Link *" value={alt.link} onChange={e => updateAlt(bi, ai, 'link', e.target.value)} />
                            <button onClick={() => removeAlt(bi, ai)} className="mt-2 text-destructive"><X size={14} /></button>
                          </div>
                        ))}
                        <Button variant="ghost" size="sm" onClick={() => addAlternative(bi)} className="gap-1 text-xs">
                          <Plus size={12} /> Adaugă alternativă
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ))}
              <Button variant="outline" onClick={addBrand} className="w-full gap-1">
                <Plus size={14} /> Adaugă brand
              </Button>
            </div>
          )}

          {step === 3 && userId && (
            <ImageUploadClient userId={userId} bannerUrl={form.banner_url} galleryUrls={form.gallery_urls} onBannerChange={v => set('banner_url', v)} onGalleryChange={v => set('gallery_urls', v)} />
          )}

        </StepperUI>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add "app/(private)/creeaza/boycott/page.tsx"
git commit -m "feat: add boycott creation stepper (3 steps)"
```

---

## Task 9: Stepper Petiție — 3 pași

**Files:**
- Create: `app/(private)/creeaza/petitie/page.tsx`

**Pași:** 1. Info → 2. Detalii → 3. Media

- [ ] **Step 1: Create `app/(private)/creeaza/petitie/page.tsx`**

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { StepperUI } from '../_components/StepperUI'
import { ImageUploadClient } from '../_components/ImageUploadClient'
import { createPetition } from '@/services/petition.service'
import { createClient } from '@/lib/supabase/client'

const STEPS = ['Info', 'Detalii', 'Media']

type Form = {
  title: string; description: string
  what_is_requested: string; requested_from: string
  why_important: string; target_signatures: string; contact_person: string
  banner_url: string | null; gallery_urls: string[]
}

const INITIAL: Form = {
  title: '', description: '',
  what_is_requested: '', requested_from: '',
  why_important: '', target_signatures: '1000', contact_person: '',
  banner_url: null, gallery_urls: [],
}

export default function CreatePetitionPage() {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState<Form>(INITIAL)
  const [submitting, setSubmitting] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const router = useRouter()

  useState(() => { createClient().auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null)) })

  function set<K extends keyof Form>(key: K, val: Form[K]) { setForm(f => ({ ...f, [key]: val })) }

  function validateStep(): string | null {
    if (step === 1) {
      if (!form.title.trim()) return 'Titlul este obligatoriu'
      if (!form.description.trim()) return 'Descrierea este obligatorie'
    }
    if (step === 2) {
      if (!form.what_is_requested.trim()) return 'Ce se solicită este obligatoriu'
      if (!form.requested_from.trim()) return 'Cui i se adresează este obligatoriu'
      if (!form.why_important.trim()) return 'De ce este importantă este obligatoriu'
      if (!form.target_signatures || Number(form.target_signatures) < 10) return 'Target minim: 10 semnături'
    }
    if (step === 3 && !form.banner_url) return 'Bannerul este obligatoriu'
    return null
  }

  function handleNext() { const e = validateStep(); if (e) { toast.error(e); return }; setStep(s => s + 1) }

  async function handleSubmit() {
    const e = validateStep(); if (e) { toast.error(e); return }
    setSubmitting(true)
    const result = await createPetition(
      { title: form.title, description: form.description, banner_url: form.banner_url, gallery_urls: form.gallery_urls, organization_id: null },
      { what_is_requested: form.what_is_requested, requested_from: form.requested_from, why_important: form.why_important, target_signatures: Number(form.target_signatures), contact_person: form.contact_person || null }
    )
    setSubmitting(false)
    if ('error' in result) { toast.error(result.error); return }
    toast.success('Petiție creată! Urmează validarea de către admin.')
    router.push(`/evenimente/petitie/${result.id}`)
  }

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[30%_70%]">
      <div className="hidden lg:flex sticky top-0 h-screen bg-gradient-to-br from-blue-600/80 to-sky-600/60 items-end p-10">
        <div className="text-white space-y-2">
          <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Creează</p>
          <h2 className="text-4xl font-black">PETIȚIE</h2>
          <p className="text-sm opacity-70">Strânge semnături</p>
        </div>
      </div>

      <div className="px-4 py-8 lg:px-12 lg:py-12">
        <StepperUI steps={STEPS} currentStep={step} onBack={() => setStep(s => s - 1)} onNext={handleNext} onSubmit={handleSubmit} isSubmitting={submitting}>

          {step === 1 && (
            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="title">Titlu *</Label>
                <Input id="title" value={form.title} onChange={e => set('title', e.target.value)} placeholder="ex: Petiție pentru Spații Verzi" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="desc">Descriere *</Label>
                <Textarea id="desc" value={form.description} onChange={e => set('description', e.target.value)} rows={5} />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="wir">Ce se solicită *</Label>
                <Textarea id="wir" value={form.what_is_requested} onChange={e => set('what_is_requested', e.target.value)} rows={3} placeholder="Descrieți concret ce anume se cere..." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rf">Cui i se adresează *</Label>
                <Input id="rf" value={form.requested_from} onChange={e => set('requested_from', e.target.value)} placeholder="ex: Ministerul Educației" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="why">De ce este importantă *</Label>
                <Textarea id="why" value={form.why_important} onChange={e => set('why_important', e.target.value)} rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="target">Target semnături *</Label>
                  <Input id="target" type="number" min="10" value={form.target_signatures} onChange={e => set('target_signatures', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact">Contact (opțional)</Label>
                  <Input id="contact" value={form.contact_person} onChange={e => set('contact_person', e.target.value)} placeholder="email sau telefon" />
                </div>
              </div>
            </div>
          )}

          {step === 3 && userId && (
            <ImageUploadClient userId={userId} bannerUrl={form.banner_url} galleryUrls={form.gallery_urls} onBannerChange={v => set('banner_url', v)} onGalleryChange={v => set('gallery_urls', v)} />
          )}

        </StepperUI>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add "app/(private)/creeaza/petitie/page.tsx"
git commit -m "feat: add petition creation stepper (3 steps)"
```

---

## Task 10: Stepper Comunitar — 2-4 pași (condiționat de subtip)

**Files:**
- Create: `app/(private)/creeaza/comunitar/page.tsx`

**Pași outdoor/workshop:** 1. Info+subtip → 2. Locație → 3. Detalii → 4. Media  
**Pași donations:** 1. Info+subtip → 2. Detalii donații → 3. Media

Pasul 2 se schimbă dinamic în funcție de `subcategory`.

- [ ] **Step 1: Create `app/(private)/creeaza/comunitar/page.tsx`**

```tsx
'use client'

import dynamic from 'next/dynamic'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Plus, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Button } from '@/components/ui/button'
import { StepperUI } from '../_components/StepperUI'
import { ImageUploadClient } from '../_components/ImageUploadClient'
import { createCommunityActivity } from '@/services/community.service'
import { createClient } from '@/lib/supabase/client'

const LocationPickerClient = dynamic(() => import('../_components/LocationPickerClient').then(m => m.LocationPickerClient), { ssr: false })

type Subcategory = 'outdoor' | 'donations' | 'workshop'
type DonationType = 'material' | 'monetary'

type Form = {
  title: string; description: string; subcategory: Subcategory; contact_person: string
  // Location step (outdoor/workshop)
  location: [number, number] | null
  // Detalii outdoor/workshop
  date: string; time_start: string; time_end: string
  max_participants: string; recommended_equipment: string; what_organizer_offers: string
  // Donations
  donation_type: DonationType; what_is_needed: string[]; newItem: string; target_amount: string
  banner_url: string | null; gallery_urls: string[]
}

const INITIAL: Form = {
  title: '', description: '', subcategory: 'outdoor', contact_person: '',
  location: null,
  date: '', time_start: '', time_end: '',
  max_participants: '', recommended_equipment: '', what_organizer_offers: '',
  donation_type: 'material', what_is_needed: [], newItem: '', target_amount: '',
  banner_url: null, gallery_urls: [],
}

function getSteps(sub: Subcategory) {
  if (sub === 'donations') return ['Info', 'Donații', 'Media']
  return ['Info', 'Locație', 'Detalii', 'Media']
}

export default function CreateCommunityPage() {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState<Form>(INITIAL)
  const [submitting, setSubmitting] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const router = useRouter()

  useState(() => { createClient().auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null)) })

  function set<K extends keyof Form>(key: K, val: Form[K]) { setForm(f => ({ ...f, [key]: val })) }
  const steps = getSteps(form.subcategory)
  const totalSteps = steps.length

  function validateStep(): string | null {
    if (step === 1) {
      if (!form.title.trim()) return 'Titlul este obligatoriu'
      if (!form.description.trim()) return 'Descrierea este obligatorie'
    }
    if (step === 2 && form.subcategory !== 'donations') {
      if (!form.location) return 'Selectează o locație pe hartă'
    }
    if (step === 2 && form.subcategory === 'donations') {
      if (form.donation_type === 'material' && form.what_is_needed.length === 0) return 'Adaugă cel puțin un item necesar'
      if (form.donation_type === 'monetary' && (!form.target_amount || Number(form.target_amount) < 1)) return 'Introdu suma target'
    }
    if (step === 3 && form.subcategory !== 'donations') {
      if (!form.date) return 'Data este obligatorie'
      if (!form.time_start) return 'Ora de început este obligatorie'
    }
    if (step === totalSteps && !form.banner_url) return 'Bannerul este obligatoriu'
    return null
  }

  function handleNext() { const e = validateStep(); if (e) { toast.error(e); return }; setStep(s => s + 1) }

  async function handleSubmit() {
    const e = validateStep(); if (e) { toast.error(e); return }
    setSubmitting(true)

    let subtypeData: any
    if (form.subcategory === 'outdoor') {
      subtypeData = { location: form.location!, date: form.date, time_start: form.time_start, time_end: form.time_end || null, max_participants: form.max_participants ? Number(form.max_participants) : null, recommended_equipment: form.recommended_equipment || null, what_organizer_offers: form.what_organizer_offers || null }
    } else if (form.subcategory === 'donations') {
      subtypeData = { donation_type: form.donation_type, what_is_needed: form.donation_type === 'material' ? form.what_is_needed : null, target_amount: form.donation_type === 'monetary' ? Number(form.target_amount) : null }
    } else {
      subtypeData = { location: form.location!, date: form.date, time_start: form.time_start, time_end: form.time_end || null, max_participants: form.max_participants ? Number(form.max_participants) : null, recommended_equipment: form.recommended_equipment || null, what_organizer_offers: form.what_organizer_offers || null }
    }

    const result = await createCommunityActivity(
      { title: form.title, description: form.description, banner_url: form.banner_url, gallery_urls: form.gallery_urls, subcategory: form.subcategory, organization_id: null },
      { contact_person: form.contact_person || null },
      subtypeData
    )
    setSubmitting(false)
    if ('error' in result) { toast.error(result.error); return }
    toast.success('Activitate creată! Urmează validarea de către admin.')
    router.push(`/evenimente/comunitar/${result.id}`)
  }

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[30%_70%]">
      <div className="hidden lg:flex sticky top-0 h-screen bg-gradient-to-br from-primary/80 to-primary/40 items-end p-10">
        <div className="text-white space-y-2">
          <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Creează</p>
          <h2 className="text-4xl font-black">COMUNITAR</h2>
          <p className="text-sm opacity-70">Aer liber · Workshop · Donații</p>
        </div>
      </div>

      <div className="px-4 py-8 lg:px-12 lg:py-12">
        <StepperUI steps={steps} currentStep={step} onBack={() => setStep(s => s - 1)} onNext={handleNext} onSubmit={handleSubmit} isSubmitting={submitting}>

          {step === 1 && (
            <div className="space-y-5">
              <div className="space-y-2">
                <Label>Subtip *</Label>
                <RadioGroup value={form.subcategory} onValueChange={v => { set('subcategory', v as Subcategory); setStep(1) }} className="flex gap-4">
                  {([['outdoor', 'Aer liber'], ['workshop', 'Workshop'], ['donations', 'Donații']] as const).map(([val, label]) => (
                    <div key={val} className="flex items-center gap-2">
                      <RadioGroupItem value={val} id={val} />
                      <Label htmlFor={val}>{label}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">Titlu *</Label>
                <Input id="title" value={form.title} onChange={e => set('title', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="desc">Descriere *</Label>
                <Textarea id="desc" value={form.description} onChange={e => set('description', e.target.value)} rows={5} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact">Persoană contact (opțional)</Label>
                <Input id="contact" value={form.contact_person} onChange={e => set('contact_person', e.target.value)} />
              </div>
            </div>
          )}

          {/* Locație — outdoor/workshop */}
          {step === 2 && form.subcategory !== 'donations' && (
            <LocationPickerClient location={form.location} onChange={v => set('location', v)} />
          )}

          {/* Donații step 2 */}
          {step === 2 && form.subcategory === 'donations' && (
            <div className="space-y-5">
              <div className="space-y-2">
                <Label>Tip donație *</Label>
                <RadioGroup value={form.donation_type} onValueChange={v => set('donation_type', v as DonationType)} className="flex gap-4">
                  <div className="flex items-center gap-2"><RadioGroupItem value="material" id="mat" /><Label htmlFor="mat">Materiale</Label></div>
                  <div className="flex items-center gap-2"><RadioGroupItem value="monetary" id="mon" /><Label htmlFor="mon">Monetar</Label></div>
                </RadioGroup>
              </div>
              {form.donation_type === 'material' && (
                <div className="space-y-2">
                  <Label>Ce este necesar *</Label>
                  <div className="flex gap-2">
                    <Input value={form.newItem} onChange={e => set('newItem', e.target.value)} placeholder="ex: conserve" onKeyDown={e => { if (e.key === 'Enter' && form.newItem.trim()) { set('what_is_needed', [...form.what_is_needed, form.newItem.trim()]); set('newItem', '') } }} />
                    <Button variant="outline" onClick={() => { if (form.newItem.trim()) { set('what_is_needed', [...form.what_is_needed, form.newItem.trim()]); set('newItem', '') } }}><Plus size={16} /></Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {form.what_is_needed.map((item, i) => (
                      <span key={i} className="flex items-center gap-1 rounded-full border border-border bg-muted/50 px-3 py-1 text-sm">
                        {item} <button onClick={() => set('what_is_needed', form.what_is_needed.filter((_, j) => j !== i))}><X size={12} /></button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {form.donation_type === 'monetary' && (
                <div className="space-y-2">
                  <Label htmlFor="ta">Suma target (RON) *</Label>
                  <Input id="ta" type="number" min="1" value={form.target_amount} onChange={e => set('target_amount', e.target.value)} />
                </div>
              )}
            </div>
          )}

          {/* Detalii outdoor/workshop step 3 */}
          {step === 3 && form.subcategory !== 'donations' && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Data *</Label><Input type="date" value={form.date} onChange={e => set('date', e.target.value)} min={new Date().toISOString().split('T')[0]} /></div>
                <div className="space-y-2"><Label>Max. participanți</Label><Input type="number" min="1" value={form.max_participants} onChange={e => set('max_participants', e.target.value)} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Ora start *</Label><Input type="time" value={form.time_start} onChange={e => set('time_start', e.target.value)} /></div>
                <div className="space-y-2"><Label>Ora final (opțional)</Label><Input type="time" value={form.time_end} onChange={e => set('time_end', e.target.value)} /></div>
              </div>
              <div className="space-y-2"><Label>Ce oferă organizatorul (opțional)</Label><Textarea value={form.what_organizer_offers} onChange={e => set('what_organizer_offers', e.target.value)} rows={3} /></div>
              <div className="space-y-2"><Label>Echipament recomandat (opțional)</Label><Textarea value={form.recommended_equipment} onChange={e => set('recommended_equipment', e.target.value)} rows={3} /></div>
            </div>
          )}

          {/* Media — last step */}
          {step === totalSteps && userId && (
            <ImageUploadClient userId={userId} bannerUrl={form.banner_url} galleryUrls={form.gallery_urls} onBannerChange={v => set('banner_url', v)} onGalleryChange={v => set('gallery_urls', v)} />
          )}

        </StepperUI>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add "app/(private)/creeaza/comunitar/page.tsx"
git commit -m "feat: add community activity creation stepper (2-4 steps, conditional)"
```

---

## Task 11: Stepper Caritabil — 2-4 pași (condiționat de subtip)

**Files:**
- Create: `app/(private)/creeaza/caritabil/page.tsx`

**Pași concert/meet_greet/sport:** 1. Info+subtip → 2. Locație → 3. Detalii → 4. Media  
**Pași livestream:** 1. Info+subtip → 2. Detalii → 3. Media

- [ ] **Step 1: Create `app/(private)/creeaza/caritabil/page.tsx`**

```tsx
'use client'

import dynamic from 'next/dynamic'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Plus, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Button } from '@/components/ui/button'
import { StepperUI } from '../_components/StepperUI'
import { ImageUploadClient } from '../_components/ImageUploadClient'
import { createCharityEvent } from '@/services/charity.service'
import { createClient } from '@/lib/supabase/client'

const LocationPickerClient = dynamic(() => import('../_components/LocationPickerClient').then(m => m.LocationPickerClient), { ssr: false })

type Subcategory = 'concert' | 'meet_greet' | 'livestream' | 'sport'

type Form = {
  title: string; description: string; subcategory: Subcategory
  location: [number, number] | null
  date: string; time_start: string; time_end: string
  performers: string[]; guests: string[]; newPerformer: string; newGuest: string
  ticket_price: string; ticket_link: string
  stream_link: string; cause: string
  target_amount: string
  banner_url: string | null; gallery_urls: string[]
}

const INITIAL: Form = {
  title: '', description: '', subcategory: 'concert',
  location: null,
  date: '', time_start: '', time_end: '',
  performers: [], guests: [], newPerformer: '', newGuest: '',
  ticket_price: '', ticket_link: '',
  stream_link: '', cause: '',
  target_amount: '',
  banner_url: null, gallery_urls: [],
}

function getSteps(sub: Subcategory) {
  if (sub === 'livestream') return ['Info', 'Detalii', 'Media']
  return ['Info', 'Locație', 'Detalii', 'Media']
}

export default function CreateCharityPage() {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState<Form>(INITIAL)
  const [submitting, setSubmitting] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const router = useRouter()

  useState(() => { createClient().auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null)) })

  function set<K extends keyof Form>(key: K, val: Form[K]) { setForm(f => ({ ...f, [key]: val })) }
  const steps = getSteps(form.subcategory)
  const totalSteps = steps.length
  const isLivestream = form.subcategory === 'livestream'

  function addTag(field: 'performers' | 'guests', newField: 'newPerformer' | 'newGuest') {
    const val = form[newField].trim()
    if (!val) return
    set(field, [...form[field], val])
    set(newField, '')
  }

  function validateStep(): string | null {
    if (step === 1) {
      if (!form.title.trim()) return 'Titlul este obligatoriu'
      if (!form.description.trim()) return 'Descrierea este obligatorie'
    }
    if (step === 2 && !isLivestream && !form.location) return 'Selectează o locație pe hartă'
    if ((step === 2 && isLivestream) || (step === 3 && !isLivestream)) {
      if (!form.time_start) return 'Ora de start este obligatorie'
      if (isLivestream && !form.stream_link.trim()) return 'Link stream este obligatoriu'
      if (isLivestream && !form.cause.trim()) return 'Cauza susținută este obligatorie'
      if (!isLivestream && !form.date) return 'Data este obligatorie'
      if (form.subcategory === 'concert' && form.performers.length === 0) return 'Adaugă cel puțin un artist'
      if (form.subcategory === 'meet_greet' && form.guests.length === 0) return 'Adaugă cel puțin un invitat'
    }
    if (step === totalSteps && !form.banner_url) return 'Bannerul este obligatoriu'
    return null
  }

  function handleNext() { const e = validateStep(); if (e) { toast.error(e); return }; setStep(s => s + 1) }

  async function handleSubmit() {
    const e = validateStep(); if (e) { toast.error(e); return }
    setSubmitting(true)

    let subtypeData: any
    if (form.subcategory === 'concert') {
      subtypeData = { location: form.location!, date: form.date, time_start: form.time_start, time_end: form.time_end || null, performers: form.performers, ticket_price: form.ticket_price ? Number(form.ticket_price) : null, ticket_link: form.ticket_link || null, max_participants: null }
    } else if (form.subcategory === 'meet_greet') {
      subtypeData = { location: form.location!, date: form.date, time_start: form.time_start, time_end: form.time_end || null, guests: form.guests, ticket_price: form.ticket_price ? Number(form.ticket_price) : null, ticket_link: form.ticket_link || null, max_participants: null }
    } else if (form.subcategory === 'livestream') {
      subtypeData = { stream_link: form.stream_link, cause: form.cause, time_start: form.time_start, time_end: form.time_end || null, guests: form.guests.length ? form.guests : null }
    } else {
      subtypeData = { location: form.location!, date: form.date, time_start: form.time_start, time_end: form.time_end || null, guests: form.guests.length ? form.guests : null, ticket_price: form.ticket_price ? Number(form.ticket_price) : null, ticket_link: form.ticket_link || null, max_participants: null }
    }

    const result = await createCharityEvent(
      { title: form.title, description: form.description, banner_url: form.banner_url, gallery_urls: form.gallery_urls, subcategory: form.subcategory, organization_id: null },
      { target_amount: form.target_amount ? Number(form.target_amount) : null },
      subtypeData
    )
    setSubmitting(false)
    if ('error' in result) { toast.error(result.error); return }
    toast.success('Eveniment caritabil creat! Urmează validarea de către admin.')
    router.push(`/evenimente/caritabil/${result.id}`)
  }

  // Detalii step index: 2 for livestream, 3 for others
  const detailsStep = isLivestream ? 2 : 3

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[30%_70%]">
      <div className="hidden lg:flex sticky top-0 h-screen bg-gradient-to-br from-pink-600/80 to-rose-600/60 items-end p-10">
        <div className="text-white space-y-2">
          <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Creează</p>
          <h2 className="text-4xl font-black">CARITABIL</h2>
          <p className="text-sm opacity-70">Concert · Meet&Greet · Sport · Live</p>
        </div>
      </div>

      <div className="px-4 py-8 lg:px-12 lg:py-12">
        <StepperUI steps={steps} currentStep={step} onBack={() => setStep(s => s - 1)} onNext={handleNext} onSubmit={handleSubmit} isSubmitting={submitting}>

          {step === 1 && (
            <div className="space-y-5">
              <div className="space-y-2">
                <Label>Subtip *</Label>
                <RadioGroup value={form.subcategory} onValueChange={v => { set('subcategory', v as Subcategory); setStep(1) }} className="grid grid-cols-2 gap-2">
                  {([['concert', 'Concert'], ['meet_greet', 'Meet & Greet'], ['livestream', 'Livestream'], ['sport', 'Sport']] as const).map(([val, label]) => (
                    <div key={val} className="flex items-center gap-2">
                      <RadioGroupItem value={val} id={val} />
                      <Label htmlFor={val}>{label}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
              <div className="space-y-2">
                <Label>Titlu *</Label>
                <Input value={form.title} onChange={e => set('title', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Descriere *</Label>
                <Textarea value={form.description} onChange={e => set('description', e.target.value)} rows={5} />
              </div>
            </div>
          )}

          {step === 2 && !isLivestream && (
            <LocationPickerClient location={form.location} onChange={v => set('location', v)} />
          )}

          {step === detailsStep && (
            <div className="space-y-5">
              {!isLivestream && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Data *</Label><Input type="date" value={form.date} onChange={e => set('date', e.target.value)} min={new Date().toISOString().split('T')[0]} /></div>
                  <div className="space-y-2"><Label>Target donații (RON, opțional)</Label><Input type="number" value={form.target_amount} onChange={e => set('target_amount', e.target.value)} /></div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Ora start *</Label><Input type="time" value={form.time_start} onChange={e => set('time_start', e.target.value)} /></div>
                <div className="space-y-2"><Label>Ora final (opțional)</Label><Input type="time" value={form.time_end} onChange={e => set('time_end', e.target.value)} /></div>
              </div>

              {isLivestream && (
                <>
                  <div className="space-y-2"><Label>Link stream *</Label><Input value={form.stream_link} onChange={e => set('stream_link', e.target.value)} placeholder="https://twitch.tv/..." /></div>
                  <div className="space-y-2"><Label>Cauza susținută *</Label><Textarea value={form.cause} onChange={e => set('cause', e.target.value)} rows={3} /></div>
                  <div className="space-y-2"><Label>Target donații (RON, opțional)</Label><Input type="number" value={form.target_amount} onChange={e => set('target_amount', e.target.value)} /></div>
                </>
              )}

              {(form.subcategory === 'concert') && (
                <div className="space-y-2">
                  <Label>Artiști *</Label>
                  <div className="flex gap-2">
                    <Input value={form.newPerformer} onChange={e => set('newPerformer', e.target.value)} placeholder="Nume artist" onKeyDown={e => { if (e.key === 'Enter') addTag('performers', 'newPerformer') }} />
                    <Button variant="outline" onClick={() => addTag('performers', 'newPerformer')}><Plus size={16} /></Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {form.performers.map((p, i) => <span key={i} className="flex items-center gap-1 rounded-full border border-border bg-muted/50 px-3 py-1 text-sm">{p}<button onClick={() => set('performers', form.performers.filter((_, j) => j !== i))}><X size={12} /></button></span>)}
                  </div>
                </div>
              )}

              {(form.subcategory === 'meet_greet' || form.subcategory === 'sport' || isLivestream) && (
                <div className="space-y-2">
                  <Label>Invitați {form.subcategory === 'meet_greet' ? '*' : '(opțional)'}</Label>
                  <div className="flex gap-2">
                    <Input value={form.newGuest} onChange={e => set('newGuest', e.target.value)} placeholder="Nume invitat" onKeyDown={e => { if (e.key === 'Enter') addTag('guests', 'newGuest') }} />
                    <Button variant="outline" onClick={() => addTag('guests', 'newGuest')}><Plus size={16} /></Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {form.guests.map((g, i) => <span key={i} className="flex items-center gap-1 rounded-full border border-border bg-muted/50 px-3 py-1 text-sm">{g}<button onClick={() => set('guests', form.guests.filter((_, j) => j !== i))}><X size={12} /></button></span>)}
                  </div>
                </div>
              )}

              {!isLivestream && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Preț bilet (RON, opțional)</Label><Input type="number" value={form.ticket_price} onChange={e => set('ticket_price', e.target.value)} /></div>
                  <div className="space-y-2"><Label>Link bilet (opțional)</Label><Input value={form.ticket_link} onChange={e => set('ticket_link', e.target.value)} placeholder="https://bilete.ro/..." /></div>
                </div>
              )}
            </div>
          )}

          {step === totalSteps && userId && (
            <ImageUploadClient userId={userId} bannerUrl={form.banner_url} galleryUrls={form.gallery_urls} onBannerChange={v => set('banner_url', v)} onGalleryChange={v => set('gallery_urls', v)} />
          )}

        </StepperUI>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add "app/(private)/creeaza/caritabil/page.tsx"
git commit -m "feat: add charity event creation stepper (2-4 steps, conditional)"
```

---

## Task 12: Verificare finală

- [ ] **Step 1: Verifică TypeScript (build)**

```bash
cd C:\Users\mc_mi\OneDrive\Desktop\civicom2
npx tsc --noEmit
```

Expected: 0 errors. Dacă apar erori de tipuri în stepper pages, le rezolvi inline.

- [ ] **Step 2: Verifică că rutele private sunt protejate**

Deschide în browser `http://localhost:3000/creeaza` fără să fii autentificat.
Expected: redirect la `/autentificare`.

- [ ] **Step 3: Test end-to-end — creează un protest**

1. Autentifică-te
2. Navighează la `/creeaza`
3. Selectează Protest
4. Parcurge toți cei 4 pași cu date valide
5. Submit
6. Expected: redirect la `/evenimente/protest/{id}`, toast de succes, evenimentul apare cu `status=pending`

- [ ] **Step 4: Verifică în Supabase că înregistrările sunt corecte**

```sql
SELECT e.id, e.title, e.status, e.category, e.subcategory, p.date, p.max_participants
FROM events e JOIN protests p ON p.event_id = e.id
ORDER BY e.created_at DESC LIMIT 5;
```

- [ ] **Step 5: Commit final**

```bash
git add .
git commit -m "feat: Etapa 6 complete — all 5 event creation steppers"
```
