import { EventsGridSkeleton } from './_components/EventsGridSkeleton'

export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8 lg:py-16">
      <EventsGridSkeleton />
    </div>
  )
}
