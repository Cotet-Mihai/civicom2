import { Suspense } from 'react'
import { getAuthUser } from '@/services/auth.service'
import { getUserAvatarUrl } from '@/services/user.service'
import { getUserOrgByAuthId } from '@/services/organization.service'
import { DashboardSidebar } from '@/components/layout/DashboardSidebar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getAuthUser()
  if (!user) return <>{children}</>

  const userName = user.user_metadata?.display_name ?? user.user_metadata?.name ?? 'Utilizator'
  const userEmail = user.email ?? ''

  const [avatarUrl, org] = await Promise.all([
    getUserAvatarUrl(user.id),
    getUserOrgByAuthId(user.id),
  ])

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      <Suspense fallback={null}>
        <DashboardSidebar
          userName={userName}
          userEmail={userEmail}
          avatarUrl={avatarUrl}
          org={org}
        />
      </Suspense>
      <main className="flex-1 min-w-0">
        {children}
      </main>
    </div>
  )
}
