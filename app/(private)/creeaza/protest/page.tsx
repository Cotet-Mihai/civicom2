'use client'

import Image from 'next/image'
import dynamic from 'next/dynamic'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { User, Mail, PlusCircle, Save, Edit2, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Info, MapPin, ListTodo, Camera } from 'lucide-react'
import { StepperUI, type Step } from '../_components/StepperUI'
import { CalendarWithStartStopTime } from '../_components/CalendarWithStartStopTime'
import { ImageUploadClient } from '../_components/ImageUploadClient'
import { createProtest } from '@/services/protest.service'
import { createClient } from '@/lib/supabase/client'

const LocationPickerClient = dynamic(() => import('../_components/LocationPickerClient').then(m => m.LocationPickerClient), { ssr: false })
const RoutePickerClient = dynamic(() => import('../_components/RoutePickerClient').then(m => m.RoutePickerClient), { ssr: false })

const STEPS: Step[] = [
    { title: 'Info', description: 'Completați informațiile de bază pentru a continua.', icon: <Info className="size-4" /> },
    { title: 'Locație', description: 'Adăugați punctul de întâlnire pe hartă pentru a continua.', icon: <MapPin className="size-4" /> },
    { title: 'Logistică', description: 'Completați detaliile logistice ale evenimentului.', icon: <ListTodo className="size-4" /> },
    { title: 'Media', description: 'Adaugă imaginea pentru banner și opțional galerie media.', icon: <Camera className="size-4" /> },
]

type Contact = { firstName: string; lastName: string; mail: string }

type Form = {
    title: string; description: string; subcategory: 'gathering' | 'march' | 'picket'
    date: Date | undefined; time_start: string; time_end: string
    location: [number, number] | null; locations: [number, number][]
    isLimited: boolean; max_participants: string
    equipment: string[]; safety_rules: string; contacts: Contact[]
    banner_url: string | null; gallery_urls: string[]
}

const INITIAL: Form = {
    title: '', description: '', subcategory: 'gathering',
    date: undefined, time_start: '', time_end: '',
    location: null, locations: [],
    isLimited: false, max_participants: '',
    equipment: [], safety_rules: '', contacts: [],
    banner_url: null, gallery_urls: [],
}

export default function CreateProtestPage() {
    const [step, setStep] = useState(1)
    const [form, setForm] = useState<Form>(INITIAL)
    const [submitting, setSubmitting] = useState(false)
    const [userId, setUserId] = useState<string | null>(null)
    const router = useRouter()
    const searchParams = useSearchParams()
    const orgId = searchParams.get('org')

    // Contact dialog state
    const [contactOpen, setContactOpen] = useState(false)
    const [editingContact, setEditingContact] = useState<Contact | null>(null)
    const [firstName, setFirstName] = useState('')
    const [lastName, setLastName] = useState('')
    const [mail, setMail] = useState('')

    // Equipment tag input
    const [equipmentInput, setEquipmentInput] = useState('')

    useEffect(() => {
        createClient().auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null))
    }, [])

    function set<K extends keyof Form>(key: K, val: Form[K]) {
        setForm(f => ({ ...f, [key]: val }))
    }

    function addEquipment() {
        if (!equipmentInput.trim()) return
        set('equipment', [...form.equipment, equipmentInput.trim()])
        setEquipmentInput('')
    }

    function removeEquipment(i: number) {
        set('equipment', form.equipment.filter((_, idx) => idx !== i))
    }

    function openAddContact() {
        setEditingContact(null)
        setFirstName(''); setLastName(''); setMail('')
        setContactOpen(true)
    }

    function openEditContact(c: Contact) {
        setEditingContact(c)
        setFirstName(c.firstName); setLastName(c.lastName); setMail(c.mail)
        setContactOpen(true)
    }

    function handleSaveContact() {
        const updated: Contact = { firstName, lastName, mail }
        if (editingContact) {
            set('contacts', form.contacts.map(c => c === editingContact ? updated : c))
        } else {
            set('contacts', [...form.contacts, updated])
        }
        setContactOpen(false)
        setFirstName(''); setLastName(''); setMail('')
        setEditingContact(null)
    }

    function handleDeleteContact() {
        if (!editingContact) return
        set('contacts', form.contacts.filter(c => c !== editingContact))
        setContactOpen(false)
        setEditingContact(null)
    }

    const isContactValid = firstName.trim() && lastName.trim() && mail.includes('@') && mail.includes('.')

    function validateStep(): string | null {
        if (step === 1) {
            if (!form.title.trim()) return 'Titlul este obligatoriu'
            if (!form.description.trim()) return 'Descrierea este obligatorie'
            if (!form.date) return 'Data este obligatorie'
            if (!form.time_start) return 'Ora de start este obligatorie'
        }
        if (step === 2) {
            if (form.subcategory === 'march' && form.locations.length < 2) return 'Adaugă minim 2 puncte de traseu'
            if (form.subcategory !== 'march' && !form.location) return 'Selectează o locație pe hartă'
        }
        if (step === 3) {
            if (form.isLimited && (!form.max_participants || Number(form.max_participants) < 1)) return 'Specifică numărul maxim de participanți'
        }
        if (step === 4 && !form.banner_url) return 'Bannerul este obligatoriu'
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
        const contactStr = form.contacts.length
            ? form.contacts.map(c => `${c.firstName} ${c.lastName} <${c.mail}>`).join(', ')
            : null
        const equipmentStr = form.equipment.length ? form.equipment.join(', ') : null
        const maxPart = form.isLimited ? Number(form.max_participants) : 0

        const subtypeData = form.subcategory === 'march'
            ? { locations: form.locations }
            : { location: form.location! }

        const result = await createProtest(
            { title: form.title, description: form.description, banner_url: form.banner_url, gallery_urls: form.gallery_urls, subcategory: form.subcategory, organization_id: orgId },
            { date: dateStr, time_start: form.time_start, time_end: form.time_end || null, max_participants: maxPart, recommended_equipment: equipmentStr, safety_rules: form.safety_rules || null, contact_person: contactStr },
            subtypeData
        )

        setSubmitting(false)
        if ('error' in result) { toast.error(result.error); return }
        toast.success('Eveniment creat! Urmează validarea de către admin.')
        router.push('/panou/evenimente')
    }

    return (
        <div className="min-h-[calc(100vh-4rem)] lg:grid lg:grid-cols-[30%_70%]">
            <div className="hidden lg:block sticky top-16 h-[calc(100vh-4rem)] overflow-hidden">
                <Image
                    src="/images/protest.webp"
                    alt="Protest"
                    fill
                    style={
                    {
                        objectFit: 'cover',
                        objectPosition: 'center'
                    }}
                    priority />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 p-10 text-white space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Creează</p>
                    <h2 className="text-4xl font-black leading-tight">PROTEST</h2>
                    <p className="text-sm opacity-70">Adunare, marș sau pichet</p>
                </div>
            </div>

            <div className="px-4 py-8 lg:px-12 lg:py-12">
                <StepperUI
                    steps={STEPS} currentStep={step}
                    onBack={() => setStep(s => s - 1)} onNext={handleNext} onSubmit={handleSubmit}
                    isSubmitting={submitting}
                    nextDisabled={
                        (step === 1 && (!form.title.trim() || !form.description.trim() || !form.date || !form.time_start)) ||
                        (step === 2 && (form.subcategory === 'march' ? form.locations.length < 2 : !form.location)) ||
                        (step === 3 && form.isLimited && (!form.max_participants || Number(form.max_participants) < 1)) ||
                        (step === 4 && !form.banner_url)
                    }
                >

                    {/* Step 1 — Info */}
                    {step === 1 && (
                        <div className="flex flex-col gap-5">
                            <div className="flex flex-col gap-2">
                                <Label>Ce tip de protest este?</Label>
                                <ToggleGroup
                                    type="single"
                                    className="border justify-start"
                                    value={[form.subcategory]}
                                    onValueChange={v => { if (v.length) set('subcategory', v[0] as Form['subcategory']) }}
                                >
                                    {([['gathering', 'Adunare'], ['march', 'Marș'], ['picket', 'Pichet']] as const).map(([val, label]) => (
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
                                <Input id="title" value={form.title} onChange={e => set('title', e.target.value)} placeholder="ex: Protest pentru Justiție" />
                            </div>

                            <div className="flex flex-col gap-2">
                                <Label htmlFor="desc">Descriere *</Label>
                                <Textarea id="desc" value={form.description} onChange={e => set('description', e.target.value)} rows={6} placeholder="Descrieți scopul protestului..." />
                            </div>

                            <CalendarWithStartStopTime
                                date={{ value: form.date, set: v => set('date', v) }}
                                fromTime={{ value: form.time_start, set: v => set('time_start', v) }}
                                toTime={{ value: form.time_end, set: v => set('time_end', v) }}
                            />
                        </div>
                    )}

                    {/* Step 2 — Locație */}
                    {step === 2 && (
                        form.subcategory === 'march'
                            ? <RoutePickerClient locations={form.locations} onChange={v => set('locations', v)} />
                            : <LocationPickerClient location={form.location} onChange={v => set('location', v)} />
                    )}

                    {/* Step 3 — Logistică */}
                    {step === 3 && (
                        <div className="flex flex-col gap-8">

                            {/* Participanți */}
                            <div className="flex flex-col gap-2">
                                <Label>Număr de participanți dorit</Label>
                                <div className="flex gap-3 items-center flex-wrap">
                                    <ToggleGroup
                                        type="single"
                                        className="border"
                                        value={[form.isLimited ? 'yes' : 'no']}
                                        onValueChange={v => { if (v.length) set('isLimited', v[0] === 'yes') }}
                                    >
                                        <ToggleGroupItem value="yes" className="aria-pressed:bg-secondary aria-pressed:text-secondary-foreground">Limitat</ToggleGroupItem>
                                        <ToggleGroupItem value="no" className="aria-pressed:bg-secondary aria-pressed:text-secondary-foreground">Nelimitat</ToggleGroupItem>
                                    </ToggleGroup>
                                    {form.isLimited && (
                                        <Input
                                            type="number"
                                            placeholder="Ex: 3000"
                                            value={form.max_participants}
                                            onChange={e => set('max_participants', e.target.value)}
                                            className="w-40"
                                        />
                                    )}
                                </div>
                            </div>

                            {/* Echipament recomandat */}
                            <div className="flex flex-col gap-2">
                                <Label>Echipament recomandat</Label>
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Ex: pancarte, fluiere..."
                                        value={equipmentInput}
                                        onChange={e => setEquipmentInput(e.target.value)}
                                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addEquipment() } }}
                                    />
                                    <Button type="button" onClick={addEquipment}>Adaugă</Button>
                                </div>
                                <div className="flex flex-wrap gap-2 mt-1">
                                    {form.equipment.map((eq, i) => (
                                        <div key={i} className="flex items-center gap-1 bg-muted px-2 py-1 rounded text-sm">
                                            <span>{eq}</span>
                                            <button type="button" onClick={() => removeEquipment(i)} className="text-muted-foreground hover:text-foreground">
                                                <X size={12} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Reguli de siguranță */}
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="safety">Reguli de siguranță și comportament</Label>
                                <Textarea
                                    id="safety"
                                    rows={4}
                                    placeholder="Ex: Respectați indicațiile organizatorilor, nu aduceți obiecte periculoase..."
                                    value={form.safety_rules}
                                    onChange={e => set('safety_rules', e.target.value)}
                                />
                            </div>

                            {/* Persoane de contact */}
                            <div className="flex flex-col gap-2">
                                <Label>Persoane de contact</Label>
                                <div className="flex flex-wrap gap-2">
                                    {form.contacts.map((c, i) => (
                                        <div key={i} className="flex items-center gap-2 border px-3 py-1.5 rounded-lg text-sm">
                                            <span>{c.firstName} {c.lastName} — {c.mail}</span>
                                            <button type="button" onClick={() => openEditContact(c)}>
                                                <Edit2 size={14} className="text-muted-foreground hover:text-foreground" />
                                            </button>
                                        </div>
                                    ))}
                                    <Button type="button" variant="outline" onClick={openAddContact}>
                                        <PlusCircle size={14} className="mr-1.5" /> Adaugă contact
                                    </Button>
                                </div>
                            </div>

                        </div>
                    )}

                    {/* Step 4 — Media */}
                    {step === 4 && (
                        userId
                            ? <ImageUploadClient userId={userId} bannerUrl={form.banner_url} galleryUrls={form.gallery_urls} onBannerChange={v => set('banner_url', v)} onGalleryChange={v => set('gallery_urls', v)} />
                            : <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">Se încarcă...</div>
                    )}

                </StepperUI>
            </div>

            {/* Contact Dialog */}
            <Dialog open={contactOpen} onOpenChange={setContactOpen}>
                <DialogContent className="sm:max-w-xl p-0 overflow-hidden rounded-xl shadow-lg border-none">
                    <DialogHeader className="p-6 pb-2">
                        <div className="flex items-center gap-3 mb-1">
                            <div className="p-2.5 bg-primary/10 rounded-full text-primary">
                                <PlusCircle className="w-6 h-6" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-bold tracking-tight">
                                    {editingContact ? 'Editează contact' : 'Adaugă contact nou'}
                                </DialogTitle>
                                <p className="text-sm text-muted-foreground mt-0.5">
                                    Completează detaliile de mai jos pentru a salva persoana.
                                </p>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="px-6 py-5 grid gap-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="firstName" className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80 ml-1">Prenume</Label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input id="firstName" placeholder="ex: Ion" className="pl-9 h-10" value={firstName} onChange={e => setFirstName(e.target.value)} />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="lastName" className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80 ml-1">Nume</Label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input id="lastName" placeholder="ex: Popescu" className="pl-9 h-10" value={lastName} onChange={e => setLastName(e.target.value)} />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="mail" className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80 ml-1">Adresă Email</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input id="mail" type="email" placeholder="nume@exemplu.ro" className="pl-9 h-10" value={mail} onChange={e => setMail(e.target.value)} />
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="p-6 pt-0 flex sm:justify-end gap-3">
                        {editingContact && (
                            <Button variant="destructive" onClick={handleDeleteContact} className="px-6">
                                Șterge contact
                            </Button>
                        )}
                        <Button onClick={handleSaveContact} disabled={!isContactValid} className="gap-2 px-6">
                            <Save className="w-4 h-4" /> Salvează Contact
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    )
}
