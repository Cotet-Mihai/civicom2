import Image from 'next/image'
import { MapPin, Phone, Mail, Globe, Star, Users, Calendar } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { UserProfile } from '@/services/user.service'
import type { OrgDetail } from '@/services/organization.service'

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('ro-RO', { day: 'numeric', month: 'long', year: 'numeric' })
}

export function UserPreview({ profile }: { profile: UserProfile }) {
  const initials = profile.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <Card className="shadow-sm border-border overflow-hidden">
      <div className="h-16 bg-gradient-to-r from-primary/20 to-primary/5" />
      <CardContent className="px-4 pb-4 space-y-4 -mt-8">
        <div className="flex items-end gap-3">
          <div className="size-16 rounded-full border-2 border-background shadow overflow-hidden shrink-0 bg-primary/10 flex items-center justify-center">
            {profile.avatar_url
              ? <Image src={profile.avatar_url} alt={profile.name} width={64} height={64} className="object-cover" />
              : <span className="font-black text-lg text-primary">{initials}</span>
            }
          </div>
        </div>
        <div>
          <p className="font-black text-foreground">{profile.name}</p>
          <p className="text-xs text-muted-foreground">{profile.email}</p>
        </div>
        <div className="space-y-2 text-xs text-muted-foreground">
          {profile.city && (
            <div className="flex items-center gap-2">
              <MapPin className="size-3 text-primary shrink-0" />
              <span>{profile.city}{profile.country ? `, ${profile.country}` : ''}</span>
            </div>
          )}
          {profile.phone && (
            <div className="flex items-center gap-2">
              <Phone className="size-3 text-primary shrink-0" />
              <span>{profile.phone}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Calendar className="size-3 text-primary shrink-0" />
            <span>Membru din {formatDate(profile.created_at)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function OrgPreview({ org }: { org: OrgDetail }) {
  const initials = org.name.charAt(0).toUpperCase()

  return (
    <Card className="shadow-sm border-border overflow-hidden">
      {org.banner_url
        ? <div className="h-20 relative"><Image src={org.banner_url} alt="" fill className="object-cover" /></div>
        : <div className="h-20 bg-gradient-to-r from-primary/20 to-primary/5" />
      }
      <CardContent className="px-4 pb-4 space-y-4 -mt-8">
        <div className="size-16 rounded-xl border-2 border-background shadow overflow-hidden bg-primary/10 flex items-center justify-center shrink-0">
          {org.logo_url
            ? <Image src={org.logo_url} alt={org.name} width={64} height={64} className="object-cover" />
            : <span className="font-black text-xl text-primary">{initials}</span>
          }
        </div>
        <div>
          <p className="font-black text-foreground">{org.name}</p>
          {org.description && <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{org.description}</p>}
        </div>
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Users className="size-3 text-primary" />
            <span>{org.members.length} membri</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Star className="size-3 text-primary" />
            <span>{org.rating.toFixed(1)}</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Calendar className="size-3 text-primary" />
            <span>{org.events_count} evenimente</span>
          </div>
        </div>
        {org.categories.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {org.categories.map(c => (
              <Badge key={c} variant="secondary" className="text-[10px] px-1.5 py-0">{c}</Badge>
            ))}
          </div>
        )}
        <div className="space-y-2 text-xs text-muted-foreground">
          {org.website && (
            <div className="flex items-center gap-2">
              <Globe className="size-3 text-primary shrink-0" />
              <a href={org.website} target="_blank" rel="noopener noreferrer" className="hover:text-primary truncate">{org.website}</a>
            </div>
          )}
          {org.email && (
            <div className="flex items-center gap-2">
              <Mail className="size-3 text-primary shrink-0" />
              <span>{org.email}</span>
            </div>
          )}
          {org.city && (
            <div className="flex items-center gap-2">
              <MapPin className="size-3 text-primary shrink-0" />
              <span>{org.city}{org.address ? `, ${org.address}` : ''}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
