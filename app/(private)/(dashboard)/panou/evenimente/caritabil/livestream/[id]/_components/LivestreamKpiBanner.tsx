import { Eye, Users, Heart, Star } from 'lucide-react'
import { StatsBanner } from '@/components/shared/StatsBanner'
import type { LivestreamStatsData } from '@/services/stats.service'

type Props = { data: LivestreamStatsData }

export function LivestreamKpiBanner({ data }: Props) {
  const joined = data.participants.filter(p => p.status === 'joined').length
  const raisedPct = data.target_amount && data.target_amount > 0 && data.collected_amount
    ? Math.min(100, Math.round((data.collected_amount / data.target_amount) * 100))
    : null
  const ratingValue = data.status === 'completed' && data.averageRating > 0
    ? `${data.averageRating.toFixed(1)} ★` : '—'

  return (
    <StatsBanner
      badge="Statistici livestream"
      title="Reach livestream"
      subtitle={data.title}
      items={[
        { icon: Eye,   iconClassName: 'size-4 text-primary',   value: data.view_count,                         label: 'Vizualizări' },
        { icon: Users, iconClassName: 'size-4 text-secondary', value: joined,                                   label: 'Participanți' },
        { icon: Heart, iconClassName: 'size-4 text-primary',   value: raisedPct !== null ? `${raisedPct}%` : '—', label: 'Din obiectiv' },
        { icon: Star,  iconClassName: 'size-4 text-secondary', value: ratingValue,                               label: 'Rating' },
      ]}
    />
  )
}
