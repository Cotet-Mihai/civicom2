import { redirect } from 'next/navigation'
import { getOrgMemberRole } from '@/services/organization.service'

type Props = {
  children: React.ReactNode
  params: Promise<unknown>
}

export default async function OrgLayout({ children, params }: Props) {
  const { id } = (await params) as { id: string }
  const role = await getOrgMemberRole(id)
  if (!role) redirect('/panou')

  return <>{children}</>
}
