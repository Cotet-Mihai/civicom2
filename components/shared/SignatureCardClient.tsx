'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { FileSignature, Loader2, CheckCircle2 } from 'lucide-react'
import { usePetitionSign } from '@/hooks/usePetitionSign'

type Props = {
  eventId: string
  signaturesCount: number
  targetSignatures: number
  status: 'pending' | 'approved' | 'rejected' | 'contested' | 'completed'
}

export function SignatureCardClient({ eventId, signaturesCount, targetSignatures, status }: Props) {
  const { isSigned, isLoading, sign } = usePetitionSign(eventId)
  const pct = targetSignatures > 0 ? Math.min(100, Math.round((signaturesCount / targetSignatures) * 100)) : 0
  const isCompleted = status === 'completed'
  const isApproved = status === 'approved'

  return (
    <Card className="shadow-lg shadow-black/5 border-border">
      <CardContent className="p-6 space-y-4">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          <FileSignature size={14} />
          Semnături
        </h3>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progres</span>
            <span className="text-3xl font-black italic tracking-tighter text-primary leading-none">
              {signaturesCount}{' '}
              <span className="text-sm font-normal text-muted-foreground not-italic">
                / {targetSignatures}
              </span>
            </span>
          </div>
          <Progress value={pct} className="h-2 bg-muted" />
        </div>

        {isCompleted ? (
          <div className="rounded-lg bg-primary/10 border border-primary/20 px-4 py-2.5 text-center text-sm font-semibold text-primary">
            Petiție finalizată
          </div>
        ) : isApproved ? (
          isSigned ? (
            <Button variant="outline" className="w-full gap-2" disabled>
              <CheckCircle2 size={16} className="text-primary" />
              Ai semnat
            </Button>
          ) : (
            <Button className="w-full" onClick={sign} disabled={isLoading}>
              {isLoading
                ? <Loader2 size={16} className="animate-spin" />
                : 'Semnează petiția'}
            </Button>
          )
        ) : null}
      </CardContent>
    </Card>
  )
}
