import Link from 'next/link'
import Image from 'next/image'
import {Button, buttonVariants } from '@/components/ui/button'
import {ArrowRight, Calendar} from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden py-20 lg:py-28 min-h-screen flex justify-center items-start">
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

            <p className="mt-6 max-w-md text-sm text-muted-foreground">
                Aducem voluntari, ONG-uri și instituții împreună pentru evenimente, petiții și donații. Descoperă, implică-te și susține cauze care contează. ✨
            </p>

            <div className="mt-8 flex flex-col gap-3  sm:flex-row">
                <Link href={'/evenimente'}>
                    <Button
                        size="lg"
                        className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 px-6"
                    >
                        Descoperă evenimente
                        <ArrowRight className="h-4 w-4" />
                    </Button>
                </Link>
                <Link href={'#'}>
                    <Button
                        variant="outline"
                        size="lg"
                        className="gap-2 border-primary/30 text-primary hover:bg-accent hover:text-accent-foreground px-6 bg-transparent"
                    >
                        <Calendar className="h-4 w-4" />
                        Creează un eveniment
                    </Button>
                </Link>
            </div>
          </div>

          {/* Imagine */}
          <div className={'relative hidden lg:block'}>
              <div className="absolute -inset-4 rounded-3xl bg-primary/5 blur-2xl " />
              <Image
                  src="/home_image.webp"
                  alt="Sigla Civicom - Mâini ridicate ținând o inimă verde"
                  width={460}
                  height={460}
                  className="relative rounded-2xl object-contain"
                  priority
              />
          </div>

        </div>
      </div>
    </section>
  )
}
