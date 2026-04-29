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
  description: 'Descoperă proteste, petiții, boicoturi și activități comunitare din România.',
  alternates: { canonical: '/evenimente' },
  openGraph: {
    title: 'Evenimente — CIVICOM',
    description: 'Descoperă proteste, petiții, boicoturi și activități comunitare din România.',
    url: 'https://civicom.ro/evenimente',
    siteName: 'CIVICOM',
    locale: 'ro_RO',
    type: 'website',
  },
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

const VALID_CATEGORIES = ['protest', 'boycott', 'petition', 'community', 'charity'] as const
const VALID_SORTS = ['data_desc', 'data_asc', 'participanti'] as const

export default async function EventsPage({ searchParams }: PageProps) {
  const params = await searchParams

  const filters: EventFilters = {
    cauta: params.cauta,
    categorie: VALID_CATEGORIES.includes(params.categorie as never)
      ? (params.categorie as EventFilters['categorie'])
      : undefined,
    sort: VALID_SORTS.includes(params.sort as never)
      ? (params.sort as EventFilters['sort'])
      : undefined,
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
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr] lg:items-start lg:gap-8">
        {/* aside = un singur grid item; FilterPanel randează intern desktop+mobile via Tailwind */}
        <aside className="lg:sticky lg:top-20">
          <FilterPanel filters={filters} />
        </aside>

        <div className="min-w-0 space-y-6">
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
