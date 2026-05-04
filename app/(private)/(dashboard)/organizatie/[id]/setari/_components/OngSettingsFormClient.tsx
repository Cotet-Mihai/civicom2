'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Scale, MapPin, FolderOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { updateOrganization } from '@/services/organization.service'
import { LogoUploadClient } from '@/app/(private)/organizatie/_components/LogoUploadClient'
import { BannerUploadClient } from '@/app/(private)/organizatie/_components/BannerUploadClient'
import { DocumentsUploadClient } from '@/app/(private)/organizatie/_components/DocumentsUploadClient'
import { ORG_CATEGORY_LABELS, ORG_TYPE_LABELS } from '@/lib/constants'
import type { OrgDetail, OrgDocument } from '@/services/organization.service'

type Props = { org: OrgDetail }

export function OngSettingsFormClient({ org }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [logoUrl, setLogoUrl] = useState<string | null>(org.logo_url)
  const [bannerUrl, setBannerUrl] = useState<string | null>(org.banner_url)
  const [documents, setDocuments] = useState<OrgDocument[]>(org.documents)
  const [categories, setCategories] = useState<string[]>(org.categories)
  const [form, setForm] = useState({
    name: org.name,
    description: org.description ?? '',
    website: org.website ?? '',
    iban: org.iban ?? '',
    cui: org.cui ?? '',
    reg_number: org.reg_number ?? '',
    org_type: org.org_type ?? '',
    email: org.email ?? '',
    phone: org.phone ?? '',
    address: org.address ?? '',
    postal_code: org.postal_code ?? '',
    city: org.city ?? '',
  })

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) { toast.error('Numele este obligatoriu'); return }
    if (categories.length === 0) { toast.error('Selectează cel puțin un domeniu de activitate'); return }
    setLoading(true)
    const result = await updateOrganization(org.id, {
      name: form.name,
      description: form.description || null,
      website: form.website || null,
      iban: form.iban || null,
      logo_url: logoUrl,
      banner_url: bannerUrl,
      categories,
      cui: form.cui || null,
      reg_number: form.reg_number || null,
      org_type: form.org_type || null,
      email: form.email || null,
      phone: form.phone || null,
      address: form.address || null,
      postal_code: form.postal_code || null,
      city: form.city || null,
    })
    setLoading(false)
    if ('error' in result) { toast.error(result.error); return }
    toast.success('Setări salvate!')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <BannerUploadClient orgId={org.id} bannerUrl={bannerUrl} onBannerChange={setBannerUrl} />
      <LogoUploadClient orgId={org.id} logoUrl={logoUrl} onLogoChange={setLogoUrl} />

      {/* Informații juridice */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center gap-2 border-b border-border/50 pb-3">
          <Scale className="size-4 text-primary" />
          <h3 className="text-sm font-bold tracking-tight text-foreground">Informații juridice</h3>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="cui" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">CUI / CIF</Label>
            <Input id="cui" placeholder="RO12345678" value={form.cui} onChange={e => set('cui', e.target.value)} className="uppercase" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reg_number" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Nr. Registru</Label>
            <Input id="reg_number" placeholder="ex: 26/A/2010" value={form.reg_number} onChange={e => set('reg_number', e.target.value)} />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="settings_org_type" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Tip organizație</Label>
          <Select value={form.org_type} onValueChange={v => set('org_type', v ?? '')}>
            <SelectTrigger id="settings_org_type"><SelectValue placeholder="Selectează tipul..." /></SelectTrigger>
            <SelectContent>
              {Object.entries(ORG_TYPE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="settings_email" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Email oficial</Label>
            <Input id="settings_email" type="email" placeholder="contact@organizatia.ro" value={form.email} onChange={e => set('email', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="settings_phone" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Telefon</Label>
            <Input id="settings_phone" type="tel" placeholder="+40 721 234 567" value={form.phone} onChange={e => set('phone', e.target.value)} />
          </div>
        </div>
      </div>

      {/* Sediu */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center gap-2 border-b border-border/50 pb-3">
          <MapPin className="size-4 text-primary" />
          <h3 className="text-sm font-bold tracking-tight text-foreground">Sediu</h3>
        </div>
        <div className="space-y-2">
          <Label htmlFor="address" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Adresă sediu</Label>
          <Input id="address" placeholder="Str. Exemplu nr. 1" value={form.address} onChange={e => set('address', e.target.value)} />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="postal_code" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Cod poștal</Label>
            <Input id="postal_code" placeholder="010101" value={form.postal_code} onChange={e => set('postal_code', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="city" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Localitate</Label>
            <Input id="city" placeholder="București" value={form.city} onChange={e => set('city', e.target.value)} />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
          Nume *
        </Label>
        <Input id="name" value={form.name} onChange={e => set('name', e.target.value)} required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
          Descriere
        </Label>
        <Textarea
          id="description"
          value={form.description}
          onChange={e => set('description', e.target.value)}
          rows={4}
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
              className="rounded-full px-4 text-sm font-medium data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:border-primary"
            >
              {label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="website" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            Website
          </Label>
          <Input id="website" type="url" value={form.website} onChange={e => set('website', e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="iban" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            IBAN donații
          </Label>
          <Input id="iban" value={form.iban} onChange={e => set('iban', e.target.value)} />
        </div>
      </div>

      {/* Documente verificare */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center gap-2 border-b border-border/50 pb-3">
          <FolderOpen className="size-4 text-primary" />
          <h3 className="text-sm font-bold tracking-tight text-foreground">Documente verificare</h3>
        </div>
        <p className="text-xs text-muted-foreground">
          Încarcă documentele necesare pentru verificarea organizației. Fișiere acceptate: PDF, JPG, PNG. Maxim 10MB per fișier.
        </p>
        <DocumentsUploadClient orgId={org.id} documents={documents} onDocumentsChange={setDocuments} />
      </div>

      <Button type="submit" disabled={loading}>
        {loading ? 'Se salvează...' : 'Salvează modificările'}
      </Button>
    </form>
  )
}
