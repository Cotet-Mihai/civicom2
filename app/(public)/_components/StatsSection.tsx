import { CalendarDays, Users, Building2, MapPin } from 'lucide-react'
import type { HomepageStats } from '@/services/homepage.service'
import { StatsCounterClient } from './StatsCounterClient'

type Props = { stats: HomepageStats }

const STATS_CONFIG = [
    { key: 'eventsCount', label: 'Evenimente organizate', icon: CalendarDays },
    { key: 'volunteersCount', label: 'Utilizatori activi', icon: Users },
    { key: 'orgsCount', label: 'ONG-uri aprobate', icon: Building2 },
    { key: 'citiesCount', label: 'Orașe acoperite', icon: MapPin },
]

export function StatsSection({ stats }: Props) {
    return (
        <section className="relative overflow-hidden bg-foreground py-20 lg:py-4 cursor-default">
            {/* Elemente decorative de fundal */}
            <div className="absolute left-1/2 top-0 -translate-x-1/2 blur-3xl opacity-20 pointer-events-none">
                <div className="aspect-[1100/500] w-7xl bg-gradient-to-tr from-primary/50 to-primary"  />
            </div>

            <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
                <div className="grid grid-cols-2 gap-y-12 gap-x-4 sm:gap-x-8 lg:grid-cols-4">
                    {STATS_CONFIG.map((stat, i) => {
                        const Icon = stat.icon
                        const value = stats[stat.key as keyof HomepageStats]

                        return (
                            <div
                                key={i}
                                className="group relative flex flex-col items-center justify-center p-6 transition-all duration-300 hover:-translate-y-2"
                            >
                                {/* Glow effect la hover */}
                                <div className="absolute inset-0 scale-75 bg-primary/10 opacity-0 blur-2xl transition-all duration-500 group-hover:scale-110 group-hover:opacity-100" />

                                <div className="relative mb-4 rounded-2xl bg-background/5 p-3 ring-1 ring-white/10 transition-colors group-hover:bg-primary/20">
                                    <Icon className="size-8 text-primary transition-transform duration-500 group-hover:scale-110" />
                                </div>

                                <div className="relative space-y-1 text-center">
                                    <h3 className="text-5xl font-extrabold tracking-tight text-white lg:text-6xl">
                                    <span className="bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">
                                        <StatsCounterClient value={value} />
                                    </span>
                                    </h3>
                                    <p className="text-sm font-semibold uppercase tracking-wider text-background/50">
                                        {stat.label}
                                    </p>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </section>
    )
}