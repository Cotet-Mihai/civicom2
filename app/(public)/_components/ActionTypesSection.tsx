import Link from 'next/link'
import { Megaphone, Ban, FileText, Heart, HandHeart, ArrowRight } from 'lucide-react'

const ACTION_TYPES = [
    {
        slug: 'protest',
        name: 'Protest',
        description: 'Participă la adunări, marșuri și pichete pentru a susține cauze civice.',
        Icon: Megaphone,
        className: "lg:col-span-1"
    },
    {
        slug: 'boycott',
        name: 'Boycott',
        description: 'Alătură-te campaniilor de boicot împotriva brandurilor sau practicilor neetice. și descoperă alternative etice.',
        Icon: Ban,
        className: "lg:col-span-1"
    },
    {
        slug: 'petition',
        name: 'Petiție',
        description: 'Participă la adunarea de semnături, crește vizibilitatea cauzei și susține schimbarea prin implicare ta.',
        Icon: FileText,
        className: "lg:col-span-1"
    },
    {
        slug: 'community',
        name: 'Comunitar',
        description: 'Descoperă evenimente pentru dezvoltarea comunității: donații, workshop-uri, activități în aer liber sau inițiative locale. Găsește oportunități relevante și implică-te activ în jurul tău.',
        Icon: Heart,
        className: "sm:col-span-2 lg:col-span-2"
    },
    {
        slug: 'charity',
        name: 'Caritabil',
        description: 'Explorează evenimente caritabile precum concerte, livestream-uri sau competiții sportive.',
        Icon: HandHeart,
        className: "sm:col-span-2 lg:col-span-1"
    }
]

export function ActionTypesSection() {
    return (
        <section className="bg-background py-20 lg:py-28">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">

                {/* Header stilizat Shadcn style */}
                <div className="mb-16">
                    <div className="flex flex-col items-start gap-2">
                        <h2 className="text-4xl font-black tracking-tight text-foreground lg:text-6xl font-heading">
                            Cum vrei să faci <span className="text-primary">diferența?</span>
                        </h2>
                        <p className="mt-4 max-w-2xl text-sm text-muted-foreground">
                            Alege tipul de acțiune care ți se potrivește. Platforma noastră îți oferă uneltele necesare pentru fiecare inițiativă.
                        </p>
                    </div>
                </div>

                {/* Bento Grid */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {ACTION_TYPES.map(({ slug, name, description, Icon, className }) => (
                        <Link
                            key={slug}
                            href={`/evenimente?categorie=${slug}`}
                            className={`group relative flex flex-col justify-between overflow-hidden rounded-xl border border-border bg-card p-8 transition-all duration-300 hover:border-primary/50 hover:shadow-md ${className}`}
                        >
                            {/* Element decorativ subtil la hover */}
                            <div className="absolute right-0 top-0 -mr-8 -mt-8 size-32 rounded-full bg-primary/5 transition-all duration-500 group-hover:bg-primary/10" />

                            <div className="relative">
                                <div className="mb-6 inline-flex size-12 items-center justify-center rounded-lg bg-primary text-primary-foreground ring-1 ring-border transition-all duration-300 group-hover:bg-primary group-hover:text-primary-foreground">
                                    <Icon className="size-6" />
                                </div>

                                <h3 className="mb-2 text-xl font-bold tracking-tight text-foreground">
                                    {name}
                                </h3>
                                <p className="text-sm leading-relaxed text-muted-foreground">
                                    {description}
                                </p>
                            </div>

                            <div className="relative mt-8 flex items-center gap-2 text-sm font-semibold text-primary opacity-0 transition-all duration-300 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0">
                                Vezi evenimente
                                <ArrowRight className="size-4" />
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    )
}