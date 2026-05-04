'use client'

import { useState } from 'react'
import { UserPreview, OrgPreview } from './ProfilePreviewPanel'
import type { UserProfile } from '@/services/user.service'
import type { OrgDetail } from '@/services/organization.service'

type Props = {
  profile: UserProfile
  org: OrgDetail
}

export function ProfileOrgToggleClient({ profile, org }: Props) {
  const [active, setActive] = useState<'user' | 'org'>('user')

  return (
    <div className="space-y-3">
      <div className="flex gap-1 p-1 bg-muted rounded-lg">
        <button
          onClick={() => setActive('user')}
          className={`flex-1 text-xs font-semibold py-1.5 rounded-md transition-colors ${
            active === 'user' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Profil
        </button>
        <button
          onClick={() => setActive('org')}
          className={`flex-1 text-xs font-semibold py-1.5 rounded-md transition-colors truncate px-2 ${
            active === 'org' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {org.name}
        </button>
      </div>
      {active === 'user' ? <UserPreview profile={profile} /> : <OrgPreview org={org} />}
    </div>
  )
}
