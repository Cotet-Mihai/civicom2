'use client'

import { useState, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import type { EventFilters } from '@/services/event.service'

const CATEGORIES = [
  { value: '', label: 'Toate categoriile' },
  { value: 'protest', label: 'Protest' },
  { value: 'boycott', label: 'Boycott' },
  { value: 'petition', label: 'Petiție' },
  { value: 'community', label: 'Comunitar' },
  { value: 'charity', label: 'Caritabil' },
]

const SORT_OPTIONS = [
  { value: 'data_desc', label: 'Cele mai recente' },
  { value: 'data_asc', label: 'Cele mai vechi' },
  { value: 'participanti', label: 'Popularitate' },
]

type Props = { filters: EventFilters }

export function FilterPanelClient({ filters }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  // State local pentru search — permite typing fluid cu debounce pe URL
  const [searchValue, setSearchValue] = useState(filters.cauta ?? '')

  function updateParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    router.replace('/evenimente?' + params.toString())
  }

  function handleSearch(value: string) {
    setSearchValue(value)
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(() => {
      updateParam('cauta', value || null)
    }, 400)
  }

  return (
    <div className="space-y-6">
      {/* Căutare text */}
      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
          Caută
        </label>
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

      {/* Categorie */}
      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
          Categorie
        </label>
        <select
          value={filters.categorie ?? ''}
          onChange={(e) => updateParam('categorie', e.target.value || null)}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      {/* Sortare */}
      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
          Sortare
        </label>
        <select
          value={filters.sort ?? 'data_desc'}
          onChange={(e) =>
            updateParam('sort', e.target.value === 'data_desc' ? null : e.target.value)
          }
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          {SORT_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {/* Interval dată */}
      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
          Perioadă
        </label>
        <div className="space-y-2">
          <Input
            type="date"
            value={filters.data_de ?? ''}
            onChange={(e) => updateParam('data_de', e.target.value || null)}
            className="text-sm"
          />
          <Input
            type="date"
            value={filters.data_pana ?? ''}
            onChange={(e) => updateParam('data_pana', e.target.value || null)}
            className="text-sm"
          />
        </div>
      </div>
    </div>
  )
}
