'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function completeEvent(
  eventId: string
): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Neautentificat' }

  const { data: userData } = await supabase
    .from('users')
    .select('id')
    .eq('auth_users_id', user.id)
    .single()
  if (!userData) return { error: 'Utilizator negăsit' }

  const { data: evtRaw } = await supabase
    .from('events')
    .select('id, title, creator_id, status')
    .eq('id', eventId)
    .single()
  if (!evtRaw) return { error: 'Eveniment negăsit' }

  const evt = evtRaw as { id: string; title: string; creator_id: string; status: string }
  if (evt.creator_id !== (userData as any).id) return { error: 'Acces interzis' }
  if (evt.status !== 'approved') return { error: 'Evenimentul nu poate fi finalizat în starea curentă' }

  const admin = createAdminClient()

  const { error: updateError } = await admin
    .from('events')
    .update({ status: 'completed' })
    .eq('id', eventId)
  if (updateError) {
    console.error('[completeEvent] update', updateError.message)
    return { error: 'Eroare la finalizare' }
  }

  const { data: participants } = await admin
    .from('event_participants')
    .select('user_id')
    .eq('event_id', eventId)
    .eq('status', 'joined')

  if (participants && participants.length > 0) {
    await admin.from('notifications').insert(
      (participants as { user_id: string }[]).map(p => ({
        user_id: p.user_id,
        title: 'Eveniment finalizat',
        message: `Evenimentul "${evt.title}" a fost finalizat. Lasă-ne feedback!`,
        type: 'event_completed',
      }))
    )
  }

  return { ok: true }
}
