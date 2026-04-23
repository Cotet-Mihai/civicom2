import Link from 'next/link'
import { Megaphone, Ban, FileText, Heart, HandHeart } from 'lucide-react'

const ACTION_TYPES = [
  {
    slug: 'protest',
    name: 'Protest',
    description: 'Adunări, marșuri și pichete pentru cauze civice.',
    Icon: Megaphone,
  },
  {
    slug: 'boycott',
    name: 'Boycott',
    description: 'Boicotează branduri și descoperă alternative etice.',
    Icon: Ban,
  },
  {
    slug: 'petition',
    name: 'Petiție',
    description: 'Strânge semnături pentru a schimba decizii.',
    Icon: FileText,
  },
  {
    slug: 'community',
    name: 'Comunitar',
    description: 'Donații, workshop-uri și activități în aer liber.',
    Icon: Heart,
  },
  {
    slug: 'charity',
    name: 'Caritabil',
    description: 'Concerte, livestreams și sporturi pentru cauze nobile.',
    Icon: HandHeart,
  },
]

export function ActionTypesSection() {
  return (
    <section className="py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">

        <div className="mb-12 text-center">
          <h2 className="flex flex-col items-center gap-1 font-heading">
            <span className="text-3xl font-black uppercase tracking-tighter text-primary lg:text-5xl">
              5 moduri
            </span>
            <span className="text-xl font-bold uppercase tracking-tight text-muted-foreground lg:text-3xl">
              să faci diferența
            </span>
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-muted-foreground">
            Alege tipul de acțiune civică potrivit cauzei tale.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {ACTION_TYPES.map(({ slug, name, description, Icon }) => (
            <Link
              key={slug}
              href={`/evenimente?categorie=${slug}`}
              className="group flex flex-col items-center gap-4 rounded-2xl border border-border bg-card p-8 text-center transition-all duration-300 hover:scale-105 hover:border-primary/30 hover:shadow-lg"
            >
              <div className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors duration-300 group-hover:bg-primary/20">
                <Icon className="size-8" />
              </div>
              <h3 className="text-lg font-black uppercase tracking-tight text-foreground">
                {name}
              </h3>
              <p className="text-sm text-muted-foreground">{description}</p>
            </Link>
          ))}
        </div>

      </div>
    </section>
  )
}
