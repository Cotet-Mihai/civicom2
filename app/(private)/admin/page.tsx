import type { Metadata } from 'next'
import Link from 'next/link'
import { Clock, Building2, MessageSquareWarning } from 'lucide-react'
import { StatCardDashboard } from '@/components/shared/StatCardDashboard'
import { getAdminStats, getPendingEvents } from '@/services/admin.service'
import { AdminTabsClient } from './_components/AdminTabsClient'
import { buttonVariants } from '@/components/ui/button'

export const metadata: Metadata = { title: 'Admin — Moderare' }

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

export default async function AdminPage() {
  const [stats, events] = await Promise.all([getAdminStats(), getPendingEvents(10)])

  return (
    <div className="mx-auto max-w-7xl px-4 lg:px-8 py-8 space-y-6">
      <h1 className="text-2xl font-black tracking-tight text-foreground">Admin</h1>
      <AdminTabsClient />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCardDashboard label="Evenimente în așteptare" value={stats.pendingEvents} icon={Clock} />
        <StatCardDashboard label="Organizații în așteptare" value={stats.pendingOrgs} icon={Building2} />
        <StatCardDashboard label="Contestații active" value={stats.pendingAppeals} icon={MessageSquareWarning} />
      </div>

      <div className="space-y-3">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
          Evenimente recente în așteptare
        </h3>
        {events.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Nicio cerere în așteptare.</p>
        ) : (
          <div className="border border-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-4 py-2.5 text-xs font-bold text-muted-foreground">Titlu</th>
                  <th className="text-left px-4 py-2.5 text-xs font-bold text-muted-foreground hidden sm:table-cell">Categorie</th>
                  <th className="text-left px-4 py-2.5 text-xs font-bold text-muted-foreground hidden md:table-cell">Creator</th>
                  <th className="text-left px-4 py-2.5 text-xs font-bold text-muted-foreground hidden lg:table-cell">Dată</th>
                  <th className="px-4 py-2.5"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {events.map(ev => (
                  <tr key={ev.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground truncate max-w-[200px]">{ev.title}</td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                        {CATEGORY_LABEL[ev.category] ?? ev.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{ev.creator_name}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">{formatDate(ev.created_at)}</td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/evenimente/${ev.id}`}
                        className={buttonVariants({ variant: 'outline', size: 'sm' })}
                      >
                        Revizuiește →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
