'use client'

import useEmblaCarousel from 'embla-carousel-react'
import Autoplay from 'embla-carousel-autoplay'
import type { EventPreview } from '@/services/homepage.service'
import { EventCard } from './EventCard'

type Props = { events: EventPreview[] }

export function EventsCarouselClient({ events }: Props) {
  const [emblaRef] = useEmblaCarousel(
    { loop: true, align: 'start' },
    [Autoplay({ delay: 5000, stopOnInteraction: true })]
  )

  return (
    <div className="overflow-hidden" ref={emblaRef}>
      <div className="flex gap-6">
        {events.map((event) => (
          <div
            key={event.id}
            className="min-w-0 shrink-0 grow-0 basis-full md:basis-1/2 lg:basis-1/3"
          >
            <EventCard event={event} />
          </div>
        ))}
      </div>
    </div>
  )
}
