import { CalendarDays, Users, Building2, MapPin } from 'lucide-react'
import type { HomepageStats } from '@/services/homepage.service'
import { StatsCounterClient } from './StatsCounterClient'

type Props = { stats: HomepageStats }

const ICONS = [CalendarDays, Users, Building2, MapPin]
const LABELS = ['Evenimente organizate', 'Utilizatori activi', 'ONG-uri aprobate', 'Orașe acoperite']

export function StatsSection({ stats }: Props) {
  const values = [stats.eventsCount, stats.volunteersCount, stats.orgsCount, stats.citiesCount]

  return (
    <section className="bg-foreground py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
          {values.map((value, i) => {
            const Icon = ICONS[i]
            return (
              <div key={i} className="flex flex-col items-center gap-2 text-center">
                <Icon className="size-6 text-primary" />
                <p className="text-4xl font-black italic tracking-tighter text-primary lg:text-6xl">
                  <StatsCounterClient value={value} />
                  <span>+</span>
                </p>
                <p className="text-sm font-medium text-background/70">{LABELS[i]}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
