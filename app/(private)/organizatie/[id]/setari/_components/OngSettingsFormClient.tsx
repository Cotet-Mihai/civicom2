'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { updateOrganization } from '@/services/organization.service'
import { LogoUploadClient } from '../../../_components/LogoUploadClient'
import type { OrgDetail } from '@/services/organization.service'

type Props = { org: OrgDetail }

export function OngSettingsFormClient({ org }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [logoUrl, setLogoUrl] = useState<string | null>(org.logo_url)
  const [form, setForm] = useState({
    name: org.name,
    description: org.description ?? '',
    website: org.website ?? '',
    iban: org.iban ?? '',
  })

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) { toast.error('Numele este obligatoriu'); return }
    setLoading(true)
    const result = await updateOrganization(org.id, {
      name: form.name,
      description: form.description || null,
      website: form.website || null,
      iban: form.iban || null,
      logo_url: logoUrl,
    })
    setLoading(false)
    if ('error' in result) { toast.error(result.error); return }
    toast.success('Setări salvate!')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <LogoUploadClient orgId={org.id} logoUrl={logoUrl} onLogoChange={setLogoUrl} />

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

      <Button type="submit" disabled={loading}>
        {loading ? 'Se salvează...' : 'Salvează modificările'}
      </Button>
    </form>
  )
}
