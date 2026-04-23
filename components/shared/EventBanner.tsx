import Image from 'next/image'
import { Eye } from 'lucide-react'
import { CATEGORY_LABELS } from '@/lib/constants'

const SUBCATEGORY_LABELS: Record<string, string> = {
  gathering: 'Protest: Adunare',
  march: 'Protest: Marș',
  picket: 'Protest: Pichet',
  outdoor: 'Activitate: Aer Liber',
  workshop: 'Activitate: Workshop',
  donation: 'Donații',
  concert: 'Concert Caritabil',
  meet_greet: 'Meet & Greet',
  livestream: 'Livestream Caritabil',
  sports: 'Sport Caritabil',
}

type Props = {
  bannerUrl: string | null
  title: string
  category: string
  subcategory: string | null
  status: string
  viewCount: number
}

export function EventBanner({ bannerUrl, title, category, subcategory, status, viewCount }: Props) {
  const badgeLabel = subcategory
    ? (SUBCATEGORY_LABELS[subcategory] ?? `${CATEGORY_LABELS[category] ?? category}: ${subcategory}`)
    : (CATEGORY_LABELS[category] ?? category)

  return (
    <div className="relative w-full aspect-[21/9] group rounded-3xl overflow-hidden border border-border shadow-xl">
      {bannerUrl ? (
        <Image
          src={bannerUrl}
          alt={title}
          fill
          priority
          className="object-cover transition-transform duration-700 group-hover:scale-[1.02]"
        />
      ) : (
        <div className="h-full w-full bg-muted" />
      )}

      <div className="absolute inset-0 shadow-[inset_0_0_40px_rgba(0,0,0,0.1)] pointer-events-none z-10" />

      <div className="absolute top-4 left-4 z-20">
        <span className="rounded-full bg-background/90 px-3 py-1.5 text-xs font-semibold text-foreground backdrop-blur-sm border border-border/50">
          {badgeLabel}
        </span>
      </div>

      <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 bg-muted/90 px-2.5 py-1 rounded-md text-xs font-bold border border-border/50 backdrop-blur-sm">
        <Eye size={12} className="text-muted-foreground" />
        <span className="text-muted-foreground">{viewCount.toLocaleString('ro-RO')}</span>
      </div>

      {status === 'completed' && (
        <div className="absolute bottom-4 left-4 z-20">
          <span className="bg-primary/80 text-primary-foreground text-xs font-bold px-3 py-1.5 rounded-full backdrop-blur-sm">
            Finalizat
          </span>
        </div>
      )}
    </div>
  )
}
