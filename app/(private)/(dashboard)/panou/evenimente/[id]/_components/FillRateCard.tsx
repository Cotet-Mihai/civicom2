import { Users, CheckCircle2, XCircle, Target } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import type { ProtestStatsData } from '@/services/stats.service'

type Props = { data: ProtestStatsData }

export function FillRateCard({ data }: Props) {
  const joined = data.participants.filter(p => p.status === 'joined').length
  const cancelled = data.participants.filter(p => p.status === 'cancelled').length
  const remaining = Math.max(0, data.max_participants - joined)
  const fillPct = data.max_participants > 0 ? (joined / data.max_participants) * 100 : 0
  const isNearFull = fillPct >= 90

  return (
    <Card className="overflow-hidden rounded-2xl border border-border bg-card/50 transition-all hover:border-primary/30">
      <CardContent className="p-5 space-y-5">

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Target className="size-4 text-primary" />
            <h3 className="font-bold text-foreground">Grad de ocupare</h3>
          </div>
          {isNearFull && (
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-primary text-primary-foreground">
              Aproape complet
            </span>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-foreground flex items-center gap-1.5">
              <Users className="size-4 text-primary" />
              {joined} / {data.max_participants} locuri
            </span>
            <span className="font-black text-2xl tracking-tighter text-foreground italic">
              {Math.round(fillPct)}%
            </span>
          </div>
          <Progress value={fillPct} className="h-3" />
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: CheckCircle2, label: 'Joined',  value: joined,    color: 'text-primary' },
            { icon: XCircle,      label: 'Anulat',  value: cancelled, color: 'text-destructive' },
            { icon: Target,       label: 'Rămase',  value: remaining, color: 'text-muted-foreground' },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="flex flex-col items-center gap-1 rounded-xl bg-muted/50 p-3">
              <Icon className={`size-4 ${color}`} />
              <span className="font-black text-xl tracking-tighter text-foreground">{value}</span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>

      </CardContent>
    </Card>
  )
}
