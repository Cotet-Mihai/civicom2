'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { FileSignature } from 'lucide-react'

type Props = {
  signaturesCount: number
  targetSignatures: number
  status: 'pending' | 'approved' | 'rejected' | 'contested' | 'completed'
}

export function SignatureCardClient({ signaturesCount, targetSignatures, status }: Props) {
  const pct = targetSignatures > 0 ? Math.min(100, Math.round((signaturesCount / targetSignatures) * 100)) : 0
  const isCompleted = status === 'completed'

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
        ) : (
          <Button className="w-full" disabled>
            Semnează
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
