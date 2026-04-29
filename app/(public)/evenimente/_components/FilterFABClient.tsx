'use client'

import { SlidersHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet'
import type { EventFilters } from '@/services/event.service'
import { FilterPanelClient } from './FilterPanelClient'

type Props = { filters: EventFilters }

export function FilterFABClient({ filters }: Props) {
    const activeCount = [
        filters.cauta,
        ...(filters.categorii ?? []),
        filters.sort !== undefined ? filters.sort : null,
        filters.data_de,
        filters.data_pana,
    ].filter(Boolean).length

    return (
        <div className="fixed bottom-6 right-6 z-40 lg:hidden">
            <Sheet>
                <SheetTrigger
                    render={
                        <Button className="relative size-14 rounded-xl shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40" />
                    }
                >
                    <SlidersHorizontal className="size-6" />
                    {activeCount > 0 && (
                        <span className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-secondary text-[11px] font-black text-secondary-foreground">
                            {activeCount}
                        </span>
                    )}
                </SheetTrigger>

                <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl px-6 pb-8">
                    <SheetHeader className="text-left pb-4">
                        <SheetTitle className="flex items-center gap-2 font-heading text-xl font-black uppercase tracking-tight text-foreground">
                            <SlidersHorizontal className="size-5 text-primary" />
                            Filtre
                        </SheetTitle>
                    </SheetHeader>
                    <FilterPanelClient filters={filters} />
                </SheetContent>
            </Sheet>
        </div>
    )
}
