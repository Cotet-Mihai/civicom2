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
import { createCommunityActivity } from '@/services/community.service'
import { createClient } from '@/lib/supabase/client'

const LocationPickerClient = dynamic(() => import('../_components/LocationPickerClient').then(m => m.LocationPickerClient), { ssr: false })

type Subcategory = 'outdoor' | 'donations' | 'workshop'
type DonationType = 'material' | 'monetary'

type Form = {
  title: string; description: string; subcategory: Subcategory; contact_person: string
  location: [number, number] | null
  date: string; time_start: string; time_end: string
  max_participants: string; recommended_equipment: string; what_organizer_offers: string
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

  useEffect(() => { createClient().auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null)) }, [])

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
                <RadioGroup value={form.subcategory} onValueChange={(v: string) => { set('subcategory', v as Subcategory); setStep(1) }} className="flex gap-4">
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
                <RadioGroup value={form.donation_type} onValueChange={(v: string) => set('donation_type', v as DonationType)} className="flex gap-4">
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
