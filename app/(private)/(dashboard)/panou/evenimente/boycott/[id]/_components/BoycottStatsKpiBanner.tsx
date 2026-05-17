import { Eye, Users, UserX, Star } from 'lucide-react'
import { StatsBanner } from '@/components/shared/StatsBanner'
import type { BoycottStatsData } from '@/services/stats.service'

type Props = { data: BoycottStatsData }

export function BoycottStatsKpiBanner({ data }: Props) {
  const joined = data.participants.filter(p => p.status === 'joined').length
  const cancelled = data.participants.filter(p => p.status === 'cancelled').length
  const ratingValue = data.status === 'completed' && data.averageRating > 0
    ? `${data.averageRating.toFixed(1)} ★` : '—'

  return (
    <StatsBanner
      badge="Statistici boycott"
      title="Reach boycott"
      subtitle={data.title}
      items={[
        { icon: Eye,     iconClassName: 'size-4 text-primary',    value: data.view_count, label: 'Vizualizări' },
        { icon: Users,   iconClassName: 'size-4 text-secondary',  value: joined,          label: 'Participanți activi' },
        { icon: UserX,   iconClassName: 'size-4 text-destructive', value: cancelled,      label: 'Anulat' },
        { icon: Star,    iconClassName: 'size-4 text-secondary',  value: ratingValue,     label: 'Rating' },
      ]}
    />
  )
}
