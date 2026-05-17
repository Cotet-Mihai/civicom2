import type { Metadata } from 'next'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { getOrganizationEvents } from '@/services/organization.service'
import { getMyEventsStats, getMyEventsChartData, getViewsEvolution } from '@/services/user.service'
import { EventsStatsSection } from '@/app/(private)/(dashboard)/panou/evenimente/_components/EventsStatsSection'
import { EventsChartsSection } from '@/app/(private)/(dashboard)/panou/evenimente/_components/EventsChartsSection'
import { EventsEvolutionChartClient } from '@/app/(private)/(dashboard)/panou/evenimente/_components/EventsEvolutionChartClient'
import { DashboardEventRow } from '@/components/shared/DashboardEventRow'
import type { DashboardEvent } from '@/services/user.service'

export const metadata: Metadata = { title: 'Evenimente ONG — CIVICOM' }

function getOrgStatsHref(event: DashboardEvent, orgId: string): string | undefined {
  const base = `/organizatie/${orgId}/evenimente`
  switch (event.category) {
    case 'protest':  return `${base}/protest/${event.id}`
    case 'boycott':  return `${base}/boycott/${event.id}`
    case 'petition': return `${base}/petitie/${event.id}`
    case 'community':
      if (event.subcategory === 'outdoor')   return `${base}/comunitar/outdoor/${event.id}`
      if (event.subcategory === 'workshop')  return `${base}/comunitar/workshop/${event.id}`
      if (event.subcategory === 'donations') return `${base}/comunitar/donations/${event.id}`
      return undefined
    case 'charity':
      if (event.subcategory === 'concert')    return `${base}/caritabil/concert/${event.id}`
      if (event.subcategory === 'meet_greet') return `${base}/caritabil/meet_greet/${event.id}`
      if (event.subcategory === 'livestream') return `${base}/caritabil/livestream/${event.id}`
      if (event.subcategory === 'sport')      return `${base}/caritabil/sport/${event.id}`
      return undefined
    default: return undefined
  }
}

type PageProps = { params: Promise<{ id: string }> }

export default async function OrgEvenimentePage({ params }: PageProps) {
  const { id } = await params

  const [events, stats, chartData, evolutionData] = await Promise.all([
    getOrganizationEvents(id),
    getMyEventsStats('org', id),
    getMyEventsChartData('org', id),
    getViewsEvolution('org', 'today', id),
  ])

  return (
    <div className="relative min-h-screen animate-fade-in-up">
      <div className="pointer-events-none absolute inset-0 overflow-hidden -z-10">
        <div className="absolute -left-1/4 top-0 h-[400px] w-[400px] rounded-full bg-primary/5 blur-[100px]" />
      </div>

      <div className="px-4 lg:px-8 py-8 pb-16 space-y-10">

        <div className="flex items-end justify-between gap-4 border-b border-border/50 pb-6">
          <div className="flex flex-col gap-1">
            <h1 className="font-heading text-3xl font-black uppercase tracking-tighter text-foreground md:text-4xl">
              Evenimente <span className="text-primary">ONG</span>
            </h1>
            <p className="text-base text-muted-foreground">
              Statistici și activitatea organizației tale.
            </p>
          </div>
          <Link href="/creeaza" className={buttonVariants({ size: 'sm' }) + ' gap-1.5 shrink-0'}>
            <Plus size={15} /> Eveniment nou
          </Link>
        </div>

        <div className="space-y-10">
          <EventsStatsSection stats={stats} />
          <EventsChartsSection data={chartData} />
          <EventsEvolutionChartClient initialData={evolutionData} context="org" orgId={id} />

          {/* Lista evenimente */}
          <div className="space-y-4">
            <h2 className="font-heading text-xl font-bold tracking-tight text-foreground">
              Toate evenimentele ({events.length})
            </h2>

            {events.length === 0 ? (
              <div className="py-16 text-center rounded-xl border border-dashed border-border">
                <p className="text-muted-foreground text-sm">Organizația nu are niciun eveniment.</p>
                <Link href="/creeaza" className="mt-3 inline-block text-sm text-primary hover:underline font-medium">
                  Creează primul eveniment →
                </Link>
              </div>
            ) : (
              <div className="space-y-1 rounded-xl border border-border bg-card p-2">
                {events.map(event => (
                  <DashboardEventRow
                    key={event.id}
                    event={event as DashboardEvent}
                    showStatus
                    statsHref={getOrgStatsHref(event as DashboardEvent, id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
