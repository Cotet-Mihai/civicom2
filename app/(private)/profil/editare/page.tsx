import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { getUserProfile } from '@/services/user.service'
import { ProfileEditFormClient } from './_components/ProfileEditFormClient'
import { AvatarUploadClient } from './_components/AvatarUploadClient'
import { notFound } from 'next/navigation'

export const metadata: Metadata = { title: 'Editează profilul' }

export default async function ProfilEditarePage() {
  const profile = await getUserProfile()
  if (!profile) notFound()

  return (
    <div className="mx-auto max-w-2xl px-4 lg:px-8 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/profil"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-black tracking-tight text-foreground">Editează profilul</h1>
      </div>

      <Card className="shadow-sm shadow-black/5 border-border">
        <CardContent className="p-6 space-y-8">
          <div className="space-y-3">
            <h2 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              Fotografie profil
            </h2>
            <AvatarUploadClient
              currentAvatarUrl={profile.avatar_url}
              name={profile.name}
            />
          </div>

          <div className="border-t border-border pt-6 space-y-3">
            <h2 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              Informații cont
            </h2>
            <ProfileEditFormClient initialName={profile.name} />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
