'use client'

import Link from 'next/link'
import Image from 'next/image'
import useEmblaCarousel from 'embla-carousel-react'
import Autoplay from 'embla-carousel-autoplay'
import type { OrgPreview } from '@/services/homepage.service'

type Props = { orgs: OrgPreview[] }

export function OrgsCarouselClient({ orgs }: Props) {
    const items = orgs.length < 4 ? [...orgs, ...orgs, ...orgs] : orgs

    const [emblaRef] = useEmblaCarousel(
        { loop: true, align: 'start', dragFree: true },
        [Autoplay({ delay: 3000, stopOnInteraction: false })]
    )

    return (
        <div className="overflow-hidden py-4" ref={emblaRef}>
            <div className="flex gap-12 sm:gap-16">
                {items.map((org, i) => (
                    <Link
                        key={`${org.id}-${i}`}
                        href={`/organizatii/${org.id}`}
                        className="group flex shrink-0 flex-col items-center gap-4 opacity-50 transition-all duration-300 hover:scale-105 hover:opacity-100"
                    >
                        {org.logo_url ? (
                            <Image
                                src={org.logo_url}
                                alt={org.name}
                                width={80}
                                height={80}
                                className="size-16 sm:size-20 rounded-full object-cover ring-1 ring-background/20 transition-all group-hover:ring-background/50"
                            />
                        ) : (
                            <div className="flex size-16 sm:size-20 items-center justify-center rounded-full bg-background/10 text-2xl font-black text-background ring-1 ring-background/20 transition-all group-hover:bg-background/20 group-hover:ring-background/50">
                                {org.name[0]}
                            </div>
                        )}
                        <span className="max-w-[100px] text-center text-sm font-semibold tracking-tight text-background/70 transition-colors group-hover:text-background">
              {org.name}
            </span>
                    </Link>
                ))}
            </div>
        </div>
    )
}