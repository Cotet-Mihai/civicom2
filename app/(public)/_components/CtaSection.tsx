import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {ArrowRight} from "lucide-react";

export function CtaSection() {
    return (
        <section className="relative overflow-hidden bg-foreground py-20 lg:py-28">

            {/* Fundal animat CSS (Server-side, zero JS) */}
            <div className="pointer-events-none absolute inset-0 z-0">
                <div className="absolute -left-1/4 -top-1/4 h-[500px] w-[500px] animate-pulse rounded-full bg-primary/20 blur-[120px] duration-[3000ms]" />
                <div className="absolute -bottom-1/4 -right-1/4 h-[500px] w-[500px] animate-pulse rounded-full bg-primary/10 blur-[120px] duration-[4000ms] delay-1000" />
            </div>

            <div className="relative z-10 mx-auto max-w-7xl px-4 text-center lg:px-8">
                <h2 className="font-heading text-4xl font-black uppercase tracking-tighter text-background lg:text-6xl text-balance">
                    Fii vocea schimbării.
                </h2>
                <p className="mx-auto mt-4 max-w-md text-lg text-background/70 text-balance">
                    Alătură-te comunității CIVICOM✨ și contribuie la o Românie mai bună.
                </p>
                <div className="mt-8 flex flex-wrap justify-center gap-4">

                    {/* Buton Principal - Contrast maxim, ring fin la hover și icon animat */}
                    <Link
                        href="/inregistrare"
                        className={cn(
                            buttonVariants({ size: 'lg' }),
                            'group bg-background text-foreground font-bold transition-all duration-300 hover:bg-background/90 hover:ring-4 hover:ring-background/20 hover:text-primary-foreground'
                        )}
                    >
                        Creează un cont
                        <ArrowRight className="ml-2 size-4 transition-transform group-hover:translate-x-1" />
                    </Link>

                    {/* Buton Secundar - Efect de sticlă (Glassmorphism), subtil dar elegant */}
                    <Link
                        href="/evenimente"
                        className={cn(
                            buttonVariants({ variant: 'outline', size: 'lg' }),
                            'border-background/50 bg-transparent text-background  duration-300 transition-all font-bold hover:text-foreground hover:bg-background/90 hover:ring-4 hover:ring-background/20'
                        )}
                    >
                        Explorează evenimente
                    </Link>

                </div>
            </div>
        </section>
    )
}