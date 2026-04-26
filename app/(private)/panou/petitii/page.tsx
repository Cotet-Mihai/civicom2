import type { Metadata } from 'next'
import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { getUserPetitionsSigned } from '@/services/user.service'
import { DashboardEventRow } from '@/components/shared/DashboardEventRow'
import { PanouTabsClient } from '../_components/PanouTabsClient'

export const metadata: Metadata = { title: 'Petiții semnate' }

export default async function PanouPetitiiPage() {
  const petitions = await getUserPetitionsSigned()

  return (
    <div className="mx-auto max-w-7xl px-4 lg:px-8 py-8 space-y-6">
      <h1 className="text-2xl font-black tracking-tight text-foreground">Panou</h1>
      <PanouTabsClient />
      <div className="space-y-1">
        {petitions.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <p className="text-muted-foreground">Nu ai semnat nicio petiție.</p>
            <Link href="/evenimente" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
              Explorează petiții
            </Link>
          </div>
        ) : (
          petitions.map(event => (
            <DashboardEventRow key={event.id} event={event} showStatus={false} />
          ))
        )}
      </div>
    </div>
  )
}
