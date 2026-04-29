import type { Metadata } from 'next'
import { getEvents } from '@/services/event.service'
import type { EventFilters } from '@/services/event.service'
import { FilterPanel } from './_components/FilterPanel'
import { FilterFABClient } from './_components/FilterFABClient'
import { FiltersPendingProvider } from './_components/FiltersPendingContext'
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

    type ValidCategory = typeof VALID_CATEGORIES[number]
    const rawCategorii = (params.categorie ?? '')
        .split(',')
        .map(c => c.trim())
        .filter((c): c is ValidCategory => VALID_CATEGORIES.includes(c as ValidCategory))

    const filters: EventFilters = {
        cauta: params.cauta,
        categorii: rawCategorii.length > 0 ? rawCategorii : undefined,
        sort: VALID_SORTS.includes(params.sort as never)
            ? (params.sort as EventFilters['sort'])
            : undefined,
        data_de: params.data_de,
        data_pana: params.data_pana,
    }

    const { events, total } = await getEvents(filters, 1)

    const filterKey = new URLSearchParams(
        Object.fromEntries(
            Object.entries(params).filter(([, v]) => v !== undefined)
        ) as Record<string, string>
    ).toString()

    return (
        <FiltersPendingProvider>
        <div className="relative min-h-screen bg-background">
            {/* Efect de glow ambiental */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute -left-1/4 top-0 h-[500px] w-[500px] rounded-full bg-primary/5 blur-[100px]" />
            </div>

            <div className="relative z-10 flex flex-col lg:flex-row">

                <aside className="hidden shrink-0 border-border/50 bg-card/30 backdrop-blur-sm lg:sticky lg:top-16 lg:block lg:h-[calc(100vh-4rem)] lg:w-[320px] lg:self-start lg:overflow-y-auto lg:border-r">
                    <div className="px-6 py-8 lg:px-8 lg:py-12">
                        <FilterPanel filters={filters} />
                    </div>
                </aside>

                {/* ZONA DE REZULTATE */}
                <main className="flex-1 px-6 py-8 lg:px-10 lg:py-12">
                    <div className="mx-auto max-w-5xl space-y-6 animate-fade-in-up">

                        {/* Bara de control superioară */}
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-xl bg-card/50 border border-border p-4 shadow-sm backdrop-blur-sm">
                            <ActiveFiltersBarClient filters={filters} />
                            <div className="ml-auto shrink-0 text-sm font-bold text-muted-foreground">
                                <ResultsCount total={total} />
                            </div>
                        </div>

                        {/* Lista de Evenimente */}
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
                </main>
            </div>
        </div>

        <FilterFABClient filters={filters} />
        </FiltersPendingProvider>
    )
}