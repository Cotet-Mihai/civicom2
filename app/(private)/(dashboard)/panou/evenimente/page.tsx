import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getAuthUser } from '@/services/auth.service'
import { getUserCreatedEvents, getMyEventsStats, getMyEventsChartData, getOrgCreatedEvents } from '@/services/user.service'
import { getUserOrgByAuthId } from '@/lib/server-cache'
import { EventsStatsSection } from './_components/EventsStatsSection'
import { EventsChartsSection } from './_components/EventsChartsSection'
import { EventsListSection } from './_components/EventsListSection'

export const metadata: Metadata = { title: 'Evenimentele mele' }

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

  const [stats, chartData, events] = await Promise.all([
    getMyEventsStats(isOrgContext ? 'org' : 'user', org?.id),
    getMyEventsChartData(isOrgContext ? 'org' : 'user', org?.id),
    isOrgContext && org ? getOrgCreatedEvents(org.id) : getUserCreatedEvents(),
  ])

  return (
    <div className="px-4 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-foreground">
          {isOrgContext ? `Evenimente ${org!.name}` : 'Evenimentele mele'}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {isOrgContext ? 'Statistici și activitate ONG' : 'Statistici și activitate personală'}
        </p>
      </div>

      <EventsStatsSection stats={stats} />
      <EventsChartsSection data={chartData} />
      <EventsListSection events={events} />
    </div>
  )
}
