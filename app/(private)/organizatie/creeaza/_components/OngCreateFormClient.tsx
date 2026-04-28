'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { createOrganization } from '@/services/organization.service'
import { LogoUploadClient } from '../../../_components/LogoUploadClient'

const TEMP_ORG_ID = 'new'

export function OngCreateFormClient() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', description: '', website: '', iban: '' })

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) { toast.error('Numele organizației este obligatoriu'); return }
    setLoading(true)
    const result = await createOrganization({
      name: form.name,
      description: form.description || undefined,
      website: form.website || undefined,
      iban: form.iban || undefined,
      logo_url: logoUrl || undefined,
    })
    setLoading(false)
    if ('error' in result) { toast.error(result.error); return }
    toast.success('Organizație creată! Acum este în așteptarea aprobării.')
    router.push(`/organizatie/${result.orgId}/panou`)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <LogoUploadClient orgId={TEMP_ORG_ID} logoUrl={logoUrl} onLogoChange={setLogoUrl} />

      <div className="space-y-2">
        <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
          Nume organizație *
        </Label>
        <Input
          id="name"
          placeholder="Asociația Civică România"
          value={form.name}
          onChange={e => set('name', e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
          Descriere
        </Label>
        <Textarea
          id="description"
          placeholder="Descrieți misiunea și activitățile organizației..."
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
          <Input
            id="website"
            type="url"
            placeholder="https://organizatia.ro"
            value={form.website}
            onChange={e => set('website', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="iban" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            IBAN donații
          </Label>
          <Input
            id="iban"
            placeholder="RO49AAAA1B31007593840000"
            value={form.iban}
            onChange={e => set('iban', e.target.value)}
          />
        </div>
      </div>

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? 'Se creează...' : 'Creează organizație'}
      </Button>
    </form>
  )
}
