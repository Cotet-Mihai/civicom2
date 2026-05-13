import type { Metadata } from 'next'
import Link from 'next/link'
import { PenLine, FileText } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { getUserPetitionsSigned } from '@/services/user.service'
import { DashboardEventRow } from '@/components/shared/DashboardEventRow'

export const metadata: Metadata = { title: 'Petiții semnate — CIVICOM' }

export default async function PanouPetitiiPage() {
  const petitions = await getUserPetitionsSigned()

  return (
    <div className="relative min-h-screen animate-fade-in-up">

      <div className="pointer-events-none absolute inset-0 overflow-hidden -z-10">
        <div className="absolute -left-1/4 top-0 h-[400px] w-[400px] rounded-full bg-primary/5 blur-[100px]" />
      </div>

      <div className="px-4 lg:px-8 py-8 pb-16 space-y-10">

        <div className="flex flex-col gap-2 border-b border-border/50 pb-6">
          <h1 className="font-heading text-3xl font-black uppercase tracking-tighter text-foreground md:text-4xl">
            Petiții <span className="text-primary">Semnate</span>
          </h1>
          <p className="text-base text-muted-foreground">
            Petițiile la care ți-ai adăugat semnătura.
          </p>
        </div>

        <Card className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300 hover:border-primary/40 hover:shadow-md">
          <CardContent className="flex flex-1 flex-col p-6 gap-4">

            <div className="flex items-center gap-2 border-b border-border/50 pb-3">
              <PenLine className="size-4 text-primary" />
              <h2 className="font-heading text-lg font-bold tracking-tight text-foreground">
                {petitions.length > 0 ? `${petitions.length} petiții semnate` : 'Petiții semnate'}
              </h2>
            </div>

            {petitions.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center py-16 text-center">
                <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground/70">
                  <FileText size={26} />
                </div>
                <h3 className="mb-1 font-bold text-foreground">Nicio petiție semnată</h3>
                <p className="mb-6 text-sm text-muted-foreground">
                  Nu ai semnat nicio petiție până acum.
                </p>
                <Link
                  href="/evenimente"
                  className={`${buttonVariants({ variant: 'outline' })} font-bold transition-all hover:bg-primary/5 hover:text-primary hover:border-primary/50`}
                >
                  Explorează petiții
                </Link>
              </div>
            ) : (
              <div className="flex flex-col divide-y divide-border/50">
                {petitions.map(event => (
                  <div key={event.id} className="py-2">
                    <DashboardEventRow event={event} showStatus={false} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
