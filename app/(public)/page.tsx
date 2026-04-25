import type { Metadata } from 'next'
import {
    getHomepageStats,
    getApprovedOrgs,
} from '@/services/homepage.service'
import { getRecentEvents } from '@/services/event.service'
import { HeroSection } from './_components/HeroSection'
import { StatsSection } from './_components/StatsSection'
import { ActionTypesSection } from './_components/ActionTypesSection'
import { EventsSection } from './_components/EventsSection'
import { OrganizationsSection } from './_components/OrganizationsSection'
import { FaqSection } from './_components/FaqSection'
import { CtaSection } from './_components/CtaSection'

export const metadata: Metadata = {
    title: 'Acasă',
    description: 'CIVICOM — platforma civică unde găsești și creezi proteste, petiții, boicoturi și acțiuni comunitare din România.',
}

const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    url: 'https://civicom.ro',
    name: 'CIVICOM',
    description:
        'Platforma de implicare civică. Creează și participă la proteste, petiții, boicoturi și activități comunitare.',
    potentialAction: {
        '@type': 'SearchAction',
        target: {
            '@type': 'EntryPoint',
            urlTemplate: 'https://civicom.ro/evenimente?cauta={search_term_string}',
        },
        'query-input': 'required name=search_term_string',
    },
}

export default async function HomePage() {
    const [stats, events, orgs] = await Promise.all([
        getHomepageStats(),
        getRecentEvents(6),
        getApprovedOrgs(),
    ])

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <main>
                <HeroSection />
                <StatsSection stats={stats} />
                <ActionTypesSection />
                <OrganizationsSection orgs={orgs} />
                <EventsSection events={events} />
                <FaqSection />
                <CtaSection />
            </main>
        </>
    )
}
