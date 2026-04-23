import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import type { EventPreview } from '@/services/homepage.service'
import { EventsCarouselClient } from './EventsCarouselClient'

type Props = { events: EventPreview[] }

export function EventsSection({ events }: Props) {
  if (events.length === 0) return null

  return (
    <section className="bg-muted/50 py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">

        <div className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <h2 className="flex flex-col font-heading">
            <span className="text-4xl font-black uppercase tracking-tighter text-primary lg:text-7xl">
              ✨Evenimente
            </span>
            <span className="text-xl font-bold uppercase tracking-tight text-muted-foreground lg:text-3xl">
              care schimbă
            </span>
            <span className="text-3xl font-black uppercase tracking-tighter text-foreground lg:text-5xl">
              comunitatea✨
            </span>
          </h2>

          <Link
            href="/evenimente"
            className={buttonVariants({ variant: 'outline' }) + ' shrink-0'}
          >
            Vezi toate evenimentele
          </Link>
        </div>

        <EventsCarouselClient events={events} />

      </div>
    </section>
  )
}
