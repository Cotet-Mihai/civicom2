import { notFound, redirect } from 'next/navigation'
import { getAuthUser } from '@/services/auth.service'
import { getProtestStats, getEventViewsEvolution } from '@/services/stats.service'
import { ProtestStatsHeader } from './_components/ProtestStatsHeader'
import { StatsKpiBanner } from './_components/StatsKpiBanner'
import { FillRateCard } from './_components/FillRateCard'
import { DemographicsSection } from './_components/DemographicsSection'
import { RegistrationsChartsClient } from './_components/RegistrationsChartsClient'
import { SingleEventViewsChartClient } from './_components/SingleEventViewsChartClient'
import { ParticipantsListClient } from './_components/ParticipantsListClient'
import { FeedbackStatsSection } from './_components/FeedbackStatsSection'

type PageProps = { params: Promise<{ id: string }> }

export default async function ProtestStatsPage({ params }: PageProps) {
  const { id } = await params
  const user = await getAuthUser()
  if (!user) redirect('/autentificare')

  const [statsData, viewsData] = await Promise.all([
    getProtestStats(id, 'user'),
    getEventViewsEvolution(id, 'today'),
  ])

  if (!statsData) notFound()

  return (
    <div className="relative min-h-screen animate-fade-in-up">
      <div className="pointer-events-none absolute inset-0 overflow-hidden -z-10">
        <div className="absolute -left-1/4 top-0 h-[400px] w-[400px] rounded-full bg-primary/5 blur-[100px]" />
      </div>

      <div className="px-4 lg:px-8 py-8 pb-16 space-y-10">
        <ProtestStatsHeader data={statsData} backHref="/panou/evenimente" />
        <StatsKpiBanner data={statsData} />
        <FillRateCard data={statsData} />
        <DemographicsSection participants={statsData.participants} />
        <RegistrationsChartsClient
          participants={statsData.participants}
          createdAt={statsData.created_at}
          protestDate={statsData.date}
        />
        <SingleEventViewsChartClient eventId={id} initialData={viewsData} />
        <ParticipantsListClient participants={statsData.participants} />
        <FeedbackStatsSection
          feedback={statsData.feedback}
          averageRating={statsData.averageRating}
          status={statsData.status}
        />
      </div>
    </div>
  )
}
