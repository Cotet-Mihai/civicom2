'use client'

import Link from 'next/link'
import { useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import {
  LayoutDashboard, Calendar, Users, FileText,
  AlertCircle, User, Building2, Settings,
  LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { signOut } from '@/services/auth.service'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import type { DashboardOrg } from './dashboard-types'

type NavItem = { label: string; href: string; Icon: React.ElementType }

type Props = { org: DashboardOrg | null; onClose?: () => void }

export function DashboardSidebarNavClient({ org, onClose }: Props) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [signOutOpen, setSignOutOpen] = useState(false)

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

  const orgActivityItems: NavItem[] = org
    ? [
        { label: 'Panou ONG', href: `/organizatie/${org.id}/panou`, Icon: Building2 },
        { label: 'Evenimente ONG', href: '/panou/evenimente?context=org', Icon: Calendar },
        { label: 'Contestații', href: `/organizatie/${org.id}/contestatii`, Icon: AlertCircle },
      ]
    : []

  const orgManageItems: NavItem[] = org
    ? [
        { label: 'Membri', href: `/organizatie/${org.id}/membri`, Icon: Users },
        { label: 'Setări', href: `/organizatie/${org.id}/setari`, Icon: Settings },
      ]
    : []

  const contItems: NavItem[] = [
    { label: 'Profil', href: '/profil', Icon: User },
  ]

  return (
    <>
      <AlertDialog open={signOutOpen} onOpenChange={setSignOutOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ieși din cont?</AlertDialogTitle>
            <AlertDialogDescription>
              Vei fi deconectat și redirecționat spre pagina principală.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anulează</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => signOut()}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Da, deconectează-mă
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {isOrgContext ? (
          <>
            <NavGroup label="Activitate" items={orgActivityItems} isActive={isActive} onClose={onClose} />
            <NavGroup label="Organizație" items={orgManageItems} isActive={isActive} onClose={onClose} />
          </>
        ) : (
          <>
            <NavGroup label="Activitate" items={userItems} isActive={isActive} onClose={onClose} />
            <NavGroup label="Cont" items={contItems} isActive={isActive} onClose={onClose} />
          </>
        )}
      </nav>

      <div className="shrink-0 border-t border-border px-3 py-3">
        <button
          onClick={() => { onClose?.(); setSignOutOpen(true) }}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
        >
          <LogOut className="size-4 shrink-0" />
          Deconectare
        </button>
      </div>
    </>
  )
}

function NavGroup({
  label, items, isActive, onClose,
}: {
  label: string
  items: NavItem[]
  isActive: (href: string) => boolean
  onClose?: () => void
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
            onClick={onClose}
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
