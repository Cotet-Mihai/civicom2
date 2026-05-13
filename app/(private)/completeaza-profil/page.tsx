import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CompleteazaProfilFormClient } from './CompleteazaProfilFormClient'

export default async function CompleteazaProfilPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/autentificare')

  const { data: profile } = await supabase
    .from('users')
    .select('id, name, avatar_url, is_profile_complete')
    .eq('auth_users_id', user.id)
    .single()

  if (profile?.is_profile_complete) redirect('/panou')

  return (
    <CompleteazaProfilFormClient
      userId={profile?.id ?? ''}
      name={profile?.name ?? ''}
      avatarUrl={profile?.avatar_url ?? null}
    />
  )
}
