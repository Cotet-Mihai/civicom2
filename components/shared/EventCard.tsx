import Link from 'next/link'
import Image from 'next/image'
import { Calendar, Eye, Users } from 'lucide-react'
import type { EventPreview } from '@/services/event.service'

const CATEGORY_ROUTES: Record<string, string> = {
  protest: 'protest',
  boycott: 'boycott',
  petition: 'petitie',
  community: 'comunitar',
  charity: 'caritabil',
}

const CATEGORY_LABELS: Record<string, string> = {
  protest: 'Protest',
  boycott: 'Boycott',
  petition: 'Petiție',
  community: 'Comunitar',
  charity: 'Caritabil',
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('ro-RO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

type Props = { event: EventPreview }

export function EventCard({ event }: Props) {
  return (
    <Link
      href={`/evenimente/${CATEGORY_ROUTES[event.category] ?? event.category}/${event.id}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-shadow duration-300 hover:shadow-lg"
    >
      <div className="relative aspect-video overflow-hidden">
        {event.banner_url ? (
          <Image
            src={event.banner_url}
            alt={event.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="h-full w-full bg-muted" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/30 to-transparent" />

        <div className="absolute left-3 top-3">
          <span className="rounded-full bg-background/90 px-2.5 py-1 text-xs font-semibold text-foreground backdrop-blur-sm">
            {CATEGORY_LABELS[event.category] ?? event.category}
          </span>
        </div>

        <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-background/90 px-2 py-1 text-xs backdrop-blur-sm">
          <Calendar className="size-3 text-primary" />
          <span className="font-medium">{formatDate(event.date)}</span>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="line-clamp-2 text-base font-bold leading-snug text-foreground">
          {event.title}
        </h3>

        <div className="mt-auto flex items-center gap-4 pt-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Users className="size-3" />
            {event.participants_count}
          </span>
          <span className="flex items-center gap-1">
            <Eye className="size-3" />
            {event.view_count}
          </span>
        </div>
      </div>
    </Link>
  )
}
