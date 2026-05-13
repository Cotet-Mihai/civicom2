import Image from 'next/image'
import { Mail, Phone, MapPin, Calendar, Pencil, GraduationCap, Users } from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { buttonVariants } from '@/components/ui/button'
import type { UserProfile } from '@/services/user.service'

const GENDER_LABELS: Record<string, string> = {
  male: 'Bărbat', female: 'Femeie', non_binary: 'Non-binar', other: 'Altul', prefer_not_to_say: 'Prefer să nu spun',
}
const EDUCATION_LABELS: Record<string, string> = {
  none: 'Fără studii', middle_school: 'Gimnaziu', high_school: 'Liceu',
  bachelor: 'Licență', master: 'Masterat', doctorate: 'Doctorat',
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('ro-RO', { day: 'numeric', month: 'long', year: 'numeric' })
}

function formatBirthDate(d: string) {
  const date = new Date(d)
  const age = new Date().getFullYear() - date.getFullYear()
  return `${formatDate(d)} (${age} ani)`
}

export function ProfileViewMode({ profile }: { profile: UserProfile }) {
  const initials = profile.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
  const location = [profile.city, profile.county].filter(Boolean).join(', ')

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
            <InfoRow icon={MapPin} label="Locație" value={location || '—'} />
            {profile.birth_date && (
              <InfoRow icon={Calendar} label="Data nașterii" value={formatBirthDate(profile.birth_date)} />
            )}
            <InfoRow icon={Calendar} label="Membru din" value={formatDate(profile.created_at)} />
          </div>
        </CardContent>
      </Card>

      {(profile.gender || profile.education_level) && (
        <Card className="shadow-sm border-border">
          <CardContent className="p-6 space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              Identitate & Educație
            </h3>
            <div className="space-y-3">
              {profile.gender && (
                <InfoRow icon={Users} label="Gen" value={GENDER_LABELS[profile.gender] ?? profile.gender} />
              )}
              {profile.education_level && (
                <InfoRow icon={GraduationCap} label="Studii" value={EDUCATION_LABELS[profile.education_level] ?? profile.education_level} />
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <Icon className="size-4 text-primary shrink-0" />
      <span className="text-muted-foreground font-medium w-28 shrink-0">{label}:</span>
      <span className="text-foreground">{value}</span>
    </div>
  )
}
