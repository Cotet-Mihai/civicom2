import Link from 'next/link'
import { SearchX } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-muted">
        <SearchX className="size-8 text-muted-foreground" />
      </div>
      <div className="space-y-1">
        <p className="text-lg font-bold text-foreground">Niciun eveniment găsit</p>
        <p className="text-sm text-muted-foreground">
          Încearcă să modifici filtrele sau explorează toate evenimentele.
        </p>
      </div>
      <Link href="/evenimente" className={buttonVariants({ variant: 'outline' })}>
        Șterge filtrele
      </Link>
    </div>
  )
}
