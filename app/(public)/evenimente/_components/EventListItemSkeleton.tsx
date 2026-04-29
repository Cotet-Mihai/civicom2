export function EventListItemSkeleton() {
    return (
        <div className="animate-pulse overflow-hidden rounded-xl border border-border bg-card flex flex-col sm:flex-row sm:items-stretch">
            {/* Imagine */}
            <div className="w-full h-[220px] shrink-0 bg-muted sm:h-auto sm:w-72 lg:w-80" />

            {/* Conținut */}
            <div className="flex flex-1 flex-col justify-between p-6">
                <div className="space-y-3">
                    <div className="h-5 w-2/3 rounded-md bg-muted" />
                    <div className="h-4 w-full rounded-md bg-muted" />
                    <div className="h-4 w-4/5 rounded-md bg-muted" />
                    <div className="h-4 w-1/2 rounded-md bg-muted" />
                </div>
                <div className="mt-6 flex items-center justify-between border-t border-border/50 pt-4">
                    <div className="flex gap-4">
                        <div className="h-4 w-20 rounded-md bg-muted" />
                        <div className="h-4 w-12 rounded-md bg-muted" />
                        <div className="h-4 w-12 rounded-md bg-muted" />
                    </div>
                    <div className="h-9 w-28 rounded-md bg-muted" />
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
