'use client'

import { useState, useCallback, useTransition } from 'react'
import { getEvents } from '@/services/event.service'
import type { EventPreview, EventFilters } from '@/services/event.service'
import { EventCard } from '@/components/shared/EventCard'
import { InfiniteScrollTrigger } from './InfiniteScrollTrigger'
import { EventsGridSkeleton } from './EventsGridSkeleton'

const PAGE_SIZE = 12

type Props = {
  initialEvents: EventPreview[]
  total: number
  filters: EventFilters
}

export function EventsListClient({ initialEvents, total, filters }: Props) {
  const [events, setEvents] = useState<EventPreview[]>(initialEvents)
  const [page, setPage] = useState(1)
  const [isPending, startTransition] = useTransition()

  const hasMore = events.length < total

  const loadMore = useCallback(() => {
    if (isPending || !hasMore) return
    startTransition(async () => {
      const nextPage = page + 1
      const { events: newEvents } = await getEvents(filters, nextPage, PAGE_SIZE)
      setEvents((prev) => [...prev, ...newEvents])
      setPage(nextPage)
    })
  }, [isPending, hasMore, page, filters])

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {events.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>

      {isPending && <EventsGridSkeleton />}

      <InfiniteScrollTrigger onIntersect={loadMore} hasMore={hasMore && !isPending} />
    </div>
  )
}
