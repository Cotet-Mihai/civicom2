'use server'

import { createClient } from '@/lib/supabase/server'

type EventBase = {
  title: string
  description: string
  banner_url: string | null
  gallery_urls: string[]
  subcategory: 'outdoor' | 'donations' | 'workshop'
  organization_id?: string | null
}

type CommunityData = { contact_person?: string | null }

type OutdoorData = {
  location: [number, number]
  date: string; time_start: string; time_end?: string | null
  max_participants?: number | null
  recommended_equipment?: string | null
  what_organizer_offers?: string | null
}

type DonationData = {
  donation_type: 'material' | 'monetary'
  what_is_needed?: string[] | null
  target_amount?: number | null
}

type WorkshopData = {
  location: [number, number]
  date: string; time_start: string; time_end?: string | null
  max_participants?: number | null
  recommended_equipment?: string | null
  what_organizer_offers?: string | null
}

type SubtypeData = OutdoorData | DonationData | WorkshopData

export async function createCommunityActivity(
  eventBase: EventBase,
  communityData: CommunityData,
  subtypeData: SubtypeData
): Promise<{ id: string } | { error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Neautentificat' }

  const { data: userData } = await supabase.from('users').select('id').eq('auth_users_id', user.id).single()
  if (!userData) return { error: 'Utilizator negăsit' }

  const { data: evt, error: evtErr } = await supabase.from('events').insert({
    title: eventBase.title, description: eventBase.description,
    banner_url: eventBase.banner_url, gallery_urls: eventBase.gallery_urls,
    category: 'community', subcategory: eventBase.subcategory, status: 'pending',
    creator_id: userData.id,
    creator_type: eventBase.organization_id ? 'ngo' : 'user',
    organization_id: eventBase.organization_id ?? null,
  }).select('id').single()
  if (evtErr || !evt) return { error: evtErr?.message ?? 'Eroare creare eveniment' }

  const { data: ca, error: caErr } = await supabase.from('community_activities').insert({
    event_id: evt.id, contact_person: communityData.contact_person ?? null,
  }).select('id').single()
  if (caErr || !ca) return { error: caErr?.message ?? 'Eroare creare activitate' }

  if (eventBase.subcategory === 'outdoor') {
    const d = subtypeData as OutdoorData
    await supabase.from('outdoor_activities').insert({ community_activity_id: ca.id, location: d.location, date: d.date, time_start: d.time_start, time_end: d.time_end ?? null, max_participants: d.max_participants ?? null, recommended_equipment: d.recommended_equipment ?? null, what_organizer_offers: d.what_organizer_offers ?? null })
  } else if (eventBase.subcategory === 'donations') {
    const d = subtypeData as DonationData
    await supabase.from('donations').insert({ community_activity_id: ca.id, donation_type: d.donation_type, what_is_needed: d.what_is_needed ?? null, target_amount: d.target_amount ?? null })
  } else {
    const d = subtypeData as WorkshopData
    await supabase.from('workshops').insert({ community_activity_id: ca.id, location: d.location, date: d.date, time_start: d.time_start, time_end: d.time_end ?? null, max_participants: d.max_participants ?? null, recommended_equipment: d.recommended_equipment ?? null, what_organizer_offers: d.what_organizer_offers ?? null })
  }

  return { id: evt.id }
}
