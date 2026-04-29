'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { X } from 'lucide-react'
import type { EventFilters } from '@/services/event.service'
import { CATEGORY_LABELS } from '@/lib/constants'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

const SORT_LABELS: Record<string, string> = {
    data_desc: 'Cele mai recente',
    data_asc: 'Dată crescătoare',
    participanti: 'Popularitate',
}

type Props = { filters: EventFilters }

export function ActiveFiltersBarClient({ filters }: Props) {
    const router = useRouter()
    const searchParams = useSearchParams()

    function removeParam(key: string) {
        const params = new URLSearchParams(searchParams.toString())
        params.delete(key)
        router.replace('/evenimente?' + params.toString())
    }

    function removeCategory(cat: string) {
        const params = new URLSearchParams(searchParams.toString())
        const current = (params.get('categorie') ?? '').split(',').filter(Boolean)
        const next = current.filter((c) => c !== cat)
        if (next.length > 0) {
            params.set('categorie', next.join(','))
        } else {
            params.delete('categorie')
        }
        router.replace('/evenimente?' + params.toString())
    }

    const chips: { label: string; onRemove: () => void }[] = []

    if (filters.cauta)
        chips.push({ label: `"${filters.cauta}"`, onRemove: () => removeParam('cauta') })

    for (const cat of filters.categorii ?? []) {
        chips.push({
            label: CATEGORY_LABELS[cat] ?? cat,
            onRemove: () => removeCategory(cat),
        })
    }

    if (filters.sort && filters.sort !== 'data_desc')
        chips.push({ label: SORT_LABELS[filters.sort] ?? filters.sort, onRemove: () => removeParam('sort') })

    if (filters.data_de)
        chips.push({ label: `De la: ${filters.data_de}`, onRemove: () => removeParam('data_de') })
    if (filters.data_pana)
        chips.push({ label: `Până la: ${filters.data_pana}`, onRemove: () => removeParam('data_pana') })

    if (chips.length === 0) return null

    return (
        <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-sm font-semibold text-muted-foreground">
                Filtre active:
            </span>

            {chips.map((chip, i) => (
                <Badge
                    key={i}
                    variant="outline"
                    render={<button onClick={chip.onRemove} />}
                    className="group h-auto cursor-pointer gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all duration-300 hover:border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                >
                    {chip.label}
                    <div className="flex size-4 items-center justify-center rounded-full bg-muted transition-colors duration-300 group-hover:bg-destructive/20">
                        <X className="size-3 text-muted-foreground transition-colors group-hover:text-destructive" />
                    </div>
                </Badge>
            ))}

            {chips.length > 1 && (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.replace('/evenimente')}
                    className="ml-2 cursor-pointer h-auto px-0 text-xs font-bold text-muted-foreground underline decoration-muted-foreground/30 underline-offset-4 hover:bg-transparent hover:text-foreground hover:decoration-foreground"
                >
                    Șterge tot
                </Button>
            )}
        </div>
    )
}
