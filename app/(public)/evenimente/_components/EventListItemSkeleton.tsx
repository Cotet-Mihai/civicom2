import { Skeleton } from '@/components/ui/skeleton'

export function EventListItemSkeleton() {
    return (
        <div className="overflow-hidden rounded-xl border border-border bg-card flex flex-col sm:flex-row sm:items-stretch">
            {/* Imagine */}
            <Skeleton className="w-full h-[220px] shrink-0 rounded-none sm:h-auto sm:w-72 lg:w-80" />

            {/* Conținut */}
            <div className="flex flex-1 flex-col justify-between p-6">
                <div className="space-y-3">
                    <Skeleton className="h-5 w-2/3" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-4/5" />
                    <Skeleton className="h-4 w-1/2" />
                </div>
                <div className="mt-6 flex items-center justify-between border-t border-border/50 pt-4">
                    <div className="flex gap-4">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-12" />
                        <Skeleton className="h-4 w-12" />
                    </div>
                    <Skeleton className="h-9 w-28" />
                </div>
            </div>
        </div>
    )
}

export function EventsListSkeleton({ count = 4 }: { count?: number }) {
    return (
        <div className="flex flex-col gap-6">
            {Array.from({ length: count }).map((_, i) => (
                <EventListItemSkeleton key={i} />
            ))}
        </div>
    )
}
