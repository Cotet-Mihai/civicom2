'use server'

import { createClient } from '@/lib/supabase/server'

async function getUserId(): Promise<string | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('users').select('id').eq('auth_users_id', user.id).single()
  return data?.id ?? null
}

export async function getParticipationStatus(eventId: string): Promise<'joined' | 'cancelled' | null> {
  const supabase = await createClient()
  const userId = await getUserId()
  if (!userId) return null

  const { data } = await supabase
    .from('event_participants')
    .select('status')
    .eq('event_id', eventId)
    .eq('user_id', userId)
    .maybeSingle()

  const s = data?.status
  if (s === 'joined' || s === 'cancelled') return s
  return null
}

export async function joinEvent(eventId: string): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient()
  const userId = await getUserId()
  if (!userId) return { error: 'Trebuie să fii autentificat pentru a participa' }

  const { error } = await supabase
    .from('event_participants')
    .upsert(
      { event_id: eventId, user_id: userId, status: 'joined' },
      { onConflict: 'event_id,user_id' }
    )

  if (error) return { error: error.message }
  return { ok: true }
}

export async function leaveEvent(eventId: string): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient()
  const userId = await getUserId()
  if (!userId) return { error: 'Trebuie să fii autentificat' }

  const { error } = await supabase
    .from('event_participants')
    .update({ status: 'cancelled' })
    .eq('event_id', eventId)
    .eq('user_id', userId)
    .eq('status', 'joined')

  if (error) return { error: error.message }
  return { ok: true }
}

export async function getSignatureStatus(eventId: string): Promise<boolean> {
  const supabase = await createClient()
  const userId = await getUserId()
  if (!userId) return false

  const { data } = await supabase
    .from('petition_signatures')
    .select('id')
    .eq('event_id', eventId)
    .eq('user_id', userId)
    .maybeSingle()

  return !!data
}

export async function signPetition(eventId: string): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient()
  const userId = await getUserId()
  if (!userId) return { error: 'Trebuie să fii autentificat pentru a semna' }

  const { error } = await supabase
    .from('petition_signatures')
    .insert({ event_id: eventId, user_id: userId })

  // 23505 = unique_violation (already signed) — treat as success
  if (error && error.code !== '23505') return { error: error.message }
  return { ok: true }
}
