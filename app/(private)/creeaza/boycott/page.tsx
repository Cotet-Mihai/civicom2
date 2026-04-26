'use client'

import { useState, useEffect } from 'react'
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

  useEffect(() => { createClient().auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null)) }, [])

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

          {step === 3 && (
            userId
              ? <ImageUploadClient userId={userId} bannerUrl={form.banner_url} galleryUrls={form.gallery_urls} onBannerChange={v => set('banner_url', v)} onGalleryChange={v => set('gallery_urls', v)} />
              : <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">Se încarcă...</div>
          )}

        </StepperUI>
      </div>
    </div>
  )
}
