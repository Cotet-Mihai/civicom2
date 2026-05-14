import { Eye, Users, Target, Star } from 'lucide-react'
import { StatsBanner } from '@/components/shared/StatsBanner'
import type { ProtestStatsData } from '@/services/stats.service'

type Props = { data: ProtestStatsData }

export function StatsKpiBanner({ data }: Props) {
  const joined = data.participants.filter(p => p.status === 'joined').length
  const fillRate = data.max_participants > 0
    ? Math.round((joined / data.max_participants) * 100)
    : 0
  const ratingValue = data.status === 'completed' && data.averageRating > 0
    ? `${data.averageRating.toFixed(1)} ★`
    : '—'

  return (
    <StatsBanner
      badge="Statistici eveniment"
      title="Reach eveniment"
      subtitle={data.title}
      items={[
        { icon: Eye,    iconClassName: 'size-4 text-primary',          value: data.view_count, label: 'Vizualizări' },
        { icon: Users,  iconClassName: 'size-4 text-secondary',        value: joined,          label: 'Participanți' },
        { icon: Target, iconClassName: 'size-4 text-primary',           value: `${fillRate}%`,  label: 'Fill Rate' },
        { icon: Star,   iconClassName: 'size-4 text-secondary',        value: ratingValue,     label: 'Rating' },
      ]}
    />
  )
}
