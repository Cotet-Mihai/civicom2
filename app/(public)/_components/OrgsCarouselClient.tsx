'use client'

import Link from 'next/link'
import Image from 'next/image'
import useEmblaCarousel from 'embla-carousel-react'
import Autoplay from 'embla-carousel-autoplay'
import type { OrgPreview } from '@/services/homepage.service'

type Props = { orgs: OrgPreview[] }

export function OrgsCarouselClient({ orgs }: Props) {
  const items = orgs.length < 4 ? [...orgs, ...orgs] : orgs

  const [emblaRef] = useEmblaCarousel(
    { loop: true, align: 'start', dragFree: true },
    [Autoplay({ delay: 3000, stopOnInteraction: false })]
  )

  return (
    <div className="overflow-hidden" ref={emblaRef}>
      <div className="flex gap-8">
        {items.map((org, i) => (
          <Link
            key={`${org.id}-${i}`}
            href={`/organizatii/${org.id}`}
            className="flex shrink-0 flex-col items-center gap-2 opacity-60 transition-opacity hover:opacity-100"
          >
            {org.logo_url ? (
              <Image
                src={org.logo_url}
                alt={org.name}
                width={64}
                height={64}
                className="size-16 rounded-full object-cover"
              />
            ) : (
              <div className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-xl font-black text-primary">
                {org.name[0]}
              </div>
            )}
            <span className="max-w-[80px] text-center text-xs font-medium text-muted-foreground">
              {org.name}
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}
