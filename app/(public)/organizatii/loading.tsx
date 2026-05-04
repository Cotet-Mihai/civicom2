import { Skeleton } from '@/components/ui/skeleton'
import { OrgsGridSkeleton } from './_components/OrgsGridSkeleton'

export default function OrganizatiiLoading() {
    return (
        <div className="relative min-h-screen bg-background pb-20 lg:pb-28">
            <div className="relative z-10 mx-auto max-w-[1400px] px-6 pt-6 lg:px-8 lg:pt-10">

                {/* Hero skeleton */}
                <div className="mb-4 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_0.9fr_auto] lg:items-center">
                    <div className="flex flex-col gap-2">
                        <Skeleton className="h-12 w-4/5" />
                        <Skeleton className="h-8 w-2/5" />
                        <Skeleton className="mt-1 h-5 w-3/4" />
                    </div>
                    <div className="space-y-2">
                        <Skeleton className="h-12 w-full rounded-xl" />
                        <Skeleton className="h-4 w-2/3" />
                    </div>
                    <div className="hidden lg:block h-80 w-80" />
                </div>

                {/* Filtre skeleton */}
                <div className="mb-4 border-t border-border/50 pt-4">
                    <div className="flex items-center gap-2 overflow-hidden">
                        {Array.from({ length: 7 }).map((_, i) => (
                            <Skeleton key={i} className="h-9 w-28 shrink-0 rounded-full" />
                        ))}
                    </div>
                </div>

                {/* Număr rezultate skeleton */}
                <Skeleton className="mb-4 h-4 w-24" />

                {/* Grid skeleton */}
                <OrgsGridSkeleton />
            </div>
        </div>
    )
}
