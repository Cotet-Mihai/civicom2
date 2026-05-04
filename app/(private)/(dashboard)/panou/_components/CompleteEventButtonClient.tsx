'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { completeEvent } from '@/services/completion.service'

function isManualComplete(category: string, subcategory: string | null): boolean {
  if (category === 'boycott' || category === 'petition') return true
  if (category === 'community' && subcategory === 'donations') return true
  if (category === 'charity' && subcategory === 'livestream') return true
  return false
}

type Props = {
  eventId: string
  category: string
  subcategory: string | null
  status: string
}

export function CompleteEventButtonClient({ eventId, category, subcategory, status }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  if (status !== 'approved' || !isManualComplete(category, subcategory)) return null

  async function handleComplete() {
    setLoading(true)
    try {
      const result = await completeEvent(eventId)
      if ('error' in result) { toast.error(result.error); return }
      toast.success('Eveniment marcat ca finalizat!')
      router.refresh()
    } catch {
      toast.error('Eroare de rețea. Încearcă din nou.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleComplete}
      disabled={loading}
      className="gap-1.5 shrink-0"
    >
      {loading
        ? <Loader2 size={14} className="animate-spin" />
        : <CheckCircle2 size={14} />}
      {loading ? 'Se procesează...' : 'Marchează finalizat'}
    </Button>
  )
}
