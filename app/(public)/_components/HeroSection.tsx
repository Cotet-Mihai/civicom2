import Link from 'next/link'
import Image from 'next/image'
import { buttonVariants } from '@/components/ui/button'

export function HeroSection() {
  return (
    <section className="relative overflow-hidden py-20 lg:py-28">
      {/* Cercuri ambient */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-primary/5" />
        <div className="absolute -bottom-20 -left-20 h-[300px] w-[300px] rounded-full bg-primary/10" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">

          {/* Text */}
          <div className="animate-fade-in-up">
            <h1 className="flex flex-col gap-1">
              <span className="font-heading text-4xl font-black uppercase tracking-tighter text-foreground lg:text-7xl">
                Acționează.
              </span>
              <span className="font-heading text-4xl font-black uppercase tracking-tighter text-primary lg:text-7xl">
                Implică-te.
              </span>
              <span className="font-heading text-2xl font-bold uppercase tracking-tight text-muted-foreground lg:text-4xl">
                Schimbă comunitatea.
              </span>
            </h1>

            <p className="mt-6 max-w-md text-lg text-muted-foreground">
              Platforma civică unde găsești proteste, petiții, boicoturi și acțiuni
              comunitare din toată România.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/evenimente" className={buttonVariants({ size: 'lg' })}>
                Descoperă evenimente
              </Link>
              <Link href="/creeaza" className={buttonVariants({ variant: 'outline', size: 'lg' })}>
                Creează un eveniment
              </Link>
            </div>
          </div>

          {/* Imagine */}
          <div className="relative hidden aspect-[4/3] overflow-hidden rounded-3xl lg:block">
            <Image
              src="/auth_panel.webp"
              alt="Voluntari CIVICOM"
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 rounded-3xl ring-1 ring-inset ring-black/10" />
          </div>

        </div>
      </div>
    </section>
  )
}
