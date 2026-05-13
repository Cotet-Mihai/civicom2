import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getOrganizationById, getOrgMemberRole } from '@/services/organization.service'
import { OngSettingsFormClient } from './_components/OngSettingsFormClient'

export const metadata: Metadata = { title: 'Setări ONG — CIVICOM' }

type PageProps = { params: Promise<{ id: string }> }

export default async function OrgSetariPage({ params }: PageProps) {
  const { id } = await params
  const [org, role] = await Promise.all([
    getOrganizationById(id),
    getOrgMemberRole(id),
  ])

  if (role !== 'admin') redirect(`/organizatie/${id}/panou`)
  if (!org) redirect('/panou')

  return (
    <div className="relative min-h-screen animate-fade-in-up">

      <div className="pointer-events-none absolute inset-0 overflow-hidden -z-10">
        <div className="absolute -left-1/4 top-0 h-[400px] w-[400px] rounded-full bg-primary/5 blur-[100px]" />
      </div>

      <div className="px-4 lg:px-8 py-8 pb-16 space-y-10">

        <div className="flex flex-col gap-2 border-b border-border/50 pb-6">
          <h1 className="font-heading text-3xl font-black uppercase tracking-tighter text-foreground md:text-4xl">
            Setări <span className="text-primary">ONG</span>
          </h1>
          <p className="text-base text-muted-foreground">
            Configurează profilul și informațiile organizației tale.
          </p>
        </div>

        <OngSettingsFormClient org={org} />

      </div>
    </div>
  )
}
