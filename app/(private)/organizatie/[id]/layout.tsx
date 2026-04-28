import { redirect } from 'next/navigation'
import { getOrgMemberRole } from '@/services/organization.service'
import { OrgTabsClient } from './_components/OrgTabsClient'

type Props = {
  children: React.ReactNode
  params: Promise<unknown>
}

export default async function OrgLayout({ children, params }: Props) {
  const { id } = (await params) as { id: string }
  const role = await getOrgMemberRole(id)

  if (!role) redirect('/panou')

  return (
    <div className="mx-auto max-w-7xl px-4 lg:px-8 py-8 space-y-6">
      <OrgTabsClient orgId={id} />
      {children}
    </div>
  )
}
