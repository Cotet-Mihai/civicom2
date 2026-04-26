import Link from 'next/link'
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import type { DashboardEvent } from '@/services/user.service'

const CATEGORY_LABEL: Record<string, string> = {
  protest: 'Protest',
  boycott: 'Boycott',
  petition: 'Petiție',
  community: 'Comunitar',
  charity: 'Caritabil',
}

const CATEGORY_PATH: Record<string, string> = {
  protest: 'protest',
  boycott: 'boycott',
  petition: 'petitie',
  community: 'comunitar',
  charity: 'caritabil',
}

const STATUS_LABEL: Record<string, string> = {
  pending: 'În așteptare',
  approved: 'Aprobat',
  rejected: 'Respins',
  contested: 'Contestat',
  completed: 'Finalizat',
}

const STATUS_CLASSES: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  approved: 'bg-primary/10 text-primary border-primary/20',
  rejected: 'bg-destructive/10 text-destructive border-destructive/20',
  contested: 'bg-orange-50 text-orange-700 border-orange-200',
  completed: 'bg-muted text-muted-foreground border-border',
}

type Props = {
  event: DashboardEvent
  showStatus?: boolean
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('ro-RO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function DashboardEventRow({ event, showStatus = true }: Props) {
  const path = CATEGORY_PATH[event.category] ?? event.category
  const href = `/evenimente/${path}/${event.id}`

  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-xl p-3 hover:bg-muted/50 transition-colors group"
    >
      <div className="relative w-16 h-10 rounded-lg overflow-hidden border border-border shrink-0 bg-muted">
        {event.banner_url ? (
          <Image src={event.banner_url} alt={event.title} fill className="object-cover" />
        ) : (
          <div className="w-full h-full bg-primary/10" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
          {event.title}
        </p>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <span className="text-xs text-muted-foreground">{formatDate(event.created_at)}</span>
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
            {CATEGORY_LABEL[event.category] ?? event.category}
          </Badge>
          {showStatus && (
            <span
              className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${STATUS_CLASSES[event.status] ?? ''}`}
            >
              {STATUS_LABEL[event.status] ?? event.status}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
