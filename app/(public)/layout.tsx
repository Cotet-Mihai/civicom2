import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'

export const metadata: Metadata = {
  // Paginile publice sunt indexabile — fiecare page.tsx definește propria metadata
}

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
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
      <Footer />
    </>
  )
}
