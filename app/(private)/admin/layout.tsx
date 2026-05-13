import { checkIsAdmin } from '@/services/admin.service'
import { redirect } from 'next/navigation'
import { getAuthUser } from '@/services/auth.service'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/Navbar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isAdmin, user] = await Promise.all([checkIsAdmin(), getAuthUser()])
  if (!isAdmin) redirect('/panou')

  if (user) {
    const supabase = await createClient()
    const { data } = await supabase
      .from('users')
      .select('is_profile_complete')
      .eq('auth_users_id', user.id)
      .single()
    if (data && !data.is_profile_complete) redirect('/completeaza-profil')
  }

  return (
    <>
      <Navbar />
      <main className="flex flex-1 flex-col pt-16">{children}</main>
    </>
  )
}
