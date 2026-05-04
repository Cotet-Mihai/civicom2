'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import {
  LayoutDashboard, Calendar, Users, FileText,
  AlertCircle, User, Building2, Settings,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { DashboardOrg } from './dashboard-types'

type NavItem = { label: string; href: string; Icon: React.ElementType }

export function DashboardSidebarNavClient({ org }: { org: DashboardOrg | null }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const isOrgContext = org && (
    searchParams.get('context') === 'org' ||
    pathname.startsWith('/organizatie/')
  )

  function isActive(href: string) {
    const path = href.split('?')[0]
    if (path === '/panou') return pathname === '/panou'
    return pathname.startsWith(path)
  }

  const userItems: NavItem[] = [
    { label: 'Panou', href: '/panou', Icon: LayoutDashboard },
    { label: 'Evenimentele mele', href: '/panou/evenimente', Icon: Calendar },
    { label: 'Participări', href: '/panou/participari', Icon: Users },
    { label: 'Petiții semnate', href: '/panou/petitii', Icon: FileText },
    { label: 'Contestații', href: '/panou/contestatii', Icon: AlertCircle },
  ]

  const orgActivityItems: NavItem[] = [
    { label: 'Panou', href: '/panou?context=org', Icon: LayoutDashboard },
    { label: 'Evenimentele mele', href: '/panou/evenimente?context=org', Icon: Calendar },
    { label: 'Contestații', href: '/panou/contestatii?context=org', Icon: AlertCircle },
  ]

  const orgManageItems: NavItem[] = org
    ? [
        { label: 'Panou ONG', href: `/organizatie/${org.id}/panou`, Icon: Building2 },
        { label: 'Evenimente', href: `/organizatie/${org.id}/evenimente`, Icon: Calendar },
        { label: 'Membri', href: `/organizatie/${org.id}/membri`, Icon: Users },
        { label: 'Setări', href: `/organizatie/${org.id}/setari`, Icon: Settings },
      ]
    : []

  const contItems: NavItem[] = [
    { label: 'Profil', href: '/profil', Icon: User },
  ]

  return (
    <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
      {isOrgContext ? (
        <>
          <NavGroup label="Activitate" items={orgActivityItems} isActive={isActive} />
          <NavGroup label="Organizație" items={orgManageItems} isActive={isActive} />
        </>
      ) : (
        <>
          <NavGroup label="Activitate" items={userItems} isActive={isActive} />
          <NavGroup label="Cont" items={contItems} isActive={isActive} />
        </>
      )}
    </nav>
  )
}

function NavGroup({
  label, items, isActive,
}: {
  label: string
  items: NavItem[]
  isActive: (href: string) => boolean
}) {
  return (
    <div>
      <p className="px-2 pb-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <div className="space-y-0.5">
        {items.map(({ label, href, Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors border-l-2',
              isActive(href)
                ? 'border-primary bg-primary/5 text-primary'
                : 'border-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground',
            )}
          >
            <Icon className="size-4 shrink-0" />
            <span className="truncate">{label}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
