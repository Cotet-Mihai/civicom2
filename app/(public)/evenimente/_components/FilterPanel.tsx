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

export function FilterPanel({ filters }: Props) {
    return (
        <>
            {/* Desktop sidebar — hidden on mobile */}
            <div className="hidden flex-col gap-8 lg:flex">
                {/* Titlu stilizat CIVICOM, integrat fluid în sidebar */}
                <div className="flex items-center gap-3">
                    <SlidersHorizontal className="size-6 text-primary" />
                    <h2 className="font-heading text-2xl font-black uppercase tracking-tight text-foreground">
                        Filtrează
                    </h2>
                </div>

                {/* Formularul de filtre - pus liber, fără borduri și fundal propriu */}
                <div className="w-full">
                    <FilterPanelClient filters={filters} />
                </div>
            </div>

            {/* Mobile Sheet trigger — hidden on desktop */}
            <div className="lg:hidden">
                <Sheet>
                    <SheetTrigger
                        render={
                            <Button
                                variant="outline"
                                className="w-full gap-2 transition-all hover:border-primary/50 sm:w-auto font-semibold"
                            />
                        }
                    >
                        <SlidersHorizontal className="size-4 text-primary" />
                        Filtrează evenimente
                    </SheetTrigger>

                    {/* Meniul lateral pe mobil */}
                    <SheetContent side="left" className="w-[300px] border-r-border/50 bg-background/95 backdrop-blur-md overflow-y-auto sm:w-[400px]">
                        <SheetHeader className="text-left">
                            <SheetTitle className="flex items-center gap-2 font-heading text-2xl font-black uppercase tracking-tight text-foreground">
                                <SlidersHorizontal className="size-5 text-primary" />
                                Filtre
                            </SheetTitle>
                        </SheetHeader>
                        <div className="mt-8 p-3">
                            <FilterPanelClient filters={filters} />
                        </div>
                    </SheetContent>
                </Sheet>
            </div>
        </>
    )
}