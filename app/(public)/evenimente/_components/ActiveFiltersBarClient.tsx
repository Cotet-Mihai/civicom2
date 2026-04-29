'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { X } from 'lucide-react'
import type { EventFilters } from '@/services/event.service'
import { CATEGORY_LABELS } from '@/lib/constants'

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

  if (filters.cauta) chips.push({ label: `"${filters.cauta}"`, onRemove: () => removeParam('cauta') })

  for (const cat of filters.categorii ?? []) {
    chips.push({
      label: CATEGORY_LABELS[cat] ?? cat,
      onRemove: () => removeCategory(cat),
    })
  }

  if (filters.sort && filters.sort !== 'data_desc')
    chips.push({ label: SORT_LABELS[filters.sort] ?? filters.sort, onRemove: () => removeParam('sort') })

  if (filters.data_de) chips.push({ label: `De la: ${filters.data_de}`, onRemove: () => removeParam('data_de') })
  if (filters.data_pana) chips.push({ label: `Până la: ${filters.data_pana}`, onRemove: () => removeParam('data_pana') })

  if (chips.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2">
      {chips.map((chip, i) => (
        <button
          key={i}
          onClick={chip.onRemove}
          className="flex items-center gap-1.5 rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium text-foreground transition-colors hover:bg-muted/80"
        >
          {chip.label}
          <X className="size-3 text-muted-foreground" />
        </button>
      ))}
    </div>
  )
}
