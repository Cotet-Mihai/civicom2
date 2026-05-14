import Link from 'next/link'
import { ArrowLeft, CalendarDays, Clock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { ProtestStatsData } from '@/services/stats.service'

const SUBCATEGORY_LABELS: Record<string, string> = {
  gathering: 'Adunare',
  march: 'Marș',
  picket: 'Pichet',
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'În așteptare',
  approved: 'Aprobat',
  rejected: 'Respins',
  contested: 'Contestat',
  completed: 'Finalizat',
}

const STATUS_CLASSES: Record<string, string> = {
  pending: 'bg-secondary text-secondary-foreground',
  approved: 'bg-primary text-primary-foreground',
  rejected: 'bg-destructive text-destructive-foreground',
  contested: 'bg-orange-500 text-white',
  completed: 'bg-muted text-muted-foreground',
}

type Props = {
  data: ProtestStatsData
  backHref: string
}

export function ProtestStatsHeader({ data, backHref }: Props) {
  const protestDate = new Date(data.date).toLocaleDateString('ro-RO', {
    day: '2-digit', month: 'long', year: 'numeric',
  })
  const timeRange = data.time_end
    ? `${data.time_start.slice(0, 5)} – ${data.time_end.slice(0, 5)}`
    : `Ora ${data.time_start.slice(0, 5)}`

  return (
    <div className="space-y-4 border-b border-border/50 pb-6">
      <Link
        href={backHref}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="size-4" />
        Înapoi la evenimente
      </Link>

      <div className="space-y-3">
        <h1 className="text-2xl md:text-4xl font-black tracking-tighter leading-tight uppercase text-foreground italic">
          {data.title}
        </h1>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">
            {SUBCATEGORY_LABELS[data.subcategory] ?? data.subcategory}
          </Badge>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_CLASSES[data.status] ?? 'bg-muted text-muted-foreground'}`}>
            {STATUS_LABELS[data.status] ?? data.status}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <CalendarDays className="size-4 text-primary" />
            {protestDate}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="size-4 text-primary" />
            {timeRange}
          </span>
        </div>
      </div>
    </div>
  )
}
