'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { approveOrg, rejectOrg } from '@/services/admin.service'

type Props = {
  orgId: string
  currentStatus: string
  rejectionNote: string | null
}

const STATUS_LABEL: Record<string, string> = {
  pending: 'În așteptare',
  approved: 'Aprobată',
  rejected: 'Respinsă',
}

const STATUS_CLASSES: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  approved: 'bg-primary/10 text-primary border-primary/20',
  rejected: 'bg-destructive/10 text-destructive border-destructive/20',
}

export function AdminOrgActionBarClient({ orgId, currentStatus, rejectionNote }: Props) {
  const [isRejecting, setIsRejecting] = useState(false)
  const [note, setNote] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  async function handleApprove() {
    setIsLoading(true)
    const result = await approveOrg(orgId)
    setIsLoading(false)
    if ('error' in result) { toast.error(result.error); return }
    toast.success('Organizație aprobată')
    router.refresh()
  }

  async function handleReject() {
    if (note.trim().length < 10) {
      toast.error('Motivul trebuie să aibă minim 10 caractere')
      return
    }
    setIsLoading(true)
    const result = await rejectOrg(orgId, note)
    setIsLoading(false)
    if ('error' in result) { toast.error(result.error); return }
    toast.success('Organizație respinsă')
    setIsRejecting(false)
    router.refresh()
  }

  return (
    <div className="space-y-2 mt-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${STATUS_CLASSES[currentStatus] ?? ''}`}>
          {STATUS_LABEL[currentStatus] ?? currentStatus}
        </span>

        {currentStatus === 'pending' && !isRejecting && (
          <div className="flex items-center gap-2">
            <Button onClick={handleApprove} disabled={isLoading} size="sm">
              {isLoading
                ? <Loader2 size={14} className="animate-spin" />
                : <><CheckCircle size={14} className="mr-1.5" />Aprobă</>
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
              Respinge
            </Button>
          </div>
        )}
      </div>

      {currentStatus === 'pending' && isRejecting && (
        <div className="space-y-2">
          <Textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Motivul respingerii (minim 10 caractere)..."
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

      {currentStatus !== 'pending' && rejectionNote && (
        <p className="text-xs text-muted-foreground">
          <span className="font-medium">Motiv respingere:</span> {rejectionNote}
        </p>
      )}
    </div>
  )
}
