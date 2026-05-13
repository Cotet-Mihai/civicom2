'use client'

import Image from 'next/image'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Info, FileText, Camera } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { StepperUI, type Step } from '../_components/StepperUI'
import { ImageUploadClient } from '../_components/ImageUploadClient'
import { createPetition } from '@/services/petition.service'
import { createClient } from '@/lib/supabase/client'

const STEPS: Step[] = [
    { title: 'Info', description: '', icon: <Info className="size-4" /> },
    { title: 'Detalii', description: '', icon: <FileText className="size-4" /> },
    { title: 'Media', description: '', icon: <Camera className="size-4" /> },
]

type Form = {
    title: string
    description: string
    what_is_requested: string
    requested_from: string
    why_important: string
    target_signatures: string
    contact_person: string
    banner_url: string | null
    gallery_urls: string[]
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

    useEffect(() => {
        createClient().auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null))
    }, [])

    function set<K extends keyof Form>(key: K, val: Form[K]) {
        setForm(f => ({ ...f, [key]: val }))
    }

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

    function handleNext() {
        const err = validateStep()
        if (err) { toast.error(err); return }
        setStep(s => s + 1)
    }

    async function handleSubmit() {
        const err = validateStep()
        if (err) { toast.error(err); return }
        setSubmitting(true)
        const result = await createPetition(
            { title: form.title, description: form.description, banner_url: form.banner_url, gallery_urls: form.gallery_urls, organization_id: null },
            { what_is_requested: form.what_is_requested, requested_from: form.requested_from, why_important: form.why_important, target_signatures: Number(form.target_signatures), contact_person: form.contact_person || null }
        )
        setSubmitting(false)
        if ('error' in result) { toast.error(result.error); return }
        toast.success('Petiție creată! Urmează validarea de către admin.')
        router.push('/panou/evenimente')
    }

    return (
        <div className="min-h-[calc(100vh-4rem)] lg:grid lg:grid-cols-[30%_70%]">
            <div className="hidden lg:block sticky top-16 h-[calc(100vh-4rem)] overflow-hidden">
                <Image src="/images/petitie.webp" alt="Petiție" fill style={{ objectFit: 'cover', objectPosition: 'center' }} priority />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 p-10 text-white space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Creează</p>
                    <h2 className="text-4xl font-black leading-tight">PETIȚIE</h2>
                    <p className="text-sm opacity-70">Strânge semnături</p>
                </div>
            </div>

            <div className="px-4 py-8 lg:px-12 lg:py-12">
                <StepperUI
                    steps={STEPS} currentStep={step}
                    onBack={() => setStep(s => s - 1)} onNext={handleNext} onSubmit={handleSubmit}
                    isSubmitting={submitting}
                    nextDisabled={
                        (step === 1 && (!form.title.trim() || !form.description.trim())) ||
                        (step === 2 && (!form.what_is_requested.trim() || !form.requested_from.trim() || !form.why_important.trim() || !form.target_signatures || Number(form.target_signatures) < 10)) ||
                        (step === 3 && !form.banner_url)
                    }
                >
                    {/* Step 1 — Info */}
                    {step === 1 && (
                        <div className="flex flex-col gap-5">
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="title">Titlu *</Label>
                                <Input
                                    id="title"
                                    value={form.title}
                                    onChange={e => set('title', e.target.value)}
                                    placeholder="ex: Petiție pentru Spații Verzi"
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="desc">Descriere *</Label>
                                <Textarea
                                    id="desc"
                                    value={form.description}
                                    onChange={e => set('description', e.target.value)}
                                    rows={6}
                                    placeholder="Descrieți scopul petiției și contextul..."
                                />
                            </div>
                        </div>
                    )}

                    {/* Step 2 — Detalii */}
                    {step === 2 && (
                        <div className="flex flex-col gap-5">
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="wir">Ce se solicită *</Label>
                                <Textarea
                                    id="wir"
                                    value={form.what_is_requested}
                                    onChange={e => set('what_is_requested', e.target.value)}
                                    rows={3}
                                    placeholder="Descrieți concret ce anume se cere..."
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="rf">Cui i se adresează *</Label>
                                <Input
                                    id="rf"
                                    value={form.requested_from}
                                    onChange={e => set('requested_from', e.target.value)}
                                    placeholder="ex: Ministerul Educației, Primăria..."
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="why">De ce este importantă *</Label>
                                <Textarea
                                    id="why"
                                    value={form.why_important}
                                    onChange={e => set('why_important', e.target.value)}
                                    rows={3}
                                    placeholder="Explicați impactul și urgența acestei petiții..."
                                />
                            </div>
                            <div className="flex flex-col gap-4 sm:flex-row sm:gap-6 sm:items-end">
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="target">Target semnături *</Label>
                                    <Input
                                        id="target"
                                        type="number"
                                        min="10"
                                        value={form.target_signatures}
                                        onChange={e => set('target_signatures', e.target.value)}
                                        className="w-40"
                                    />
                                </div>
                                <div className="flex flex-col gap-2 flex-1">
                                    <Label htmlFor="contact">Contact (opțional)</Label>
                                    <Input
                                        id="contact"
                                        value={form.contact_person}
                                        onChange={e => set('contact_person', e.target.value)}
                                        placeholder="email sau număr de telefon"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 3 — Media */}
                    {step === 3 && (
                        userId
                            ? <ImageUploadClient
                                userId={userId}
                                bannerUrl={form.banner_url}
                                galleryUrls={form.gallery_urls}
                                onBannerChange={v => set('banner_url', v)}
                                onGalleryChange={v => set('gallery_urls', v)}
                            />
                            : <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">Se încarcă...</div>
                    )}
                </StepperUI>
            </div>
        </div>
    )
}
