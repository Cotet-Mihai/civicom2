import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { Mail, Calendar, Pencil } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { buttonVariants } from '@/components/ui/button'
import { getUserProfile } from '@/services/user.service'
import { notFound } from 'next/navigation'

export const metadata: Metadata = { title: 'Profilul meu' }

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('ro-RO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export default async function ProfilPage() {
  const profile = await getUserProfile()
  if (!profile) notFound()

  const initials = profile.name
    .split(' ')
    .map((w: string) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="mx-auto max-w-2xl px-4 lg:px-8 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black tracking-tight text-foreground">Profilul meu</h1>
        <Link href="/profil/editare" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
          <Pencil size={14} className="mr-1.5" />
          Editează
        </Link>
      </div>

      <Card className="shadow-sm shadow-black/5 border-border">
        <CardContent className="p-6 space-y-6">
          <div className="flex items-center gap-4">
            {profile.avatar_url ? (
              <div className="relative size-20 rounded-full overflow-hidden border-2 border-primary/20 shrink-0">
                <Image src={profile.avatar_url} alt={profile.name} fill className="object-cover" unoptimized />
              </div>
            ) : (
              <div className="size-20 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center font-black text-xl text-primary shrink-0">
                {initials}
              </div>
            )}
            <div>
              <p className="text-xl font-black text-foreground">{profile.name}</p>
              <p className="text-sm text-muted-foreground">{profile.email}</p>
            </div>
          </div>

          <div className="space-y-3 border-t border-border pt-4">
            <div className="flex items-center gap-3 text-sm">
              <Mail size={16} className="text-primary shrink-0" />
              <span className="text-muted-foreground font-medium">Email:</span>
              <span className="text-foreground">{profile.email}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Calendar size={16} className="text-primary shrink-0" />
              <span className="text-muted-foreground font-medium">Membru din:</span>
              <span className="text-foreground">{formatDate(profile.created_at)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
