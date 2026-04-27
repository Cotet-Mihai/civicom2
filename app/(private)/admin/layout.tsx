import { checkIsAdmin } from '@/services/admin.service'
import { redirect } from 'next/navigation'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const isAdmin = await checkIsAdmin()
  if (!isAdmin) redirect('/panou')
  return <>{children}</>
}
