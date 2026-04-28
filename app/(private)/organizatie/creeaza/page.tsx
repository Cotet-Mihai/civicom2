import type { Metadata } from 'next'
import { Building2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { OngCreateFormClient } from './_components/OngCreateFormClient'

export const metadata: Metadata = { title: 'Creează organizație' }

export default function OrganizatieCreeazaPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 lg:px-8 py-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="size-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
          <Building2 size={20} className="text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">Creează organizație</h1>
          <p className="text-sm text-muted-foreground">Organizația va fi verificată de echipa CIVICOM✨</p>
        </div>
      </div>

      <Card className="shadow-sm shadow-black/5 border-border">
        <CardContent className="p-6">
          <OngCreateFormClient />
        </CardContent>
      </Card>
    </div>
  )
}
