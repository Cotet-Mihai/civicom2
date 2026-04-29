'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { resolveAppeal } from '@/services/appeal.service'

type Props = {
  appealId: string
  eventId: string
}

export function AdminAppealActionBarClient({ appealId, eventId }: Props) {
  const [isRejecting, setIsRejecting] = useState(false)
  const [note, setNote] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  async function handleApprove() {
    setIsLoading(true)
    const result = await resolveAppeal(appealId, 'approved', '')
    setIsLoading(false)
    if ('error' in result) { toast.error(result.error); return }
    toast.success('Contestație aprobată — evenimentul este acum public')
    router.refresh()
  }

  async function handleReject() {
    if (note.trim().length < 10) {
      toast.error('Motivul trebuie să aibă minim 10 caractere')
      return
    }
    setIsLoading(true)
    const result = await resolveAppeal(appealId, 'rejected', note)
    setIsLoading(false)
    if ('error' in result) { toast.error(result.error); return }
    toast.success('Contestație respinsă')
    setIsRejecting(false)
    router.refresh()
  }

  return (
    <div className="space-y-2 mt-3">
      {!isRejecting && (
        <div className="flex items-center gap-2 flex-wrap">
          <Button onClick={handleApprove} disabled={isLoading} size="sm">
            {isLoading
              ? <Loader2 size={14} className="animate-spin" />
              : <><CheckCircle size={14} className="mr-1.5" />Aprobă evenimentul</>
            }
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsRejecting(true)}
            disabled={isLoading}
            className="text-destructive border-destructive/30 hover:bg-destructive/5"
          >
            <XCircle size={14} className="mr-1.5" />
            Respinge contestația
          </Button>
        </div>
      )}

      {isRejecting && (
        <div className="space-y-2">
          <Textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Motivul respingerii contestației (minim 10 caractere)..."
            rows={2}
            className="text-sm"
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="destructive"
              onClick={handleReject}
              disabled={isLoading || note.trim().length < 10}
            >
              {isLoading ? <Loader2 size={14} className="animate-spin" /> : 'Confirmă respingerea'}
            </Button>
            <Button size="sm" variant="outline" onClick={() => { setIsRejecting(false); setNote('') }}>
              Anulează
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
