import Link from 'next/link'
import type { Metadata } from 'next'
import { Megaphone, ShoppingBag, FileText, Users, Heart } from 'lucide-react'

export const metadata: Metadata = { title: 'Creează eveniment', robots: { index: false } }

const TYPES = [
  {
    href: '/creeaza/protest',
    label: 'Protest',
    description: 'Adunare, marș sau pichet pentru a susține o cauză',
    icon: Megaphone,
    bg: 'from-red-500/20 to-orange-500/10',
    accent: 'text-red-600',
  },
  {
    href: '/creeaza/boycott',
    label: 'Boycott',
    description: 'Organizează un boicot și propune alternative',
    icon: ShoppingBag,
    bg: 'from-amber-500/20 to-yellow-500/10',
    accent: 'text-amber-600',
  },
  {
    href: '/creeaza/petitie',
    label: 'Petiție',
    description: 'Strânge semnături pentru o schimbare concretă',
    icon: FileText,
    bg: 'from-blue-500/20 to-sky-500/10',
    accent: 'text-blue-600',
  },
  {
    href: '/creeaza/comunitar',
    label: 'Comunitar',
    description: 'Activitate în aer liber, workshop sau colectă donații',
    icon: Users,
    bg: 'from-primary/20 to-primary/5',
    accent: 'text-primary',
  },
  {
    href: '/creeaza/caritabil',
    label: 'Caritabil',
    description: 'Concert, meet & greet, livestream sau activitate sportivă',
    icon: Heart,
    bg: 'from-pink-500/20 to-rose-500/10',
    accent: 'text-pink-600',
  },
]

export default function CreateSelectPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 lg:px-8 py-12">
      <div className="mb-10 space-y-2">
        <h1 className="text-3xl font-black tracking-tighter text-foreground">
          Ce tip de eveniment creezi?
        </h1>
        <p className="text-muted-foreground">
          Alege categoria potrivită pentru acțiunea ta civică.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {TYPES.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className={`group relative flex flex-col gap-4 rounded-2xl border border-border bg-gradient-to-br ${t.bg} p-6 transition-all hover:shadow-lg hover:scale-[1.02]`}
          >
            <div className={`size-12 rounded-xl bg-white/60 flex items-center justify-center ${t.accent}`}>
              <t.icon size={24} />
            </div>
            <div>
              <p className={`text-lg font-black ${t.accent}`}>{t.label}</p>
              <p className="text-sm text-muted-foreground mt-1 leading-snug">{t.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
