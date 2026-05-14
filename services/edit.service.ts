'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// ============================================================
// TYPES
// ============================================================

export type EditEventBase = {
  id: string
  title: string
  description: string
  banner_url: string | null
  gallery_urls: string[]
  status: string
  category: string
  subcategory: string | null
  creator_id: string
}

export type EditEventData =
  | { kind: 'protest'; base: EditEventBase; date: string; time_start: string; time_end: string | null; max_participants: number; safety_rules: string | null; recommended_equipment: string | null; contact_person: string | null }
  | { kind: 'petition'; base: EditEventBase; target_signatures: number; what_is_requested: string; requested_from: string; why_important: string; contact_person: string | null }
  | { kind: 'boycott'; base: EditEventBase; reason: string; method: string; brands: { name: string; link: string | null }[] }
  | { kind: 'community'; base: EditEventBase; date: string | null; time_start: string | null; time_end: string | null; what_organizer_offers: string | null; donation_type: string | null; target_amount: number | null; what_is_needed: string[] | null; contact_person: string | null }
  | { kind: 'charity'; base: EditEventBase; date: string | null; time_start: string | null; target_amount: number | null; cause: string | null; performers: string[] | null; guests: string[] | null; stream_link: string | null }

type UpdateCommon = {
  title: string
  description: string
  banner_url: string | null
  gallery_urls: string[]
}

export type UpdateEventPayload =
  | (UpdateCommon & { kind: 'protest'; date: string; time_start: string; time_end: string | null; max_participants: number; safety_rules: string | null; recommended_equipment: string | null; contact_person: string | null })
  | (UpdateCommon & { kind: 'petition'; target_signatures: number; what_is_requested: string; requested_from: string; why_important: string; contact_person: string | null })
  | (UpdateCommon & { kind: 'boycott'; reason: string; method: string })
  | (UpdateCommon & { kind: 'community'; contact_person: string | null; date: string | null; time_start: string | null; time_end: string | null; what_organizer_offers: string | null; target_amount: number | null; what_is_needed: string[] | null })
  | (UpdateCommon & { kind: 'charity'; target_amount: number | null; date: string | null; time_start: string | null; cause: string | null; performers: string[] | null; guests: string[] | null; stream_link: string | null })

// ============================================================
// HELPERS
// ============================================================

async function getUserId(supabase: Awaited<ReturnType<typeof createClient>>): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('users').select('id').eq('auth_users_id', user.id).single()
  return data?.id ?? null
}

// ============================================================
// READ
// ============================================================

export async function getEventForEdit(id: string): Promise<EditEventData | null> {
  const supabase = await createClient()

  const { data: evtRaw } = await supabase
    .from('events')
    .select('id, title, description, category, subcategory, status, creator_id, banner_url, gallery_urls')
    .eq('id', id)
    .single()

  if (!evtRaw) return null

  const base: EditEventBase = {
    id: evtRaw.id,
    title: evtRaw.title,
    description: evtRaw.description ?? '',
    banner_url: evtRaw.banner_url ?? null,
    gallery_urls: (evtRaw.gallery_urls as string[]) ?? [],
    status: evtRaw.status,
    category: evtRaw.category,
    subcategory: evtRaw.subcategory ?? null,
    creator_id: evtRaw.creator_id,
  }

  const { category, subcategory } = base

  if (category === 'protest') {
    const { data: p } = await supabase
      .from('protests')
      .select('date, time_start, time_end, max_participants, safety_rules, recommended_equipment, contact_person')
      .eq('event_id', id)
      .single()
    if (!p) return null
    return {
      kind: 'protest', base,
      date: (p as any).date,
      time_start: (p as any).time_start,
      time_end: (p as any).time_end ?? null,
      max_participants: (p as any).max_participants,
      safety_rules: (p as any).safety_rules ?? null,
      recommended_equipment: (p as any).recommended_equipment ?? null,
      contact_person: (p as any).contact_person ?? null,
    }
  }

  if (category === 'petition') {
    const { data: p } = await supabase
      .from('petitions')
      .select('target_signatures, what_is_requested, requested_from, why_important, contact_person')
      .eq('event_id', id)
      .single()
    if (!p) return null
    return {
      kind: 'petition', base,
      target_signatures: (p as any).target_signatures,
      what_is_requested: (p as any).what_is_requested,
      requested_from: (p as any).requested_from,
      why_important: (p as any).why_important,
      contact_person: (p as any).contact_person ?? null,
    }
  }

  if (category === 'boycott') {
    const { data: b } = await supabase
      .from('boycotts')
      .select('reason, method, boycott_brands(name, link)')
      .eq('event_id', id)
      .single()
    if (!b) return null
    return {
      kind: 'boycott', base,
      reason: (b as any).reason,
      method: (b as any).method,
      brands: ((b as any).boycott_brands ?? []).map((br: any) => ({ name: br.name, link: br.link ?? null })),
    }
  }

  if (category === 'community') {
    const { data: ca } = await supabase
      .from('community_activities')
      .select('id, contact_person')
      .eq('event_id', id)
      .single()
    if (!ca) return null

    let date: string | null = null
    let time_start: string | null = null
    let time_end: string | null = null
    let what_organizer_offers: string | null = null
    let donation_type: string | null = null
    let target_amount: number | null = null
    let what_is_needed: string[] | null = null

    if (subcategory === 'outdoor') {
      const { data: oa } = await supabase
        .from('outdoor_activities')
        .select('date, time_start, time_end, what_organizer_offers')
        .eq('community_activity_id', (ca as any).id)
        .single()
      if (oa) {
        date = (oa as any).date; time_start = (oa as any).time_start
        time_end = (oa as any).time_end ?? null; what_organizer_offers = (oa as any).what_organizer_offers ?? null
      }
    } else if (subcategory === 'donation') {
      const { data: don } = await supabase
        .from('donations')
        .select('donation_type, target_amount, what_is_needed')
        .eq('community_activity_id', (ca as any).id)
        .single()
      if (don) {
        donation_type = (don as any).donation_type
        target_amount = (don as any).target_amount ?? null
        what_is_needed = (don as any).what_is_needed ?? null
      }
    } else if (subcategory === 'workshop') {
      const { data: ws } = await supabase
        .from('workshops')
        .select('date, time_start, time_end, what_organizer_offers')
        .eq('community_activity_id', (ca as any).id)
        .single()
      if (ws) {
        date = (ws as any).date; time_start = (ws as any).time_start
        time_end = (ws as any).time_end ?? null; what_organizer_offers = (ws as any).what_organizer_offers ?? null
      }
    }

    return {
      kind: 'community', base,
      date, time_start, time_end, what_organizer_offers,
      donation_type, target_amount, what_is_needed,
      contact_person: (ca as any).contact_person ?? null,
    }
  }

  if (category === 'charity') {
    const { data: ce } = await supabase
      .from('charity_events')
      .select('id, target_amount')
      .eq('event_id', id)
      .single()
    if (!ce) return null

    let date: string | null = null
    let time_start: string | null = null
    let cause: string | null = null
    let performers: string[] | null = null
    let guests: string[] | null = null
    let stream_link: string | null = null

    if (subcategory === 'concert') {
      const { data: cc } = await supabase
        .from('charity_concerts')
        .select('date, time_start, performers')
        .eq('charity_event_id', (ce as any).id)
        .single()
      if (cc) { date = (cc as any).date; time_start = (cc as any).time_start; performers = (cc as any).performers ?? null }
    } else if (subcategory === 'meet_greet') {
      const { data: mg } = await supabase
        .from('meet_greets')
        .select('date, time_start, guests')
        .eq('charity_event_id', (ce as any).id)
        .single()
      if (mg) { date = (mg as any).date; time_start = (mg as any).time_start; guests = (mg as any).guests ?? null }
    } else if (subcategory === 'livestream') {
      const { data: ls } = await supabase
        .from('charity_livestreams')
        .select('cause, time_start, stream_link')
        .eq('charity_event_id', (ce as any).id)
        .single()
      if (ls) { cause = (ls as any).cause; time_start = (ls as any).time_start; stream_link = (ls as any).stream_link ?? null }
    } else if (subcategory === 'sport') {
      const { data: sa } = await supabase
        .from('sports_activities')
        .select('date, time_start, guests')
        .eq('charity_event_id', (ce as any).id)
        .single()
      if (sa) { date = (sa as any).date; time_start = (sa as any).time_start; guests = (sa as any).guests ?? null }
    }

    return {
      kind: 'charity', base,
      date, time_start, target_amount: (ce as any).target_amount ?? null,
      cause, performers, guests, stream_link,
    }
  }

  return null
}

// ============================================================
// HELPERS
// ============================================================

function buildSnapshot(data: EditEventData): Record<string, unknown> {
  const snap: Record<string, unknown> = {
    title: data.base.title,
    description: data.base.description,
    banner_url: data.base.banner_url,
    gallery_urls: data.base.gallery_urls,
  }
  if (data.kind === 'protest') {
    Object.assign(snap, {
      date: data.date, time_start: data.time_start, time_end: data.time_end,
      max_participants: data.max_participants, safety_rules: data.safety_rules,
      recommended_equipment: data.recommended_equipment, contact_person: data.contact_person,
    })
  } else if (data.kind === 'petition') {
    Object.assign(snap, {
      target_signatures: data.target_signatures, what_is_requested: data.what_is_requested,
      requested_from: data.requested_from, why_important: data.why_important,
      contact_person: data.contact_person,
    })
  } else if (data.kind === 'boycott') {
    Object.assign(snap, { reason: data.reason, method: data.method, brands: data.brands })
  } else if (data.kind === 'community') {
    Object.assign(snap, {
      date: data.date, time_start: data.time_start, time_end: data.time_end,
      what_organizer_offers: data.what_organizer_offers, donation_type: data.donation_type,
      target_amount: data.target_amount, what_is_needed: data.what_is_needed,
      contact_person: data.contact_person,
    })
  } else if (data.kind === 'charity') {
    Object.assign(snap, {
      date: data.date, time_start: data.time_start, target_amount: data.target_amount,
      cause: data.cause, performers: data.performers, guests: data.guests,
      stream_link: data.stream_link,
    })
  }
  return snap
}

// ============================================================
// WRITE
// ============================================================

export async function updateEvent(
  eventId: string,
  payload: UpdateEventPayload
): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient()
  const userId = await getUserId(supabase)
  if (!userId) return { error: 'Neautorizat' }

  const { data: evtRaw } = await supabase
    .from('events')
    .select('id, creator_id, status, category, subcategory')
    .eq('id', eventId)
    .single()

  if (!evtRaw) return { error: 'Eveniment negăsit' }
  if ((evtRaw as any).creator_id !== userId) return { error: 'Acces interzis' }
  if ((evtRaw as any).status === 'completed') return { error: 'Evenimentele finalizate nu pot fi editate' }

  const currentStatus = (evtRaw as any).status as string
  const isRejected = currentStatus === 'rejected'

  const currentData = await getEventForEdit(eventId)
  const snapshot = currentData ? buildSnapshot(currentData) : null

  const admin = createAdminClient()
  const { error: evtErr } = await admin
    .from('events')
    .update({
      title: payload.title,
      description: payload.description,
      banner_url: payload.banner_url,
      gallery_urls: payload.gallery_urls,
      ...(isRejected ? { status: 'pending', rejection_note: null } : {}),
      is_edited: true,
      previous_snapshot: snapshot,
    })
    .eq('id', eventId)

  if (evtErr) return { error: evtErr.message }

  if (payload.kind === 'protest') {
    const { error } = await supabase
      .from('protests')
      .update({
        date: payload.date,
        time_start: payload.time_start,
        time_end: payload.time_end,
        max_participants: payload.max_participants,
        safety_rules: payload.safety_rules,
        recommended_equipment: payload.recommended_equipment,
        contact_person: payload.contact_person,
      })
      .eq('event_id', eventId)
    if (error) return { error: error.message }
  }

  else if (payload.kind === 'petition') {
    const { error } = await supabase
      .from('petitions')
      .update({
        target_signatures: payload.target_signatures,
        what_is_requested: payload.what_is_requested,
        requested_from: payload.requested_from,
        why_important: payload.why_important,
        contact_person: payload.contact_person,
      })
      .eq('event_id', eventId)
    if (error) return { error: error.message }
  }

  else if (payload.kind === 'boycott') {
    const { error } = await supabase
      .from('boycotts')
      .update({ reason: payload.reason, method: payload.method })
      .eq('event_id', eventId)
    if (error) return { error: error.message }
  }

  else if (payload.kind === 'community') {
    const { error: caErr } = await supabase
      .from('community_activities')
      .update({ contact_person: payload.contact_person })
      .eq('event_id', eventId)
    if (caErr) return { error: caErr.message }

    const { data: ca } = await supabase
      .from('community_activities')
      .select('id')
      .eq('event_id', eventId)
      .single()
    if (!ca) return { error: 'Date activitate negăsite' }

    const sub = (evtRaw as any).subcategory
    if (sub === 'outdoor') {
      const { error } = await supabase
        .from('outdoor_activities')
        .update({ date: payload.date, time_start: payload.time_start, time_end: payload.time_end, what_organizer_offers: payload.what_organizer_offers })
        .eq('community_activity_id', (ca as any).id)
      if (error) return { error: error.message }
    } else if (sub === 'donation') {
      const { error } = await supabase
        .from('donations')
        .update({ target_amount: payload.target_amount, what_is_needed: payload.what_is_needed })
        .eq('community_activity_id', (ca as any).id)
      if (error) return { error: error.message }
    } else if (sub === 'workshop') {
      const { error } = await supabase
        .from('workshops')
        .update({ date: payload.date, time_start: payload.time_start, time_end: payload.time_end, what_organizer_offers: payload.what_organizer_offers })
        .eq('community_activity_id', (ca as any).id)
      if (error) return { error: error.message }
    }
  }

  else if (payload.kind === 'charity') {
    const { error: ceErr } = await supabase
      .from('charity_events')
      .update({ target_amount: payload.target_amount })
      .eq('event_id', eventId)
    if (ceErr) return { error: ceErr.message }

    const { data: ce } = await supabase
      .from('charity_events')
      .select('id')
      .eq('event_id', eventId)
      .single()
    if (!ce) return { error: 'Date caritabil negăsite' }

    const sub = (evtRaw as any).subcategory
    if (sub === 'concert') {
      const { error } = await supabase
        .from('charity_concerts')
        .update({ date: payload.date, time_start: payload.time_start, performers: payload.performers })
        .eq('charity_event_id', (ce as any).id)
      if (error) return { error: error.message }
    } else if (sub === 'meet_greet') {
      const { error } = await supabase
        .from('meet_greets')
        .update({ date: payload.date, time_start: payload.time_start, guests: payload.guests })
        .eq('charity_event_id', (ce as any).id)
      if (error) return { error: error.message }
    } else if (sub === 'livestream') {
      const { error } = await supabase
        .from('charity_livestreams')
        .update({ cause: payload.cause, time_start: payload.time_start, stream_link: payload.stream_link })
        .eq('charity_event_id', (ce as any).id)
      if (error) return { error: error.message }
    } else if (sub === 'sport') {
      const { error } = await supabase
        .from('sports_activities')
        .update({ date: payload.date, time_start: payload.time_start, guests: payload.guests })
        .eq('charity_event_id', (ce as any).id)
      if (error) return { error: error.message }
    }
  }

  return { ok: true }
}
