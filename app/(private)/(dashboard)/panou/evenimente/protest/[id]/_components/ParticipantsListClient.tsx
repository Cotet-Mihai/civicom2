'use client'

import { useState } from 'react'
import { Users, ChevronLeft, ChevronRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { ProtestParticipant } from '@/services/stats.service'

const PAGE_SIZE = 20

type Props = { participants: ProtestParticipant[] }

export function ParticipantsListClient({ participants }: Props) {
  const [filter, setFilter] = useState<'joined' | 'cancelled'>('joined')
  const [page, setPage] = useState(0)

  const filtered = participants.filter(p => p.status === filter)
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const pageData = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  const joinedCount = participants.filter(p => p.status === 'joined').length
  const cancelledCount = participants.filter(p => p.status === 'cancelled').length

  function initials(name: string) {
    return name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('ro-RO', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 border-b border-border/50 pb-2">
        <div className="flex items-center gap-2">
          <Users className="size-5 text-primary" />
          <h2 className="font-heading text-xl font-bold tracking-tight text-foreground">
            Participanți ({participants.length})
          </h2>
        </div>

        <div className="ml-auto flex items-center gap-1 rounded-lg bg-muted p-1">
          {(['joined', 'cancelled'] as const).map(s => (
            <button
              key={s}
              onClick={() => { setFilter(s); setPage(0) }}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-default ${
                filter === s
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {s === 'joined' ? `Joined (${joinedCount})` : `Anulat (${cancelledCount})`}
            </button>
          ))}
        </div>
      </div>

      <Card className="overflow-hidden rounded-2xl border border-border bg-card/50">
        <CardContent className="p-0">
          {pageData.length === 0 ? (
            <div className="flex h-32 items-center justify-center">
              <p className="text-sm text-muted-foreground">Nicio intrare</p>
            </div>
          ) : (
            <ul className="divide-y divide-border/50">
              {pageData.map(p => (
                <li key={p.user_id} className="flex items-center gap-3 px-4 py-3">
                  <div className="size-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-black text-xs text-primary shrink-0">
                    {initials(p.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{p.name}</p>
                    {p.county && <p className="text-xs text-muted-foreground">{p.county}</p>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="hidden sm:block text-xs text-muted-foreground">{formatDate(p.joined_at)}</span>
                    <Badge
                      variant={p.status === 'joined' ? 'default' : 'destructive'}
                      className="text-[10px] px-2 py-0"
                    >
                      {p.status === 'joined' ? 'Joined' : 'Anulat'}
                    </Badge>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} din {filtered.length}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:border-primary/40 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-default"
            >
              <ChevronLeft className="size-3" /> Înapoi
            </button>
            <span className="px-2 text-xs font-medium text-foreground">{page + 1} / {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page === totalPages - 1}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:border-primary/40 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-default"
            >
              Înainte <ChevronRight className="size-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
