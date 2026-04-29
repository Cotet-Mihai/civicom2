import { SlidersHorizontal } from 'lucide-react'
import type { EventFilters } from '@/services/event.service'
import { FilterPanelClient } from './FilterPanelClient'

type Props = { filters: EventFilters }

export function FilterPanel({ filters }: Props) {
    return (
        <div className="flex flex-col gap-8">
            <div className="flex items-center gap-3">
                <SlidersHorizontal className="size-6 text-primary" />
                <h2 className="font-heading text-2xl font-black uppercase tracking-tight text-foreground">
                    Filtrează
                </h2>
            </div>
            <FilterPanelClient filters={filters} />
        </div>
    )
}