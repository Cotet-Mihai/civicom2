'use client'

import { useRef } from 'react'
import Autoplay from 'embla-carousel-autoplay'
import type { EventPreview } from '@/services/homepage.service'
import { EventCard } from '@/components/shared/EventCard'
import {
    Carousel,
    CarouselContent,
    CarouselItem,
} from '@/components/ui/carousel'

type Props = { events: EventPreview[] }

export function EventsCarouselClient({ events }: Props) {
    const plugin = useRef(
        Autoplay({ delay: 5000, stopOnInteraction: true })
    )

    return (
        <Carousel
            opts={{
                align: 'start',
                loop: true,
            }}
            plugins={[plugin.current]}
            className="w-full"
            onMouseEnter={plugin.current.stop}
            onMouseLeave={plugin.current.reset}
        >
            <CarouselContent className="-ml-6 py-4">
                {events.map((event) => (
                    <CarouselItem
                        key={event.id}
                        className="pl-6 basis-full md:basis-1/2 lg:basis-1/3"
                    >
                        <EventCard event={event} />
                    </CarouselItem>
                ))}
            </CarouselContent>
        </Carousel>
    )
}