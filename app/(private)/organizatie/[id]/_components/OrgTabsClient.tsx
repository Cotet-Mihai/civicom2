'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

type Props = { orgId: string }

export function OrgTabsClient({ orgId }: Props) {
  const pathname = usePathname()

  const tabs = [
    { label: 'Panou', href: `/organizatie/${orgId}/panou` },
    { label: 'Evenimente', href: `/organizatie/${orgId}/evenimente` },
    { label: 'Membri', href: `/organizatie/${orgId}/membri` },
    { label: 'Setări', href: `/organizatie/${orgId}/setari` },
  ]

  return (
    <div className="flex gap-1 bg-muted/50 rounded-xl p-1 w-full overflow-x-auto">
      {tabs.map(tab => (
        <Link
          key={tab.href}
          href={tab.href}
          className={cn(
            'flex-1 text-center text-xs font-semibold px-3 py-2 rounded-lg transition-colors whitespace-nowrap',
            pathname === tab.href
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  )
}
