'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ArrowRight, Image as ImageIcon, FileText, Link as LinkIcon, Scale, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createOrganization } from '@/services/organization.service'
import { LogoUploadClient } from '../../_components/LogoUploadClient'
import { BannerUploadClient } from '../../_components/BannerUploadClient'
import { ORG_CATEGORY_LABELS, ORG_TYPE_LABELS } from '@/lib/constants'

const TEMP_ORG_ID = 'new'

export function OngCreateFormClient() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [logoUrl, setLogoUrl] = useState<string | null>(null)
    const [bannerUrl, setBannerUrl] = useState<string | null>(null)
    const [categories, setCategories] = useState<string[]>([])
    const [form, setForm] = useState({ name: '', description: '', website: '', iban: '', cui: '', reg_number: '', org_type: '', email: '', phone: '', address: '', postal_code: '', city: '' })

    function set(field: string, value: string) {
        setForm(prev => ({ ...prev, [field]: value }))
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!form.name.trim()) { toast.error('Numele organizației este obligatoriu'); return }
        if (categories.length === 0) { toast.error('Selectează cel puțin un domeniu de activitate'); return }
        if (!form.cui.trim()) { toast.error('CUI/CIF este obligatoriu'); return }
        if (!form.reg_number.trim()) { toast.error('Nr. Registru este obligatoriu'); return }
        if (!form.org_type) { toast.error('Tipul organizației este obligatoriu'); return }
        if (!form.email.trim()) { toast.error('Email-ul oficial este obligatoriu'); return }
        if (!form.phone.trim()) { toast.error('Telefonul este obligatoriu'); return }
        if (!form.address.trim()) { toast.error('Adresa sediului este obligatorie'); return }
        if (!form.postal_code.trim()) { toast.error('Codul poștal este obligatoriu'); return }
        if (!form.city.trim()) { toast.error('Localitatea este obligatorie'); return }
        setLoading(true)
        const result = await createOrganization({
            name: form.name,
            description: form.description || undefined,
            website: form.website || undefined,
            iban: form.iban || undefined,
            logo_url: logoUrl || undefined,
            banner_url: bannerUrl || undefined,
            categories,
            cui: form.cui,
            reg_number: form.reg_number,
            org_type: form.org_type,
            email: form.email,
            phone: form.phone,
            address: form.address,
            postal_code: form.postal_code,
            city: form.city,
        })
        setLoading(false)
        if ('error' in result) { toast.error(result.error); return }
        toast.success('Organizație creată! Acum este în așteptarea aprobării.')
        router.push(`/organizatie/${result.orgId}/panou`)
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
                            Descriere
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
                        <SelectTrigger id="org_type" className="h-11 bg-transparent transition-all hover:border-primary/50 focus:ring-primary/20">
                            <SelectValue placeholder="Selectează tipul..." />
                        </SelectTrigger>
                        <SelectContent>
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
                        <Input
                            id="phone"
                            type="tel"
                            placeholder="+40 721 234 567"
                            value={form.phone}
                            onChange={e => set('phone', e.target.value)}
                            className="bg-transparent h-11 transition-all hover:border-primary/50 focus-visible:ring-primary/20"
                        />
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
                        placeholder="Str. Exemplu nr. 1, Sector 1"
                        value={form.address}
                        onChange={e => set('address', e.target.value)}
                        className="bg-transparent h-11 transition-all hover:border-primary/50 focus-visible:ring-primary/20"
                    />
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
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
                    <div className="space-y-3">
                        <Label htmlFor="city" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                            Localitate *
                        </Label>
                        <Input
                            id="city"
                            placeholder="București"
                            value={form.city}
                            onChange={e => set('city', e.target.value)}
                            className="bg-transparent h-11 transition-all hover:border-primary/50 focus-visible:ring-primary/20"
                        />
                    </div>
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

            {/* SECȚIUNEA 3: Identitate Vizuală */}
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