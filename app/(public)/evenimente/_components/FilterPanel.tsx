// app/(public)/evenimente/_components/FilterPanel.tsx
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
      <div className="hidden w-[280px] shrink-0 lg:block">
        <p className="mb-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
          Filtre
        </p>
        <FilterPanelClient key={filters.cauta ?? ''} filters={filters} />
      </div>

      {/* Mobile Sheet trigger — hidden on desktop */}
      <div className="lg:hidden">
        <Sheet>
          <SheetTrigger
            render={
              <Button variant="outline" size="sm" className="gap-2" />
            }
          >
            <SlidersHorizontal className="size-4" />
            Filtre
          </SheetTrigger>
          <SheetContent side="left" className="w-[300px] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Filtre</SheetTitle>
            </SheetHeader>
            <div className="mt-6">
              <FilterPanelClient key={filters.cauta ?? ''} filters={filters} />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  )
}
