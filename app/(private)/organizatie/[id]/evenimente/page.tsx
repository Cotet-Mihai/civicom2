import type { Metadata } from 'next'
import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { DashboardEventRow } from '@/components/shared/DashboardEventRow'
import { getOrganizationEvents } from '@/services/organization.service'
import type { DashboardEvent } from '@/services/user.service'

export const metadata: Metadata = { title: 'Evenimente ONG' }

type PageProps = { params: Promise<{ id: string }> }

export default async function OrgEvenimentePage({ params }: PageProps) {
  const { id } = await params
  const events = await getOrganizationEvents(id)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-black tracking-tight text-foreground">
          Evenimente ({events.length})
        </h2>
        <Link href="/creeaza" className={buttonVariants({ size: 'sm' }) + ' gap-1.5'}>
          + Eveniment nou
        </Link>
      </div>

      {events.length === 0 ? (
        <div className="py-16 text-center rounded-xl border border-dashed border-border">
          <p className="text-muted-foreground text-sm">Organizația nu are niciun eveniment.</p>
        </div>
      ) : (
        <div className="space-y-1 rounded-xl border border-border bg-card p-2">
          {events.map(event => (
            <DashboardEventRow
              key={event.id}
              event={event as DashboardEvent}
              showStatus
            />
          ))}
        </div>
      )}
    </div>
  )
}
