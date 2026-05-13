import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getAuthUser } from '@/services/auth.service'
import { getUserAvatarUrl } from '@/services/user.service'
import { getUserOrgByAuthId } from '@/lib/server-cache'
import { createClient } from '@/lib/supabase/server'
import { DashboardSidebar } from '@/components/layout/DashboardSidebar'
import { DashboardMobileSheetClient } from '@/components/layout/DashboardMobileSheetClient'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getAuthUser()
  if (!user) redirect('/autentificare')

  const userName = user.user_metadata?.display_name ?? user.user_metadata?.name ?? 'Utilizator'
  const userEmail = user.email ?? ''

  const supabase = await createClient()
  const [avatarUrl, org, profileResult] = await Promise.all([
    getUserAvatarUrl(user.id),
    getUserOrgByAuthId(user.id),
    supabase.from('users').select('is_profile_complete').eq('auth_users_id', user.id).single(),
  ])

  if (profileResult.data && !profileResult.data.is_profile_complete) {
    redirect('/completeaza-profil')
  }

  return (
    <div className="flex min-h-screen">
      <DashboardSidebar
        userName={userName}
        userEmail={userEmail}
        avatarUrl={avatarUrl}
        org={org}
      />

      <div className="flex flex-1 flex-col min-w-0">
        {/* Mobile top bar — identic cu Navbar */}
        <header className="md:hidden sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md shadow-sm transition-all duration-300">
          <div className="flex h-16 items-center justify-between px-4">
            <DashboardMobileSheetClient
              userName={userName}
              userEmail={userEmail}
              avatarUrl={avatarUrl}
              org={org}
            />
            <Link
              href="/"
              className="font-heading text-2xl font-black uppercase tracking-tighter text-primary transition-opacity hover:opacity-80"
            >
              CIVICOM<span className="text-primary">✨</span>
            </Link>
          </div>
        </header>

        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>
    </div>
  )
}
