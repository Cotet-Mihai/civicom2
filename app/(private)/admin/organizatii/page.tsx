import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { Building2, ArrowRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getPendingOrgs } from '@/services/admin.service'
import { AdminTabsClient } from '../_components/AdminTabsClient'
import { AdminOrgActionBarClient } from './_components/AdminOrgActionBarClient'

export const metadata: Metadata = { title: 'Admin — Organizații în așteptare' }

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('ro-RO', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default async function AdminOrganizatiiPage() {
  const orgs = await getPendingOrgs()

  return (
    <div className="mx-auto max-w-7xl px-4 lg:px-8 py-8 space-y-6">
      <h1 className="text-2xl font-black tracking-tight text-foreground">Admin</h1>
      <AdminTabsClient />

      <div className="space-y-4">
        {orgs.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">Nicio organizație în așteptare.</p>
        ) : (
          orgs.map(org => (
            <Card key={org.id} className="shadow-sm shadow-black/5 border-border">
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  {org.logo_url ? (
                    <div className="relative size-12 rounded-lg overflow-hidden border border-border shrink-0">
                      <Image src={org.logo_url} alt={org.name} fill className="object-cover" unoptimized />
                    </div>
                  ) : (
                    <div className="size-12 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                      <Building2 size={20} className="text-primary" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-black text-foreground text-base">{org.name}</p>
                      {org.is_edited && (
                        <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200">
                          Editat
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Owner: {org.owner_name} · {formatDate(org.created_at)}
                    </p>
                    {org.description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{org.description}</p>
                    )}
                    <div className="flex items-start justify-between gap-3 mt-3">
                      <AdminOrgActionBarClient
                        orgId={org.id}
                        currentStatus={org.status}
                        rejectionNote={org.rejection_note}
                      />
                      <Link href={`/admin/organizatii/${org.id}`} className="shrink-0">
                        <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                          Vezi detalii
                          <ArrowRight size={13} />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
