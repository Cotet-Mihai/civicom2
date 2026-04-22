import type { Metadata } from 'next'
import { getHomepageStats } from '@/services/homepage.service'
import { HeroSection } from './_components/HeroSection'
import { StatsSection } from './_components/StatsSection'

export const metadata: Metadata = {
  title: 'Acasă',
  description: 'CIVICOM — platforma civică unde găsești și creezi proteste, petiții, boicoturi și acțiuni comunitare din România.',
}

export default async function HomePage() {
  const stats = await getHomepageStats()

  return (
    <main>
      <HeroSection />
      <StatsSection stats={stats} />
    </main>
  )
}
