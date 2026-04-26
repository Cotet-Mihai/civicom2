'use client'

import dynamic from 'next/dynamic'
import { useState, useEffect } from 'react'
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

  useEffect(() => { createClient().auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null)) }, [])

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
                <RadioGroup value={form.subcategory} onValueChange={(v: string) => { set('subcategory', v as Subcategory); setStep(1) }} className="grid grid-cols-2 gap-2">
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

          {step === totalSteps && (
            userId
              ? <ImageUploadClient userId={userId} bannerUrl={form.banner_url} galleryUrls={form.gallery_urls} onBannerChange={v => set('banner_url', v)} onGalleryChange={v => set('gallery_urls', v)} />
              : <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">Se încarcă...</div>
          )}

        </StepperUI>
      </div>
    </div>
  )
}
