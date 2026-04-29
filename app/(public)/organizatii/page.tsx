import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { Building2, Star, Globe, ArrowRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { buttonVariants } from '@/components/ui/button'
import { getOrganizations } from '@/services/organization.service'

export const metadata: Metadata = {
    title: 'Organizații',
    description: 'Descoperă organizațiile non-guvernamentale verificate pe CIVICOM care coordonează acțiuni civice.',
    alternates: { canonical: '/organizatii' },
    openGraph: {
        title: 'Organizații — CIVICOM',
        description: 'Descoperă organizațiile non-guvernamentale verificate pe CIVICOM care coordonează acțiuni civice.',
        url: 'https://civicom.ro/organizatii',
        siteName: 'CIVICOM',
        locale: 'ro_RO',
        type: 'website',
    },
}

function StarRating({ rating }: { rating: number }) {
    return (
        <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map(i => (
                <Star
                    key={i}
                    size={12}
                    className={i <= Math.round(rating) ? 'fill-secondary text-secondary' : 'text-muted-foreground/30'}
                />
            ))}
            <span className="text-xs text-muted-foreground ml-1">{rating > 0 ? rating.toFixed(1) : 'Fără evaluări'}</span>
        </div>
    )
}

export default async function OrganizatiiPage() {
    const orgs = await getOrganizations()

    return (
        <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8 lg:py-16 space-y-8">
            <div>
                <h1 className="text-2xl font-black uppercase tracking-tighter text-foreground lg:text-3xl">
                    Organizații
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                    {orgs.length} organizații verificate pe CIVICOM✨
                </p>
            </div>

            {orgs.length === 0 ? (
                <div className="py-24 text-center">
                    <Building2 size={40} className="mx-auto text-muted-foreground/30 mb-4" />
                    <p className="text-muted-foreground">Nicio organizație aprobată momentan.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {orgs.map(org => (
                        <Card key={org.id} className="group flex flex-col overflow-hidden transition-shadow hover:shadow-lg shadow-sm shadow-black/5 border-border">
                            <CardContent className="flex flex-col flex-1 p-5 gap-4">
                                <div className="flex items-start gap-3">
                                    {org.logo_url ? (
                                        <div className="relative size-12 rounded-xl overflow-hidden border border-border shrink-0">
                                            <Image src={org.logo_url} alt={org.name} fill sizes="48px" className="object-cover" />
                                        </div>
                                    ) : (
                                        <div className="size-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                                            <Building2 size={20} className="text-primary" />
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className="font-black text-foreground text-base leading-tight line-clamp-1 group-hover:text-primary transition-colors">
                                            {org.name}
                                        </p>
                                        <div className="mt-1">
                                            <StarRating rating={org.rating} />
                                        </div>
                                    </div>
                                </div>

                                {org.description && (
                                    <p className="text-sm text-muted-foreground line-clamp-2 flex-1">{org.description}</p>
                                )}

                                <div className="flex items-center justify-between pt-1 border-t border-border/50 mt-auto">
                                    {org.website ? (
                                        <a
                                            href={org.website}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                                        >
                                            <Globe size={12} />
                                            Website
                                        </a>
                                    ) : (
                                        <span />
                                    )}
                                    <Link
                                        href={`/organizatii/${org.id}`}
                                        className={buttonVariants({ variant: 'outline', size: 'sm' }) + ' gap-1 text-xs h-7 px-2'}
                                    >
                                        Află mai mult <ArrowRight size={12} />
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
