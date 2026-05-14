'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Scale } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { createOrgAppeal } from '@/services/org_appeal.service'

type Props = { orgId: string; orgName: string }

export function OrgAppealFormClient({ orgId, orgName }: Props) {
  const router = useRouter()
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (reason.trim().length < 20) {
      toast.error('Motivul trebuie să aibă minim 20 de caractere')
      return
    }
    setLoading(true)
    const result = await createOrgAppeal(orgId, reason)
    setLoading(false)
    if ('error' in result) {
      toast.error(result.error)
      return
    }
    toast.success('Contestație trimisă! Vei fi notificat cu privire la decizie.')
    router.push(`/organizatie/${orgId}/panou`)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="reason" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
          Motivul contestației *
        </Label>
        <Textarea
          id="reason"
          value={reason}
          onChange={e => setReason(e.target.value)}
          placeholder="Explică în detaliu de ce consideri că decizia de respingere este incorectă. Poți menționa documentele depuse, activitățile organizației, sau orice altă informație relevantă..."
          rows={6}
          required
        />
        <p className="text-xs text-muted-foreground">
          {reason.trim().length}/20 caractere minim
          {reason.trim().length >= 20 && <span className="text-primary font-semibold"> ✓</span>}
        </p>
      </div>

      <p className="text-xs text-muted-foreground rounded-lg border border-border bg-muted/40 p-3">
        După trimiterea contestației, organizația <strong>{orgName}</strong> va fi marcată ca „Contestată" și va intra din nou în analiză. Poți continua să editezi detaliile organizației din <strong>Setări</strong> pentru a remedia motivele de respingere.
      </p>

      <div className="flex gap-3">
        <Button type="submit" disabled={loading || reason.trim().length < 20}>
          <Scale className="size-4 mr-1.5" />
          {loading ? 'Se trimite...' : 'Trimite contestația'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={loading}
        >
          Anulează
        </Button>
      </div>
    </form>
  )
}
