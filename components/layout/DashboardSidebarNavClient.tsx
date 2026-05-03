'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import {
  LayoutDashboard, Calendar, Users, FileText,
  AlertCircle, User, Building2, Settings,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type Org = { id: string; name: string; logo_url: string | null }
type NavItem = { label: string; href: string; Icon: React.ElementType }

export function DashboardSidebarNavClient({ org }: { org: Org | null }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const isOrgContext = searchParams.get('context') === 'org' && !!org

  const baseItems: NavItem[] = [
    { label: 'Panou', href: isOrgContext ? '/panou?context=org' : '/panou', Icon: LayoutDashboard },
    {
      label: isOrgContext ? `Evenimente ${org?.name ?? 'ONG'}` : 'Evenimentele mele',
      href: isOrgContext ? '/panou/evenimente?context=org' : '/panou/evenimente',
      Icon: Calendar,
    },
    { label: 'Participări', href: '/panou/participari', Icon: Users },
    { label: 'Petiții semnate', href: '/panou/petitii', Icon: FileText },
    { label: 'Contestații', href: '/panou/contestatii', Icon: AlertCircle },
  ]

  const orgItems: NavItem[] = org
    ? [
        { label: 'Panou ONG', href: `/organizatie/${org.id}/panou`, Icon: Building2 },
        { label: 'Membri', href: `/organizatie/${org.id}/membri`, Icon: Users },
        { label: 'Setări ONG', href: `/organizatie/${org.id}/setari`, Icon: Settings },
      ]
    : []

  const contItems: NavItem[] = [
    { label: 'Profil', href: '/profil', Icon: User },
    ...(org ? [{ label: org.name, href: `/organizatie/${org.id}/panou`, Icon: Building2 }] : []),
  ]

  function isActive(href: string) {
    const path = href.split('?')[0]
    if (path === '/panou') return pathname === '/panou'
    return pathname.startsWith(path)
  }

  return (
    <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
      <NavGroup label="Activitate" items={baseItems} isActive={isActive} />
      {isOrgContext && org && <NavGroup label="Organizație" items={orgItems} isActive={isActive} />}
      {!isOrgContext && <NavGroup label="Cont" items={contItems} isActive={isActive} />}
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
