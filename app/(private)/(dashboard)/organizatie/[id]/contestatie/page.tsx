import type { Metadata } from 'next'
import { redirect, notFound } from 'next/navigation'
import { getOrganizationById } from '@/services/organization.service'
import { OrgAppealFormClient } from './_components/OrgAppealFormClient'

export const metadata: Metadata = { title: 'Contestație ONG — CIVICOM' }

type PageProps = { params: Promise<{ id: string }> }

export default async function OrgContestatiePage({ params }: PageProps) {
  const { id } = await params
  const org = await getOrganizationById(id)
  if (!org) notFound()
  if (org.status !== 'rejected') redirect(`/organizatie/${id}/panou`)

  return (
    <div className="px-4 lg:px-8 py-8 max-w-2xl animate-fade-in-up">
      <div className="flex flex-col gap-2 border-b border-border/50 pb-6 mb-8">
        <h1 className="font-heading text-3xl font-black uppercase tracking-tighter text-foreground md:text-4xl">
          Contestează <span className="text-primary">decizia</span>
        </h1>
        <p className="text-base text-muted-foreground">
          Explică de ce consideri că organizația <strong>{org.name}</strong> a fost respinsă incorect.
        </p>
        {org.rejection_note && (
          <div className="mt-2 rounded-xl border border-destructive/20 bg-destructive/5 p-3">
            <p className="text-xs font-black uppercase tracking-widest text-destructive mb-1">Motiv respingere</p>
            <p className="text-sm text-foreground">{org.rejection_note}</p>
          </div>
        )}
      </div>

      <OrgAppealFormClient orgId={id} orgName={org.name} />
    </div>
  )
}
