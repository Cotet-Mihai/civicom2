'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { createAppeal } from '@/services/appeal.service'

type Props = { eventId: string }

export function AppealFormClient({ eventId }: Props) {
  const [reason, setReason] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (reason.trim().length < 20) {
      toast.error('Motivul trebuie să aibă minim 20 de caractere')
      return
    }
    setIsLoading(true)
    const result = await createAppeal(eventId, reason)
    setIsLoading(false)
    if ('error' in result) {
      toast.error(result.error)
      return
    }
    toast.success('Contestație trimisă cu succes')
    router.push('/panou/contestatii')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
          Motivul contestației
        </label>
        <Textarea
          value={reason}
          onChange={e => setReason(e.target.value)}
          placeholder="Explică de ce crezi că evenimentul tău trebuie reconsiderat. Furnizează context relevant, corecturi sau clarificări... (minim 20 de caractere)"
          rows={6}
          className="text-sm resize-none"
          disabled={isLoading}
        />
        <p className="text-xs text-muted-foreground text-right">{reason.trim().length} / minim 20</p>
      </div>
      <Button type="submit" disabled={isLoading || reason.trim().length < 20} className="w-full sm:w-auto">
        {isLoading
          ? <><Loader2 size={15} className="mr-2 animate-spin" />Se trimite...</>
          : <><Send size={15} className="mr-2" />Trimite contestația</>
        }
      </Button>
    </form>
  )
}
