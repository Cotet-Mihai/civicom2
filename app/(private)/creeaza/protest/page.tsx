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
                <RadioGroup value={form.subcategory} onValueChange={(v: string) => set('subcategory', v as Form['subcategory'])} className="flex gap-4">
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
