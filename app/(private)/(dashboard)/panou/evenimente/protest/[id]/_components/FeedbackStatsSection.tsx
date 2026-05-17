import { Star } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import type { ProtestFeedbackItem } from '@/services/stats.service'

type Props = {
  feedback: ProtestFeedbackItem[]
  averageRating: number
  status: string
}

export function FeedbackStatsSection({ feedback, averageRating, status }: Props) {
  if (status !== 'completed') return null

  const dist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  feedback.forEach(f => { dist[f.rating] = (dist[f.rating] ?? 0) + 1 })

  function initials(name: string) {
    return name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 border-b border-border/50 pb-2">
        <Star className="size-5 text-primary fill-primary" />
        <h2 className="font-heading text-xl font-bold tracking-tight text-foreground">
          Feedback ({feedback.length})
        </h2>
      </div>

      {feedback.length === 0 ? (
        <p className="text-sm text-muted-foreground italic py-8 text-center">
          Niciun feedback înregistrat.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          <Card className="overflow-hidden rounded-2xl border border-border bg-card/50">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center gap-4">
                <span className="text-5xl font-black italic tracking-tighter text-primary">
                  {averageRating.toFixed(1)}
                </span>
                <div className="space-y-1">
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star
                        key={i}
                        className={`size-5 ${i < Math.round(averageRating) ? 'fill-primary text-primary' : 'text-muted-foreground/30'}`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {feedback.length} {feedback.length === 1 ? 'recenzie' : 'recenzii'}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                {[5, 4, 3, 2, 1].map(star => {
                  const count = dist[star] ?? 0
                  const pct = feedback.length > 0 ? Math.round((count / feedback.length) * 100) : 0
                  return (
                    <div key={star} className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-muted-foreground w-3">{star}</span>
                      <Star className="size-3 fill-primary text-primary shrink-0" />
                      <Progress value={pct} className="h-2 flex-1" />
                      <span className="text-xs font-semibold text-muted-foreground w-8 text-right">{pct}%</span>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
            {feedback.map(f => (
              <div key={f.id} className="flex gap-3">
                <div className="size-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-black text-xs text-primary shrink-0">
                  {initials(f.user_name)}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-foreground">{f.user_name}</span>
                    <div className="flex gap-0.5 shrink-0">
                      {Array.from({ length: 5 }, (_, i) => (
                        <Star key={i} className={`size-3 ${i < f.rating ? 'fill-primary text-primary' : 'text-muted-foreground/30'}`} />
                      ))}
                    </div>
                  </div>
                  {f.comment && (
                    <p className="text-sm text-muted-foreground leading-relaxed">{f.comment}</p>
                  )}
                  <p className="text-xs text-muted-foreground/60">
                    {new Date(f.created_at).toLocaleDateString('ro-RO', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </div>
            ))}
          </div>

        </div>
      )}
    </div>
  )
}
