import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft, AlertTriangle } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { AppealFormClient } from './_components/AppealFormClient'

export const metadata: Metadata = { title: 'Contestație eveniment' }

type Props = { params: Promise<{ id: string }> }

export default async function ContestatiePage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/autentificare')

  const { data: userRow } = await supabase
    .from('users')
    .select('id')
    .eq('auth_users_id', user.id)
    .single()
  if (!userRow) redirect('/autentificare')

  const { data: evt } = await supabase
    .from('events')
    .select('id, title, status, rejection_note, creator_id')
    .eq('id', id)
    .single()

  if (!evt) notFound()
  if (evt.creator_id !== userRow.id) notFound()
  if (evt.status !== 'rejected') redirect('/panou/evenimente')

  return (
    <div className="mx-auto max-w-2xl px-4 lg:px-8 py-8 space-y-8">
      <div className="flex items-center gap-3">
        <Link href="/panou/evenimente" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-xl font-black tracking-tight text-foreground">Contestație eveniment</h1>
      </div>

      <div className="rounded-xl border border-border bg-card p-5 space-y-3">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Eveniment respins</h3>
        <p className="font-semibold text-foreground">{evt.title}</p>
        {evt.rejection_note && (
          <div className="flex items-start gap-2 rounded-lg bg-destructive/5 border border-destructive/20 p-3">
            <AlertTriangle size={14} className="text-destructive mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-destructive mb-0.5">Motiv respingere</p>
              <p className="text-sm text-muted-foreground">{evt.rejection_note}</p>
            </div>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div>
          <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">
            Trimite contestație
          </h3>
          <p className="text-sm text-muted-foreground">
            Explică de ce evenimentul tău ar trebui reconsiderat. Contestația va fi analizată de echipa de moderare.
          </p>
        </div>
        <AppealFormClient eventId={id} />
      </div>
    </div>
  )
}
