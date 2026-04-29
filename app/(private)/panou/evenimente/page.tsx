import type { Metadata } from 'next'
import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { getUserCreatedEvents } from '@/services/user.service'
import { DashboardEventRow } from '@/components/shared/DashboardEventRow'
import { PanouTabsClient } from '../_components/PanouTabsClient'
import { CompleteEventButtonClient } from '../_components/CompleteEventButtonClient'

export const metadata: Metadata = { title: 'Evenimentele mele' }

export default async function PanouEvenimentePage() {
  const events = await getUserCreatedEvents()

  return (
    <div className="mx-auto max-w-7xl px-4 lg:px-8 py-8 space-y-6">
      <h1 className="text-2xl font-black tracking-tight text-foreground">Panou</h1>
      <PanouTabsClient />
      <div className="space-y-1">
        {events.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <p className="text-muted-foreground">Nu ai creat niciun eveniment încă.</p>
            <Link href="/creeaza" className={buttonVariants({ size: 'sm' })}>
              Creează un eveniment
            </Link>
          </div>
        ) : (
          events.map(event => (
            <div key={event.id}>
              <div className="flex items-center gap-2">
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
              {event.status === 'rejected' && (
                <div className="pl-3 pb-1">
                  <Link
                    href={`/evenimente/${event.id}/contestatie`}
                    className="text-xs text-destructive hover:text-destructive/80 font-medium transition-colors"
                  >
                    Contestează decizia →
                  </Link>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
