import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getUserProfile } from '@/services/user.service'
import { ProfileViewMode } from './_components/ProfileViewMode'
import { ProfileEditModeClient } from './_components/ProfileEditModeClient'

export const metadata: Metadata = { title: 'Profilul meu' }

export default async function ProfilPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>
}) {
  const { edit } = await searchParams
  const profile = await getUserProfile()
  if (!profile) notFound()

  return (
    <div className="mx-auto max-w-2xl px-4 lg:px-8 py-8">
      {edit === 'true'
        ? <ProfileEditModeClient profile={profile} />
        : <ProfileViewMode profile={profile} />
      }
    </div>
  )
}
