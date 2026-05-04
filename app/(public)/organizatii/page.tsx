import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { Suspense } from 'react'
import { Building2, CheckCircle2, Search, Star, Users, ArrowRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { getOrganizations, getPopularOrgSearches } from '@/services/organization.service'
import { ORG_CATEGORY_LABELS, ORG_CATEGORY_BADGE_CLASSES } from '@/lib/constants'
import { ExtraCategoriesBadge } from './_components/ExtraCategoriesBadge'
import { OrgsSearchBarClient } from './_components/OrgsSearchBarClient'
import { OrgsCategoryFilterClient } from './_components/OrgsCategoryFilterClient'
import { OrgsMobileFABClient } from './_components/OrgsMobileFABClient'
import { OrgsPendingProvider } from './_components/OrgsPendingContext'
import { OrgsGridClient } from './_components/OrgsGridClient'

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

function norm(s: string) {
    return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
}

function editDist(a: string, b: string): number {
    const m = a.length, n = b.length
    const row = Array.from({ length: n + 1 }, (_, j) => j)
    for (let i = 1; i <= m; i++) {
        let prev = row[0]
        row[0] = i
        for (let j = 1; j <= n; j++) {
            const tmp = row[j]
            row[j] = a[i - 1] === b[j - 1] ? prev : 1 + Math.min(prev, row[j], row[j - 1])
            prev = tmp
        }
    }
    return row[n]
}

function maxDist(word: string) {
    if (word.length <= 3) return 0
    if (word.length <= 6) return 1
    return 2
}

function wordHits(word: string, tokens: string[]): boolean {
    const d = maxDist(word)
    return tokens.some(t => t.includes(word) || (d > 0 && editDist(word, t) <= d))
}

type SearchParams = Promise<{ q?: string; cat?: string; sort?: string }>

export default async function OrganizatiiPage({ searchParams }: { searchParams: SearchParams }) {
    const { q = '', cat = '', sort = '' } = await searchParams

    const [allOrgs, popularSearches] = await Promise.all([
        getOrganizations(),
        getPopularOrgSearches(),
    ])

    let filtered = allOrgs

    if (q) {
        const words = norm(q).split(/\s+/).filter(Boolean)

        const scored = allOrgs.flatMap(org => {
            const nameTokens = norm(org.name).split(/\s+/)
            const descTokens = org.description ? norm(org.description).split(/\s+/) : []
            const catTokens = org.categories.flatMap(c => norm(ORG_CATEGORY_LABELS[c] ?? '').split(/\s+/))

            let score = 0
            for (const word of words) {
                if (wordHits(word, nameTokens)) score += 2
                else if (wordHits(word, [...descTokens, ...catTokens])) score += 1
            }

            return score > 0 ? [{ org, score }] : []
        })

        scored.sort((a, b) => b.score - a.score)
        filtered = scored.map(s => s.org)
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
        <OrgsPendingProvider>
        <div className="relative min-h-screen bg-background pb-20 lg:pb-28">

            {/* Efecte ambientale CIVICOM */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute -right-1/4 top-0 h-[500px] w-[500px] rounded-full bg-primary/5 blur-[100px]" />
                <div className="absolute -left-1/4 top-1/3 h-[400px] w-[400px] rounded-full bg-primary/5 blur-[100px]" />
            </div>

            <div className="relative z-10 mx-auto max-w-[1400px] px-6 pt-6 lg:px-8 lg:pt-10">

                {/* Hero Section */}
                <div className="mb-4 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_0.9fr_auto] lg:items-center animate-fade-in-up">
                    <div className="flex flex-col gap-2">
                        <h1 className="font-heading text-4xl font-black tracking-tighter text-foreground lg:text-5xl">
                            Descoperă ONG-uri <br/>
                            <span className="text-primary">din România</span>
                        </h1>
                        <p className="max-w-md text-base leading-relaxed text-muted-foreground">
                            Găsește organizații care fac diferența și alătură-te cauzelor în care crezi.
                        </p>
                    </div>

                    <Suspense>
                        <OrgsSearchBarClient popularSearches={popularSearches} />
                    </Suspense>

                    <div className="relative hidden lg:block h-80 w-80 opacity-20">
                        <Image
                            src="/img_organizatii2.png"
                            alt=""
                            fill
                            className="object-contain"
                        />
                    </div>
                </div>

                {/* Filtre Categorii — desktop only */}
                <div className="mb-4 hidden lg:block animate-fade-in-up" style={{ animationDelay: '80ms' }}>
                    <Suspense>
                        <OrgsCategoryFilterClient filteredCount={filtered.length} totalCount={allOrgs.length} />
                    </Suspense>
                </div>

                {/* FAB filtre — mobil only */}
                <Suspense>
                    <OrgsMobileFABClient />
                </Suspense>

                {/* Număr rezultate */}
                <h2 className="mb-4 text-sm font-bold text-foreground">
                    {filtered.length} {filtered.length === 1 ? 'ONG găsit' : 'ONG-uri găsite'}
                </h2>

                {/* Grid / Empty states */}
                <OrgsGridClient>
                {filtered.length === 0 ? (
                    <div
                        className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 py-24 text-center backdrop-blur-sm"
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
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {filtered.map(org => {
                            const displayCategories = org.categories.slice(0, 2)
                            return (
                                <Card key={org.id} className="group relative cursor-default flex flex-col overflow-hidden rounded-2xl border border-border bg-card py-0 gap-0 transition-all duration-300 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5">

                                    {/* Banner */}
                                    <div className="relative w-full aspect-[5/3] overflow-hidden shrink-0">
                                        {org.banner_url ? (
                                            <Image
                                                src={org.banner_url}
                                                alt={`Banner ${org.name}`}
                                                fill
                                                className="object-cover transition-transform duration-500 group-hover:scale-105"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                                                <span className="font-heading text-4xl font-black text-primary/20 select-none tracking-tight">CIVICOM</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Logo suprapus peste banner */}
                                    <div className="relative h-0">
                                        {org.logo_url ? (
                                            <div className="absolute -top-10 left-5 z-10 size-16 overflow-hidden rounded-2xl border-4 border-card bg-background shadow-sm transition-transform duration-300 group-hover:scale-105">
                                                <Image src={org.logo_url} alt={org.name} fill sizes="64px" className="object-contain p-1" />
                                            </div>
                                        ) : (
                                            <div className="absolute -top-10 left-5 z-10 flex size-16 items-center justify-center rounded-2xl border-4 border-card bg-muted shadow-sm transition-all duration-300 group-hover:bg-primary/10">
                                                <Building2 size={24} className="text-muted-foreground group-hover:text-primary" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Conținut Card */}
                                    <CardContent className="relative flex flex-1 flex-col p-5 pt-10 gap-3">

                                        {/* Titlu + Verificat */}
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                            <Link href={`/organizatii/${org.id}`} className="text-lg font-bold leading-tight tracking-tight text-foreground transition-colors hover:text-primary line-clamp-1">
                                                {org.name}
                                            </Link>
                                            <CheckCircle2 size={16} className="shrink-0 text-primary" />
                                        </div>

                                        {/* Rating reinserat */}
                                        <div className="-mt-1.5">
                                            <StarRating rating={org.rating} />
                                        </div>

                                        {/* Descriere */}
                                        <p className="text-sm leading-relaxed text-muted-foreground line-clamp-2 flex-1">
                                            {org.description || 'Nicio descriere disponibilă pentru această organizație.'}
                                        </p>

                                        {/* Categorii tip "Soft Pill" */}
                                        {displayCategories.length > 0 && (
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                {displayCategories.map(c => (
                                                    <Badge key={c} variant="outline" className={cn('text-xs px-2.5 py-1 font-semibold', ORG_CATEGORY_BADGE_CLASSES[c] ?? 'bg-muted text-muted-foreground border-border')}>
                                                        {ORG_CATEGORY_LABELS[c] ?? c}
                                                    </Badge>
                                                ))}
                                                {org.categories.length > 2 && (
                                                    <ExtraCategoriesBadge categories={org.categories.slice(2)} />
                                                )}
                                            </div>
                                        )}

                                        {/* Footer: Membri (stânga) | Vezi profil (dreapta) */}
                                        <div className="mt-auto flex items-center justify-between border-t border-border/50 pt-4">

                                            {/* Număr membri */}
                                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                <Users size={14} className="shrink-0 text-muted-foreground/70" />
                                                <span><strong className="text-foreground">{org.members_count}</strong> {org.members_count === 1 ? 'membru' : 'membri'}</span>
                                            </div>

                                            {/* Buton Vezi Profil */}
                                            <Link
                                                href={`/organizatii/${org.id}`}
                                                className="group/link flex items-center gap-1 text-sm font-bold text-primary transition-all hover:text-primary/80"
                                            >
                                                Vezi profil
                                                <ArrowRight className="size-4 transition-transform group-hover/link:translate-x-1" />
                                            </Link>
                                        </div>
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>
                )}
                </OrgsGridClient>
            </div>
        </div>
    </OrgsPendingProvider>
    )
}