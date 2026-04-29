import type { Metadata } from 'next'
import { Navbar } from '@/components/layout/Navbar'

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function PrivateLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="flex flex-1 flex-col">{children}</main>
    </>
  )
}
