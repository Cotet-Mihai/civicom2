import Link from 'next/link'
import type { Metadata } from 'next'
import { Megaphone, ShoppingBag, FileText, Users, Heart, ArrowRight } from 'lucide-react'
import { SuggestEventCardClient } from './_components/SuggestEventCardClient'

export const metadata: Metadata = { title: 'Creează eveniment — CIVICOM', robots: { index: false } }

// Am explicitat clasele Tailwind pentru ca purgeCSS-ul să nu le șteargă.
// Fiecare categorie are propria identitate cromatică subtilă la hover.
const TYPES = [
    {
        href: '/creeaza/protest',
        label: 'Protest',
        description: 'Adunare, marș sau pichet pentru a susține o cauză.',
        icon: Megaphone,
        iconColor: 'text-red-500',
        iconBg: 'bg-red-500/10',
        hoverBorder: 'hover:border-red-500/40',
        hoverShadow: 'hover:shadow-red-500/10',
        groupHoverBg: 'group-hover:bg-red-500/20',
    },
    {
        href: '/creeaza/boycott',
        label: 'Boycott',
        description: 'Organizează un boicot și propune alternative clare.',
        icon: ShoppingBag,
        iconColor: 'text-amber-500',
        iconBg: 'bg-amber-500/10',
        hoverBorder: 'hover:border-amber-500/40',
        hoverShadow: 'hover:shadow-amber-500/10',
        groupHoverBg: 'group-hover:bg-amber-500/20',
    },
    {
        href: '/creeaza/petitie',
        label: 'Petiție',
        description: 'Strânge semnături online pentru o schimbare concretă.',
        icon: FileText,
        iconColor: 'text-blue-500',
        iconBg: 'bg-blue-500/10',
        hoverBorder: 'hover:border-blue-500/40',
        hoverShadow: 'hover:shadow-blue-500/10',
        groupHoverBg: 'group-hover:bg-blue-500/20',
    },
    {
        href: '/creeaza/comunitar',
        label: 'Comunitar',
        description: 'Activitate în aer liber, workshop sau plantare de copaci.',
        icon: Users,
        iconColor: 'text-primary',
        iconBg: 'bg-primary/10',
        hoverBorder: 'hover:border-primary/40',
        hoverShadow: 'hover:shadow-primary/10',
        groupHoverBg: 'group-hover:bg-primary/20',
    },
    {
        href: '/creeaza/caritabil',
        label: 'Caritabil',
        description: 'Concert, colectă de fonduri, sau activitate sportivă.',
        icon: Heart,
        iconColor: 'text-purple-500',
        iconBg: 'bg-purple-500/10',
        hoverBorder: 'hover:border-purple-500/40',
        hoverShadow: 'hover:shadow-purple-500/10',
        groupHoverBg: 'group-hover:bg-purple-500/20',
    },
]

export default function CreateSelectPage() {
    return (
        <div className="relative min-h-[calc(100vh-4rem)] flex flex-col items-center py-16 lg:py-24">

            {/* Efect ambiental de focus (Glow central) */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden -z-10">
                <div className="absolute left-1/2 top-0 h-[500px] w-[600px] -translate-x-1/2 rounded-full bg-primary/5 blur-[120px]" />
            </div>

            <div className="mx-auto w-full max-w-5xl px-6 lg:px-8 animate-fade-in-up">

                <div className="mb-10 space-y-2">
                    <h1 className="text-3xl md:text-4xl font-black tracking-tighter uppercase italic text-foreground leading-tight">
                        Ce tip de <span className="text-primary">eveniment</span> creezi?
                    </h1>
                    <p className="text-muted-foreground">
                        Alege categoria potrivită pentru acțiunea ta civică.
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {TYPES.map((t) => (
                        <Link
                            key={t.href}
                            href={t.href}
                            className={`group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-border bg-card p-6 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl ${t.hoverBorder} ${t.hoverShadow}`}
                        >
                            <div className="flex flex-col gap-5">
                                <div className={`flex size-14 shrink-0 items-center justify-center rounded-2xl transition-colors duration-300 ${t.iconBg} ${t.iconColor} ${t.groupHoverBg}`}>
                                    <t.icon size={26} className="transition-transform duration-300 group-hover:scale-110" />
                                </div>
                                <div>
                                    <h2 className="font-heading text-xl font-bold tracking-tight text-foreground">{t.label}</h2>
                                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                                        {t.description}
                                    </p>
                                </div>
                            </div>
                            <div className={`mt-8 flex items-center text-xs font-bold transition-colors text-muted-foreground ${t.iconColor.replace('text-', 'group-hover:text-')}`}>
                                Selectează categoria
                                <ArrowRight size={14} className="ml-1.5 transition-transform group-hover:translate-x-1" />
                            </div>
                        </Link>
                    ))}
                    <SuggestEventCardClient />
                </div>

            </div>
        </div>
    )
}