import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getAuthUser } from '@/services/auth.service'
import { getUserCreatedEvents, getMyEventsStats, getMyEventsChartData, getOrgCreatedEvents, getEvolutionData } from '@/services/user.service'
import { getUserOrgByAuthId } from '@/lib/server-cache'
import { EventsStatsSection } from './_components/EventsStatsSection'
import { EventsChartsSection } from './_components/EventsChartsSection'
import { EventsListSection } from './_components/EventsListSection'
import { EventsEvolutionChartClient } from './_components/EventsEvolutionChartClient'

export const metadata: Metadata = { title: 'Evenimentele mele — CIVICOM' }

export default async function PanouEvenimentePage({
                                                      searchParams,
                                                  }: {
    searchParams: Promise<{ context?: string }>
}) {
    const { context } = await searchParams
    const user = await getAuthUser()
    if (!user) redirect('/autentificare')

    const org = await getUserOrgByAuthId(user.id)
    const isOrgContext = context === 'org' && !!org

    const [stats, chartData, events, evolutionData] = await Promise.all([
        getMyEventsStats(isOrgContext ? 'org' : 'user', org?.id),
        getMyEventsChartData(isOrgContext ? 'org' : 'user', org?.id),
        isOrgContext && org ? getOrgCreatedEvents(org.id) : getUserCreatedEvents(),
        getEvolutionData('30d', 'participants', isOrgContext ? 'org' : 'user', org?.id),
    ])

    return (
        <div className="relative min-h-screen animate-fade-in-up">

            {/* Efect de glow ambiental subtil (fundal) */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden -z-10">
                <div className="absolute -left-1/4 top-0 h-[400px] w-[400px] rounded-full bg-primary/5 blur-[100px]" />
            </div>

            <div className="px-4 lg:px-8 py-8 pb-16 space-y-10">

            {/* Header Dashboard */}
            <div className="flex flex-col gap-2 border-b border-border/50 pb-6">
                <h1 className="font-heading text-3xl font-black uppercase tracking-tighter text-foreground md:text-4xl">
                    {isOrgContext ? (
                        <>Evenimente <span className="text-primary">{org!.name}</span></>
                    ) : (
                        <>Evenimentele <span className="text-primary">Mele</span></>
                    )}
                </h1>
                <p className="text-base text-muted-foreground">
                    {isOrgContext
                        ? 'Gestionează evenimentele și analizează impactul organizației tale.'
                        : 'Urmărește statisticile și activitatea ta civică.'
                    }
                </p>
            </div>

            {/* Secțiunile de conținut spațiate generos */}
            <div className="space-y-10">
                <EventsStatsSection stats={stats} />
                <EventsChartsSection data={chartData} />
                <EventsEvolutionChartClient
                    initialData={evolutionData}
                    isOrgContext={isOrgContext}
                    orgId={org?.id}
                />
                <EventsListSection events={events} />
            </div>

            </div>{/* end padding wrapper */}
        </div>
    )
}