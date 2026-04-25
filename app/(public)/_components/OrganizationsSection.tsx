import type { OrgPreview } from '@/services/homepage.service'
import { OrgsCarouselClient } from './OrgsCarouselClient'

type Props = { orgs: OrgPreview[] }

export function OrganizationsSection({ orgs }: Props) {
    if (orgs.length === 0) return null

    return (
        <section className="bg-foreground py-20 lg:py-28">
            <div className="mx-auto max-w-7xl px-4 text-center lg:px-8">

                <h2 className="font-heading text-4xl font-black uppercase tracking-tighter text-background lg:text-6xl">
                    ONG-uri partenere
                </h2>

                <p className="mx-auto mt-4 mb-12 max-w-xl text-lg text-background/70 text-balance">
                    Descoperă organizațiile verificate care susțin și coordonează inițiativele din comunitatea noastră.
                </p>

                <div className="mt-8 w-full">
                    <OrgsCarouselClient orgs={orgs} />
                </div>

            </div>
        </section>
    )
}