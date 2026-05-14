import type { Metadata } from 'next'
import Link from 'next/link'
import { Users, CalendarDays, Star, ArrowRight, CalendarX2, AlertTriangle, Clock, Scale } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { StatsBanner } from '@/components/shared/StatsBanner'
import { DashboardEventRow } from '@/components/shared/DashboardEventRow'
import { getOrgDashboardStats, getOrganizationEvents, getOrganizationById } from '@/services/organization.service'
import type { DashboardEvent } from '@/services/user.service'

export const metadata: Metadata = { title: 'Panou ONG — CIVICOM' }

type PageProps = { params: Promise<{ id: string }> }

const STATUS_CONFIG: Record<string, { icon: typeof AlertTriangle; bg: string; border: string; text: string; label: string }> = {
  pending: {
    icon: Clock,
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-700',
    label: 'Organizația ta este în așteptare și va fi analizată de echipa CIVICOM.',
  },
  rejected: {
    icon: AlertTriangle,
    bg: 'bg-destructive/5',
    border: 'border-destructive/20',
    text: 'text-destructive',
    label: 'Organizația ta a fost respinsă.',
  },
  contested: {
    icon: Scale,
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    text: 'text-orange-700',
    label: 'Contestația ta este în curs de analiză.',
  },
}

export default async function OrgPanouPage({ params }: PageProps) {
  const { id } = await params
  const [stats, allEvents, org] = await Promise.all([
    getOrgDashboardStats(id),
    getOrganizationEvents(id),
    getOrganizationById(id),
  ])
  const recentEvents = allEvents.slice(0, 5)
  const statusConfig = org && org.status !== 'approved' ? STATUS_CONFIG[org.status] : null

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

      {/* Status banner — shown only when not approved */}
      {org && statusConfig && (() => {
        const Icon = statusConfig.icon
        return (
          <div className={`rounded-2xl border ${statusConfig.border} ${statusConfig.bg} p-4 space-y-3`}>
            <div className="flex items-start gap-3">
              <Icon className={`size-5 shrink-0 mt-0.5 ${statusConfig.text}`} />
              <div className="flex-1 min-w-0 space-y-1">
                <p className={`text-sm font-bold ${statusConfig.text}`}>{statusConfig.label}</p>
                {org.rejection_note && (
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium">Motiv:</span> {org.rejection_note}
                  </p>
                )}
              </div>
            </div>
            {org.status === 'rejected' && (
              <div className="flex flex-wrap gap-2 pt-1">
                <Link
                  href={`/organizatie/${id}/contestatie`}
                  className={buttonVariants({ size: 'sm' })}
                >
                  <Scale className="size-3.5 mr-1.5" />
                  Contestează decizia
                </Link>
                <Link
                  href={`/organizatie/${id}/setari`}
                  className={buttonVariants({ size: 'sm', variant: 'outline' })}
                >
                  Editează și retrimite
                </Link>
              </div>
            )}
            {org.status === 'contested' && (
              <Link
                href={`/organizatie/${id}/setari`}
                className={`inline-flex ${buttonVariants({ size: 'sm', variant: 'outline' })}`}
              >
                Editează organizația
              </Link>
            )}
          </div>
        )
      })()}

      {/* Statistici */}
      <StatsBanner
        badge="Statistici ONG"
        title="Activitate organizație"
        subtitle="Statistici cumulate"
        items={[
          { icon: Users,        iconClassName: 'size-4 text-secondary',                                                         value: stats.membersCount,                              label: 'Membri' },
          { icon: CalendarDays, iconClassName: 'size-4 text-primary',                                                           value: stats.eventsCount,                               label: 'Evenimente' },
          { icon: Star,         iconClassName: stats.rating > 0 ? 'size-4 text-secondary fill-secondary' : 'size-4 text-background/40', value: stats.rating > 0 ? stats.rating.toFixed(1) : '—', label: 'Rating' },
        ]}
      />

      {/* Secțiunea Evenimente Recente */}
      <div className="space-y-4">
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
