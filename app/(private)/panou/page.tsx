import type { Metadata } from 'next'
import Link from 'next/link'
import { CalendarPlus, Users, PenLine, Scale, ArrowRight } from 'lucide-react'
import { getUserDashboardStats, getUserCreatedEvents, getUserParticipations } from '@/services/user.service'
import { StatCardDashboard } from '@/components/shared/StatCardDashboard'
import { DashboardEventRow } from '@/components/shared/DashboardEventRow'
import { Card, CardContent } from '@/components/ui/card'
import { buttonVariants } from '@/components/ui/button'

export const metadata: Metadata = { title: 'Panou' }

export default async function PanouPage() {
  const [stats, recentEvents, recentParticipations] = await Promise.all([
    getUserDashboardStats(),
    getUserCreatedEvents(3),
    getUserParticipations(3),
  ])

  return (
    <div className="mx-auto max-w-7xl px-4 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-foreground">Panou</h1>
        <p className="text-sm text-muted-foreground mt-1">Activitatea ta civică pe CIVICOM✨</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCardDashboard label="Evenimente create" value={stats.eventsCreated} icon={CalendarPlus} />
        <StatCardDashboard label="Participări" value={stats.participations} icon={Users} />
        <StatCardDashboard label="Petiții semnate" value={stats.petitionsSigned} icon={PenLine} />
        <StatCardDashboard label="Contestații" value={stats.appeals} icon={Scale} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-sm shadow-black/5 border-border">
          <CardContent className="p-5 space-y-1">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Evenimentele mele recente
              </h2>
              <Link
                href="/panou/evenimente"
                className="text-xs text-primary font-medium flex items-center gap-1 hover:underline"
              >
                Vezi toate <ArrowRight size={12} />
              </Link>
            </div>
            {recentEvents.length === 0 ? (
              <div className="py-6 text-center space-y-3">
                <p className="text-sm text-muted-foreground">Nu ai creat niciun eveniment încă.</p>
                <Link href="/creeaza" className={buttonVariants({ size: 'sm' })}>
                  Creează primul eveniment
                </Link>
              </div>
            ) : (
              recentEvents.map(event => (
                <DashboardEventRow key={event.id} event={event} showStatus />
              ))
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm shadow-black/5 border-border">
          <CardContent className="p-5 space-y-1">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Participările mele recente
              </h2>
              <Link
                href="/panou/participari"
                className="text-xs text-primary font-medium flex items-center gap-1 hover:underline"
              >
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
      </div>
    </div>
  )
}
