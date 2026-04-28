import type { Metadata } from 'next'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { getOrganizationMembers, getOrgMemberRole } from '@/services/organization.service'
import { InviteMemberFormClient } from './_components/InviteMemberFormClient'
import { MemberActionsClient } from './_components/MemberActionsClient'

export const metadata: Metadata = { title: 'Membri ONG' }

type PageProps = { params: Promise<{ id: string }> }

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('ro-RO', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default async function OrgMembriPage({ params }: PageProps) {
  const { id } = await params
  const [members, currentRole] = await Promise.all([
    getOrganizationMembers(id),
    getOrgMemberRole(id),
  ])
  const isAdmin = currentRole === 'admin'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-black tracking-tight text-foreground">
          Membri ({members.length})
        </h2>
      </div>

      {isAdmin && (
        <Card className="shadow-sm shadow-black/5 border-border">
          <CardContent className="p-5 space-y-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              Invită un nou membru
            </p>
            <InviteMemberFormClient orgId={id} />
            <p className="text-xs text-muted-foreground">Utilizatorul trebuie să aibă deja un cont CIVICOM.</p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {members.map(member => (
          <Card key={member.user_id} className="shadow-sm shadow-black/5 border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-black text-xs text-primary shrink-0">
                  {member.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-foreground text-sm">{member.name}</p>
                    <Badge
                      variant={member.role === 'admin' ? 'default' : 'secondary'}
                      className="text-[9px] px-1.5 py-0 h-4"
                    >
                      {member.role === 'admin' ? 'Admin' : 'Membru'}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">Din {formatDate(member.joined_at)}</p>
                </div>
                {isAdmin && (
                  <MemberActionsClient
                    orgId={id}
                    userId={member.user_id}
                    currentRole={member.role}
                  />
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
