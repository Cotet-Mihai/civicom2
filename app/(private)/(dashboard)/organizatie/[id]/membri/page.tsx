import type { Metadata } from 'next'
import { Users } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { getOrganizationMembers, getOrgMemberRole } from '@/services/organization.service'
import { InviteMemberFormClient } from './_components/InviteMemberFormClient'
import { MemberActionsClient } from './_components/MemberActionsClient'

export const metadata: Metadata = { title: 'Membri ONG — CIVICOM' }

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
    <div className="relative min-h-screen animate-fade-in-up">

      <div className="pointer-events-none absolute inset-0 overflow-hidden -z-10">
        <div className="absolute -left-1/4 top-0 h-[400px] w-[400px] rounded-full bg-primary/5 blur-[100px]" />
      </div>

      <div className="px-4 lg:px-8 py-8 pb-16 space-y-10">

        <div className="flex flex-col gap-2 border-b border-border/50 pb-6">
          <h1 className="font-heading text-3xl font-black uppercase tracking-tighter text-foreground md:text-4xl">
            Membri <span className="text-primary">ONG</span>
          </h1>
          <p className="text-base text-muted-foreground">
            Gestionează echipa organizației tale.
          </p>
        </div>

        {isAdmin && (
          <Card className="overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300 hover:border-primary/40 hover:shadow-md">
            <CardContent className="p-6 space-y-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Invită un nou membru
              </p>
              <InviteMemberFormClient orgId={id} />
              <p className="text-xs text-muted-foreground">Utilizatorul trebuie să aibă deja un cont CIVICOM.</p>
            </CardContent>
          </Card>
        )}

        <Card className="overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300 hover:border-primary/40 hover:shadow-md">
          <CardContent className="p-6 gap-4 flex flex-col">

            <div className="flex items-center gap-2 border-b border-border/50 pb-3">
              <Users className="size-4 text-primary" />
              <h2 className="font-heading text-lg font-bold tracking-tight text-foreground">
                {members.length} {members.length === 1 ? 'membru' : 'membri'}
              </h2>
            </div>

            <div className="flex flex-col divide-y divide-border/50">
              {members.map(member => (
                <div key={member.user_id} className="flex items-center gap-3 py-3">
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
              ))}
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
