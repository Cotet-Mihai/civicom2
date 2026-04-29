import Link from 'next/link'
import Image from 'next/image'
import { Users, Eye, Calendar, ArrowRight } from 'lucide-react'
import type { EventPreview } from '@/services/event.service'
import { CATEGORY_LABELS, CATEGORY_ROUTES } from '@/lib/constants'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

type Props = { event: EventPreview }

function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('ro-RO', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    })
}

export function EventListItem({ event }: Props) {
    return (
    <Card className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-all duration-300 hover:border-primary/50 hover:shadow-md sm:flex-row sm:items-stretch p-0">

        {/* Partea Stângă: Imaginea. Acum se va lipi perfect de margini datorită overflow-hidden și lipsei de padding */}
        <div className="relative w-full shrink-0 h-[220px] sm:h-auto sm:w-72 lg:w-80">
            {event.banner_url ? (
                <Image
                    src={event.banner_url}
                    alt={event.title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
            ) : (
                <div className="h-full w-full bg-muted transition-colors group-hover:bg-muted/80" />
            )}

            {/* Badge categorie */}
            <div className="absolute left-4 top-4">
                <Badge variant="secondary" className="font-semibold shadow-sm backdrop-blur-md bg-background/80">
                    {CATEGORY_LABELS[event.category] ?? event.category}
                </Badge>
            </div>
        </div>

        {/* Partea Dreaptă: Conținutul. Aici păstrăm `p-6` pentru a avea spațiere frumoasă doar la text */}
        <div className="flex flex-1 flex-col p-6 relative">

            {/* Glow ambiental intern - la hover */}
            <div className="pointer-events-none absolute right-0 top-0 -mr-8 -mt-8 size-32 rounded-full bg-primary/5 transition-all duration-500 group-hover:bg-primary/10" />

            <div className="flex-1">
                <h3 className="text-xl font-bold tracking-tight text-foreground line-clamp-2">
                    {event.title}
                </h3>
                <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground sm:line-clamp-3">
                    {event.description}
                </p>
            </div>

            {/* Footer-ul cardului */}
            <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-t border-border/50 pt-4">

                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground font-medium">
                        <span className="flex items-center gap-1.5">
                            <Calendar className="size-4 text-primary" />
                            {formatDate(event.date)}
                        </span>
                    <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1.5">
                                <Users className="size-4 text-primary" />
                                {event.participants_count}
                            </span>
                        <span className="flex items-center gap-1.5">
                                <Eye className="size-4 text-primary" />
                            {event.view_count}
                            </span>
                    </div>
                </div>

                <Button
                    className="group/btn font-semibold shrink-0"
                    nativeButton={false}
                    render={<Link href={`/evenimente/${CATEGORY_ROUTES[event.category] ?? event.category}/${event.id}`} />}
                >
                    Vezi detaliile
                    <ArrowRight className="ml-2 size-4 transition-transform group-hover/btn:translate-x-1" />
                </Button>

            </div>
        </div>
    </Card>
)
}