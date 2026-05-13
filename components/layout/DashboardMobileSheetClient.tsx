'use client'

import { useState } from 'react'
import { Menu } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { DashboardContextSwitcherClient } from './DashboardContextSwitcherClient'
import { DashboardSidebarNavClient } from './DashboardSidebarNavClient'
import type { DashboardOrg } from './dashboard-types'

type Props = {
  userName: string
  userEmail: string
  avatarUrl: string | null
  org: DashboardOrg | null
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
          <div className="flex items-center px-4 py-3 border-b border-border/50 shrink-0">
            <Link
              href="/"
              className="font-heading text-xl font-black uppercase tracking-tighter text-primary hover:opacity-80 transition-opacity"
              onClick={() => setOpen(false)}
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
          <DashboardSidebarNavClient org={org} onClose={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
    </>
  )
}
