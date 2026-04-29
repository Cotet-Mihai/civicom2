'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useFiltersPending } from './FiltersPendingContext'
import { Search, CalendarIcon } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { ro } from 'date-fns/locale'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { EventFilters } from '@/services/event.service'

const CATEGORIES = [
    { value: 'protest', label: 'Protest' },
    { value: 'boycott', label: 'Boycott' },
    { value: 'petition', label: 'Petiție' },
    { value: 'community', label: 'Comunitar' },
    { value: 'charity', label: 'Caritabil' },
]

type SortValue = 'data_desc' | 'data_asc' | 'participanti'

const SORT_OPTIONS: { value: SortValue; label: string }[] = [
    { value: 'data_desc', label: 'Cele mai recente' },
    { value: 'data_asc', label: 'Cele mai vechi' },
    { value: 'participanti', label: 'Popularitate' },
]

const SECTION_LABEL = 'text-[10px] font-black uppercase tracking-widest text-muted-foreground'

type Props = { filters: EventFilters }

export function FilterPanelClient({ filters }: Props) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { startTransition } = useFiltersPending()
    const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

    // Local state pentru răspuns imediat — independent de latența server re-render
    const [searchValue, setSearchValue] = useState(filters.cauta ?? '')
    const [localCategorii, setLocalCategorii] = useState<string[]>(filters.categorii ?? [])
    const [localSort, setLocalSort] = useState<SortValue>((filters.sort ?? 'data_desc') as SortValue)
    const [localDateFrom, setLocalDateFrom] = useState(filters.data_de)
    const [localDateTo, setLocalDateTo] = useState(filters.data_pana)
    const [openFrom, setOpenFrom] = useState(false)
    const [openTo, setOpenTo] = useState(false)

    // Sincronizare din props (chips remove, navigare înapoi etc.)
    useEffect(() => { setSearchValue(filters.cauta ?? '') }, [filters.cauta])
    useEffect(() => { setLocalCategorii(filters.categorii ?? []) }, [filters.categorii])
    useEffect(() => { setLocalSort((filters.sort ?? 'data_desc') as SortValue) }, [filters.sort])
    useEffect(() => { setLocalDateFrom(filters.data_de) }, [filters.data_de])
    useEffect(() => { setLocalDateTo(filters.data_pana) }, [filters.data_pana])

    function updateParam(key: string, value: string | null) {
        const params = new URLSearchParams(searchParams.toString())
        if (value) {
            params.set(key, value)
        } else {
            params.delete(key)
        }
        startTransition(() => {
            router.replace('/evenimente?' + params.toString())
        })
    }

    function handleSearch(value: string) {
        setSearchValue(value)
        if (searchTimeout.current) clearTimeout(searchTimeout.current)
        searchTimeout.current = setTimeout(() => {
            updateParam('cauta', value || null)
        }, 400)
    }

    function toggleCategory(value: string) {
        const next = localCategorii.includes(value)
            ? localCategorii.filter((c) => c !== value)
            : [...localCategorii, value]
        setLocalCategorii(next)
        updateParam('categorie', next.length > 0 ? next.join(',') : null)
    }

    function handleSortChange(val: SortValue | null) {
        const sort = val ?? 'data_desc'
        setLocalSort(sort)
        updateParam('sort', sort === 'data_desc' ? null : sort)
    }

    const dateFrom = localDateFrom ? parseISO(localDateFrom) : undefined
    const dateTo = localDateTo ? parseISO(localDateTo) : undefined

    return (
        <div className="space-y-6">

            {/* Căutare text */}
            <div className="space-y-2">
                <Label className={SECTION_LABEL}>Caută</Label>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Titlu eveniment..."
                        value={searchValue}
                        onChange={(e) => handleSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>
            </div>

            {/* Sortare */}
            <div className="space-y-2">
                <Label className={SECTION_LABEL}>Sortare</Label>
                <Select value={localSort} onValueChange={handleSortChange}>
                    <SelectTrigger className="w-full">
                        <SelectValue>
                            {SORT_OPTIONS.find(s => s.value === localSort)?.label}
                        </SelectValue>
                    </SelectTrigger>
                    <SelectContent align="start" alignItemWithTrigger={false}>
                        {SORT_OPTIONS.map((s) => (
                            <SelectItem key={s.value} value={s.value}>
                                {s.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Categorie — checkboxuri multiple */}
            <div className="space-y-2">
                <Label className={SECTION_LABEL}>Categorie</Label>
                <div className="space-y-1">
                    {CATEGORIES.map((c) => {
                        const checked = localCategorii.includes(c.value)
                        return (
                            <label
                                key={c.value}
                                className={cn(
                                    'flex w-full cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors',
                                    checked
                                        ? 'border-primary/30 bg-primary/10 text-primary'
                                        : 'border-transparent text-foreground hover:bg-muted'
                                )}
                            >
                                <Checkbox
                                    checked={checked}
                                    onCheckedChange={() => toggleCategory(c.value)}
                                />
                                {c.label}
                            </label>
                        )
                    })}
                </div>
            </div>

            {/* Interval dată */}
            <div className="space-y-2">
                <div>
                    <Label className={SECTION_LABEL}>Perioadă</Label>
                    <p className="mt-0.5 text-[10px] text-muted-foreground/60">
                        Data la care a fost postat evenimentul
                    </p>
                </div>
                <div className="space-y-2">

                    {/* De la */}
                    <div className="space-y-1">
                        <Label className="text-xs font-semibold text-muted-foreground">De la</Label>
                        <Popover open={openFrom} onOpenChange={setOpenFrom}>
                            <PopoverTrigger
                                className={cn(
                                    buttonVariants({ variant: 'outline' }),
                                    'w-full justify-start text-left font-normal',
                                    !dateFrom && 'text-muted-foreground'
                                )}
                            >
                                <CalendarIcon className="mr-2 size-4 shrink-0" />
                                {dateFrom
                                    ? format(dateFrom, 'd MMM yyyy', { locale: ro })
                                    : 'Alege dată'}
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={dateFrom}
                                    onSelect={(date) => {
                                        const formatted = date ? format(date, 'yyyy-MM-dd') : null
                                        setLocalDateFrom(formatted ?? undefined)
                                        updateParam('data_de', formatted)
                                        setOpenFrom(false)
                                    }}
                                />
                            </PopoverContent>
                        </Popover>
                    </div>

                    {/* Până la */}
                    <div className="space-y-1">
                        <Label className="text-xs font-semibold text-muted-foreground">Până la</Label>
                        <Popover open={openTo} onOpenChange={setOpenTo}>
                            <PopoverTrigger
                                className={cn(
                                    buttonVariants({ variant: 'outline' }),
                                    'w-full justify-start text-left font-normal',
                                    !dateTo && 'text-muted-foreground'
                                )}
                            >
                                <CalendarIcon className="mr-2 size-4 shrink-0" />
                                {dateTo
                                    ? format(dateTo, 'd MMM yyyy', { locale: ro })
                                    : 'Alege dată'}
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={dateTo}
                                    onSelect={(date) => {
                                        const formatted = date ? format(date, 'yyyy-MM-dd') : null
                                        setLocalDateTo(formatted ?? undefined)
                                        updateParam('data_pana', formatted)
                                        setOpenTo(false)
                                    }}
                                />
                            </PopoverContent>
                        </Popover>
                    </div>

                </div>
            </div>
        </div>
    )
}
