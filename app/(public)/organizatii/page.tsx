import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { Suspense } from 'react'
import { Building2, Star, Globe, ArrowRight, CheckCircle2, Users, Search } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getOrganizations } from '@/services/organization.service'
import { ORG_CATEGORY_LABELS } from '@/lib/constants'
import { ExtraCategoriesBadge } from './_components/ExtraCategoriesBadge'
import { OrgsSearchBarClient } from './_components/OrgsSearchBarClient'
import { OrgsCategoryFilterClient } from './_components/OrgsCategoryFilterClient'

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
        <div className="flex items-center gap-1.5">
            <div className="flex">
                {[1, 2, 3, 4, 5].map(i => (
                    <Star
                        key={i}
                        size={13}
                        className={i <= Math.round(rating) ? 'fill-secondary text-secondary' : 'text-muted-foreground/20'}
                    />
                ))}
            </div>
            <span className="text-xs font-semibold text-muted-foreground">
                {rating > 0 ? rating.toFixed(1) : 'Fără evaluări'}
            </span>
        </div>
    )
}

type SearchParams = Promise<{ q?: string; cat?: string; sort?: string }>

export default async function OrganizatiiPage({ searchParams }: { searchParams: SearchParams }) {
    const { q = '', cat = '', sort = '' } = await searchParams

    const allOrgs = await getOrganizations()

    let filtered = allOrgs

    if (q) {
        const lower = q.toLowerCase()
        filtered = filtered.filter(org =>
            org.name.toLowerCase().includes(lower) ||
            (org.description?.toLowerCase().includes(lower) ?? false) ||
            org.categories.some(c => ORG_CATEGORY_LABELS[c]?.toLowerCase().includes(lower))
        )
    }
    if (cat) {
        filtered = filtered.filter(org => org.categories.includes(cat))
    }
    if (sort === 'members') {
        filtered = [...filtered].sort((a, b) => b.members_count - a.members_count)
    } else if (sort === 'newest') {
        filtered = [...filtered].sort((a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
    }

    const hasFilter = !!(q || cat)

    return (
        <div className="relative min-h-screen bg-background pb-20 lg:pb-28">

            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute -right-1/4 top-0 h-[500px] w-[500px] rounded-full bg-primary/5 blur-[100px]" />
                <div className="absolute -left-1/4 top-1/3 h-[400px] w-[400px] rounded-full bg-primary/5 blur-[100px]" />
            </div>

            <div className="relative z-10 mx-auto max-w-7xl px-6 pt-12 lg:px-8 lg:pt-20">

                {/* Hero — 2-col on lg */}
                <div className="mb-4 grid grid-cols-1 gap-8 lg:grid-cols-2 lg:items-center animate-fade-in-up">
                    <div className="flex flex-col gap-3">
                        <h1 className="font-heading text-4xl font-black uppercase tracking-tighter text-foreground lg:text-6xl text-balance">
                            Descoperă <span className="text-primary">Organizații</span>
                        </h1>
                        <p className="max-w-xl text-base leading-relaxed text-muted-foreground text-balance">
                            Peste <strong>{allOrgs.length}</strong> organizații non-guvernamentale verificate care coordonează acțiuni civice și creează impact în comunitate.
                        </p>
                    </div>
                    <Suspense>
                        <OrgsSearchBarClient />
                    </Suspense>
                </div>

                {/* Category filter bar */}
                <div className="mb-10 animate-fade-in-up" style={{ animationDelay: '80ms' }}>
                    <Suspense>
                        <OrgsCategoryFilterClient filteredCount={filtered.length} totalCount={allOrgs.length} />
                    </Suspense>
                </div>

                {/* Grid / empty states */}
                {filtered.length === 0 ? (
                    <div
                        className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 py-24 text-center backdrop-blur-sm animate-fade-in-up"
                        style={{ animationDelay: '100ms' }}
                    >
                        <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-muted">
                            {hasFilter
                                ? <Search size={32} className="text-muted-foreground/50" />
                                : <Building2 size={32} className="text-muted-foreground/50" />
                            }
                        </div>
                        <h3 className="text-xl font-bold tracking-tight text-foreground">
                            {hasFilter ? 'Nicio organizație găsită' : 'Nicio organizație'}
                        </h3>
                        <p className="mt-2 text-sm text-muted-foreground">
                            {hasFilter
                                ? 'Nu există rezultate pentru filtrele aplicate. Încearcă alte criterii.'
                                : 'Momentan nu există organizații aprobate pe platformă.'
                            }
                        </p>
                    </div>
                ) : (
                    <div
                        className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 animate-fade-in-up"
                        style={{ animationDelay: '100ms' }}
                    >
                        {filtered.map(org => {
                            const displayCategories = org.categories.slice(0, 2)
                            return (
                                <Card key={org.id} className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-all duration-300 hover:border-primary/50 hover:shadow-md">

                                    {/* Banner */}
                                    <div className="relative w-full aspect-video overflow-hidden shrink-0">
                                        {org.banner_url ? (
                                            <Image
                                                src={org.banner_url}
                                                alt={`Banner ${org.name}`}
                                                fill
                                                className="object-cover transition-transform duration-300 group-hover:scale-105"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-primary/10 to-primary/5" />
                                        )}
                                    </div>

                                    <div className="pointer-events-none absolute right-0 top-0 -mr-8 -mt-8 size-32 rounded-full bg-primary/5 transition-all duration-500 group-hover:bg-primary/10" />

                                    <CardContent className="relative flex flex-1 flex-col p-5 gap-4">

                                        {/* Logo + Nume + Verificat */}
                                        <div className="flex items-start gap-3">
                                            {org.logo_url ? (
                                                <div className="relative size-12 shrink-0 overflow-hidden rounded-xl border border-border bg-background shadow-sm transition-transform duration-300 group-hover:scale-105">
                                                    <Image src={org.logo_url} alt={org.name} fill sizes="48px" className="object-cover" />
                                                </div>
                                            ) : (
                                                <div className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-border bg-muted/50 text-muted-foreground transition-transform duration-300 group-hover:scale-105 group-hover:bg-primary/10 group-hover:text-primary">
                                                    <Building2 size={22} />
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                    <h3 className="text-base font-bold leading-tight tracking-tight text-foreground transition-colors group-hover:text-primary line-clamp-1">
                                                        {org.name}
                                                    </h3>
                                                    <CheckCircle2 size={15} className="shrink-0 text-primary" />
                                                </div>
                                                <div className="mt-1">
                                                    <StarRating rating={org.rating} />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Descriere — max 2 rânduri */}
                                        {org.description && (
                                            <p className="text-sm leading-relaxed text-muted-foreground line-clamp-2">
                                                {org.description}
                                            </p>
                                        )}

                                        {/* Categorii — max 2 */}
                                        {displayCategories.length > 0 && (
                                            <div className="flex flex-wrap gap-1.5">
                                                {displayCategories.map(c => (
                                                    <Badge key={c} variant="secondary" className="text-[10px] px-2 py-0.5 font-semibold">
                                                        {ORG_CATEGORY_LABELS[c] ?? c}
                                                    </Badge>
                                                ))}
                                                {org.categories.length > 2 && (
                                                    <ExtraCategoriesBadge categories={org.categories.slice(2)} />
                                                )}
                                            </div>
                                        )}

                                        {/* Membri */}
                                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                            <Users size={13} className="shrink-0" />
                                            <span><strong className="text-foreground">{org.members_count}</strong> {org.members_count === 1 ? 'membru' : 'membri'}</span>
                                        </div>

                                        {/* Footer: Website + Detalii */}
                                        <div className="mt-auto flex items-center justify-between border-t border-border/50 pt-4">
                                            {org.website ? (
                                                <a
                                                    href={org.website}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className={`${buttonVariants({ variant: 'outline', size: 'sm' })} gap-1.5 font-semibold`}
                                                >
                                                    <Globe size={13} />
                                                    Website
                                                </a>
                                            ) : (
                                                <span />
                                            )}
                                            <Link
                                                href={`/organizatii/${org.id}`}
                                                className={`${buttonVariants({ variant: 'default', size: 'sm' })} group/btn font-semibold`}
                                            >
                                                Detalii
                                                <ArrowRight className="ml-1.5 size-3.5 transition-transform group-hover/btn:translate-x-1" />
                                            </Link>
                                        </div>
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}
