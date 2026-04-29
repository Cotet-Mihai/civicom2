import { Skeleton } from '@/components/ui/skeleton'
import { EventListItemSkeleton } from './EventListItemSkeleton'

export function EventsGridSkeleton() {
  return (
    <div className="relative min-h-screen bg-background">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-1/4 top-0 h-[500px] w-[500px] rounded-full bg-primary/5 blur-[100px]" />
      </div>

      <div className="relative z-10 flex flex-col lg:flex-row">

        {/* Sidebar */}
        <aside className="w-full shrink-0 border-border/50 bg-card/30 backdrop-blur-sm lg:sticky lg:top-0 lg:h-screen lg:w-[320px] lg:border-r">
          <div className="space-y-6 px-6 py-8 lg:px-8 lg:py-12">
            <div className="space-y-2">
              <Skeleton className="h-2.5 w-10" />
              <Skeleton className="h-9 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-2.5 w-14" />
              <Skeleton className="h-9 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-2.5 w-16" />
              <div className="space-y-1.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Skeleton className="h-2.5 w-14" />
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
            </div>
          </div>
        </aside>

        {/* Zona de rezultate */}
        <main className="flex-1 px-6 py-8 lg:px-10 lg:py-12">
          <div className="mx-auto max-w-5xl space-y-6">
            <Skeleton className="h-14 w-full rounded-xl" />
            <div className="flex flex-col gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <EventListItemSkeleton key={i} />
              ))}
            </div>
          </div>
        </main>

      </div>
    </div>
  )
}
