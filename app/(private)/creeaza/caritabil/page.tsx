'use client'

import Image from 'next/image'
import dynamic from 'next/dynamic'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { Plus, X, Info, MapPin, FileText, Camera } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { StepperUI, type Step } from '../_components/StepperUI'
import { ImageUploadClient } from '../_components/ImageUploadClient'
import { CalendarWithStartStopTime } from '../_components/CalendarWithStartStopTime'
import { createCharityEvent } from '@/services/charity.service'
import { createClient } from '@/lib/supabase/client'

const LocationPickerClient = dynamic(
    () => import('../_components/LocationPickerClient').then(m => m.LocationPickerClient),
    { ssr: false }
)

type Subcategory = 'concert' | 'meet_greet' | 'livestream' | 'sport'

type Form = {
    title: string
    description: string
    subcategory: Subcategory
    location: [number, number] | null
    date: Date | undefined
    time_start: string
    time_end: string
    performers: string[]
    guests: string[]
    ticket_price: string
    ticket_link: string
    stream_link: string
    cause: string
    target_amount: string
    banner_url: string | null
    gallery_urls: string[]
}

const INITIAL: Form = {
    title: '', description: '', subcategory: 'concert',
    location: null,
    date: undefined, time_start: '', time_end: '',
    performers: [], guests: [],
    ticket_price: '', ticket_link: '',
    stream_link: '', cause: '',
    target_amount: '',
    banner_url: null, gallery_urls: [],
}

const STEPS_WITH_MAP: Step[] = [
    { title: 'Info', description: '', icon: <Info className="size-4" /> },
    { title: 'Locație', description: '', icon: <MapPin className="size-4" /> },
    { title: 'Detalii', description: '', icon: <FileText className="size-4" /> },
    { title: 'Media', description: '', icon: <Camera className="size-4" /> },
]

const STEPS_LIVESTREAM: Step[] = [
    { title: 'Info', description: '', icon: <Info className="size-4" /> },
    { title: 'Detalii', description: '', icon: <FileText className="size-4" /> },
    { title: 'Media', description: '', icon: <Camera className="size-4" /> },
]

export default function CreateCharityPage() {
    const [step, setStep] = useState(1)
    const [form, setForm] = useState<Form>(INITIAL)
    const [submitting, setSubmitting] = useState(false)
    const [userId, setUserId] = useState<string | null>(null)
    const [newPerformer, setNewPerformer] = useState('')
    const [newGuest, setNewGuest] = useState('')
    const router = useRouter()
    const searchParams = useSearchParams()
    const orgId = searchParams.get('org')

    useEffect(() => {
        createClient().auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null))
    }, [])

    function set<K extends keyof Form>(key: K, val: Form[K]) {
        setForm(f => ({ ...f, [key]: val }))
    }

    const isLivestream = form.subcategory === 'livestream'
    const steps = isLivestream ? STEPS_LIVESTREAM : STEPS_WITH_MAP
    const totalSteps = steps.length
    const detailsStep = isLivestream ? 2 : 3

    function addPerformer() {
        if (!newPerformer.trim()) return
        set('performers', [...form.performers, newPerformer.trim()])
        setNewPerformer('')
    }

    function addGuest() {
        if (!newGuest.trim()) return
        set('guests', [...form.guests, newGuest.trim()])
        setNewGuest('')
    }

    function validateStep(): string | null {
        if (step === 1) {
            if (!form.title.trim()) return 'Titlul este obligatoriu'
            if (!form.description.trim()) return 'Descrierea este obligatorie'
        }
        if (step === 2 && !isLivestream && !form.location) return 'Selectează o locație pe hartă'
        if (step === detailsStep) {
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

    function handleNext() {
        const err = validateStep()
        if (err) { toast.error(err); return }
        setStep(s => s + 1)
    }

    async function handleSubmit() {
        const err = validateStep()
        if (err) { toast.error(err); return }
        setSubmitting(true)

        const dateStr = form.date
            ? `${form.date.getFullYear()}-${String(form.date.getMonth() + 1).padStart(2, '0')}-${String(form.date.getDate()).padStart(2, '0')}`
            : ''

        let subtypeData: any
        if (form.subcategory === 'concert') {
            subtypeData = { location: form.location!, date: dateStr, time_start: form.time_start, time_end: form.time_end || null, performers: form.performers, ticket_price: form.ticket_price ? Number(form.ticket_price) : null, ticket_link: form.ticket_link || null, max_participants: null }
        } else if (form.subcategory === 'meet_greet') {
            subtypeData = { location: form.location!, date: dateStr, time_start: form.time_start, time_end: form.time_end || null, guests: form.guests, ticket_price: form.ticket_price ? Number(form.ticket_price) : null, ticket_link: form.ticket_link || null, max_participants: null }
        } else if (form.subcategory === 'livestream') {
            subtypeData = { stream_link: form.stream_link, cause: form.cause, time_start: form.time_start, time_end: form.time_end || null, guests: form.guests.length ? form.guests : null }
        } else {
            subtypeData = { location: form.location!, date: dateStr, time_start: form.time_start, time_end: form.time_end || null, guests: form.guests.length ? form.guests : null, ticket_price: form.ticket_price ? Number(form.ticket_price) : null, ticket_link: form.ticket_link || null, max_participants: null }
        }

        const result = await createCharityEvent(
            { title: form.title, description: form.description, banner_url: form.banner_url, gallery_urls: form.gallery_urls, subcategory: form.subcategory, organization_id: orgId },
            { target_amount: form.target_amount ? Number(form.target_amount) : null },
            subtypeData
        )
        setSubmitting(false)
        if ('error' in result) { toast.error(result.error); return }
        toast.success('Eveniment caritabil creat! Urmează validarea de către admin.')
        router.push('/panou/evenimente')
    }

    const detailsStepDisabled = step === detailsStep && (
        !form.time_start ||
        (isLivestream && (!form.stream_link.trim() || !form.cause.trim())) ||
        (!isLivestream && !form.date) ||
        (form.subcategory === 'concert' && form.performers.length === 0) ||
        (form.subcategory === 'meet_greet' && form.guests.length === 0)
    )

    return (
        <div className="min-h-[calc(100vh-4rem)] lg:grid lg:grid-cols-[30%_70%]">
            <div className="hidden lg:block sticky top-16 h-[calc(100vh-4rem)] relative overflow-hidden">
                <Image src="/images/eveniment_caritabil.webp" alt="Caritabil" fill style={{ objectFit: 'cover', objectPosition: 'center' }} priority />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 p-10 text-white space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Creează</p>
                    <h2 className="text-4xl font-black leading-tight">CARITABIL</h2>
                    <p className="text-sm opacity-70">Concert · Meet&Greet · Sport · Live</p>
                </div>
            </div>

            <div className="px-4 py-8 lg:px-12 lg:py-12">
                <StepperUI
                    steps={steps} currentStep={step}
                    onBack={() => setStep(s => s - 1)} onNext={handleNext} onSubmit={handleSubmit}
                    isSubmitting={submitting}
                    nextDisabled={
                        (step === 1 && (!form.title.trim() || !form.description.trim())) ||
                        (step === 2 && !isLivestream && !form.location) ||
                        detailsStepDisabled ||
                        (step === totalSteps && !form.banner_url)
                    }
                >
                    {/* Step 1 — Info */}
                    {step === 1 && (
                        <div className="flex flex-col gap-5">
                            <div className="flex flex-col gap-2">
                                <Label>Ce tip de eveniment este? *</Label>
                                <ToggleGroup
                                    type="single"
                                    className="border flex-wrap justify-start"
                                    value={[form.subcategory]}
                                    onValueChange={v => { if (v.length) { set('subcategory', v[0] as Subcategory); setStep(1) } }}
                                >
                                    {([['concert', 'Concert'], ['meet_greet', 'Meet & Greet'], ['livestream', 'Livestream'], ['sport', 'Sport']] as const).map(([val, label]) => (
                                        <ToggleGroupItem
                                            key={val}
                                            value={val}
                                            className="aria-pressed:bg-secondary aria-pressed:text-secondary-foreground"
                                        >
                                            {label}
                                        </ToggleGroupItem>
                                    ))}
                                </ToggleGroup>
                            </div>
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="title">Titlu *</Label>
                                <Input
                                    id="title"
                                    value={form.title}
                                    onChange={e => set('title', e.target.value)}
                                    placeholder="ex: Concert caritabil pentru copii..."
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="desc">Descriere *</Label>
                                <Textarea
                                    id="desc"
                                    value={form.description}
                                    onChange={e => set('description', e.target.value)}
                                    rows={6}
                                    placeholder="Descrieți evenimentul și cauza susținută..."
                                />
                            </div>
                        </div>
                    )}

                    {/* Step 2 — Locație (non-livestream) */}
                    {step === 2 && !isLivestream && (
                        <LocationPickerClient location={form.location} onChange={v => set('location', v)} />
                    )}

                    {/* Step 2 — Detalii (Livestream only) */}
                    {step === 2 && isLivestream && (
                        <div className="flex flex-col gap-5">
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="stream">Link stream *</Label>
                                <Input
                                    id="stream"
                                    value={form.stream_link}
                                    onChange={e => set('stream_link', e.target.value)}
                                    placeholder="https://twitch.tv/..., https://youtube.com/..."
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="cause">Cauza susținută *</Label>
                                <Textarea
                                    id="cause"
                                    value={form.cause}
                                    onChange={e => set('cause', e.target.value)}
                                    rows={3}
                                    placeholder="Descrieți cauza pentru care se strâng fonduri..."
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="target">Target donații (RON, opțional)</Label>
                                <Input
                                    id="target"
                                    type="number"
                                    value={form.target_amount}
                                    onChange={e => set('target_amount', e.target.value)}
                                    className="w-48"
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <Label>Ora start *</Label>
                                <div className="flex gap-4 flex-wrap">
                                    <div className="flex flex-col gap-2">
                                        <Label htmlFor="ts" className="text-xs text-muted-foreground">De la</Label>
                                        <Input
                                            id="ts"
                                            type="time"
                                            value={form.time_start}
                                            onChange={e => set('time_start', e.target.value)}
                                            className="w-36 bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <Label htmlFor="te" className="text-xs text-muted-foreground">Până la</Label>
                                        <Input
                                            id="te"
                                            type="time"
                                            value={form.time_end}
                                            onChange={e => set('time_end', e.target.value)}
                                            className="w-36 bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Invitați livestream */}
                            <div className="flex flex-col gap-2">
                                <Label>Invitați (opțional)</Label>
                                <div className="flex gap-2">
                                    <Input
                                        value={newGuest}
                                        onChange={e => setNewGuest(e.target.value)}
                                        placeholder="Nume invitat"
                                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addGuest() } }}
                                    />
                                    <Button type="button" variant="outline" onClick={addGuest}>Adaugă</Button>
                                </div>
                                <div className="flex flex-wrap gap-2 mt-1">
                                    {form.guests.map((g, i) => (
                                        <div key={i} className="flex items-center gap-1 bg-muted px-2 py-1 rounded text-sm">
                                            <span>{g}</span>
                                            <button type="button" onClick={() => set('guests', form.guests.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-foreground">
                                                <X size={12} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 3 — Detalii (concert, meet_greet, sport) */}
                    {step === 3 && !isLivestream && (
                        <div className="flex flex-col gap-5">
                            <CalendarWithStartStopTime
                                date={{ value: form.date, set: v => set('date', v) }}
                                fromTime={{ value: form.time_start, set: v => set('time_start', v) }}
                                toTime={{ value: form.time_end, set: v => set('time_end', v) }}
                            />

                            <div className="flex flex-col gap-2">
                                <Label htmlFor="target">Target donații (RON, opțional)</Label>
                                <Input
                                    id="target"
                                    type="number"
                                    value={form.target_amount}
                                    onChange={e => set('target_amount', e.target.value)}
                                    className="w-48"
                                />
                            </div>

                            {/* Artiști — concert */}
                            {form.subcategory === 'concert' && (
                                <div className="flex flex-col gap-2">
                                    <Label>Artiști *</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            value={newPerformer}
                                            onChange={e => setNewPerformer(e.target.value)}
                                            placeholder="Nume artist"
                                            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addPerformer() } }}
                                        />
                                        <Button type="button" variant="outline" onClick={addPerformer}>Adaugă</Button>
                                    </div>
                                    <div className="flex flex-wrap gap-2 mt-1">
                                        {form.performers.map((p, i) => (
                                            <div key={i} className="flex items-center gap-1 bg-muted px-2 py-1 rounded text-sm">
                                                <span>{p}</span>
                                                <button type="button" onClick={() => set('performers', form.performers.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-foreground">
                                                    <X size={12} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Invitați — meet_greet / sport */}
                            {(form.subcategory === 'meet_greet' || form.subcategory === 'sport') && (
                                <div className="flex flex-col gap-2">
                                    <Label>Invitați {form.subcategory === 'meet_greet' ? '*' : '(opțional)'}</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            value={newGuest}
                                            onChange={e => setNewGuest(e.target.value)}
                                            placeholder="Nume invitat"
                                            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addGuest() } }}
                                        />
                                        <Button type="button" variant="outline" onClick={addGuest}>Adaugă</Button>
                                    </div>
                                    <div className="flex flex-wrap gap-2 mt-1">
                                        {form.guests.map((g, i) => (
                                            <div key={i} className="flex items-center gap-1 bg-muted px-2 py-1 rounded text-sm">
                                                <span>{g}</span>
                                                <button type="button" onClick={() => set('guests', form.guests.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-foreground">
                                                    <X size={12} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="flex flex-col gap-4 sm:flex-row sm:gap-6">
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="tp">Preț bilet (RON, opțional)</Label>
                                    <Input
                                        id="tp"
                                        type="number"
                                        value={form.ticket_price}
                                        onChange={e => set('ticket_price', e.target.value)}
                                        className="w-36"
                                    />
                                </div>
                                <div className="flex flex-col gap-2 flex-1">
                                    <Label htmlFor="tl">Link bilet (opțional)</Label>
                                    <Input
                                        id="tl"
                                        value={form.ticket_link}
                                        onChange={e => set('ticket_link', e.target.value)}
                                        placeholder="https://bilete.ro/..."
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Media — ultimul pas */}
                    {step === totalSteps && (
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
