import { Users, CheckCircle2, XCircle, Target, Infinity } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

type Props = {
  participants: Array<{ status: 'joined' | 'cancelled' }>
  maxParticipants: number | null
}

export function FillRateCard({ participants, maxParticipants }: Props) {
  const joined = participants.filter(p => p.status === 'joined').length
  const cancelled = participants.filter(p => p.status === 'cancelled').length
  const hasLimit = (maxParticipants ?? 0) > 0
  const remaining = hasLimit ? Math.max(0, maxParticipants! - joined) : null
  const fillPct = hasLimit ? (joined / maxParticipants!) * 100 : 0
  const isNearFull = hasLimit && fillPct >= 90
  const maxP = maxParticipants ?? 0

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
          {!hasLimit && (
            <span className="flex items-center gap-1 text-xs font-semibold text-muted-foreground">
              <Infinity className="size-3.5" />
              Fără limită
            </span>
          )}
        </div>

        {hasLimit && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-foreground flex items-center gap-1.5">
                <Users className="size-4 text-primary" />
                {joined} / {maxP} locuri
              </span>
              <span className="font-black text-2xl tracking-tighter text-foreground italic">
                {Math.round(fillPct)}%
              </span>
            </div>
            <Progress value={fillPct} className="h-3" />
          </div>
        )}

        <div className={`grid gap-3 ${hasLimit ? 'grid-cols-3' : 'grid-cols-2'}`}>
          {[
            { icon: CheckCircle2, label: 'Înscriși',  value: joined,    color: 'text-primary' },
            { icon: XCircle,      label: 'Anulat',    value: cancelled, color: 'text-destructive' },
            ...(remaining !== null ? [{ icon: Target, label: 'Rămase', value: remaining, color: 'text-muted-foreground' }] : []),
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
