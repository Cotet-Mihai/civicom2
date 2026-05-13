import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { CalendarPlus, Users, PenLine, Scale, ArrowRight, CalendarX2, Footprints, Plus } from 'lucide-react'
import {
    getUserDashboardStats, getUserCreatedEvents, getUserParticipations,
    getOrgCreatedEvents,
} from '@/services/user.service'
import { getOrgDashboardStats } from '@/services/organization.service'
import { getUserOrgByAuthId } from '@/lib/server-cache'
import { getAuthUser } from '@/services/auth.service'
import { StatsBanner } from '@/components/shared/StatsBanner'
import { DashboardEventRow } from '@/components/shared/DashboardEventRow'
import { Card, CardContent } from '@/components/ui/card'
import { buttonVariants } from '@/components/ui/button'
import { CompleteEventButtonClient } from './_components/CompleteEventButtonClient'

export const metadata: Metadata = { title: 'Panou — CIVICOM' }

export default async function PanouPage({
    searchParams,
}: {
    searchParams: Promise<{ context?: string }>
}) {
    const { context } = await searchParams
    const isOrgContext = context === 'org'

    const user = await getAuthUser()
    if (!user) redirect('/autentificare')

    const userName = user.user_metadata?.display_name ?? user.user_metadata?.name ?? 'Utilizator'
    const org = await getUserOrgByAuthId(user.id)
    const isActualOrgContext = isOrgContext && !!org

    const [stats, recentEvents, recentParticipations] = await Promise.all([
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
    ])

    return (
        <div className="relative min-h-screen animate-fade-in-up">

            <div className="pointer-events-none absolute inset-0 overflow-hidden -z-10">
                <div className="absolute -left-1/4 top-0 h-[400px] w-[400px] rounded-full bg-primary/5 blur-[100px]" />
            </div>

            <div className="px-4 lg:px-8 py-8 pb-16 space-y-8">

                {/* Header */}
                <div className="flex items-center justify-between gap-4 border-b border-border/50 pb-6">
                    <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">
                            {isActualOrgContext ? 'Panou ONG' : 'Panou personal'}
                        </p>
                        <h1 className="font-heading font-black uppercase tracking-tighter leading-tight">
                            {isActualOrgContext
                                ? <span className="text-xl text-primary md:text-2xl">{org.name}</span>
                                : <>
                                    <span className="block text-sm text-muted-foreground md:text-base">Bun venit,</span>
                                    <span className="block text-xl text-foreground md:text-2xl"><span className="text-primary">{userName}</span></span>
                                  </>
                            }
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {isActualOrgContext
                                ? 'Activitatea organizației pe CIVICOM✨'
                                : 'Activitatea ta civică pe CIVICOM✨'}
                        </p>
                    </div>
                    <Link
                        href="/creeaza"
                        className={`${buttonVariants({ size: 'sm' })} shrink-0 gap-1.5 font-bold shadow-sm hidden sm:flex`}
                    >
                        <Plus size={15} /> Eveniment nou
                    </Link>
                </div>

                {/* Statistici */}
                <StatsBanner
                    badge={isActualOrgContext ? 'Statistici ONG' : 'Activitate Civică'}
                    title={isActualOrgContext ? 'Activitate ONG' : 'Sumarul tău'}
                    subtitle={isActualOrgContext ? `Organizația ${org!.name}` : 'Acțiunile tale pe CIVICOM✨'}
                    items={isActualOrgContext
                        ? [
                            { icon: CalendarPlus, iconClassName: 'size-4 text-primary', value: stats.eventsCreated, label: 'Create' },
                        ]
                        : [
                            { icon: CalendarPlus, iconClassName: 'size-4 text-primary',       value: stats.eventsCreated,   label: 'Create' },
                            { icon: Users,        iconClassName: 'size-4 text-secondary',     value: stats.participations,  label: 'Participări' },
                            { icon: PenLine,      iconClassName: 'size-4 text-green-400',     value: stats.petitionsSigned, label: 'Petiții' },
                            { icon: Scale,        iconClassName: 'size-4 text-background/60', value: stats.appeals,         label: 'Contestații' },
                        ]
                    }
                />

                {/* Grid Evenimente / Participări */}
                <div className={`grid grid-cols-1 gap-6 ${isActualOrgContext ? '' : 'lg:grid-cols-2'}`}>

                    {/* Evenimente Recente */}
                    <Card className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300 hover:border-primary/40 hover:shadow-md">
                        <CardContent className="flex flex-1 flex-col p-6 gap-4">

                            <div className="flex items-center justify-between border-b border-border/50 pb-3">
                                <h2 className="font-heading text-base font-bold tracking-tight text-foreground">
                                    {isActualOrgContext ? 'Evenimente recente' : 'Evenimentele mele'}
                                </h2>
                                <Link
                                    href={isActualOrgContext ? '/panou/evenimente?context=org' : '/panou/evenimente'}
                                    className="group flex items-center gap-1.5 text-xs font-bold text-primary transition-colors hover:text-primary/80"
                                >
                                    Vezi toate <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
                                </Link>
                            </div>

                            {recentEvents.length === 0 ? (
                                <div className="flex flex-1 flex-col items-center justify-center py-10 text-center">
                                    <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground/70">
                                        <CalendarX2 size={24} />
                                    </div>
                                    <p className="mb-5 text-sm font-medium text-muted-foreground">Nu ai niciun eveniment creat.</p>
                                    <Link
                                        href="/creeaza"
                                        className={`${buttonVariants({ size: 'default' })} font-bold shadow-sm`}
                                    >
                                        Creează primul eveniment
                                    </Link>
                                </div>
                            ) : (
                                <div className="flex flex-col divide-y divide-border/50">
                                    {recentEvents.map(event => (
                                        <div key={event.id} className="flex items-center justify-between gap-4 py-2 sm:pr-4">
                                            <div className="flex-1 min-w-0">
                                                <DashboardEventRow event={event} showStatus />
                                            </div>
                                            <div className="shrink-0">
                                                <CompleteEventButtonClient
                                                    eventId={event.id}
                                                    category={event.category}
                                                    subcategory={event.subcategory}
                                                    status={event.status}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Participări Recente */}
                    {!isActualOrgContext && (
                        <Card className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300 hover:border-primary/40 hover:shadow-md">
                            <CardContent className="flex flex-1 flex-col p-6 gap-4">

                                <div className="flex items-center justify-between border-b border-border/50 pb-3">
                                    <h2 className="font-heading text-base font-bold tracking-tight text-foreground">
                                        Participări recente
                                    </h2>
                                    <Link
                                        href="/panou/participari"
                                        className="group flex items-center gap-1.5 text-xs font-bold text-primary transition-colors hover:text-primary/80"
                                    >
                                        Vezi toate <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
                                    </Link>
                                </div>

                                {recentParticipations.length === 0 ? (
                                    <div className="flex flex-1 flex-col items-center justify-center py-10 text-center">
                                        <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground/70">
                                            <Footprints size={24} />
                                        </div>
                                        <p className="mb-5 text-sm font-medium text-muted-foreground">Nu participi la niciun eveniment.</p>
                                        <Link
                                            href="/evenimente"
                                            className={`${buttonVariants({ size: 'default', variant: 'outline' })} font-bold transition-all hover:bg-primary/5 hover:text-primary hover:border-primary/50`}
                                        >
                                            Explorează evenimente
                                        </Link>
                                    </div>
                                ) : (
                                    <div className="flex flex-col divide-y divide-border/50">
                                        {recentParticipations.map(event => (
                                            <div key={event.id} className="py-2">
                                                <DashboardEventRow event={event} showStatus={false} />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                </div>
            </div>
        </div>
    )
}
