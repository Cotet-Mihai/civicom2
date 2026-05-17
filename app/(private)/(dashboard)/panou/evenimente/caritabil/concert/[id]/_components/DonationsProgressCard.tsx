import { Heart } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import type { CharityLiveEventStatsData, LivestreamStatsData } from '@/services/stats.service'

type Props = { data: CharityLiveEventStatsData | LivestreamStatsData }

export function DonationsProgressCard({ data }: Props) {
  const target = data.target_amount
  const collected = data.collected_amount
  const pct = target && target > 0 && collected
    ? Math.min(100, Math.round((collected / target) * 100))
    : 0

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-card/50 p-5">
      <div className="flex items-center gap-2 border-b border-border/50 pb-2">
        <Heart className="size-5 text-primary" />
        <h2 className="font-heading text-xl font-bold tracking-tight text-foreground">
          Fonduri strânse
        </h2>
      </div>

      {target ? (
        <>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Strânse</span>
            <span className="font-semibold text-foreground">
              {(collected ?? 0).toLocaleString('ro-RO')} RON
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Obiectiv</span>
            <span className="font-semibold text-foreground">
              {target.toLocaleString('ro-RO')} RON
            </span>
          </div>
          <Progress value={pct} className="h-3 bg-muted" />
          <p className="text-right text-sm font-bold text-primary">{pct}% din obiectiv</p>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">Niciun obiectiv de strângere specificat.</p>
      )}
    </div>
  )
}
