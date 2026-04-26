'use server'

import { createClient } from '@/lib/supabase/server'

type EventBase = {
  title: string
  description: string
  banner_url: string | null
  gallery_urls: string[]
  subcategory: 'gathering' | 'march' | 'picket'
  organization_id?: string | null
}

type ProtestData = {
  date: string
  time_start: string
  time_end?: string | null
  max_participants: number
  recommended_equipment?: string | null
  safety_rules?: string | null
  contact_person?: string | null
}

type GatheringData = { location: [number, number] }
type MarchData = { locations: [number, number][] }
type PicketData = { location: [number, number] }

type SubtypeData = GatheringData | MarchData | PicketData

export async function createProtest(
  eventBase: EventBase,
  protestData: ProtestData,
  subtypeData: SubtypeData
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
    category: 'protest',
    subcategory: eventBase.subcategory,
    status: 'pending',
    creator_id: userData.id,
    creator_type: creatorType,
    organization_id: eventBase.organization_id ?? null,
  }).select('id').single()

  if (evtErr || !evt) return { error: evtErr?.message ?? 'Eroare creare eveniment' }

  const { data: pr, error: prErr } = await supabase.from('protests').insert({
    event_id: evt.id,
    date: protestData.date,
    time_start: protestData.time_start,
    time_end: protestData.time_end ?? null,
    max_participants: protestData.max_participants,
    recommended_equipment: protestData.recommended_equipment ?? null,
    safety_rules: protestData.safety_rules ?? null,
    contact_person: protestData.contact_person ?? null,
  }).select('id').single()

  if (prErr || !pr) return { error: prErr?.message ?? 'Eroare creare protest' }

  if (eventBase.subcategory === 'gathering') {
    const d = subtypeData as GatheringData
    const { error: stErr } = await supabase.from('gatherings').insert({ protest_id: pr.id, location: d.location })
    if (stErr) return { error: stErr.message }
  } else if (eventBase.subcategory === 'march') {
    const d = subtypeData as MarchData
    const { error: stErr } = await supabase.from('marches').insert({ protest_id: pr.id, locations: d.locations })
    if (stErr) return { error: stErr.message }
  } else {
    const d = subtypeData as PicketData
    const { error: stErr } = await supabase.from('pickets').insert({ protest_id: pr.id, location: d.location })
    if (stErr) return { error: stErr.message }
  }

  return { id: evt.id }
}
