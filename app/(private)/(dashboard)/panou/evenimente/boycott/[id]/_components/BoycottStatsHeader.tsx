import Link from 'next/link'
import { ArrowLeft, ExternalLink, ShoppingCart, Zap } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { EditEventWarningModalClient } from '../../../_components/EditEventWarningModalClient'
import type { BoycottStatsData } from '@/services/stats.service'

const METHOD_LABELS: Record<string, string> = {
  avoid_purchase: 'Evitare cumpărare',
  return_products: 'Returnare produse',
  social_pressure: 'Presiune socială',
  online_campaign: 'Campanie online',
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'În așteptare', approved: 'Aprobat', rejected: 'Respins',
  contested: 'Contestat', completed: 'Finalizat',
}
const STATUS_CLASSES: Record<string, string> = {
  pending: 'bg-secondary text-secondary-foreground',
  approved: 'bg-primary text-primary-foreground',
  rejected: 'bg-destructive text-destructive-foreground',
  contested: 'bg-orange-500/10 text-orange-600 border border-orange-500/20',
  completed: 'bg-muted text-muted-foreground',
}

type Props = { data: BoycottStatsData; backHref: string }

export function BoycottStatsHeader({ data, backHref }: Props) {
  return (
    <div className="space-y-4 border-b border-border/50 pb-6">
      <div className="flex items-center justify-between gap-2">
        <Link href={backHref} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="size-4" />
          Înapoi la evenimente
        </Link>
        <div className="flex items-center gap-2">
          {data.status !== 'completed' && <EditEventWarningModalClient eventId={data.id} />}
          <Link href={`/evenimente/boycott/${data.id}`} className={buttonVariants({ variant: 'outline' }) + ' gap-1.5 text-xs'}>
            <ExternalLink className="size-3.5" />
            Vezi eveniment
          </Link>
        </div>
      </div>

      <div className="space-y-3">
        <h1 className="text-2xl md:text-4xl font-black tracking-tighter leading-tight uppercase text-foreground italic">
          {data.title}
        </h1>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="flex items-center gap-1">
            <ShoppingCart className="size-3" />
            Boycott
          </Badge>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_CLASSES[data.status] ?? 'bg-muted text-muted-foreground'}`}>
            {STATUS_LABELS[data.status] ?? data.status}
          </span>
          <Badge variant="outline" className="flex items-center gap-1 text-xs">
            <Zap className="size-3" />
            {METHOD_LABELS[data.method] ?? data.method}
          </Badge>
        </div>
      </div>
    </div>
  )
}
