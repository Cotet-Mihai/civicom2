'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Megaphone, ShoppingBag, FileText, Users, Heart, ArrowRight, User, Check, Building2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SuggestEventCardClient } from './SuggestEventCardClient'

const TYPES = [
    {
        slug: 'protest',
        label: 'Protest',
        description: 'Adunare, marș sau pichet pentru a susține o cauză.',
        icon: Megaphone,
        iconColor: 'text-red-500',
        iconBg: 'bg-red-500/10',
        hoverBorder: 'hover:border-red-500/40',
        hoverShadow: 'hover:shadow-red-500/10',
        groupHoverBg: 'group-hover:bg-red-500/20',
        hoverText: 'group-hover:text-red-500',
    },
    {
        slug: 'boycott',
        label: 'Boycott',
        description: 'Organizează un boicot și propune alternative clare.',
        icon: ShoppingBag,
        iconColor: 'text-amber-500',
        iconBg: 'bg-amber-500/10',
        hoverBorder: 'hover:border-amber-500/40',
        hoverShadow: 'hover:shadow-amber-500/10',
        groupHoverBg: 'group-hover:bg-amber-500/20',
        hoverText: 'group-hover:text-amber-500',
    },
    {
        slug: 'petitie',
        label: 'Petiție',
        description: 'Strânge semnături online pentru o schimbare concretă.',
        icon: FileText,
        iconColor: 'text-blue-500',
        iconBg: 'bg-blue-500/10',
        hoverBorder: 'hover:border-blue-500/40',
        hoverShadow: 'hover:shadow-blue-500/10',
        groupHoverBg: 'group-hover:bg-blue-500/20',
        hoverText: 'group-hover:text-blue-500',
    },
    {
        slug: 'comunitar',
        label: 'Comunitar',
        description: 'Activitate în aer liber, workshop sau plantare de copaci.',
        icon: Users,
        iconColor: 'text-primary',
        iconBg: 'bg-primary/10',
        hoverBorder: 'hover:border-primary/40',
        hoverShadow: 'hover:shadow-primary/10',
        groupHoverBg: 'group-hover:bg-primary/20',
        hoverText: 'group-hover:text-primary',
    },
    {
        slug: 'caritabil',
        label: 'Caritabil',
        description: 'Concert, colectă de fonduri, sau activitate sportivă.',
        icon: Heart,
        iconColor: 'text-purple-500',
        iconBg: 'bg-purple-500/10',
        hoverBorder: 'hover:border-purple-500/40',
        hoverShadow: 'hover:shadow-purple-500/10',
        groupHoverBg: 'group-hover:bg-purple-500/20',
        hoverText: 'group-hover:text-purple-500',
    },
]

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
    pending:   { label: 'În așteptare', className: 'bg-amber-100 text-amber-700' },
    rejected:  { label: 'Respins',      className: 'bg-destructive/10 text-destructive' },
    contested: { label: 'Contestat',    className: 'bg-orange-100 text-orange-700' },
}

type Org = { id: string; name: string; logo_url: string | null; status: string }

type Props = {
    orgs: Org[]
    userName: string
}

export function CreatePageClient({ orgs, userName }: Props) {
    const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null)

    function buildHref(slug: string) {
        if (!selectedOrgId) return `/creeaza/${slug}`
        return `/creeaza/${slug}?org=${selectedOrgId}`
    }

    return (
        <div className="relative min-h-[calc(100vh-4rem)] flex flex-col items-center py-16 lg:py-24">

            <div className="pointer-events-none absolute inset-0 overflow-hidden -z-10">
                <div className="absolute left-1/2 top-0 h-[500px] w-[600px] -translate-x-1/2 rounded-full bg-primary/5 blur-[120px]" />
            </div>

            <div className="mx-auto w-full max-w-5xl px-6 lg:px-8 animate-fade-in-up space-y-12">

                {/* Selector ONG — afișat doar dacă userul aparține unui ONG */}
                {orgs.length > 0 && (
                    <div className="space-y-4">
                        <div>
                            <h2 className="text-xl md:text-2xl font-black tracking-tighter uppercase italic text-foreground">
                                În numele <span className="text-primary">cui</span> creezi?
                            </h2>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Alege contul personal sau una dintre organizațiile tale.
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            {/* Card personal */}
                            <button
                                onClick={() => setSelectedOrgId(null)}
                                className={cn(
                                    'relative flex items-center gap-3 rounded-2xl border bg-card px-5 py-4 text-left transition-all duration-200 hover:shadow-md cursor-default',
                                    selectedOrgId === null
                                        ? 'border-primary ring-2 ring-primary/20 bg-primary/5'
                                        : 'border-border hover:border-primary/40'
                                )}
                            >
                                {selectedOrgId === null && (
                                    <span className="absolute top-2 right-2 flex size-4 items-center justify-center rounded-full bg-primary">
                                        <Check size={10} className="text-white" strokeWidth={3} />
                                    </span>
                                )}
                                <div className="flex size-9 items-center justify-center rounded-full bg-primary/10">
                                    <User size={16} className="text-primary" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-foreground">{userName}</p>
                                    <p className="text-xs text-muted-foreground">Cont personal</p>
                                </div>
                            </button>

                            {/* Carduri ONG */}
                            {orgs.map(org => {
                                const isApproved = org.status === 'approved'
                                const badge = STATUS_BADGE[org.status]
                                const isSelected = selectedOrgId === org.id
                                return (
                                    <button
                                        key={org.id}
                                        onClick={() => isApproved && setSelectedOrgId(org.id)}
                                        disabled={!isApproved}
                                        className={cn(
                                            'relative flex items-center gap-3 rounded-2xl border bg-card px-5 py-4 text-left transition-all duration-200',
                                            isApproved
                                                ? 'hover:shadow-md cursor-default hover:border-primary/40'
                                                : 'opacity-50 cursor-not-allowed',
                                            isSelected && 'border-primary ring-2 ring-primary/20 bg-primary/5',
                                            !isSelected && isApproved && 'border-border',
                                        )}
                                    >
                                        {isSelected && (
                                            <span className="absolute top-2 right-2 flex size-4 items-center justify-center rounded-full bg-primary">
                                                <Check size={10} className="text-white" strokeWidth={3} />
                                            </span>
                                        )}
                                        <div className="flex size-9 items-center justify-center rounded-full bg-primary/10 overflow-hidden shrink-0">
                                            {org.logo_url
                                                ? <img src={org.logo_url} alt={org.name} className="size-full object-cover" />
                                                : <Building2 size={16} className="text-primary" />
                                            }
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-foreground">{org.name}</p>
                                            {badge
                                                ? <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded-full', badge.className)}>{badge.label}</span>
                                                : <p className="text-xs text-muted-foreground">Organizație</p>
                                            }
                                        </div>
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                )}

                {/* Grid tipuri eveniment */}
                <div className="space-y-4">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-black tracking-tighter uppercase italic text-foreground leading-tight">
                            Ce tip de <span className="text-primary">eveniment</span> creezi?
                        </h1>
                        <p className="mt-1 text-muted-foreground">
                            Alege categoria potrivită pentru acțiunea ta civică.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {TYPES.map((t) => (
                            <Link
                                key={t.slug}
                                href={buildHref(t.slug)}
                                className={cn(
                                    'group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-border bg-card p-6 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl',
                                    t.hoverBorder,
                                    t.hoverShadow,
                                )}
                            >
                                <div className="flex flex-col gap-5">
                                    <div className={cn('flex size-14 shrink-0 items-center justify-center rounded-2xl transition-colors duration-300', t.iconBg, t.iconColor, t.groupHoverBg)}>
                                        <t.icon size={26} className="transition-transform duration-300 group-hover:scale-110" />
                                    </div>
                                    <div>
                                        <h2 className="font-heading text-xl font-bold tracking-tight text-foreground">{t.label}</h2>
                                        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                                            {t.description}
                                        </p>
                                    </div>
                                </div>
                                <div className={cn('mt-8 flex items-center text-xs font-bold transition-colors text-muted-foreground', t.hoverText)}>
                                    Selectează categoria
                                    <ArrowRight size={14} className="ml-1.5 transition-transform group-hover:translate-x-1" />
                                </div>
                            </Link>
                        ))}
                        <SuggestEventCardClient />
                    </div>
                </div>

            </div>
        </div>
    )
}
