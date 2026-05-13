import Link from 'next/link'
import Image from 'next/image'
import { ChevronRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { DashboardEvent } from '@/services/user.service'

const CATEGORY_LABEL: Record<string, string> = {
    protest: 'Protest',
    boycott: 'Boycott',
    petition: 'Petiție',
    community: 'Comunitar',
    charity: 'Caritabil',
}

const CATEGORY_PATH: Record<string, string> = {
    protest: 'protest',
    boycott: 'boycott',
    petition: 'petitie',
    community: 'comunitar',
    charity: 'caritabil',
}

const STATUS_LABEL: Record<string, string> = {
    pending: 'În așteptare',
    approved: 'Aprobat',
    rejected: 'Respins',
    contested: 'Contestat',
    completed: 'Finalizat',
}

// Am rafinat nuanțele pentru a se integra într-un dashboard curat
const STATUS_CLASSES: Record<string, string> = {
    pending: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    approved: 'bg-primary/10 text-primary border-primary/20',
    rejected: 'bg-destructive/10 text-destructive border-destructive/20',
    contested: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
    completed: 'bg-muted text-muted-foreground border-border/50',
}

type Props = {
    event: DashboardEvent
    showStatus?: boolean
}

function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('ro-RO', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    })
}

export function DashboardEventRow({ event, showStatus = true }: Props) {
    const path = CATEGORY_PATH[event.category] ?? event.category
    const href = `/evenimente/${path}/${event.id}`

    return (
        <Link
            href={href}
            className="group flex items-center justify-between gap-4 p-4 transition-colors hover:bg-muted/30 sm:p-5"
        >
            <div className="flex flex-1 min-w-0 items-center gap-4">

                {/* Thumbnail actualizat cu aspect-video și efect de hover */}
                <div className="relative aspect-video w-16 shrink-0 overflow-hidden rounded-lg border border-border bg-muted sm:w-20">
                    {event.banner_url ? (
                        <Image
                            src={event.banner_url}
                            alt={event.title}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                    ) : (
                        <div className="h-full w-full bg-primary/5 transition-colors group-hover:bg-primary/10" />
                    )}
                </div>

                {/* Informații text */}
                <div className="flex flex-1 min-w-0 flex-col py-0.5">
                    <p className="truncate text-sm font-bold text-foreground transition-colors group-hover:text-primary sm:text-base">
                        {event.title}
                    </p>

                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-medium text-muted-foreground">
              {formatDate(event.created_at)}
            </span>

                        {/* Punct despărțitor subtil */}
                        <span className="h-1 w-1 rounded-full bg-border" />

                        <Badge variant="outline" className="border-transparent bg-primary/5 px-2 py-0 text-[10px] font-semibold text-primary">
                            {CATEGORY_LABEL[event.category] ?? event.category}
                        </Badge>

                        {showStatus && (
                            <span
                                className={`rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${STATUS_CLASSES[event.status] ?? ''}`}
                            >
                {STATUS_LABEL[event.status] ?? event.status}
              </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Săgeată indicator pentru a încuraja acțiunea */}
            <div className="flex shrink-0 text-muted-foreground/30 transition-colors group-hover:text-primary">
                <ChevronRight className="size-5 transition-transform group-hover:translate-x-1" />
            </div>
        </Link>
    )
}