'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import type { DashboardEvent } from '@/services/user.service'

const TABS = [
  { label: 'Toate', value: 'all' },
  { label: 'Aprobate', value: 'approved' },
  { label: 'În așteptare', value: 'pending' },
  { label: 'Finalizate', value: 'completed' },
  { label: 'Respinse', value: 'rejected' },
]

type Props = {
  children: (filtered: DashboardEvent[]) => React.ReactNode
  events: DashboardEvent[]
}

export function EventsFilterTabsClient({ events, children }: Props) {
  const [active, setActive] = useState('all')

  const filtered = active === 'all'
    ? events
    : active === 'pending'
      ? events.filter(e => e.status === 'pending' || e.status === 'contested')
      : events.filter(e => e.status === active)

  return (
    <div className="space-y-4">
      <div className="flex gap-1 overflow-x-auto border-b border-border pb-0">
        {TABS.map(tab => (
          <button
            key={tab.value}
            onClick={() => setActive(tab.value)}
            className={cn(
              'px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors',
              active === tab.value
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {children(filtered)}
    </div>
  )
}
