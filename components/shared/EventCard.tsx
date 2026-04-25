import Link from 'next/link'
import Image from 'next/image'
import { Users, Eye, Calendar, ArrowRight } from 'lucide-react'
import type { EventPreview } from '@/services/event.service'
import { CATEGORY_LABELS, CATEGORY_ROUTES } from '@/lib/constants'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

type Props = { event: EventPreview }

function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('ro-RO', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    })
}

export function EventCard({ event }: Props) {
    return (
        <Card className="group relative mx-auto flex h-full w-full max-w-sm flex-col overflow-hidden rounded-xl border border-border bg-card transition-all duration-300 hover:border-primary/50 hover:shadow-md pt-0">
            <div className="pointer-events-none absolute right-0 top-[40%] -mr-8 size-32 rounded-full bg-primary/5 transition-all duration-500 group-hover:bg-primary/10" />

            {/* Banner */}
            <div className="relative aspect-video w-full overflow-hidden">
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
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/50 via-foreground/10 to-transparent opacity-80" />

                <div className="absolute left-4 top-4">
                    <Badge variant="secondary" className="font-semibold shadow-sm backdrop-blur-md bg-background/80">
                        {CATEGORY_LABELS[event.category] ?? event.category}
                    </Badge>
                </div>
            </div>

            {/* Header */}
            <CardHeader className="relative pb-2 pt-6 px-6">
                <h3 className="text-xl font-bold tracking-tight text-foreground line-clamp-2">
                    {event.title}
                </h3>
                <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                    {event.description}
                </p>
            </CardHeader>

            {/* Content */}
            <CardContent className="relative flex flex-1 flex-col gap-3 px-6 pb-4">
                <div className="mt-auto flex items-center justify-between rounded-lg bg-background/50 p-3 ring-1 ring-border/50 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                        <Calendar className="size-4 text-primary" />
                        {formatDate(event.date)}
                    </span>
                    <span className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                            <Users className="size-4 text-primary" />
                            {event.participants_count}
                        </span>
                        <span className="flex items-center gap-1">
                            <Eye className="size-4 text-primary" />
                            {event.view_count}
                        </span>
                    </span>
                </div>
            </CardContent>

            {/* Footer */}
            <CardFooter className="relative border-t border-border/50 px-6 py-4 flex transition-colors group-hover:bg-muted/20">
                <Button
                    className="w-full group/btn font-semibold"
                    nativeButton={false}
                    render={<Link href={`/evenimente/${CATEGORY_ROUTES[event.category] ?? event.category}/${event.id}`} />}
                >
                    Vezi evenimentul
                    <ArrowRight className="ml-2 size-4 transition-transform group-hover/btn:translate-x-1" />
                </Button>
            </CardFooter>
        </Card>
    )
}