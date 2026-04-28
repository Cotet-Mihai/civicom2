import type { Metadata } from 'next'
import Link from 'next/link'
import { Users, CalendarDays, Star, ArrowRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { buttonVariants } from '@/components/ui/button'
import { StatCardDashboard } from '@/components/shared/StatCardDashboard'
import { DashboardEventRow } from '@/components/shared/DashboardEventRow'
import { getOrgDashboardStats, getOrganizationEvents } from '@/services/organization.service'
import type { DashboardEvent } from '@/services/user.service'

export const metadata: Metadata = { title: 'Panou ONG' }

type PageProps = { params: Promise<{ id: string }> }

export default async function OrgPanouPage({ params }: PageProps) {
  const { id } = await params
  const [stats, allEvents] = await Promise.all([
    getOrgDashboardStats(id),
    getOrganizationEvents(id),
  ])
  const recentEvents = allEvents.slice(0, 5)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-foreground">Panou ONG</h1>
        <p className="text-sm text-muted-foreground mt-1">Gestionează organizația ta pe CIVICOM✨</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCardDashboard label="Membri" value={stats.membersCount} icon={Users} />
        <StatCardDashboard label="Evenimente active" value={stats.eventsCount} icon={CalendarDays} />

        {/* Rating card — rendered manually because value may be a formatted string */}
        <Card className="shadow-sm shadow-black/5 border-border">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="size-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
              <Star size={18} className="text-primary" />
            </div>
            <div>
              <p className="text-3xl font-black italic tracking-tighter text-primary leading-none">
                {stats.rating > 0 ? stats.rating.toFixed(1) : '—'}
              </p>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-1">Rating</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm shadow-black/5 border-border">
        <CardContent className="p-5 space-y-1">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              Evenimente recente
            </h2>
            <Link
              href={`/organizatie/${id}/evenimente`}
              className="text-xs text-primary font-medium flex items-center gap-1 hover:underline"
            >
              Vezi toate <ArrowRight size={12} />
            </Link>
          </div>
          {recentEvents.length === 0 ? (
            <div className="py-6 text-center space-y-3">
              <p className="text-sm text-muted-foreground">Organizația nu are niciun eveniment încă.</p>
              <Link href="/creeaza" className={buttonVariants({ size: 'sm' })}>
                Creează primul eveniment
              </Link>
            </div>
          ) : (
            recentEvents.map(event => (
              <DashboardEventRow
                key={event.id}
                event={event as DashboardEvent}
                showStatus
              />
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
