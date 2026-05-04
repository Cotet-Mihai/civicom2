import { Skeleton } from '@/components/ui/skeleton'

function OrgCardSkeleton() {
    return (
        <div className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card">
            {/* Banner */}
            <Skeleton className="w-full aspect-[5/3] rounded-none" />

            {/* Logo suprapus */}
            <div className="relative h-0">
                <div className="absolute -top-10 left-5 z-10 size-16 rounded-2xl border-4 border-card bg-card">
                    <Skeleton className="size-full rounded-xl" />
                </div>
            </div>

            {/* Conținut */}
            <div className="flex flex-1 flex-col gap-3 p-5 pt-10">
                {/* Nume */}
                <Skeleton className="h-5 w-3/4" />
                {/* Rating */}
                <Skeleton className="h-3.5 w-24" />
                {/* Descriere */}
                <div className="space-y-1.5">
                    <Skeleton className="h-3.5 w-full" />
                    <Skeleton className="h-3.5 w-5/6" />
                </div>
                {/* Badge-uri */}
                <div className="flex gap-2">
                    <Skeleton className="h-6 w-16 rounded-full" />
                    <Skeleton className="h-6 w-20 rounded-full" />
                </div>
                {/* Footer */}
                <div className="mt-auto flex items-center justify-between border-t border-border/50 pt-4">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-16" />
                </div>
            </div>
        </div>
    )
}

export function OrgsGridSkeleton() {
    return (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
                <OrgCardSkeleton key={i} />
            ))}
        </div>
    )
}
