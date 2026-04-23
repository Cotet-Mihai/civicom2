'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { X } from 'lucide-react'
import type { EventFilters } from '@/services/event.service'

const CATEGORY_LABELS: Record<string, string> = {
  protest: 'Protest',
  boycott: 'Boycott',
  petition: 'Petiție',
  community: 'Comunitar',
  charity: 'Caritabil',
}

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

  const chips: { label: string; key: string }[] = []

  if (filters.cauta) chips.push({ label: `"${filters.cauta}"`, key: 'cauta' })
  if (filters.categorie) chips.push({ label: CATEGORY_LABELS[filters.categorie] ?? filters.categorie, key: 'categorie' })
  if (filters.sort && filters.sort !== 'data_desc') chips.push({ label: SORT_LABELS[filters.sort] ?? filters.sort, key: 'sort' })
  if (filters.data_de) chips.push({ label: `De la: ${filters.data_de}`, key: 'data_de' })
  if (filters.data_pana) chips.push({ label: `Până la: ${filters.data_pana}`, key: 'data_pana' })

  if (chips.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2">
      {chips.map((chip) => (
        <button
          key={chip.key}
          onClick={() => removeParam(chip.key)}
          className="flex items-center gap-1.5 rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium text-foreground transition-colors hover:bg-muted/80"
        >
          {chip.label}
          <X className="size-3 text-muted-foreground" />
        </button>
      ))}
    </div>
  )
}
