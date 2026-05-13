'use client'

import Image from 'next/image'
import dynamic from 'next/dynamic'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Plus, X, Info, MapPin, FileText, Camera, Heart } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { StepperUI, type Step } from '../_components/StepperUI'
import { ImageUploadClient } from '../_components/ImageUploadClient'
import { CalendarWithStartStopTime } from '../_components/CalendarWithStartStopTime'
import { createCommunityActivity } from '@/services/community.service'
import { createClient } from '@/lib/supabase/client'

const LocationPickerClient = dynamic(
    () => import('../_components/LocationPickerClient').then(m => m.LocationPickerClient),
    { ssr: false }
)

type Subcategory = 'outdoor' | 'donations' | 'workshop'
type DonationType = 'material' | 'monetary'

type Form = {
    title: string
    description: string
    subcategory: Subcategory
    contact_person: string
    location: [number, number] | null
    date: Date | undefined
    time_start: string
    time_end: string
    max_participants: string
    equipment: string[]
    what_organizer_offers: string
    donation_type: DonationType
    what_is_needed: string[]
    target_amount: string
    banner_url: string | null
    gallery_urls: string[]
}

const INITIAL: Form = {
    title: '', description: '', subcategory: 'outdoor', contact_person: '',
    location: null,
    date: undefined, time_start: '', time_end: '',
    max_participants: '', equipment: [], what_organizer_offers: '',
    donation_type: 'material', what_is_needed: [], target_amount: '',
    banner_url: null, gallery_urls: [],
}

const STEPS_WITH_MAP: Step[] = [
    { title: 'Info', description: '', icon: <Info className="size-4" /> },
    { title: 'Locație', description: '', icon: <MapPin className="size-4" /> },
    { title: 'Detalii', description: '', icon: <FileText className="size-4" /> },
    { title: 'Media', description: '', icon: <Camera className="size-4" /> },
]

const STEPS_DONATIONS: Step[] = [
    { title: 'Info', description: '', icon: <Info className="size-4" /> },
    { title: 'Donații', description: '', icon: <Heart className="size-4" /> },
    { title: 'Media', description: '', icon: <Camera className="size-4" /> },
]

export default function CreateCommunityPage() {
    const [step, setStep] = useState(1)
    const [form, setForm] = useState<Form>(INITIAL)
    const [submitting, setSubmitting] = useState(false)
    const [userId, setUserId] = useState<string | null>(null)
    const [equipmentInput, setEquipmentInput] = useState('')
    const [donationItemInput, setDonationItemInput] = useState('')
    const router = useRouter()

    useEffect(() => {
        createClient().auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null))
    }, [])

    function set<K extends keyof Form>(key: K, val: Form[K]) {
        setForm(f => ({ ...f, [key]: val }))
    }

    const isDonations = form.subcategory === 'donations'
    const steps = isDonations ? STEPS_DONATIONS : STEPS_WITH_MAP
    const totalSteps = steps.length

    function addEquipment() {
        if (!equipmentInput.trim()) return
        set('equipment', [...form.equipment, equipmentInput.trim()])
        setEquipmentInput('')
    }

    function addDonationItem() {
        if (!donationItemInput.trim()) return
        set('what_is_needed', [...form.what_is_needed, donationItemInput.trim()])
        setDonationItemInput('')
    }

    function validateStep(): string | null {
        if (step === 1) {
            if (!form.title.trim()) return 'Titlul este obligatoriu'
            if (!form.description.trim()) return 'Descrierea este obligatorie'
        }
        if (step === 2 && !isDonations && !form.location) return 'Selectează o locație pe hartă'
        if (step === 2 && isDonations) {
            if (form.donation_type === 'material' && form.what_is_needed.length === 0) return 'Adaugă cel puțin un item necesar'
            if (form.donation_type === 'monetary' && (!form.target_amount || Number(form.target_amount) < 1)) return 'Introdu suma target'
        }
        if (step === 3 && !isDonations) {
            if (!form.date) return 'Data este obligatorie'
            if (!form.time_start) return 'Ora de început este obligatorie'
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
        const equipmentStr = form.equipment.length ? form.equipment.join(', ') : null

        let subtypeData: any
        if (form.subcategory === 'outdoor') {
            subtypeData = { location: form.location!, date: dateStr, time_start: form.time_start, time_end: form.time_end || null, max_participants: form.max_participants ? Number(form.max_participants) : null, recommended_equipment: equipmentStr, what_organizer_offers: form.what_organizer_offers || null }
        } else if (form.subcategory === 'donations') {
            subtypeData = { donation_type: form.donation_type, what_is_needed: form.donation_type === 'material' ? form.what_is_needed : null, target_amount: form.donation_type === 'monetary' ? Number(form.target_amount) : null }
        } else {
            subtypeData = { location: form.location!, date: dateStr, time_start: form.time_start, time_end: form.time_end || null, max_participants: form.max_participants ? Number(form.max_participants) : null, recommended_equipment: equipmentStr, what_organizer_offers: form.what_organizer_offers || null }
        }

        const result = await createCommunityActivity(
            { title: form.title, description: form.description, banner_url: form.banner_url, gallery_urls: form.gallery_urls, subcategory: form.subcategory, organization_id: null },
            { contact_person: form.contact_person || null },
            subtypeData
        )
        setSubmitting(false)
        if ('error' in result) { toast.error(result.error); return }
        toast.success('Activitate creată! Urmează validarea de către admin.')
        router.push('/panou/evenimente')
    }

    const isNextDisabled =
        (step === 1 && (!form.title.trim() || !form.description.trim())) ||
        (step === 2 && !isDonations && !form.location) ||
        (step === 2 && isDonations && (
            (form.donation_type === 'material' && form.what_is_needed.length === 0) ||
            (form.donation_type === 'monetary' && (!form.target_amount || Number(form.target_amount) < 1))
        )) ||
        (step === 3 && !isDonations && (!form.date || !form.time_start)) ||
        (step === totalSteps && !form.banner_url)

    return (
        <div className="min-h-[calc(100vh-4rem)] lg:grid lg:grid-cols-[30%_70%]">
            <div className="hidden lg:block sticky top-16 h-[calc(100vh-4rem)] relative overflow-hidden">
                <Image src="/images/activitate_comunitara.webp" alt="Comunitar" fill style={{ objectFit: 'cover', objectPosition: 'center' }} priority />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 p-10 text-white space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Creează</p>
                    <h2 className="text-4xl font-black leading-tight">COMUNITAR</h2>
                    <p className="text-sm opacity-70">Aer liber · Workshop · Donații</p>
                </div>
            </div>

            <div className="px-4 py-8 lg:px-12 lg:py-12">
                <StepperUI
                    steps={steps} currentStep={step}
                    onBack={() => setStep(s => s - 1)} onNext={handleNext} onSubmit={handleSubmit}
                    isSubmitting={submitting}
                    nextDisabled={isNextDisabled}
                >
                    {/* Step 1 — Info */}
                    {step === 1 && (
                        <div className="flex flex-col gap-5">
                            <div className="flex flex-col gap-2">
                                <Label>Ce tip de activitate este? *</Label>
                                <ToggleGroup
                                    type="single"
                                    className="border justify-start"
                                    value={[form.subcategory]}
                                    onValueChange={v => { if (v.length) { set('subcategory', v[0] as Subcategory); setStep(1) } }}
                                >
                                    {([['outdoor', 'Aer liber'], ['workshop', 'Workshop'], ['donations', 'Donații']] as const).map(([val, label]) => (
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
                                    placeholder="ex: Curățenie în parc, Atelier de pictură..."
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="desc">Descriere *</Label>
                                <Textarea
                                    id="desc"
                                    value={form.description}
                                    onChange={e => set('description', e.target.value)}
                                    rows={6}
                                    placeholder="Descrieți activitatea și ce implică participarea..."
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="contact">Persoană contact (opțional)</Label>
                                <Input
                                    id="contact"
                                    value={form.contact_person}
                                    onChange={e => set('contact_person', e.target.value)}
                                    placeholder="email sau număr de telefon"
                                />
                            </div>
                        </div>
                    )}

                    {/* Step 2 — Locație (outdoor / workshop) */}
                    {step === 2 && !isDonations && (
                        <LocationPickerClient location={form.location} onChange={v => set('location', v)} />
                    )}

                    {/* Step 2 — Donații */}
                    {step === 2 && isDonations && (
                        <div className="flex flex-col gap-5">
                            <div className="flex flex-col gap-2">
                                <Label>Tip donație *</Label>
                                <ToggleGroup
                                    type="single"
                                    className="border justify-start"
                                    value={[form.donation_type]}
                                    onValueChange={v => { if (v.length) set('donation_type', v[0] as DonationType) }}
                                >
                                    <ToggleGroupItem value="material" className="aria-pressed:bg-secondary aria-pressed:text-secondary-foreground">
                                        Materiale
                                    </ToggleGroupItem>
                                    <ToggleGroupItem value="monetary" className="aria-pressed:bg-secondary aria-pressed:text-secondary-foreground">
                                        Monetar
                                    </ToggleGroupItem>
                                </ToggleGroup>
                            </div>

                            {form.donation_type === 'material' && (
                                <div className="flex flex-col gap-2">
                                    <Label>Ce este necesar *</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            value={donationItemInput}
                                            onChange={e => setDonationItemInput(e.target.value)}
                                            placeholder="ex: conserve, haine, jucării..."
                                            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addDonationItem() } }}
                                        />
                                        <Button type="button" variant="outline" onClick={addDonationItem}>Adaugă</Button>
                                    </div>
                                    <div className="flex flex-wrap gap-2 mt-1">
                                        {form.what_is_needed.map((item, i) => (
                                            <div key={i} className="flex items-center gap-1 bg-muted px-2 py-1 rounded text-sm">
                                                <span>{item}</span>
                                                <button type="button" onClick={() => set('what_is_needed', form.what_is_needed.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-foreground">
                                                    <X size={12} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {form.donation_type === 'monetary' && (
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="ta">Suma target (RON) *</Label>
                                    <Input
                                        id="ta"
                                        type="number"
                                        min="1"
                                        value={form.target_amount}
                                        onChange={e => set('target_amount', e.target.value)}
                                        className="w-48"
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 3 — Detalii (outdoor/workshop) */}
                    {step === 3 && !isDonations && (
                        <div className="flex flex-col gap-5">
                            <CalendarWithStartStopTime
                                date={{ value: form.date, set: v => set('date', v) }}
                                fromTime={{ value: form.time_start, set: v => set('time_start', v) }}
                                toTime={{ value: form.time_end, set: v => set('time_end', v) }}
                            />

                            <div className="flex flex-col gap-2">
                                <Label htmlFor="max">Număr maxim de participanți (opțional)</Label>
                                <Input
                                    id="max"
                                    type="number"
                                    min="1"
                                    value={form.max_participants}
                                    onChange={e => set('max_participants', e.target.value)}
                                    className="w-40"
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <Label>Echipament recomandat (opțional)</Label>
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="ex: mănuși, saci gunoi, apă..."
                                        value={equipmentInput}
                                        onChange={e => setEquipmentInput(e.target.value)}
                                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addEquipment() } }}
                                    />
                                    <Button type="button" variant="outline" onClick={addEquipment}>Adaugă</Button>
                                </div>
                                <div className="flex flex-wrap gap-2 mt-1">
                                    {form.equipment.map((eq, i) => (
                                        <div key={i} className="flex items-center gap-1 bg-muted px-2 py-1 rounded text-sm">
                                            <span>{eq}</span>
                                            <button type="button" onClick={() => set('equipment', form.equipment.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-foreground">
                                                <X size={12} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <Label htmlFor="offers">Ce oferă organizatorul (opțional)</Label>
                                <Textarea
                                    id="offers"
                                    value={form.what_organizer_offers}
                                    onChange={e => set('what_organizer_offers', e.target.value)}
                                    rows={3}
                                    placeholder="ex: materiale necesare, gustări, transport..."
                                />
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
