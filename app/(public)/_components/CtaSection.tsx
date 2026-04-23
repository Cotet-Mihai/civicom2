import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function CtaSection() {
  return (
    <section className="bg-foreground py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 text-center lg:px-8">
        <h2 className="font-heading text-4xl font-black uppercase tracking-tighter text-background lg:text-6xl">
          Fii vocea schimbării.
        </h2>
        <p className="mx-auto mt-4 max-w-md text-lg text-background/70">
          Alătură-te comunității CIVICOM✨ și contribuie la o Românie mai bună.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link
            href="/inregistrare"
            className={cn(
              buttonVariants({ size: 'lg' }),
              'bg-background text-foreground hover:bg-background/90'
            )}
          >
            Creează un cont
          </Link>
          <Link
            href="/evenimente"
            className={cn(
              buttonVariants({ variant: 'outline', size: 'lg' }),
              'border-background/30 text-background hover:bg-background/10'
            )}
          >
            Explorează evenimente
          </Link>
        </div>
      </div>
    </section>
  )
}
