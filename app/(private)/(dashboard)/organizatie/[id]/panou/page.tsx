import type { Metadata } from 'next'
import Link from 'next/link'
import { Users, CalendarDays, Star, ArrowRight, CalendarX2 } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { StatsBanner } from '@/components/shared/StatsBanner'
import { DashboardEventRow } from '@/components/shared/DashboardEventRow'
import { getOrgDashboardStats, getOrganizationEvents } from '@/services/organization.service'
import type { DashboardEvent } from '@/services/user.service'

export const metadata: Metadata = { title: 'Panou ONG — CIVICOM' }

type PageProps = { params: Promise<{ id: string }> }

export default async function OrgPanouPage({ params }: PageProps) {
    const { id } = await params
    const [stats, allEvents] = await Promise.all([
        getOrgDashboardStats(id),
        getOrganizationEvents(id),
    ])
    const recentEvents = allEvents.slice(0, 5)

    return (
        <div className="px-4 lg:px-8 py-8 space-y-10 animate-fade-in-up">

            {/* Header Dashboard */}
            <div className="flex flex-col gap-2 border-b border-border/50 pb-6">
                <h1 className="font-heading text-3xl font-black uppercase tracking-tighter text-foreground md:text-4xl">
                    Panou <span className="text-primary">ONG</span>
                </h1>
                <p className="text-base text-muted-foreground">
                    Gestionează-ți organizația și analizează impactul pe CIVICOM✨
                </p>
            </div>

            {/* Statistici */}
            <StatsBanner
                badge="Statistici ONG"
                title="Activitate organizație"
                subtitle="Statistici cumulate"
                items={[
                    { icon: Users,       iconClassName: 'size-4 text-secondary',                                             value: stats.membersCount,                              label: 'Membri' },
                    { icon: CalendarDays, iconClassName: 'size-4 text-primary',                                              value: stats.eventsCount,                               label: 'Evenimente' },
                    { icon: Star,        iconClassName: stats.rating > 0 ? 'size-4 text-secondary fill-secondary' : 'size-4 text-background/40', value: stats.rating > 0 ? stats.rating.toFixed(1) : '—', label: 'Rating' },
                ]}
            />

            {/* Secțiunea Evenimente Recente */}
            <div className="space-y-4">
                {/* Header Secțiune */}
                <div className="flex items-center justify-between border-b border-border/50 pb-3">
                    <h2 className="font-heading text-xl font-bold tracking-tight text-foreground">
                        Evenimente recente
                    </h2>
                    <Link
                        href={`/organizatie/${id}/evenimente`}
                        className="group flex items-center gap-1.5 text-xs font-bold text-primary transition-colors hover:text-primary/80"
                    >
                        Vezi toate
                        <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
                    </Link>
                </div>

                {/* Container Listă */}
                <div className="rounded-2xl border border-border bg-card/50 shadow-sm">
                    {recentEvents.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
                                <CalendarX2 size={24} />
                            </div>
                            <h3 className="mb-1 font-bold text-foreground">Niciun eveniment</h3>
                            <p className="mb-6 text-sm text-muted-foreground">
                                Organizația nu are niciun eveniment creat încă.
                            </p>
                            <Link
                                href="/creeaza"
                                className={`${buttonVariants({ size: 'default' })} font-bold shadow-sm transition-all hover:ring-2 hover:ring-primary/20`}
                            >
                                Creează primul eveniment
                            </Link>
                        </div>
                    ) : (
                        <div className="flex flex-col divide-y divide-border/50">
                            {recentEvents.map(event => (
                                <DashboardEventRow
                                    key={event.id}
                                    event={event as DashboardEvent}
                                    showStatus
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}