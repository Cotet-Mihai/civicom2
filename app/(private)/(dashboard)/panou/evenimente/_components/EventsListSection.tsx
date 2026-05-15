'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Eye, Users } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { CompleteEventButtonClient } from '../../_components/CompleteEventButtonClient'
import { EditEventWarningModalClient } from './EditEventWarningModalClient'
import type { DashboardEvent } from '@/services/user.service'
import { EventsFilterTabsClient } from './EventsFilterTabsClient'

const CATEGORY_LABEL: Record<string, string> = {
  protest: 'Protest', boycott: 'Boycott', petition: 'Petiție',
  community: 'Comunitar', charity: 'Caritabil',
}
const CATEGORY_PATH: Record<string, string> = {
  protest: 'protest', boycott: 'boycott', petition: 'petitie',
  community: 'comunitar', charity: 'caritabil',
}
const STATUS_LABEL: Record<string, string> = {
  pending: 'În așteptare', approved: 'Aprobat', rejected: 'Respins',
  contested: 'Contestat', completed: 'Finalizat',
}
const STATUS_CLASSES: Record<string, string> = {
  pending: 'bg-secondary/20 text-foreground border-secondary/30',
  approved: 'bg-primary/10 text-primary border-primary/20',
  rejected: 'bg-destructive/10 text-destructive border-destructive/20',
  contested: 'bg-secondary/30 text-foreground border-secondary/40',
  completed: 'bg-muted text-muted-foreground border-border',
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('ro-RO', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function EventsListSection({ events }: { events: DashboardEvent[] }) {
  if (events.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-muted-foreground">Nu ai creat niciun eveniment.</p>
        <Link href="/creeaza" className="mt-3 inline-block text-sm text-primary hover:underline font-medium">
          Creează primul eveniment →
        </Link>
      </div>
    )
  }

  return (
    <EventsFilterTabsClient events={events}>
      {(filtered) => (
        <div className="space-y-2">
          {filtered.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">Nu există evenimente în această categorie.</p>
          )}
          {filtered.map(event => {
            const path = CATEGORY_PATH[event.category] ?? event.category
            const publicHref = `/evenimente/${path}/${event.id}`
            const statsHref = event.category === 'protest' ? `/panou/evenimente/${event.id}` : undefined
            const primaryHref = statsHref ?? publicHref
            return (
              <div
                key={event.id}
                className="flex items-center gap-3 rounded-xl border border-border p-3 bg-card hover:shadow-sm transition-shadow"
              >
                <Link href={primaryHref} className="relative w-16 h-12 rounded-lg overflow-hidden border border-border shrink-0 bg-muted">
                  {event.banner_url
                    ? <Image src={event.banner_url} alt={event.title} fill className="object-cover" />
                    : <div className="w-full h-full bg-primary/10" />
                  }
                </Link>

                <div className="flex-1 min-w-0">
                  <Link href={primaryHref} className="text-sm font-semibold text-foreground hover:text-primary transition-colors truncate block">
                    {event.title}
                  </Link>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="text-xs text-muted-foreground">{formatDate(event.created_at)}</span>
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                      {CATEGORY_LABEL[event.category] ?? event.category}
                    </Badge>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${STATUS_CLASSES[event.status] ?? ''}`}>
                      {STATUS_LABEL[event.status] ?? event.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Eye className="size-3" />{event.view_count ?? 0}</span>
                    <span className="flex items-center gap-1"><Users className="size-3" />{event.participants_count}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {statsHref && (
                    <Link
                      href={publicHref}
                      className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-lg border border-border text-[11px] font-semibold text-muted-foreground hover:text-primary hover:border-primary/40 transition-all"
                    >
                      Eveniment
                    </Link>
                  )}
                  {event.status !== 'completed' && <EditEventWarningModalClient eventId={event.id} />}
                  <CompleteEventButtonClient
                    eventId={event.id}
                    category={event.category}
                    subcategory={event.subcategory}
                    status={event.status}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </EventsFilterTabsClient>
  )
}
