'use client'

import { useState, useCallback, useTransition, useRef } from 'react'
import { getEvents } from '@/services/event.service'
import type { EventPreview, EventFilters } from '@/services/event.service'
import { InfiniteScrollTrigger } from './InfiniteScrollTrigger'
import { EventListItem } from './EventListItem'
import { EventsListSkeleton } from './EventListItemSkeleton'
import { useFiltersPending } from './FiltersPendingContext'

const PAGE_SIZE = 12

type Props = {
    initialEvents: EventPreview[]
    total: number
    filters: EventFilters
}

export function EventsListClient({ initialEvents, total, filters }: Props) {
    const [events, setEvents] = useState<EventPreview[]>(initialEvents)
    const [page, setPage] = useState(1)
    const [isLoadingMore, startLoadMore] = useTransition()
    const { isPending: isFiltering } = useFiltersPending()
    const loadingRef = useRef(false)

    const hasMore = events.length < total

    const loadMore = useCallback(() => {
        if (loadingRef.current || !hasMore) return
        loadingRef.current = true
        startLoadMore(async () => {
            const nextPage = page + 1
            const { events: newEvents } = await getEvents(filters, nextPage, PAGE_SIZE)
            setEvents((prev) => [...prev, ...newEvents])
            setPage(nextPage)
            loadingRef.current = false
        })
    }, [hasMore, page, filters])

    if (isFiltering) {
        return <EventsListSkeleton count={Math.min(initialEvents.length, 4)} />
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-6">
                {events.map((event) => (
                    <EventListItem key={event.id} event={event} />
                ))}
            </div>

            {isLoadingMore && <EventsListSkeleton count={3} />}

            <InfiniteScrollTrigger onIntersect={loadMore} hasMore={hasMore && !isLoadingMore} />
        </div>
    )
}
