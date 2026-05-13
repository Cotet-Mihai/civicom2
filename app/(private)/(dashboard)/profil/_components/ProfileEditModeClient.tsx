'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { AvatarUploadClient } from './AvatarUploadClient'
import { ProfileEditFormClient } from './ProfileEditFormClient'
import type { UserProfile } from '@/services/user.service'

export function ProfileEditModeClient({ profile }: { profile: UserProfile }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/profil" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="size-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">Editează profilul</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Modifică informațiile afișate public</p>
        </div>
      </div>

      <Card className="overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300 hover:border-primary/40 hover:shadow-md">
        <CardContent className="p-6 space-y-4">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground border-b border-border/50 pb-3">
            Fotografie profil
          </h3>
          <AvatarUploadClient
            currentAvatarUrl={profile.avatar_url}
            name={profile.name}
            userId={profile.id}
          />
        </CardContent>
      </Card>

      <Card className="overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300 hover:border-primary/40 hover:shadow-md">
        <CardContent className="p-6 space-y-4">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground border-b border-border/50 pb-3">
            Informații cont
          </h3>
          <ProfileEditFormClient profile={profile} />
        </CardContent>
      </Card>
    </div>
  )
}
