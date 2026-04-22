import Link from 'next/link'
import { getSession } from '@/services/auth.service'
import { getUserOrgId } from '@/services/organization.service'
import { DashboardNavbarActionsClient } from './DashboardNavbarActionsClient'

export async function DashboardNavbar() {
  const session = await getSession()
  const user = session?.user

  const userName: string = user?.user_metadata?.name ?? user?.email ?? 'Utilizator'
  const userEmail: string = user?.email ?? ''
  const orgId: string | null = user ? await getUserOrgId(user.id) : null

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 lg:px-8">

        <Link
          href="/"
          className="font-heading text-xl font-extrabold tracking-tight text-green-700"
        >
          CIVICOM✨
        </Link>

        <DashboardNavbarActionsClient
          userName={userName}
          userEmail={userEmail}
          orgId={orgId}
        />

      </div>
    </header>
  )
}
