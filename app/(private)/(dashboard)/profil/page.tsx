import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getUserProfile } from '@/services/user.service'
import { ProfileViewMode } from './_components/ProfileViewMode'
import { ProfileEditModeClient } from './_components/ProfileEditModeClient'

export const metadata: Metadata = { title: 'Profilul meu — CIVICOM' }

export default async function ProfilPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>
}) {
  const { edit } = await searchParams
  const profile = await getUserProfile()
  if (!profile) notFound()

  return (
    <div className="relative min-h-screen animate-fade-in-up">

      <div className="pointer-events-none absolute inset-0 overflow-hidden -z-10">
        <div className="absolute -left-1/4 top-0 h-[400px] w-[400px] rounded-full bg-primary/5 blur-[100px]" />
      </div>

      <div className="px-4 lg:px-8 py-8 pb-16 space-y-10">

        <div className="flex flex-col gap-2 border-b border-border/50 pb-6">
          <h1 className="font-heading text-3xl font-black uppercase tracking-tighter text-foreground md:text-4xl">
            Profilul <span className="text-primary">Meu</span>
          </h1>
          <p className="text-base text-muted-foreground">
            Informațiile tale de cont și preferințele personale.
          </p>
        </div>

        {edit === 'true'
          ? <ProfileEditModeClient profile={profile} />
          : <ProfileViewMode profile={profile} />
        }

      </div>
    </div>
  )
}
