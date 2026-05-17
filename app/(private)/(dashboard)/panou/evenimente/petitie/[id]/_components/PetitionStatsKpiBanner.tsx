import { Eye, PenLine, Target, Star } from 'lucide-react'
import { StatsBanner } from '@/components/shared/StatsBanner'
import type { PetitionStatsData } from '@/services/stats.service'

type Props = { data: PetitionStatsData }

export function PetitionStatsKpiBanner({ data }: Props) {
  const signed = data.signers.length
  const pct = data.target_signatures > 0
    ? Math.min(100, Math.round((signed / data.target_signatures) * 100))
    : 0
  const ratingValue = data.status === 'completed' && data.averageRating > 0
    ? `${data.averageRating.toFixed(1)} ★` : '—'

  return (
    <StatsBanner
      badge="Statistici petiție"
      title="Reach petiție"
      subtitle={data.title}
      items={[
        { icon: Eye,     iconClassName: 'size-4 text-primary',    value: data.view_count,  label: 'Vizualizări' },
        { icon: PenLine, iconClassName: 'size-4 text-secondary',  value: signed,            label: 'Semnatari' },
        { icon: Target,  iconClassName: 'size-4 text-primary',    value: `${pct}%`,         label: 'Din obiectiv' },
        { icon: Star,    iconClassName: 'size-4 text-secondary',  value: ratingValue,       label: 'Rating' },
      ]}
    />
  )
}
