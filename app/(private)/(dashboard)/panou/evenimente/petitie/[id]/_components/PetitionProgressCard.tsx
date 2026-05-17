import { FileText } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import type { PetitionStatsData } from '@/services/stats.service'

type Props = { data: PetitionStatsData }

export function PetitionProgressCard({ data }: Props) {
  const signed = data.signers.length
  const target = data.target_signatures
  const pct = target > 0 ? Math.min(100, Math.round((signed / target) * 100)) : 0

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-card/50 p-5">
      <div className="flex items-center gap-2 border-b border-border/50 pb-2">
        <FileText className="size-5 text-primary" />
        <h2 className="font-heading text-xl font-bold tracking-tight text-foreground">
          Progres semnături
        </h2>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Semnate</span>
        <span className="font-semibold text-foreground">
          {signed.toLocaleString('ro-RO')} / {target.toLocaleString('ro-RO')}
        </span>
      </div>
      <Progress value={pct} className="h-3 bg-muted" />
      <p className="text-right text-sm font-bold text-primary">{pct}% din obiectiv</p>

      {data.requested_from && (
        <div className="mt-2 rounded-lg bg-muted/50 px-4 py-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Adresată către</p>
          <p className="mt-1 text-sm font-semibold text-foreground">{data.requested_from}</p>
        </div>
      )}
    </div>
  )
}
