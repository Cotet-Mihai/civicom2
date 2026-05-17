import { notFound, redirect } from 'next/navigation'
import { getAuthUser } from '@/services/auth.service'
import { getPetitionStats, getEventViewsEvolution } from '@/services/stats.service'
import type { ProtestParticipant } from '@/services/stats.service'
import { PetitionStatsHeader } from '@/app/(private)/(dashboard)/panou/evenimente/petitie/[id]/_components/PetitionStatsHeader'
import { PetitionStatsKpiBanner } from '@/app/(private)/(dashboard)/panou/evenimente/petitie/[id]/_components/PetitionStatsKpiBanner'
import { PetitionProgressCard } from '@/app/(private)/(dashboard)/panou/evenimente/petitie/[id]/_components/PetitionProgressCard'
import { SignersListClient } from '@/app/(private)/(dashboard)/panou/evenimente/petitie/[id]/_components/SignersListClient'
import { DemographicsSection } from '@/app/(private)/(dashboard)/panou/evenimente/protest/[id]/_components/DemographicsSection'
import { RegistrationsChartsClient } from '@/app/(private)/(dashboard)/panou/evenimente/protest/[id]/_components/RegistrationsChartsClient'
import { SingleEventViewsChartClient } from '@/app/(private)/(dashboard)/panou/evenimente/protest/[id]/_components/SingleEventViewsChartClient'
import { FeedbackStatsSection } from '@/app/(private)/(dashboard)/panou/evenimente/protest/[id]/_components/FeedbackStatsSection'

type PageProps = { params: Promise<{ id: string; eventId: string }> }

export default async function OrgPetitionStatsPage({ params }: PageProps) {
  const { id, eventId } = await params
  const user = await getAuthUser()
  if (!user) redirect('/autentificare')

  const [statsData, viewsData] = await Promise.all([
    getPetitionStats(eventId, 'org', id),
    getEventViewsEvolution(eventId, 'today'),
  ])

  if (!statsData) notFound()

  const signersAsParticipants: ProtestParticipant[] = statsData.signers.map(s => ({
    user_id: s.user_id, name: s.name, avatar_url: null, county: s.county, city: null,
    status: 'joined' as const, joined_at: s.signed_at,
    biological_sex: s.biological_sex, gender: s.gender, sexual_orientation: s.sexual_orientation,
    birth_date: s.birth_date, education_level: s.education_level,
  }))

  return (
    <div className="relative min-h-screen animate-fade-in-up">
      <div className="pointer-events-none absolute inset-0 overflow-hidden -z-10">
        <div className="absolute -left-1/4 top-0 h-[400px] w-[400px] rounded-full bg-primary/5 blur-[100px]" />
      </div>
      <div className="px-4 lg:px-8 py-8 pb-16 space-y-10">
        <PetitionStatsHeader data={statsData} backHref={`/organizatie/${id}/evenimente`} />
        <PetitionStatsKpiBanner data={statsData} />
        <PetitionProgressCard data={statsData} />
        <DemographicsSection participants={signersAsParticipants} />
        <RegistrationsChartsClient
          participants={signersAsParticipants}
          createdAt={statsData.created_at}
        />
        <SingleEventViewsChartClient eventId={eventId} initialData={viewsData} />
        <SignersListClient signers={statsData.signers} />
        <FeedbackStatsSection
          feedback={statsData.feedback}
          averageRating={statsData.averageRating}
          status={statsData.status}
        />
      </div>
    </div>
  )
}
