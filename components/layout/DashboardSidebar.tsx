import Link from 'next/link'
import { DashboardContextSwitcherClient } from './DashboardContextSwitcherClient'
import { DashboardSidebarNavClient } from './DashboardSidebarNavClient'
import type { DashboardOrg } from './dashboard-types'

type Props = {
  userName: string
  userEmail: string
  avatarUrl: string | null
  org: DashboardOrg | null
}

export function DashboardSidebar({ userName, userEmail, avatarUrl, org }: Props) {
  return (
    <aside className="hidden md:flex flex-col w-[260px] shrink-0 border-r border-border bg-background sticky top-0 h-screen overflow-hidden">
      <div className="flex items-center px-4 py-3 border-b border-border/50 shrink-0">
        <Link
          href="/"
          className="font-heading text-xl font-black uppercase tracking-tighter text-primary hover:opacity-80 transition-opacity"
        >
          CIVICOM✨
        </Link>
      </div>
      <DashboardContextSwitcherClient
        userName={userName}
        userEmail={userEmail}
        avatarUrl={avatarUrl}
        org={org}
      />
      <DashboardSidebarNavClient org={org} />
    </aside>
  )
}
