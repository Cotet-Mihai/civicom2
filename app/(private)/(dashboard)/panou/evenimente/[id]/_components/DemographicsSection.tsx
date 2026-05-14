import { Users2 } from 'lucide-react'
import { DemographicsChartsClient } from './DemographicsChartsClient'
import type { ProtestParticipant } from '@/services/stats.service'

type Props = { participants: ProtestParticipant[] }

export function DemographicsSection({ participants }: Props) {
  const joined = participants.filter(p => p.status === 'joined')

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 border-b border-border/50 pb-2">
        <Users2 className="size-5 text-primary" />
        <h2 className="font-heading text-xl font-bold tracking-tight text-foreground">
          Demografice Participanți
        </h2>
        <span className="ml-auto text-xs text-muted-foreground font-medium">
          {joined.length} participanți (joined)
        </span>
      </div>
      <DemographicsChartsClient participants={joined} />
    </div>
  )
}
