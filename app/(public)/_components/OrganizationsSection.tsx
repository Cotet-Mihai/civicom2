import type { OrgPreview } from '@/services/homepage.service'
import { OrgsCarouselClient } from './OrgsCarouselClient'

type Props = { orgs: OrgPreview[] }

export function OrganizationsSection({ orgs }: Props) {
  if (orgs.length === 0) return null

  return (
    <section className="py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <h2 className="mb-10 text-center font-heading text-2xl font-black uppercase tracking-tight text-foreground lg:text-3xl">
          ONG-uri partenere
        </h2>
        <OrgsCarouselClient orgs={orgs} />
      </div>
    </section>
  )
}
