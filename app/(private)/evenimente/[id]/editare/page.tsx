import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getEventForEdit } from '@/services/edit.service'
import { EditEventFormClient } from './_components/EditEventFormClient'

export const metadata: Metadata = { title: 'Editează eveniment — CIVICOM' }

type Props = { params: Promise<{ id: string }> }

export default async function EditarePage({ params }: Props) {
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

  const data = await getEventForEdit(id)
  if (!data) notFound()

  if (data.base.creator_id !== (userRow as any).id) notFound()
  if (data.base.status === 'completed') redirect('/panou/evenimente')

  return (
    <div className="mx-auto max-w-2xl px-4 lg:px-8 py-8 space-y-8">
      <div className="flex items-center gap-3">
        <Link href="/panou/evenimente" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-xl font-black tracking-tight text-foreground">Editează eveniment</h1>
      </div>

      <EditEventFormClient
        eventId={id}
        data={data}
        authUserId={user.id}
      />
    </div>
  )
}
