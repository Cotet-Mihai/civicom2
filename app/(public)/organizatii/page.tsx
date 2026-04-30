import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { Building2, Star, Globe, ArrowRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getOrganizations } from '@/services/organization.service'
import { ORG_CATEGORY_LABELS } from '@/lib/constants'

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

// Am stilizat stelele pentru a se integra în design-ul curat
function StarRating({ rating }: { rating: number }) {
    return (
        <div className="flex items-center gap-1.5">
            <div className="flex">
                {[1, 2, 3, 4, 5].map(i => (
                    <Star
                        key={i}
                        size={14}
                        className={i <= Math.round(rating) ? 'fill-primary text-primary' : 'text-muted-foreground/20'}
                    />
                ))}
            </div>
            <span className="text-xs font-semibold text-muted-foreground">
                {rating > 0 ? rating.toFixed(1) : 'Fără evaluări'}
            </span>
        </div>
    )
}

export default async function OrganizatiiPage() {
    const orgs = await getOrganizations()

    return (
        <div className="relative min-h-screen bg-background pb-20 lg:pb-28">

            {/* Efect de glow ambiental specific CIVICOM */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute -right-1/4 top-0 h-[500px] w-[500px] rounded-full bg-primary/5 blur-[100px]" />
                <div className="absolute -left-1/4 top-1/3 h-[400px] w-[400px] rounded-full bg-primary/5 blur-[100px]" />
            </div>

            <div className="relative z-10 mx-auto max-w-7xl px-6 pt-12 lg:px-8 lg:pt-20">

                {/* Header-ul paginii - Stilizat cu tipografia masivă CIVICOM */}
                <div className="mb-12 animate-fade-in-up flex flex-col gap-3">
                    <h1 className="font-heading text-4xl font-black uppercase tracking-tighter text-foreground lg:text-6xl text-balance">
                        Descoperă <span className="text-primary">Organizații</span>
                    </h1>
                    <p className="max-w-2xl text-base leading-relaxed text-muted-foreground text-balance">
                        Peste <strong>{orgs.length}</strong> de organizații non-guvernamentale verificate pe CIVICOM care coordonează acțiuni civice și creează impact în comunitate.
                    </p>
                </div>

                {/* Empty state stilizat corespunzător */}
                {orgs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 py-24 text-center backdrop-blur-sm animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                        <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-muted">
                            <Building2 size={32} className="text-muted-foreground/50" />
                        </div>
                        <h3 className="text-xl font-bold tracking-tight text-foreground">Nicio organizație</h3>
                        <p className="mt-2 text-sm text-muted-foreground">Momentan nu există organizații aprobate pe platformă.</p>
                    </div>
                ) : (
                    /* Grid-ul de Carduri */
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                        {orgs.map(org => (
                            <Card key={org.id} className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-all duration-300 hover:border-primary/50 hover:shadow-md">

                                {/* Glow ambiental intern - declanșat la hover */}
                                <div className="pointer-events-none absolute right-0 top-0 -mr-8 -mt-8 size-32 rounded-full bg-primary/5 transition-all duration-500 group-hover:bg-primary/10" />

                                <CardContent className="relative flex flex-1 flex-col p-6 gap-5">

                                    {/* Header Card: Logo + Titlu + Rating */}
                                    <div className="flex items-start gap-4">
                                        {org.logo_url ? (
                                            <div className="relative size-14 shrink-0 overflow-hidden rounded-xl border border-border bg-background shadow-sm transition-transform duration-300 group-hover:scale-105">
                                                <Image src={org.logo_url} alt={org.name} fill sizes="56px" className="object-cover" />
                                            </div>
                                        ) : (
                                            <div className="flex size-14 shrink-0 items-center justify-center rounded-xl border border-border bg-muted/50 text-muted-foreground transition-transform duration-300 group-hover:scale-105 group-hover:bg-primary/10 group-hover:text-primary">
                                                <Building2 size={24} />
                                            </div>
                                        )}
                                        <div className="flex flex-1 flex-col justify-center min-w-0 pt-1">
                                            <h3 className="line-clamp-2 text-lg font-bold leading-tight tracking-tight text-foreground transition-colors group-hover:text-primary">
                                                {org.name}
                                            </h3>
                                            <div className="mt-1.5">
                                                <StarRating rating={org.rating} />
                                            </div>
                                            {org.categories.length > 0 && (
                                                <div className="mt-2 flex flex-wrap gap-1">
                                                    {org.categories.map(cat => (
                                                        <Badge key={cat} variant="secondary" className="text-[10px] px-2 py-0.5 font-semibold">
                                                            {ORG_CATEGORY_LABELS[cat] ?? cat}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Descriere */}
                                    {org.description && (
                                        <p className="text-sm leading-relaxed text-muted-foreground line-clamp-3 flex-1">
                                            {org.description}
                                        </p>
                                    )}

                                    {/* Footer Card: Website + Buton Acțiune */}
                                    <div className="mt-auto flex items-center justify-between border-t border-border/50 pt-5">
                                        {org.website ? (
                                            <a
                                                href={org.website}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-primary"
                                            >
                                                <Globe size={14} />
                                                <span className="line-clamp-1 max-w-[120px]">Website</span>
                                            </a>
                                        ) : (
                                            <span />
                                        )}

                                        {/* Buton cu hover group și săgeată animată */}
                                        <Link
                                            href={`/organizatii/${org.id}`}
                                            className={`${buttonVariants({ variant: 'outline', size: 'sm' })} group/btn font-semibold transition-all hover:border-primary/50 hover:bg-primary/5 hover:text-primary`}
                                        >
                                            Detalii
                                            <ArrowRight className="ml-1.5 size-3.5 transition-transform group-hover/btn:translate-x-1" />
                                        </Link>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}