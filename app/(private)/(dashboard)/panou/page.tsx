import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { CalendarPlus, Users, PenLine, Scale, ArrowRight } from 'lucide-react'
import {
  getUserDashboardStats, getUserCreatedEvents, getUserParticipations,
  getUserProfile, getOrgCreatedEvents,
} from '@/services/user.service'
import { getOrganizationById, getOrgDashboardStats } from '@/services/organization.service'
import { getUserOrgByAuthId } from '@/lib/server-cache'
import { getAuthUser } from '@/services/auth.service'
import { StatCardDashboard } from '@/components/shared/StatCardDashboard'
import { DashboardEventRow } from '@/components/shared/DashboardEventRow'
import { Card, CardContent } from '@/components/ui/card'
import { buttonVariants } from '@/components/ui/button'
import { CompleteEventButtonClient } from './_components/CompleteEventButtonClient'
import { UserPreview, OrgPreview } from './_components/ProfilePreviewPanel'
import { ProfileOrgToggleClient } from './_components/ProfileOrgToggleClient'

export const metadata: Metadata = { title: 'Panou' }

export default async function PanouPage({
  searchParams,
}: {
  searchParams: Promise<{ context?: string }>
}) {
  const { context } = await searchParams
  const isOrgContext = context === 'org'

  const user = await getAuthUser()
  if (!user) redirect('/autentificare')

  const org = await getUserOrgByAuthId(user.id)
  const isActualOrgContext = isOrgContext && !!org

  const [stats, recentEvents, recentParticipations, profile, orgDetail] = await Promise.all([
    isActualOrgContext
      ? getOrgDashboardStats(org.id).then(s => ({
          eventsCreated: s.eventsCount,
          participations: 0,
          petitionsSigned: 0,
          appeals: 0,
        }))
      : getUserDashboardStats(),
    isActualOrgContext ? getOrgCreatedEvents(org.id, 3) : getUserCreatedEvents(3),
    isActualOrgContext ? Promise.resolve([]) : getUserParticipations(3),
    getUserProfile(),
    org ? getOrganizationById(org.id) : Promise.resolve(null),
  ])

  return (
    <div className="px-4 lg:px-8 py-8 space-y-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Conținut principal */}
        <div className="flex-1 min-w-0 space-y-8">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-foreground">Panou</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {isActualOrgContext ? `Activitatea ${org.name} pe CIVICOM✨` : 'Activitatea ta civică pe CIVICOM✨'}
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCardDashboard label="Evenimente create" value={stats.eventsCreated} icon={CalendarPlus} />
            {!isActualOrgContext && (
              <>
                <StatCardDashboard label="Participări" value={stats.participations} icon={Users} />
                <StatCardDashboard label="Petiții semnate" value={stats.petitionsSigned} icon={PenLine} />
                <StatCardDashboard label="Contestații" value={stats.appeals} icon={Scale} />
              </>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="shadow-sm shadow-black/5 border-border">
              <CardContent className="p-5 space-y-1">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    {isActualOrgContext ? `Evenimente recente ${org.name}` : 'Evenimentele mele recente'}
                  </h2>
                  <Link href={isActualOrgContext ? '/panou/evenimente?context=org' : '/panou/evenimente'} className="text-xs text-primary font-medium flex items-center gap-1 hover:underline">
                    Vezi toate <ArrowRight size={12} />
                  </Link>
                </div>
                {recentEvents.length === 0 ? (
                  <div className="py-6 text-center space-y-3">
                    <p className="text-sm text-muted-foreground">Nu există evenimente.</p>
                    <Link href="/creeaza" className={buttonVariants({ size: 'sm' })}>
                      Creează primul eveniment
                    </Link>
                  </div>
                ) : (
                  recentEvents.map(event => (
                    <div key={event.id} className="flex items-center gap-2">
                      <div className="flex-1 min-w-0">
                        <DashboardEventRow event={event} showStatus />
                      </div>
                      <CompleteEventButtonClient
                        eventId={event.id}
                        category={event.category}
                        subcategory={event.subcategory}
                        status={event.status}
                      />
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {!isActualOrgContext && (
              <Card className="shadow-sm shadow-black/5 border-border">
                <CardContent className="p-5 space-y-1">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      Participările mele recente
                    </h2>
                    <Link href="/panou/participari" className="text-xs text-primary font-medium flex items-center gap-1 hover:underline">
                      Vezi toate <ArrowRight size={12} />
                    </Link>
                  </div>
                  {recentParticipations.length === 0 ? (
                    <div className="py-6 text-center space-y-3">
                      <p className="text-sm text-muted-foreground">Nu participi la niciun eveniment.</p>
                      <Link href="/evenimente" className={buttonVariants({ size: 'sm', variant: 'outline' })}>
                        Explorează evenimente
                      </Link>
                    </div>
                  ) : (
                    recentParticipations.map(event => (
                      <DashboardEventRow key={event.id} event={event} showStatus={false} />
                    ))
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Preview panel dreapta */}
        {profile && (
          <div className="w-full lg:w-[300px] shrink-0">
            {orgDetail
              ? <ProfileOrgToggleClient profile={profile} org={orgDetail} />
              : <UserPreview profile={profile} />
            }
          </div>
        )}
      </div>
    </div>
  )
}
