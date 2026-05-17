import { Eye, Users, Ticket, Heart } from 'lucide-react'
import { StatsBanner } from '@/components/shared/StatsBanner'
import type { CharityLiveEventStatsData } from '@/services/stats.service'

type Props = { data: CharityLiveEventStatsData; badgeLabel: string }

export function CharityLiveKpiBanner({ data, badgeLabel }: Props) {
  const joined = data.participants.filter(p => p.status === 'joined').length
  const raisedPct = data.target_amount && data.target_amount > 0 && data.collected_amount
    ? Math.min(100, Math.round((data.collected_amount / data.target_amount) * 100))
    : null
  const ratingValue = data.status === 'completed' && data.averageRating > 0
    ? `${data.averageRating.toFixed(1)} ★` : '—'

  return (
    <StatsBanner
      badge={badgeLabel}
      title="Reach eveniment"
      subtitle={data.title}
      items={[
        { icon: Eye,    iconClassName: 'size-4 text-primary',   value: data.view_count,                         label: 'Vizualizări' },
        { icon: Users,  iconClassName: 'size-4 text-secondary', value: joined,                                   label: 'Participanți' },
        { icon: Ticket, iconClassName: 'size-4 text-primary',   value: data.ticket_price ? `${data.ticket_price} RON` : '—', label: 'Preț bilet' },
        { icon: Heart,  iconClassName: 'size-4 text-secondary', value: raisedPct !== null ? `${raisedPct}%` : ratingValue, label: raisedPct !== null ? 'Din obiectiv' : 'Rating' },
      ]}
    />
  )
}
