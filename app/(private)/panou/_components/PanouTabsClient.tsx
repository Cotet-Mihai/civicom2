'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const tabs = [
  { label: 'Evenimentele mele', href: '/panou/evenimente' },
  { label: 'Participări', href: '/panou/participari' },
  { label: 'Petiții', href: '/panou/petitii' },
  { label: 'Contestații', href: '/panou/contestatii' },
]

export function PanouTabsClient() {
  const pathname = usePathname()
  return (
    <div className="flex gap-1 border-b border-border overflow-x-auto">
      {tabs.map(tab => (
        <Link
          key={tab.href}
          href={tab.href}
          className={cn(
            'px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors',
            pathname === tab.href
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          )}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  )
}
