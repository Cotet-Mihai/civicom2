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
