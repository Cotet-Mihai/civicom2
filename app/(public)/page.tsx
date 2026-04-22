import type { Metadata } from 'next'
import {
  getHomepageStats,
  getRecentEvents,
  getApprovedOrgs,
} from '@/services/homepage.service'
import { HeroSection } from './_components/HeroSection'
import { StatsSection } from './_components/StatsSection'
import { ActionTypesSection } from './_components/ActionTypesSection'
import { EventsSection } from './_components/EventsSection'
import { OrganizationsSection } from './_components/OrganizationsSection'
import { FaqSection } from './_components/FaqSection'

export const metadata: Metadata = {
  title: 'Acasă',
  description: 'CIVICOM — platforma civică unde găsești și creezi proteste, petiții, boicoturi și acțiuni comunitare din România.',
}

export default async function HomePage() {
  const [stats, events, orgs] = await Promise.all([
    getHomepageStats(),
    getRecentEvents(6),
    getApprovedOrgs(),
  ])

  return (
    <main>
      <HeroSection />
      <StatsSection stats={stats} />
      <ActionTypesSection />
      <EventsSection events={events} />
      <OrganizationsSection orgs={orgs} />
      <FaqSection />
    </main>
  )
}
