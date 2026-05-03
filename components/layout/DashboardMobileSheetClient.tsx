'use client'

import { useState } from 'react'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { DashboardContextSwitcherClient } from './DashboardContextSwitcherClient'
import { DashboardSidebarNavClient } from './DashboardSidebarNavClient'

type Org = { id: string; name: string; logo_url: string | null }

type Props = {
  userName: string
  userEmail: string
  avatarUrl: string | null
  org: Org | null
}

export function DashboardMobileSheetClient({ userName, userEmail, avatarUrl, org }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button variant="ghost" size="icon" onClick={() => setOpen(true)} aria-label="Deschide meniul">
        <Menu className="size-5" />
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-[280px] p-0 flex flex-col">
          <DashboardContextSwitcherClient
            userName={userName}
            userEmail={userEmail}
            avatarUrl={avatarUrl}
            org={org}
          />
          <DashboardSidebarNavClient org={org} />
        </SheetContent>
      </Sheet>
    </>
  )
}
