import type { Metadata } from 'next'
import Link from 'next/link'
import { getPendingEvents } from '@/services/admin.service'
import { AdminTabsClient } from '../_components/AdminTabsClient'
import { buttonVariants } from '@/components/ui/button'

export const metadata: Metadata = { title: 'Admin — Evenimente în așteptare' }

const CATEGORY_LABEL: Record<string, string> = {
  protest: 'Protest',
  boycott: 'Boycott',
  petition: 'Petiție',
  community: 'Comunitar',
  charity: 'Caritabil',
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('ro-RO', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default async function AdminEvenimentePage() {
  const events = await getPendingEvents()

  return (
    <div className="mx-auto max-w-7xl px-4 lg:px-8 py-8 space-y-6">
      <h1 className="text-2xl font-black tracking-tight text-foreground">Admin</h1>
      <AdminTabsClient />

      <div className="space-y-2">
        {events.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">Nicio cerere de eveniment în așteptare.</p>
        ) : (
          events.map(ev => (
            <div key={ev.id} className="flex items-center justify-between rounded-xl border border-border bg-card p-4 gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{ev.title}</p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                    {CATEGORY_LABEL[ev.category] ?? ev.category}
                  </span>
                  <span className="text-xs text-muted-foreground">{ev.creator_name}</span>
                  <span className="text-xs text-muted-foreground">{formatDate(ev.created_at)}</span>
                </div>
              </div>
              <Link
                href={`/admin/evenimente/${ev.id}`}
                className={buttonVariants({ variant: 'outline', size: 'sm' })}
              >
                Revizuiește →
              </Link>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
