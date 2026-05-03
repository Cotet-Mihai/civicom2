import { DashboardContextSwitcherClient } from './DashboardContextSwitcherClient'
import { DashboardSidebarNavClient } from './DashboardSidebarNavClient'
import { DashboardMobileSheetClient } from './DashboardMobileSheetClient'

type Org = { id: string; name: string; logo_url: string | null }

type Props = {
  userName: string
  userEmail: string
  avatarUrl: string | null
  org: Org | null
}

export function DashboardSidebar({ userName, userEmail, avatarUrl, org }: Props) {
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-[260px] shrink-0 border-r border-border bg-background sticky top-16 h-[calc(100vh-4rem)] overflow-hidden">
        <DashboardContextSwitcherClient
          userName={userName}
          userEmail={userEmail}
          avatarUrl={avatarUrl}
          org={org}
        />
        <DashboardSidebarNavClient org={org} />
      </aside>

      {/* Mobile trigger (rendered inline în layout, nu fixed) */}
      <div className="md:hidden">
        <DashboardMobileSheetClient
          userName={userName}
          userEmail={userEmail}
          avatarUrl={avatarUrl}
          org={org}
        />
      </div>
    </>
  )
}
