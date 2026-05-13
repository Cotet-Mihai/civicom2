import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function PendingEventPage() {
  return (
    <main className="relative overflow-hidden min-h-screen flex items-center justify-center bg-background">

      {/* Ambient circles */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-primary/5" />
        <div className="absolute -bottom-20 -left-20 h-[300px] w-[300px] rounded-full bg-secondary/5" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-primary/3" />
      </div>

      <div className="relative mx-auto max-w-2xl px-4 lg:px-8 py-20 text-center animate-fade-in-up">

        {/* Icon — editorial style */}
        <div className="flex flex-col items-center gap-0 cursor-default mb-8">
          <span className="font-heading text-[120px] lg:text-[180px] font-black leading-none tracking-tighter text-primary/15 select-none">
            ⏳
          </span>
          <div className="-mt-4 lg:-mt-8 space-y-1">
            <p className="font-heading text-2xl lg:text-4xl font-black uppercase tracking-tighter text-foreground">
              Eveniment în verificare.
            </p>
            <p className="font-heading text-base lg:text-xl font-bold uppercase tracking-tight text-muted-foreground">
              Revenim curând.
            </p>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed mb-10">
          Echipa CIVICOM✨ analizează evenimentul tău. Vei primi o notificare imediat ce procesul de validare este finalizat.
        </p>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/panou/evenimente"
            className={cn(buttonVariants({ size: 'lg' }), 'gap-2')}
          >
            Evenimentele mele
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/evenimente"
            className={cn(
              buttonVariants({ variant: 'outline', size: 'lg' }),
              'gap-2 border-primary/30 text-primary hover:bg-accent'
            )}
          >
            Explorează evenimente
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

      </div>
    </main>
  )
}
