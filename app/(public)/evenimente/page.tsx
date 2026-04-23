import type { Metadata } from 'next'
import { getEvents } from '@/services/event.service'
import type { EventFilters } from '@/services/event.service'
import { FilterPanel } from './_components/FilterPanel'
import { ActiveFiltersBarClient } from './_components/ActiveFiltersBarClient'
import { ResultsCount } from './_components/ResultsCount'
import { EventsListClient } from './_components/EventsListClient'
import { EmptyState } from './_components/EmptyState'

export const metadata: Metadata = {
  title: 'Evenimente',
  description:
    'Descoperă proteste, petiții, boicoturi și activități comunitare din România.',
  alternates: { canonical: '/evenimente' },
}

type PageProps = {
  searchParams: Promise<{
    cauta?: string
    categorie?: string
    sort?: string
    data_de?: string
    data_pana?: string
  }>
}

export default async function EventsPage({ searchParams }: PageProps) {
  const params = await searchParams

  const filters: EventFilters = {
    cauta: params.cauta,
    categorie: params.categorie as EventFilters['categorie'],
    sort: params.sort as EventFilters['sort'],
    data_de: params.data_de,
    data_pana: params.data_pana,
  }

  const { events, total } = await getEvents(filters, 1)

  // filterKey forces EventsListClient to remount on filter change (resets accumulated list)
  const filterKey = new URLSearchParams(
    Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== undefined)
    ) as Record<string, string>
  ).toString()

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8 lg:py-16">
      {/* flex-col on mobile (Sheet trigger above content), flex-row on desktop (sidebar) */}
      <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
        <FilterPanel filters={filters} />

        <div className="min-w-0 flex-1 space-y-6">
          <h1 className="text-2xl font-black uppercase tracking-tighter text-foreground lg:text-3xl">
            Evenimente
          </h1>

          <ActiveFiltersBarClient filters={filters} />

          <ResultsCount total={total} />

          {total === 0 ? (
            <EmptyState />
          ) : (
            <EventsListClient
              key={filterKey}
              initialEvents={events}
              total={total}
              filters={filters}
            />
          )}
        </div>
      </div>
    </div>
  )
}
