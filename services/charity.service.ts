'use server'

import { createClient } from '@/lib/supabase/server'

type EventBase = {
  title: string; description: string
  banner_url: string | null; gallery_urls: string[]
  subcategory: 'concert' | 'meet_greet' | 'livestream' | 'sport'
  organization_id?: string | null
}

type CharityMeta = { target_amount?: number | null; collected_amount?: number | null }

type ConcertData = { location: [number, number]; date: string; time_start: string; time_end?: string | null; performers: string[]; ticket_price?: number | null; ticket_link?: string | null; max_participants?: number | null }
type MeetGreetData = { location: [number, number]; date: string; time_start: string; time_end?: string | null; guests: string[]; ticket_price?: number | null; ticket_link?: string | null; max_participants?: number | null }
type LivestreamData = { stream_link: string; cause: string; time_start: string; time_end?: string | null; guests?: string[] | null }
type SportData = { location: [number, number]; date: string; time_start: string; time_end?: string | null; guests?: string[] | null; ticket_price?: number | null; ticket_link?: string | null; max_participants?: number | null }

type SubtypeData = ConcertData | MeetGreetData | LivestreamData | SportData

export async function createCharityEvent(
  eventBase: EventBase,
  charityMeta: CharityMeta,
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
    category: 'charity', subcategory: eventBase.subcategory, status: 'pending',
    creator_id: userData.id,
    creator_type: eventBase.organization_id ? 'ngo' : 'user',
    organization_id: eventBase.organization_id ?? null,
  }).select('id').single()
  if (evtErr || !evt) return { error: evtErr?.message ?? 'Eroare creare eveniment' }

  const { data: ce, error: ceErr } = await supabase.from('charity_events').insert({
    event_id: evt.id,
    target_amount: charityMeta.target_amount ?? null,
    collected_amount: charityMeta.collected_amount ?? 0,
  }).select('id').single()
  if (ceErr || !ce) return { error: ceErr?.message ?? 'Eroare creare charity' }

  if (eventBase.subcategory === 'concert') {
    const d = subtypeData as ConcertData
    const { error: stErr } = await supabase.from('charity_concerts').insert({ charity_event_id: ce.id, location: d.location, date: d.date, time_start: d.time_start, time_end: d.time_end ?? null, performers: d.performers, ticket_price: d.ticket_price ?? null, ticket_link: d.ticket_link ?? null, max_participants: d.max_participants ?? null })
    if (stErr) return { error: stErr.message }
  } else if (eventBase.subcategory === 'meet_greet') {
    const d = subtypeData as MeetGreetData
    const { error: stErr } = await supabase.from('meet_greets').insert({ charity_event_id: ce.id, location: d.location, date: d.date, time_start: d.time_start, time_end: d.time_end ?? null, guests: d.guests, ticket_price: d.ticket_price ?? null, ticket_link: d.ticket_link ?? null, max_participants: d.max_participants ?? null })
    if (stErr) return { error: stErr.message }
  } else if (eventBase.subcategory === 'livestream') {
    const d = subtypeData as LivestreamData
    const { error: stErr } = await supabase.from('charity_livestreams').insert({ charity_event_id: ce.id, stream_link: d.stream_link, cause: d.cause, time_start: d.time_start, time_end: d.time_end ?? null, guests: d.guests ?? null })
    if (stErr) return { error: stErr.message }
  } else {
    const d = subtypeData as SportData
    const { error: stErr } = await supabase.from('sports_activities').insert({ charity_event_id: ce.id, location: d.location, date: d.date, time_start: d.time_start, time_end: d.time_end ?? null, guests: d.guests ?? null, ticket_price: d.ticket_price ?? null, ticket_link: d.ticket_link ?? null, max_participants: d.max_participants ?? null })
    if (stErr) return { error: stErr.message }
  }

  return { id: evt.id }
}
