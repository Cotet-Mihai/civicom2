import { getFeedback } from '@/services/feedback.service'
import { Star } from 'lucide-react'

type Props = { eventId: string; status: string }

export async function FeedbackSection({ eventId, status }: Props) {
  if (status !== 'completed') return null

  const { feedbacks, averageRating, totalCount } = await getFeedback(eventId)

  if (totalCount === 0) {
    return (
      <section className="space-y-4 pt-4 border-t border-border">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          <Star size={14} />
          Feedback participanți
        </h3>
        <p className="text-sm text-muted-foreground italic">Niciun feedback încă.</p>
      </section>
    )
  }

  return (
    <section className="space-y-6 pt-4 border-t border-border">
      <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
        <Star size={14} />
        Feedback participanți
      </h3>

      <div className="flex items-center gap-4">
        <span className="text-4xl font-black italic tracking-tighter text-primary">
          {averageRating.toFixed(1)}
        </span>
        <div className="space-y-1">
          <div className="flex gap-0.5">
            {Array.from({ length: 5 }, (_, i) => (
              <Star
                key={i}
                size={16}
                className={
                  i < Math.round(averageRating)
                    ? 'fill-primary text-primary'
                    : 'text-muted-foreground/30'
                }
              />
            ))}
          </div>
          <p className="text-xs text-muted-foreground">{totalCount} recenzii</p>
        </div>
      </div>

      <ul className="space-y-5">
        {feedbacks.map((f) => (
          <li key={f.id} className="flex gap-3">
            <div className="size-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-black text-xs text-primary shrink-0">
              {f.user.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-foreground">{f.user.name}</span>
                <div className="flex gap-0.5 shrink-0">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star
                      key={i}
                      size={12}
                      className={
                        i < f.rating
                          ? 'fill-primary text-primary'
                          : 'text-muted-foreground/30'
                      }
                    />
                  ))}
                </div>
              </div>
              {f.comment && (
                <p className="text-sm text-muted-foreground leading-relaxed">{f.comment}</p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
