'use server'

import { createClient } from '@/lib/supabase/server'

export type RecentSigner = {
    id: string
    user_id: string
    name: string
    avatar_url: string | null
    signed_at: string
}

export async function getRecentSigners(eventId: string, limit = 5): Promise<RecentSigner[]> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('petition_signatures')
        .select('id, user_id, joined_at, user:users!user_id(name, avatar_url)')
        .eq('event_id', eventId)
        .order('joined_at', { ascending: false })
        .limit(limit)

    if (error) console.error('[getRecentSigners]', error.message)

    return (data ?? []).map((row: any) => ({
        id: row.id,
        user_id: row.user_id,
        name: row.user?.name ?? 'Anonim',
        avatar_url: row.user?.avatar_url ?? null,
        signed_at: row.joined_at,
    }))
}

type PetitionEventBase = {
  title: string
  description: string
  banner_url: string | null
  gallery_urls: string[]
  organization_id?: string | null
}

type PetitionData = {
  what_is_requested: string
  requested_from: string
  target_signatures: number
  why_important: string
  contact_person?: string | null
}

export async function createPetition(
  eventBase: PetitionEventBase,
  petitionData: PetitionData
): Promise<{ id: string } | { error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Neautentificat' }

  const { data: userData } = await supabase.from('users').select('id').eq('auth_users_id', user.id).single()
  if (!userData) return { error: 'Utilizator negăsit' }

  const creatorType = eventBase.organization_id ? 'ngo' : 'user'

  const { data: evt, error: evtErr } = await supabase.from('events').insert({
    title: eventBase.title,
    description: eventBase.description,
    banner_url: eventBase.banner_url,
    gallery_urls: eventBase.gallery_urls,
    category: 'petition',
    subcategory: null,
    status: 'pending',
    creator_id: userData.id,
    creator_type: creatorType,
    organization_id: eventBase.organization_id ?? null,
  }).select('id').single()

  if (evtErr || !evt) return { error: evtErr?.message ?? 'Eroare creare eveniment' }

  const { error: petErr } = await supabase.from('petitions').insert({
    event_id: evt.id,
    what_is_requested: petitionData.what_is_requested,
    requested_from: petitionData.requested_from,
    target_signatures: petitionData.target_signatures,
    why_important: petitionData.why_important,
    contact_person: petitionData.contact_person ?? null,
  })

  if (petErr) return { error: petErr.message }
  return { id: evt.id }
}
