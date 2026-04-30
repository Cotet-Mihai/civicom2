'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ArrowRight, Image as ImageIcon, FileText, Link as LinkIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { createOrganization } from '@/services/organization.service'
import { LogoUploadClient } from '../../_components/LogoUploadClient'
import { BannerUploadClient } from '../../_components/BannerUploadClient'
import { ORG_CATEGORY_LABELS } from '@/lib/constants'

const TEMP_ORG_ID = 'new'

export function OngCreateFormClient() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [logoUrl, setLogoUrl] = useState<string | null>(null)
    const [bannerUrl, setBannerUrl] = useState<string | null>(null)
    const [categories, setCategories] = useState<string[]>([])
    const [form, setForm] = useState({ name: '', description: '', website: '', iban: '' })

    function set(field: string, value: string) {
        setForm(prev => ({ ...prev, [field]: value }))
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!form.name.trim()) { toast.error('Numele organizației este obligatoriu'); return }
        if (categories.length === 0) { toast.error('Selectează cel puțin un domeniu de activitate'); return }
        setLoading(true)
        const result = await createOrganization({
            name: form.name,
            description: form.description || undefined,
            website: form.website || undefined,
            iban: form.iban || undefined,
            logo_url: logoUrl || undefined,
            banner_url: bannerUrl || undefined,
            categories,
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
                            className="flex flex-wrap justify-start gap-2"
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

            {/* SECȚIUNEA 2: Contact & Financiar */}
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