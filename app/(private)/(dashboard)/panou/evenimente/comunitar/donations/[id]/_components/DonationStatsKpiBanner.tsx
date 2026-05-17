import { Eye, Users, Package, Star } from 'lucide-react'
import { StatsBanner } from '@/components/shared/StatsBanner'
import type { DonationActivityStatsData } from '@/services/stats.service'

type Props = { data: DonationActivityStatsData }

export function DonationStatsKpiBanner({ data }: Props) {
  const joined = data.participants.filter(p => p.status === 'joined').length
  const ratingValue = data.status === 'completed' && data.averageRating > 0
    ? `${data.averageRating.toFixed(1)} ★` : '—'
  const donationTypeLabel = data.donation_type === 'material' ? 'Material' : 'Monetar'

  return (
    <StatsBanner
      badge="Statistici donații"
      title="Reach donații"
      subtitle={data.title}
      items={[
        { icon: Eye,     iconClassName: 'size-4 text-primary',   value: data.view_count,    label: 'Vizualizări' },
        { icon: Users,   iconClassName: 'size-4 text-secondary', value: joined,              label: 'Participanți' },
        { icon: Package, iconClassName: 'size-4 text-primary',   value: donationTypeLabel,   label: 'Tip donație' },
        { icon: Star,    iconClassName: 'size-4 text-secondary', value: ratingValue,          label: 'Rating' },
      ]}
    />
  )
}
