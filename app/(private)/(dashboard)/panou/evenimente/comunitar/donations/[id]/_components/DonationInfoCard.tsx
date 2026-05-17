import { Heart, Package, Coins } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import type { DonationActivityStatsData } from '@/services/stats.service'

type Props = { data: DonationActivityStatsData }

export function DonationInfoCard({ data }: Props) {
  if (data.donation_type === 'material') {
    return (
      <div className="space-y-4 rounded-2xl border border-border bg-card/50 p-5">
        <div className="flex items-center gap-2 border-b border-border/50 pb-2">
          <Package className="size-5 text-primary" />
          <h2 className="font-heading text-xl font-bold tracking-tight text-foreground">
            Materiale necesare
          </h2>
        </div>
        {data.what_is_needed && data.what_is_needed.length > 0 ? (
          <ul className="space-y-2">
            {data.what_is_needed.map((item, i) => (
              <li key={i} className="flex items-center gap-2 rounded-lg bg-muted/50 px-4 py-2">
                <Heart className="size-3.5 text-primary shrink-0" />
                <span className="text-sm text-foreground">{item}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">Nu au fost specificate materiale.</p>
        )}
      </div>
    )
  }

  const pct = data.target_amount && data.target_amount > 0
    ? Math.min(100, Math.round((data.participants_count / data.target_amount) * 100))
    : 0

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-card/50 p-5">
      <div className="flex items-center gap-2 border-b border-border/50 pb-2">
        <Coins className="size-5 text-primary" />
        <h2 className="font-heading text-xl font-bold tracking-tight text-foreground">
          Obiectiv monetar
        </h2>
      </div>
      {data.target_amount ? (
        <>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Donatori</span>
            <span className="font-semibold text-foreground">
              {data.participants_count.toLocaleString('ro-RO')} participanți
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Obiectiv</span>
            <span className="font-semibold text-foreground">
              {data.target_amount.toLocaleString('ro-RO')} RON
            </span>
          </div>
          <Progress value={pct} className="h-3 bg-muted" />
        </>
      ) : (
        <p className="text-sm text-muted-foreground">Niciun obiectiv monetar specificat.</p>
      )}
    </div>
  )
}
