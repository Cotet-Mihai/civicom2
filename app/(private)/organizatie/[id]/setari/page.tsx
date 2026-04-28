import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { getOrganizationById, getOrgMemberRole } from '@/services/organization.service'
import { OngSettingsFormClient } from './_components/OngSettingsFormClient'

export const metadata: Metadata = { title: 'Setări ONG' }

type PageProps = { params: Promise<{ id: string }> }

export default async function OrgSetariPage({ params }: PageProps) {
  const { id } = await params
  const [org, role] = await Promise.all([
    getOrganizationById(id),
    getOrgMemberRole(id),
  ])

  if (role !== 'admin') redirect(`/organizatie/${id}/panou`)
  if (!org) redirect('/panou')

  return (
    <div className="space-y-6 max-w-2xl">
      <h2 className="text-lg font-black tracking-tight text-foreground">Setări organizație</h2>
      <Card className="shadow-sm shadow-black/5 border-border">
        <CardContent className="p-6">
          <OngSettingsFormClient org={org} />
        </CardContent>
      </Card>
    </div>
  )
}
