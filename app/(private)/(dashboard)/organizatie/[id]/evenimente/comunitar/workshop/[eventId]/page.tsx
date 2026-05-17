import { notFound, redirect } from 'next/navigation'
import { getAuthUser } from '@/services/auth.service'
import { getWorkshopStats, getEventViewsEvolution } from '@/services/stats.service'
import { WorkshopStatsHeader } from '@/app/(private)/(dashboard)/panou/evenimente/comunitar/workshop/[id]/_components/WorkshopStatsHeader'
import { CommunityPhysicalKpiBanner } from '@/app/(private)/(dashboard)/panou/evenimente/comunitar/outdoor/[id]/_components/CommunityPhysicalKpiBanner'
import { FillRateCard } from '@/app/(private)/(dashboard)/panou/evenimente/protest/[id]/_components/FillRateCard'
import { DemographicsSection } from '@/app/(private)/(dashboard)/panou/evenimente/protest/[id]/_components/DemographicsSection'
import { RegistrationsChartsClient } from '@/app/(private)/(dashboard)/panou/evenimente/protest/[id]/_components/RegistrationsChartsClient'
import { SingleEventViewsChartClient } from '@/app/(private)/(dashboard)/panou/evenimente/protest/[id]/_components/SingleEventViewsChartClient'
import { ParticipantsListClient } from '@/app/(private)/(dashboard)/panou/evenimente/protest/[id]/_components/ParticipantsListClient'
import { FeedbackStatsSection } from '@/app/(private)/(dashboard)/panou/evenimente/protest/[id]/_components/FeedbackStatsSection'

type PageProps = { params: Promise<{ id: string; eventId: string }> }

export default async function OrgWorkshopStatsPage({ params }: PageProps) {
  const { id, eventId } = await params
  const user = await getAuthUser()
  if (!user) redirect('/autentificare')

  const [statsData, viewsData] = await Promise.all([
    getWorkshopStats(eventId, 'org', id),
    getEventViewsEvolution(eventId, 'today'),
  ])

  if (!statsData) notFound()

  return (
    <div className="relative min-h-screen animate-fade-in-up">
      <div className="pointer-events-none absolute inset-0 overflow-hidden -z-10">
        <div className="absolute -left-1/4 top-0 h-[400px] w-[400px] rounded-full bg-primary/5 blur-[100px]" />
      </div>
      <div className="px-4 lg:px-8 py-8 pb-16 space-y-10">
        <WorkshopStatsHeader data={statsData} backHref={`/organizatie/${id}/evenimente`} />
        <CommunityPhysicalKpiBanner data={statsData} badgeLabel="Statistici workshop" />
        <FillRateCard participants={statsData.participants} maxParticipants={statsData.max_participants} />
        <DemographicsSection participants={statsData.participants} />
        <RegistrationsChartsClient
          participants={statsData.participants}
          createdAt={statsData.created_at}
          eventDate={statsData.date}
        />
        <SingleEventViewsChartClient eventId={eventId} initialData={viewsData} />
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
