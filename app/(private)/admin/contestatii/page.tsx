import type { Metadata } from 'next'
import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { buttonVariants } from '@/components/ui/button'
import { getAllAppeals } from '@/services/appeal.service'
import { AdminTabsClient } from '../_components/AdminTabsClient'
import { AdminAppealActionBarClient } from './_components/AdminAppealActionBarClient'

export const metadata: Metadata = { title: 'Admin — Contestații' }

const APPEAL_STATUS_LABEL: Record<string, string> = {
  pending: 'În așteptare',
  under_review: 'În analiză',
  resolved: 'Rezolvată',
}

const APPEAL_STATUS_CLASSES: Record<string, string> = {
  pending: 'bg-secondary/20 text-secondary-foreground border-secondary/30',
  under_review: 'bg-primary/10 text-primary border-primary/20',
  resolved: 'bg-muted text-muted-foreground border-border',
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('ro-RO', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default async function AdminContestatiePage() {
  const appeals = await getAllAppeals()

  return (
    <div className="mx-auto max-w-7xl px-4 lg:px-8 py-8 space-y-6">
      <h1 className="text-2xl font-black tracking-tight text-foreground">Admin</h1>
      <AdminTabsClient />

      <div className="space-y-4">
        {appeals.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">Nicio contestație activă.</p>
        ) : (
          appeals.map(appeal => (
            <Card key={appeal.id} className="shadow-sm shadow-black/5 border-border">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-foreground text-base truncate">{appeal.event_title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Creator: {appeal.creator_name} · {formatDate(appeal.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-[10px] font-semibold px-2 py-1 rounded border ${APPEAL_STATUS_CLASSES[appeal.status] ?? ''}`}>
                      {APPEAL_STATUS_LABEL[appeal.status] ?? appeal.status}
                    </span>
                    <Link
                      href={`/admin/evenimente/${appeal.event_id}`}
                      className={buttonVariants({ variant: 'outline', size: 'sm' })}
                    >
                      Vezi evenimentul →
                    </Link>
                  </div>
                </div>

                {appeal.event_rejection_note && (
                  <div className="flex items-start gap-2 rounded-lg bg-destructive/5 border border-destructive/20 p-3">
                    <AlertTriangle size={13} className="text-destructive mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-destructive mb-0.5">Motiv respingere inițial</p>
                      <p className="text-sm text-muted-foreground">{appeal.event_rejection_note}</p>
                    </div>
                  </div>
                )}

                <div className="rounded-lg bg-muted/50 border border-border p-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Motivul contestației</p>
                  <p className="text-sm text-foreground whitespace-pre-wrap">{appeal.reason}</p>
                </div>

                <AdminAppealActionBarClient appealId={appeal.id} eventId={appeal.event_id} />
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
