import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import type { EventPreview } from '@/services/homepage.service'
import { EventsCarouselClient } from './EventsCarouselClient'

type Props = { events: EventPreview[] }

export function EventsSection({ events }: Props) {
    if (events.length === 0) return null

    return (
        <section className="relative overflow-hidden bg-background py-20 lg:py-28">
            {/* Element decorativ de fundal subtil, similar cu StatsSection */}
            <div className="absolute right-0 top-0 -translate-y-1/4 translate-x-1/3 blur-3xl opacity-10 pointer-events-none">
                <div className="aspect-square w-[500px] rounded-full bg-primary" />
            </div>

            <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">

                {/* Header aliniat la stilul "ActionTypesSection" */}
                <div className="mb-16 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
                    <div className="flex flex-col items-start gap-2">
                        <h2 className="text-4xl font-black tracking-tight text-foreground lg:text-6xl font-heading text-balance">
                            Evenimente care schimbă <span className="text-primary">comunitatea</span>
                        </h2>
                        <p className="mt-4 max-w-2xl text-sm text-muted-foreground">
                            Descoperă inițiativele locale, participă la cauzele care contează pentru tine și implică-te activ pentru un viitor mai bun.
                        </p>
                    </div>

                    <Link
                        href="/evenimente"
                        className={buttonVariants({ variant: 'outline' }) + ' group shrink-0 transition-all hover:border-primary/50'}
                    >
                        Vezi toate evenimentele
                        <ArrowRight className="ml-2 size-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                </div>

                <EventsCarouselClient events={events} />

            </div>
        </section>
    )
}