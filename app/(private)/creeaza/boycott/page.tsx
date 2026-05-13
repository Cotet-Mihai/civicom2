'use client'

import Image from 'next/image'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Plus, Info, ShoppingBag, Camera } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { StepperUI, type Step } from '../_components/StepperUI'
import { ImageUploadClient } from '../_components/ImageUploadClient'
import { BrandDialog, type Brand } from '../_components/BrandDialog'
import { BrandViewDialog } from '../_components/BrandViewDialog'
import { createBoycott } from '@/services/boycott.service'
import { createClient } from '@/lib/supabase/client'

const STEPS: Step[] = [
    { title: 'Info', description: '', icon: <Info className="size-4" /> },
    { title: 'Branduri', description: '', icon: <ShoppingBag className="size-4" /> },
    { title: 'Media', description: '', icon: <Camera className="size-4" /> },
]

const REASONS = [
    { value: 'unethical practices', label: 'Practici neetice' },
    { value: 'environmental issues', label: 'Probleme de mediu' },
    { value: 'exploitation of workers', label: 'Exploatare muncitori' },
    { value: 'political position', label: 'Poziție politică' },
    { value: 'other', label: 'Altele' },
]

const METHODS = [
    { value: 'not buying anymore', label: 'Nu mai cumpăr acest brand' },
    { value: 'public pressure', label: 'Presiune publică online' },
    { value: 'inform people', label: 'Informare publică' },
    { value: 'any', label: 'Orice mod' },
]

type Form = {
    title: string
    description: string
    reason: string
    method: string
    brands: Brand[]
    banner_url: string | null
    gallery_urls: string[]
}

const INITIAL: Form = {
    title: '', description: '', reason: '', method: '',
    brands: [], banner_url: null, gallery_urls: [],
}

export default function CreateBoycottPage() {
    const [step, setStep] = useState(1)
    const [form, setForm] = useState<Form>(INITIAL)
    const [submitting, setSubmitting] = useState(false)
    const [userId, setUserId] = useState<string | null>(null)
    const router = useRouter()

    // Brand dialog state
    const [addDialogOpen, setAddDialogOpen] = useState(false)
    const [viewingIndex, setViewingIndex] = useState<number | null>(null)
    const [viewDialogOpen, setViewDialogOpen] = useState(false)
    const [editDialogOpen, setEditDialogOpen] = useState(false)
    const [editingIndex, setEditingIndex] = useState<number | null>(null)

    useEffect(() => {
        createClient().auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null))
    }, [])

    function set<K extends keyof Form>(key: K, val: Form[K]) {
        setForm(f => ({ ...f, [key]: val }))
    }

    function handleAddBrand(brand: Brand) {
        set('brands', [...form.brands, brand])
    }

    function handleEditBrand(brand: Brand) {
        if (editingIndex === null) return
        set('brands', form.brands.map((b, i) => i === editingIndex ? brand : b))
        setEditingIndex(null)
    }

    function openViewDialog(idx: number) {
        setViewingIndex(idx)
        setViewDialogOpen(true)
    }

    function handleEditFromView() {
        setViewDialogOpen(false)
        if (viewingIndex !== null) {
            setEditingIndex(viewingIndex)
            setEditDialogOpen(true)
        }
    }

    function handleDeleteFromView() {
        if (viewingIndex === null) return
        set('brands', form.brands.filter((_, i) => i !== viewingIndex))
        setViewDialogOpen(false)
        setViewingIndex(null)
    }

    function validateStep(): string | null {
        if (step === 1) {
            if (!form.title.trim()) return 'Titlul este obligatoriu'
            if (!form.description.trim()) return 'Descrierea este obligatorie'
        }
        if (step === 2) {
            if (!form.reason) return 'Selectează motivul boicotului'
            if (!form.method) return 'Selectează modul de operare'
            if (form.brands.length === 0) return 'Adaugă cel puțin un brand'
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
        const result = await createBoycott(
            {
                title: form.title,
                description: form.description,
                banner_url: form.banner_url,
                gallery_urls: form.gallery_urls,
                organization_id: null,
            },
            {
                reason: form.reason,
                method: form.method,
                brands: form.brands.map(b => ({
                    name: b.name,
                    link: b.link || null,
                    alternatives: b.alternatives.map(a => ({
                        name: a.name,
                        link: a.link,
                        reason: a.reason || null,
                    })),
                })),
            }
        )
        setSubmitting(false)
        if ('error' in result) { toast.error(result.error); return }
        toast.success('Boicot creat! Urmează validarea de către admin.')
        router.push('/panou/evenimente')
    }

    return (
        <div className="min-h-[calc(100vh-4rem)] lg:grid lg:grid-cols-[30%_70%]">
            <div className="hidden lg:block sticky top-16 h-[calc(100vh-4rem)] relative overflow-hidden">
                <Image src="/images/protest.webp" alt="Boycott" fill style={{ objectFit: 'cover', objectPosition: 'center' }} priority />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 p-10 text-white space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Creează</p>
                    <h2 className="text-4xl font-black leading-tight">BOYCOTT</h2>
                    <p className="text-sm opacity-70">Branduri & alternative</p>
                </div>
            </div>

            <div className="px-4 py-8 lg:px-12 lg:py-12">
                <StepperUI
                    steps={STEPS} currentStep={step}
                    onBack={() => setStep(s => s - 1)} onNext={handleNext} onSubmit={handleSubmit}
                    isSubmitting={submitting}
                    nextDisabled={
                        (step === 1 && (!form.title.trim() || !form.description.trim())) ||
                        (step === 2 && (!form.reason || !form.method || form.brands.length === 0)) ||
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
                                    placeholder="ex: Boicot Fast Fashion"
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="desc">Descriere *</Label>
                                <Textarea
                                    id="desc"
                                    value={form.description}
                                    onChange={e => set('description', e.target.value)}
                                    rows={6}
                                    placeholder="Descrieți scopul boicotului..."
                                />
                            </div>
                        </div>
                    )}

                    {/* Step 2 — Branduri */}
                    {step === 2 && (
                        <div className="flex flex-col gap-5">
                            {/* Motiv */}
                            <div className="flex flex-col gap-2">
                                <Label className="font-semibold">Motivul boicotului *</Label>
                                <ToggleGroup
                                    type="single"
                                    className="border flex-wrap justify-start"
                                    value={[form.reason]}
                                    onValueChange={v => { if (v.length) set('reason', v[0]) }}
                                >
                                    {REASONS.map(({ value, label }) => (
                                        <ToggleGroupItem
                                            key={value}
                                            value={value}
                                            className="aria-pressed:bg-secondary aria-pressed:text-secondary-foreground"
                                        >
                                            {label}
                                        </ToggleGroupItem>
                                    ))}
                                </ToggleGroup>
                            </div>

                            {/* Mod de operare */}
                            <div className="flex flex-col gap-2">
                                <Label className="font-semibold">Mod de operare *</Label>
                                <ToggleGroup
                                    type="single"
                                    className="border flex-wrap justify-start"
                                    value={[form.method]}
                                    onValueChange={v => { if (v.length) set('method', v[0]) }}
                                >
                                    {METHODS.map(({ value, label }) => (
                                        <ToggleGroupItem
                                            key={value}
                                            value={value}
                                            className="aria-pressed:bg-secondary aria-pressed:text-secondary-foreground"
                                        >
                                            {label}
                                        </ToggleGroupItem>
                                    ))}
                                </ToggleGroup>
                            </div>

                            <Separator />

                            {/* Branduri */}
                            <div className="flex flex-col gap-4">
                                <div>
                                    <Label className="text-base font-semibold">Branduri vizate *</Label>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        Adaugă brandurile pe care vrei să le boicotezi și sugerează alternative.
                                    </p>
                                </div>

                                <div className="flex flex-wrap gap-3">
                                    {form.brands.map((brand, idx) => (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => openViewDialog(idx)}
                                            className="group relative flex h-24 w-28 flex-col items-center justify-center gap-2 rounded-xl border-2 border-secondary bg-secondary/10 hover:bg-secondary/20 transition-all overflow-hidden"
                                        >
                                            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-secondary-foreground font-bold shadow-sm text-sm">
                                                {brand.name.charAt(0).toUpperCase()}
                                            </span>
                                            <span className="max-w-[80%] truncate text-[11px] font-medium text-center text-foreground/80">
                                                {brand.name}
                                            </span>
                                        </button>
                                    ))}

                                    <button
                                        type="button"
                                        onClick={() => setAddDialogOpen(true)}
                                        className="flex h-24 w-28 flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 transition-all text-muted-foreground hover:text-primary"
                                    >
                                        <Plus className="h-6 w-6" />
                                        <span className="text-xs font-medium">Adaugă</span>
                                    </button>
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

            {/* Dialogs */}
            <BrandDialog
                open={addDialogOpen}
                onOpenChange={setAddDialogOpen}
                onSave={handleAddBrand}
            />

            <BrandViewDialog
                open={viewDialogOpen}
                onOpenChange={setViewDialogOpen}
                brand={viewingIndex !== null ? form.brands[viewingIndex] : null}
                onEdit={handleEditFromView}
                onDelete={handleDeleteFromView}
            />

            <BrandDialog
                open={editDialogOpen}
                onOpenChange={val => { setEditDialogOpen(val); if (!val) setEditingIndex(null) }}
                onSave={handleEditBrand}
                initialData={editingIndex !== null ? form.brands[editingIndex] : null}
            />
        </div>
    )
}
