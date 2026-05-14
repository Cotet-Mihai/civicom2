'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ArrowRight, Image as ImageIcon, FileText, Link as LinkIcon, Scale, MapPin, Upload, X, FileIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { createOrganization, addOrgDocument } from '@/services/organization.service'
import { uploadOrgDocument } from '@/lib/upload'
import { LogoUploadClient } from '../../_components/LogoUploadClient'
import { BannerUploadClient } from '../../_components/BannerUploadClient'
import { ORG_CATEGORY_LABELS, ORG_TYPE_LABELS, ORG_DOC_TYPE_LABELS } from '@/lib/constants'
import { LOCALITIES_BY_COUNTY } from '@/lib/romanian-localities'

function formatPhone(raw: string): string {
    const digits = raw.replace(/\D/g, '').slice(0, 9)
    const parts: string[] = []
    if (digits.length > 0) parts.push(digits.slice(0, 3))
    if (digits.length > 3) parts.push(digits.slice(3, 6))
    if (digits.length > 6) parts.push(digits.slice(6, 9))
    return parts.join(' ')
}

const TEMP_ORG_ID = 'new'

export function OngCreateFormClient() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [logoUrl, setLogoUrl] = useState<string | null>(null)
    const [bannerUrl, setBannerUrl] = useState<string | null>(null)
    const [categories, setCategories] = useState<string[]>([])
    const [pendingDocs, setPendingDocs] = useState<Record<string, File | null>>({})
    const docInputRefs = useRef<Record<string, HTMLInputElement | null>>({})
    const [phone, setPhone] = useState('')
    const [county, setCounty] = useState('')
    const [city, setCity] = useState('')
    const [form, setForm] = useState({ name: '', description: '', website: '', iban: '', cui: '', reg_number: '', org_type: '', email: '', address: '', postal_code: '' })

    const isBucharest = county === 'București'
    const cityLabel = isBucharest ? 'Sector' : 'Localitate'
    const localities = county ? (LOCALITIES_BY_COUNTY[county] ?? []) : []

    function set(field: string, value: string) {
        setForm(prev => ({ ...prev, [field]: value }))
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!form.name.trim()) { toast.error('Numele organizației este obligatoriu'); return }
        if (!form.description.trim()) { toast.error('Descrierea este obligatorie'); return }
        if (categories.length === 0) { toast.error('Selectează cel puțin un domeniu de activitate'); return }
        if (!form.cui.trim()) { toast.error('CUI/CIF este obligatoriu'); return }
        if (!form.reg_number.trim()) { toast.error('Nr. Registru este obligatoriu'); return }
        if (!form.org_type) { toast.error('Tipul organizației este obligatoriu'); return }
        if (!form.email.trim()) { toast.error('Email-ul oficial este obligatoriu'); return }
        if (phone.replace(/\s/g, '').length !== 9) { toast.error('Numărul de telefon trebuie să aibă 9 cifre'); return }
        if (!form.address.trim()) { toast.error('Adresa sediului este obligatorie'); return }
        if (!form.postal_code.trim()) { toast.error('Codul poștal este obligatoriu'); return }
        if (!county) { toast.error('Județul este obligatoriu'); return }
        if (!city) { toast.error('Localitatea este obligatorie'); return }

        const missingDocs = Object.keys(ORG_DOC_TYPE_LABELS).filter(type => !pendingDocs[type])
        if (missingDocs.length > 0) {
            toast.error(`Documentele obligatorii lipsesc: ${missingDocs.map(t => ORG_DOC_TYPE_LABELS[t]).join(', ')}`)
            return
        }

        setLoading(true)
        const result = await createOrganization({
            name: form.name,
            description: form.description,
            website: form.website || undefined,
            iban: form.iban || undefined,
            logo_url: logoUrl || undefined,
            banner_url: bannerUrl || undefined,
            categories,
            cui: form.cui,
            reg_number: form.reg_number,
            org_type: form.org_type,
            email: form.email,
            phone: `+40${phone.replace(/\s/g, '')}`,
            address: form.address,
            postal_code: form.postal_code,
            county,
            city,
        })
        if ('error' in result) { setLoading(false); toast.error(result.error); return }

        const { orgId } = result
        const docResults = await Promise.all(
            Object.entries(pendingDocs).map(async ([docType, file]) => {
                if (!file) return null
                const path = await uploadOrgDocument(file, orgId)
                if (!path) return `Upload eșuat pentru ${ORG_DOC_TYPE_LABELS[docType]}`
                const res = await addOrgDocument(orgId, docType, file.name, path)
                if ('error' in res) return `${ORG_DOC_TYPE_LABELS[docType]}: ${res.error}`
                return null
            })
        )
        const docErrors = docResults.filter(Boolean)
        if (docErrors.length > 0) {
            toast.error(`Documente neîncărcate: ${docErrors.join('; ')}`)
        }

        toast.success('Organizație creată! Acum este în așteptarea aprobării.')
        router.push(`/organizatie/${orgId}/panou`)
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-12">

            {/* SECȚIUNEA 1: Informații Generale */}
            <div className="space-y-6">
                <div className="flex items-center gap-2 border-b border-border/50 pb-3">
                    <FileText className="size-5 text-primary" />
                    <h3 className="font-heading text-xl font-bold tracking-tight text-foreground">
                        Informații generale
                    </h3>
                </div>

                <div className="space-y-6">
                    <div className="space-y-3">
                        <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                            Nume organizație *
                        </Label>
                        <Input
                            id="name"
                            placeholder="ex: Asociația Civică România"
                            value={form.name}
                            onChange={e => set('name', e.target.value)}
                            required
                            className="bg-transparent h-11 transition-all hover:border-primary/50 focus-visible:ring-primary/20"
                        />
                    </div>

                    <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                            Domenii de activitate *
                        </Label>
                        <ToggleGroup
                            multiple
                            value={categories}
                            onValueChange={(values) => setCategories(values)}
                            className="flex flex-wrap justify-start"
                        >
                            {Object.entries(ORG_CATEGORY_LABELS).map(([value, label]) => (
                                <ToggleGroupItem
                                    key={value}
                                    value={value}
                                    variant="outline"
                                    className="rounded-full px-5 font-semibold transition-all duration-300 hover:bg-muted aria-pressed:bg-secondary aria-pressed:text-secondary-foreground aria-pressed:border-secondary aria-pressed:shadow-md"
                                >
                                    {label}
                                </ToggleGroupItem>
                            ))}
                        </ToggleGroup>
                    </div>

                    <div className="space-y-3">
                        <Label htmlFor="description" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                            Descriere *
                        </Label>
                        <Textarea
                            id="description"
                            placeholder="Descrieți misiunea și activitățile organizației..."
                            value={form.description}
                            onChange={e => set('description', e.target.value)}
                            rows={4}
                            className="resize-none bg-transparent transition-all hover:border-primary/50 focus-visible:ring-primary/20"
                        />
                    </div>
                </div>
            </div>

            {/* SECȚIUNEA 2: Informații juridice */}
            <div className="space-y-6">
                <div className="flex items-center gap-2 border-b border-border/50 pb-3">
                    <Scale className="size-5 text-primary" />
                    <h3 className="font-heading text-xl font-bold tracking-tight text-foreground">
                        Informații juridice
                    </h3>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div className="space-y-3">
                        <Label htmlFor="cui" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                            CUI / CIF *
                        </Label>
                        <Input
                            id="cui"
                            placeholder="RO12345678"
                            value={form.cui}
                            onChange={e => set('cui', e.target.value)}
                            className="bg-transparent h-11 uppercase transition-all hover:border-primary/50 focus-visible:ring-primary/20"
                        />
                    </div>
                    <div className="space-y-3">
                        <Label htmlFor="reg_number" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                            Nr. Registru / Înregistrare *
                        </Label>
                        <Input
                            id="reg_number"
                            placeholder="ex: 26/A/2010"
                            value={form.reg_number}
                            onChange={e => set('reg_number', e.target.value)}
                            className="bg-transparent h-11 transition-all hover:border-primary/50 focus-visible:ring-primary/20"
                        />
                    </div>
                </div>

                <div className="space-y-3">
                    <Label htmlFor="org_type" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        Tip organizație *
                    </Label>
                    <Select value={form.org_type} onValueChange={v => set('org_type', v ?? '')}>
                        <SelectTrigger id="org_type" className="w-full h-11 bg-transparent transition-all hover:border-primary/50 focus:ring-primary/20">
                            <SelectValue placeholder="Selectează tipul...">{ORG_TYPE_LABELS[form.org_type]}</SelectValue>
                        </SelectTrigger>
                        <SelectContent alignItemWithTrigger={false}>
                            {Object.entries(ORG_TYPE_LABELS).map(([value, label]) => (
                                <SelectItem key={value} value={value}>{label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div className="space-y-3">
                        <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                            Email oficial *
                        </Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="contact@organizatia.ro"
                            value={form.email}
                            onChange={e => set('email', e.target.value)}
                            className="bg-transparent h-11 transition-all hover:border-primary/50 focus-visible:ring-primary/20"
                        />
                    </div>
                    <div className="space-y-3">
                        <Label htmlFor="phone" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                            Telefon *
                        </Label>
                        <InputGroup>
                            <InputGroupAddon>
                                <Badge variant="secondary" className="text-xs">+40</Badge>
                            </InputGroupAddon>
                            <InputGroupInput
                                id="phone"
                                inputMode="numeric"
                                placeholder="700 000 000"
                                value={phone}
                                onChange={e => setPhone(formatPhone(e.target.value))}
                            />
                        </InputGroup>
                    </div>
                </div>
            </div>

            {/* SECȚIUNEA 3: Sediu */}
            <div className="space-y-6">
                <div className="flex items-center gap-2 border-b border-border/50 pb-3">
                    <MapPin className="size-5 text-primary" />
                    <h3 className="font-heading text-xl font-bold tracking-tight text-foreground">
                        Sediu
                    </h3>
                </div>

                <div className="space-y-3">
                    <Label htmlFor="address" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        Adresă sediu *
                    </Label>
                    <Input
                        id="address"
                        placeholder="Str. Exemplu nr. 1"
                        value={form.address}
                        onChange={e => set('address', e.target.value)}
                        className="bg-transparent h-11 transition-all hover:border-primary/50 focus-visible:ring-primary/20"
                    />
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                            Județ *
                        </Label>
                        <Select value={county} onValueChange={v => { setCounty(v ?? ''); setCity('') }}>
                            <SelectTrigger className="w-full h-11 bg-transparent transition-all hover:border-primary/50 focus:ring-primary/20">
                                <SelectValue placeholder="Selectează județul...">{county || undefined}</SelectValue>
                            </SelectTrigger>
                            <SelectContent alignItemWithTrigger={false}>
                                {Object.keys(LOCALITIES_BY_COUNTY).sort().map(c => (
                                    <SelectItem key={c} value={c}>{c}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                            {cityLabel} *
                        </Label>
                        <Select value={city} onValueChange={v => setCity(v ?? '')} disabled={!county}>
                            <SelectTrigger className="w-full h-11 bg-transparent transition-all hover:border-primary/50 focus:ring-primary/20">
                                <SelectValue placeholder={county ? `Selectează ${cityLabel.toLowerCase()}...` : 'Selectează mai întâi județul...'}>
                                    {city || undefined}
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent alignItemWithTrigger={false}>
                                {localities.map(l => (
                                    <SelectItem key={l} value={l}>{l}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="space-y-3">
                    <Label htmlFor="postal_code" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        Cod poștal *
                    </Label>
                    <Input
                        id="postal_code"
                        placeholder="010101"
                        value={form.postal_code}
                        onChange={e => set('postal_code', e.target.value)}
                        className="bg-transparent h-11 transition-all hover:border-primary/50 focus-visible:ring-primary/20"
                    />
                </div>
            </div>

            {/* SECȚIUNEA 4: Contact & Donații */}
            <div className="space-y-6">
                <div className="flex items-center gap-2 border-b border-border/50 pb-3">
                    <LinkIcon className="size-5 text-primary" />
                    <h3 className="font-heading text-xl font-bold tracking-tight text-foreground">
                        Contact & Donații
                    </h3>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div className="space-y-3">
                        <Label htmlFor="website" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                            Website (opțional)
                        </Label>
                        <Input
                            id="website"
                            type="url"
                            placeholder="https://organizatia.ro"
                            value={form.website}
                            onChange={e => set('website', e.target.value)}
                            className="bg-transparent h-11 transition-all hover:border-primary/50 focus-visible:ring-primary/20"
                        />
                    </div>
                    <div className="space-y-3">
                        <Label htmlFor="iban" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                            IBAN donații (opțional)
                        </Label>
                        <Input
                            id="iban"
                            placeholder="RO49AAAA1B31007593840000"
                            value={form.iban}
                            onChange={e => set('iban', e.target.value)}
                            className="bg-transparent h-11 uppercase transition-all hover:border-primary/50 focus-visible:ring-primary/20"
                        />
                    </div>
                </div>
            </div>

            {/* SECȚIUNEA 5: Documente obligatorii */}
            <div className="space-y-6">
                <div className="flex items-center gap-2 border-b border-border/50 pb-3">
                    <FileText className="size-5 text-primary" />
                    <h3 className="font-heading text-xl font-bold tracking-tight text-foreground">
                        Documente obligatorii
                    </h3>
                </div>
                <p className="text-sm text-muted-foreground">
                    Toate documentele de mai jos sunt obligatorii pentru procesarea cererii. Formate acceptate: PDF, JPG, PNG (max. 10MB).
                </p>

                <div className="space-y-3">
                    {Object.entries(ORG_DOC_TYPE_LABELS).map(([docType, label]) => {
                        const file = pendingDocs[docType] ?? null
                        return (
                            <div
                                key={docType}
                                className="flex items-center justify-between gap-4 rounded-xl border border-border bg-muted/30 px-4 py-3"
                            >
                                <span className="text-sm font-semibold text-foreground">
                                    {label} <span className="text-destructive">*</span>
                                </span>

                                {file ? (
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-1.5 rounded-md bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                                            <FileIcon size={12} />
                                            <span className="max-w-[180px] truncate">{file.name}</span>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 px-2 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                                            onClick={() => setPendingDocs(prev => ({ ...prev, [docType]: null }))}
                                        >
                                            <X size={12} className="mr-1" /> Șterge
                                        </Button>
                                    </div>
                                ) : (
                                    <>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="h-7 gap-1.5 text-xs"
                                            onClick={() => docInputRefs.current[docType]?.click()}
                                        >
                                            <Upload size={12} /> Încarcă
                                        </Button>
                                        <input
                                            ref={el => { docInputRefs.current[docType] = el }}
                                            type="file"
                                            accept=".pdf,.jpg,.jpeg,.png"
                                            className="hidden"
                                            onChange={e => {
                                                const f = e.target.files?.[0]
                                                if (!f) return
                                                if (f.size > 10 * 1024 * 1024) { toast.error('Fișierul depășește 10MB'); return }
                                                setPendingDocs(prev => ({ ...prev, [docType]: f }))
                                                e.target.value = ''
                                            }}
                                        />
                                    </>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* SECȚIUNEA 6: Identitate Vizuală */}
            <div className="space-y-6">
                <div className="flex items-center gap-2 border-b border-border/50 pb-3">
                    <ImageIcon className="size-5 text-primary" />
                    <h3 className="font-heading text-xl font-bold tracking-tight text-foreground">
                        Identitate vizuală
                    </h3>
                </div>

                {/* Layout aerisit: Bannerul ia spațiul principal, Logo-ul e grupat frumos lângă pe desktop */}
                <div className="grid grid-cols-1 gap-8 sm:grid-cols-[1fr_240px]">
                    <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                            Imagine de fundal (Banner)
                        </Label>
                        <BannerUploadClient orgId={TEMP_ORG_ID} bannerUrl={bannerUrl} onBannerChange={setBannerUrl} />
                    </div>

                    <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                            Logo Organizație
                        </Label>
                        <LogoUploadClient orgId={TEMP_ORG_ID} logoUrl={logoUrl} onLogoChange={setLogoUrl} />
                    </div>
                </div>
            </div>

            {/* BUTON SUBMIT */}
            <div className="pt-8">
                <Button
                    type="submit"
                    disabled={loading}
                    size="lg"
                    className="group w-full h-12 font-bold shadow-sm transition-all duration-300 hover:ring-4 hover:ring-primary/20 sm:w-auto sm:px-12"
                >
                    {loading ? 'Se procesează...' : 'Trimite solicitarea'}
                    {!loading && <ArrowRight className="ml-2 size-4 transition-transform group-hover:translate-x-1" />}
                </Button>
            </div>

        </form>
    )
}