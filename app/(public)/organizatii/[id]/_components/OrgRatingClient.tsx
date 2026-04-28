'use client'

import { useState } from 'react'
import { Star } from 'lucide-react'
import { toast } from 'sonner'
import { rateOrganization } from '@/services/organization.service'

type Props = {
  orgId: string
  initialRating: number | null
  isAuthenticated: boolean
}

export function OrgRatingClient({ orgId, initialRating, isAuthenticated }: Props) {
  const [selected, setSelected] = useState<number>(initialRating ?? 0)
  const [hovered, setHovered] = useState<number>(0)
  const [loading, setLoading] = useState(false)

  async function handleRate(rating: number) {
    if (!isAuthenticated) {
      toast.error('Trebuie să fii autentificat pentru a evalua.')
      return
    }
    setLoading(true)
    const result = await rateOrganization(orgId, rating)
    if ('error' in result) {
      toast.error(result.error)
    } else {
      setSelected(rating)
      toast.success('Evaluare salvată!')
    }
    setLoading(false)
  }

  const display = hovered || selected

  return (
    <div className="flex flex-col gap-2">
      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
        Evaluează organizația
      </p>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map(i => (
          <button
            key={i}
            disabled={loading}
            onClick={() => handleRate(i)}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(0)}
            className="transition-transform hover:scale-110 focus:outline-none disabled:opacity-50"
            aria-label={`Evaluează cu ${i} stele`}
          >
            <Star
              size={24}
              className={i <= display ? 'fill-secondary text-secondary' : 'text-muted-foreground/30'}
            />
          </button>
        ))}
      </div>
      {selected > 0 && (
        <p className="text-xs text-muted-foreground">Evaluarea ta: {selected}/5</p>
      )}
    </div>
  )
}
