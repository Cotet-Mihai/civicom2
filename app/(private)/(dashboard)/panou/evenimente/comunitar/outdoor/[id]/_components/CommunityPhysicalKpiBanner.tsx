import { Eye, Users, Target, Star } from 'lucide-react'
import { StatsBanner } from '@/components/shared/StatsBanner'
import type { CommunityPhysicalStatsData } from '@/services/stats.service'

type Props = { data: CommunityPhysicalStatsData; badgeLabel: string }

export function CommunityPhysicalKpiBanner({ data, badgeLabel }: Props) {
  const joined = data.participants.filter(p => p.status === 'joined').length
  const fillRate = data.max_participants && data.max_participants > 0
    ? Math.round((joined / data.max_participants) * 100)
    : null
  const ratingValue = data.status === 'completed' && data.averageRating > 0
    ? `${data.averageRating.toFixed(1)} ★` : '—'

  return (
    <StatsBanner
      badge={badgeLabel}
      title="Reach eveniment"
      subtitle={data.title}
      items={[
        { icon: Eye,    iconClassName: 'size-4 text-primary',   value: data.view_count,                   label: 'Vizualizări' },
        { icon: Users,  iconClassName: 'size-4 text-secondary', value: joined,                             label: 'Participanți' },
        { icon: Target, iconClassName: 'size-4 text-primary',   value: fillRate !== null ? `${fillRate}%` : '—', label: 'Fill Rate' },
        { icon: Star,   iconClassName: 'size-4 text-secondary', value: ratingValue,                        label: 'Rating' },
      ]}
    />
  )
}
