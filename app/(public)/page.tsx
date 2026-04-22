import type { Metadata } from 'next'
import { getHomepageStats, getRecentEvents } from '@/services/homepage.service'
import { HeroSection } from './_components/HeroSection'
import { StatsSection } from './_components/StatsSection'
import { ActionTypesSection } from './_components/ActionTypesSection'
import { EventsSection } from './_components/EventsSection'

export const metadata: Metadata = {
  title: 'Acasă',
  description: 'CIVICOM — platforma civică unde găsești și creezi proteste, petiții, boicoturi și acțiuni comunitare din România.',
}

export default async function HomePage() {
  const [stats, events] = await Promise.all([
    getHomepageStats(),
    getRecentEvents(6),
  ])

  return (
    <main>
      <HeroSection />
      <StatsSection stats={stats} />
      <ActionTypesSection />
      <EventsSection events={events} />
    </main>
  )
}
