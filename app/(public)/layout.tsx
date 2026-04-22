import type { Metadata } from 'next'
import { PublicNavbar } from '@/components/layout/PublicNavbar'
import { Footer } from '@/components/layout/Footer'

export const metadata: Metadata = {
  // Paginile publice sunt indexabile — fiecare page.tsx definește propria metadata
}

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PublicNavbar />
      <main className="flex flex-1 flex-col">{children}</main>
      <Footer />
    </>
  )
}
