import type { Metadata } from 'next'
import { getUserAppeals } from '@/services/user.service'
import { PanouTabsClient } from '../_components/PanouTabsClient'

export const metadata: Metadata = { title: 'Contestațiile mele' }

const APPEAL_STATUS_LABEL: Record<string, string> = {
  pending: 'În așteptare',
  under_review: 'În analiză',
  resolved: 'Rezolvată',
}

const APPEAL_STATUS_CLASSES: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  under_review: 'bg-primary/10 text-primary border-primary/20',
  resolved: 'bg-muted text-muted-foreground border-border',
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('ro-RO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export default async function PanouContestatiePage() {
  const appeals = await getUserAppeals()

  return (
    <div className="mx-auto max-w-7xl px-4 lg:px-8 py-8 space-y-6">
      <h1 className="text-2xl font-black tracking-tight text-foreground">Panou</h1>
      <PanouTabsClient />
      <div className="space-y-2">
        {appeals.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-muted-foreground">Nu ai nicio contestație.</p>
          </div>
        ) : (
          appeals.map(appeal => (
            <div
              key={appeal.id}
              className="flex items-center justify-between rounded-xl p-4 border border-border bg-card"
            >
              <div>
                <p className="text-sm font-semibold text-foreground">{appeal.event_title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{formatDate(appeal.created_at)}</p>
              </div>
              <span
                className={`text-[10px] font-semibold px-2 py-1 rounded border ${APPEAL_STATUS_CLASSES[appeal.status] ?? ''}`}
              >
                {APPEAL_STATUS_LABEL[appeal.status] ?? appeal.status}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
