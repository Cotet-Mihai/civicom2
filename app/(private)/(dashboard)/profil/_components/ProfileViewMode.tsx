import Image from 'next/image'
import { Mail, Phone, MapPin, Calendar, Pencil } from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { buttonVariants } from '@/components/ui/button'
import type { UserProfile } from '@/services/user.service'

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('ro-RO', { day: 'numeric', month: 'long', year: 'numeric' })
}

export function ProfileViewMode({ profile }: { profile: UserProfile }) {
  const initials = profile.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div className="space-y-6">
      <Card className="shadow-sm border-border overflow-hidden">
        <div className="h-20 bg-gradient-to-r from-primary/20 to-primary/5" />
        <CardContent className="px-6 pb-6 -mt-10">
          <div className="flex items-end justify-between gap-4">
            <div className="size-20 rounded-full border-4 border-background shadow overflow-hidden bg-primary/10 flex items-center justify-center shrink-0">
              {profile.avatar_url
                ? <Image src={profile.avatar_url} alt={profile.name} width={80} height={80} className="object-cover" />
                : <span className="font-black text-2xl text-primary">{initials}</span>
              }
            </div>
            <Link href="/profil?edit=true" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
              <Pencil className="size-3.5 mr-1.5" />
              Editează profil
            </Link>
          </div>
          <div className="mt-4">
            <p className="text-xl font-black text-foreground">{profile.name}</p>
            <p className="text-sm text-muted-foreground">{profile.email}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm border-border">
        <CardContent className="p-6 space-y-4">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            Informații cont
          </h3>
          <div className="space-y-3">
            <InfoRow icon={Mail} label="Email" value={profile.email} />
            <InfoRow icon={Phone} label="Telefon" value={profile.phone ?? '—'} />
            <InfoRow icon={MapPin} label="Oraș" value={[profile.city, profile.country].filter(Boolean).join(', ') || '—'} />
            <InfoRow icon={Calendar} label="Membru din" value={formatDate(profile.created_at)} />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <Icon className="size-4 text-primary shrink-0" />
      <span className="text-muted-foreground font-medium w-24 shrink-0">{label}:</span>
      <span className="text-foreground">{value}</span>
    </div>
  )
}
