import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getAuthUser } from '@/services/auth.service'
import { getUserCreatedEvents, getMyEventsStats, getMyEventsChartData, getViewsEvolution } from '@/services/user.service'
import { EventsStatsSection } from './_components/EventsStatsSection'
import { EventsChartsSection } from './_components/EventsChartsSection'
import { EventsListSection } from './_components/EventsListSection'
import { EventsEvolutionChartClient } from './_components/EventsEvolutionChartClient'

export const metadata: Metadata = { title: 'Evenimentele mele — CIVICOM' }

export default async function PanouEvenimentePage() {
    const user = await getAuthUser()
    if (!user) redirect('/autentificare')

    const [stats, chartData, events, evolutionData] = await Promise.all([
        getMyEventsStats('user'),
        getMyEventsChartData('user'),
        getUserCreatedEvents(),
        getViewsEvolution('user', 'today'),
    ])

    return (
        <div className="relative min-h-screen animate-fade-in-up">

            <div className="pointer-events-none absolute inset-0 overflow-hidden -z-10">
                <div className="absolute -left-1/4 top-0 h-[400px] w-[400px] rounded-full bg-primary/5 blur-[100px]" />
            </div>

            <div className="px-4 lg:px-8 py-8 pb-16 space-y-10">

                <div className="flex flex-col gap-2 border-b border-border/50 pb-6">
                    <h1 className="font-heading text-3xl font-black uppercase tracking-tighter text-foreground md:text-4xl">
                        Evenimentele <span className="text-primary">Mele</span>
                    </h1>
                    <p className="text-base text-muted-foreground">
                        Urmărește statisticile și activitatea ta civică.
                    </p>
                </div>

                <div className="space-y-10">
                    <EventsStatsSection stats={stats} />
                    <EventsChartsSection data={chartData} />
                    <EventsEvolutionChartClient initialData={evolutionData} />
                    <EventsListSection events={events} />
                </div>

            </div>
        </div>
    )
}
