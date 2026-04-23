import type { Metadata } from 'next'
import { DashboardNavbar } from '@/components/layout/DashboardNavbar'

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function PrivateLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <DashboardNavbar />
      <main className="flex flex-1 flex-col">{children}</main>
    </>
  )
}
