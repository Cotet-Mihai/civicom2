import type { Metadata } from 'next'
import { Scale, AlertCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { getOrgAppeals } from '@/services/organization.service'

export const metadata: Metadata = { title: 'Contestații ONG — CIVICOM' }

type PageProps = { params: Promise<{ id: string }> }

const APPEAL_STATUS_LABEL: Record<string, string> = {
  pending: 'În așteptare',
  under_review: 'În analiză',
  resolved: 'Rezolvată',
}

const APPEAL_STATUS_CLASSES: Record<string, string> = {
  pending: 'bg-secondary/20 text-foreground border-secondary/30',
  under_review: 'bg-primary/10 text-primary border-primary/20',
  resolved: 'bg-muted text-muted-foreground border-border',
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('ro-RO', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default async function OrgContestatiePage({ params }: PageProps) {
  const { id } = await params
  const appeals = await getOrgAppeals(id)

  return (
    <div className="relative min-h-screen animate-fade-in-up">

      <div className="pointer-events-none absolute inset-0 overflow-hidden -z-10">
        <div className="absolute -left-1/4 top-0 h-[400px] w-[400px] rounded-full bg-primary/5 blur-[100px]" />
      </div>

      <div className="px-4 lg:px-8 py-8 pb-16 space-y-10">

        <div className="flex flex-col gap-2 border-b border-border/50 pb-6">
          <h1 className="font-heading text-3xl font-black uppercase tracking-tighter text-foreground md:text-4xl">
            Contestații <span className="text-primary">ONG</span>
          </h1>
          <p className="text-base text-muted-foreground">
            Contestațiile depuse pentru evenimentele respinse ale organizației.
          </p>
        </div>

        <Card className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300 hover:border-primary/40 hover:shadow-md">
          <CardContent className="flex flex-1 flex-col p-6 gap-4">

            <div className="flex items-center gap-2 border-b border-border/50 pb-3">
              <Scale className="size-4 text-primary" />
              <h2 className="font-heading text-lg font-bold tracking-tight text-foreground">
                {appeals.length > 0 ? `${appeals.length} contestații` : 'Contestații'}
              </h2>
            </div>

            {appeals.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center py-16 text-center">
                <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground/70">
                  <AlertCircle size={26} />
                </div>
                <h3 className="mb-1 font-bold text-foreground">Nicio contestație</h3>
                <p className="text-sm text-muted-foreground">
                  Organizația nu are contestații depuse.
                </p>
              </div>
            ) : (
              <div className="flex flex-col divide-y divide-border/50">
                {appeals.map(appeal => (
                  <div key={appeal.id} className="flex items-center justify-between gap-4 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{appeal.event_title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{formatDate(appeal.created_at)}</p>
                    </div>
                    <span className={`shrink-0 text-[10px] font-black uppercase tracking-wide px-2.5 py-1 rounded-lg border ${APPEAL_STATUS_CLASSES[appeal.status] ?? ''}`}>
                      {APPEAL_STATUS_LABEL[appeal.status] ?? appeal.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
