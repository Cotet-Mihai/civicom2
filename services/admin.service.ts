'use server'

import { createClient } from '@/lib/supabase/server'
import { createNotification } from '@/services/notification.service'

// ============================================================
// TYPES
// ============================================================

export type AdminEvent = {
  id: string
  title: string
  category: string
  subcategory: string | null
  status: string
  rejection_note: string | null
  creator_id: string
  creator_name: string
  created_at: string
  banner_url: string | null
}

export type AdminOrg = {
  id: string
  name: string
  description: string | null
  owner_id: string
  owner_name: string
  status: string
  rejection_note: string | null
  created_at: string
  logo_url: string | null
}

type ProtestDetail = {
  date: string
  time_start: string
  time_end: string | null
  max_participants: number
  safety_rules: string | null
  recommended_equipment: string | null
  contact_person: string | null
}

type PetitionDetail = {
  target_signatures: number
  what_is_requested: string
  requested_from: string
  why_important: string
  contact_person: string | null
}

type BoycottDetail = {
  reason: string
  method: string
  brands: { name: string; link: string | null }[]
}

type CommunityDetail = {
  subcategory: string
  date: string | null
  time_start: string | null
  time_end: string | null
  what_organizer_offers: string | null
  donation_type: string | null
  target_amount: number | null
  what_is_needed: string[] | null
  contact_person: string | null
}

type CharityDetail = {
  subcategory: string
  date: string | null
  time_start: string | null
  target_amount: number | null
  cause: string | null
  performers: string[] | null
  guests: string[] | null
  stream_link: string | null
}

export type AdminEventDetail =
  | { kind: 'protest'; event: AdminEvent; description: string; gallery_urls: string[]; detail: ProtestDetail }
  | { kind: 'petition'; event: AdminEvent; description: string; gallery_urls: string[]; detail: PetitionDetail }
  | { kind: 'boycott'; event: AdminEvent; description: string; gallery_urls: string[]; detail: BoycottDetail }
  | { kind: 'community'; event: AdminEvent; description: string; gallery_urls: string[]; detail: CommunityDetail }
  | { kind: 'charity'; event: AdminEvent; description: string; gallery_urls: string[]; detail: CharityDetail }

// ============================================================
// HELPERS
// ============================================================

export async function checkIsAdmin(): Promise<boolean> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  const { data } = await supabase
    .from('users')
    .select('role')
    .eq('auth_users_id', user.id)
    .single()
  return data?.role === 'admin'
}

// ============================================================
// READ FUNCTIONS
// ============================================================

export async function getAdminStats(): Promise<{ pendingEvents: number; pendingOrgs: number }> {
  const supabase = await createClient()
  const [{ count: pendingEvents, error: e1 }, { count: pendingOrgs, error: e2 }] = await Promise.all([
    supabase.from('events').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('organizations').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
  ])
  if (e1) console.error('[getAdminStats] events', e1.message)
  if (e2) console.error('[getAdminStats] orgs', e2.message)
  return { pendingEvents: pendingEvents ?? 0, pendingOrgs: pendingOrgs ?? 0 }
}

export async function getPendingEvents(limit?: number): Promise<AdminEvent[]> {
  const supabase = await createClient()
  const query = supabase
    .from('events')
    .select('id, title, category, subcategory, status, rejection_note, creator_id, banner_url, created_at, creator:users!creator_id(name)')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
  const { data, error } = limit ? await query.limit(limit) : await query
  if (error) console.error('[getPendingEvents]', error.message)
  return ((data ?? []) as any[]).map((row: any) => ({
    id: row.id,
    title: row.title,
    category: row.category,
    subcategory: row.subcategory ?? null,
    status: row.status,
    rejection_note: row.rejection_note ?? null,
    creator_id: row.creator_id,
    creator_name: row.creator?.name ?? 'Necunoscut',
    created_at: row.created_at,
    banner_url: row.banner_url ?? null,
  }))
}

export async function getPendingOrgs(): Promise<AdminOrg[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('organizations')
    .select('id, name, description, owner_id, status, rejection_note, logo_url, created_at, owner:users!owner_id(name)')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
  if (error) console.error('[getPendingOrgs]', error.message)
  return ((data ?? []) as any[]).map((row: any) => ({
    id: row.id,
    name: row.name,
    description: row.description ?? null,
    owner_id: row.owner_id,
    owner_name: row.owner?.name ?? 'Necunoscut',
    status: row.status,
    rejection_note: row.rejection_note ?? null,
    created_at: row.created_at,
    logo_url: row.logo_url ?? null,
  }))
}

export async function getAdminEventDetail(id: string): Promise<AdminEventDetail | null> {
  const supabase = await createClient()

  const { data: evt } = await supabase
    .from('events')
    .select('id, title, description, category, subcategory, status, rejection_note, creator_id, banner_url, gallery_urls, created_at, creator:users!creator_id(name)')
    .eq('id', id)
    .single()

  if (!evt) return null

  const event: AdminEvent = {
    id: (evt as any).id,
    title: (evt as any).title,
    category: (evt as any).category,
    subcategory: (evt as any).subcategory ?? null,
    status: (evt as any).status,
    rejection_note: (evt as any).rejection_note ?? null,
    creator_id: (evt as any).creator_id,
    creator_name: ((evt as any).creator as any)?.name ?? 'Necunoscut',
    created_at: (evt as any).created_at,
    banner_url: (evt as any).banner_url ?? null,
  }
  const description: string = (evt as any).description ?? ''
  const gallery_urls: string[] = (evt as any).gallery_urls ?? []
  const category: string = (evt as any).category
  const subcategory: string = (evt as any).subcategory ?? ''

  if (category === 'protest') {
    const { data: p } = await supabase
      .from('protests')
      .select('date, time_start, time_end, max_participants, safety_rules, recommended_equipment, contact_person')
      .eq('event_id', id)
      .single()
    if (!p) return null
    return {
      kind: 'protest', event, description, gallery_urls,
      detail: {
        date: (p as any).date,
        time_start: (p as any).time_start,
        time_end: (p as any).time_end ?? null,
        max_participants: (p as any).max_participants,
        safety_rules: (p as any).safety_rules ?? null,
        recommended_equipment: (p as any).recommended_equipment ?? null,
        contact_person: (p as any).contact_person ?? null,
      },
    }
  }

  if (category === 'petition') {
    const { data: p } = await supabase
      .from('petitions')
      .select('what_is_requested, requested_from, target_signatures, why_important, contact_person')
      .eq('event_id', id)
      .single()
    if (!p) return null
    return {
      kind: 'petition', event, description, gallery_urls,
      detail: {
        target_signatures: (p as any).target_signatures,
        what_is_requested: (p as any).what_is_requested,
        requested_from: (p as any).requested_from,
        why_important: (p as any).why_important,
        contact_person: (p as any).contact_person ?? null,
      },
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
      kind: 'boycott', event, description, gallery_urls,
      detail: {
        reason: (b as any).reason,
        method: (b as any).method,
        brands: ((b as any).boycott_brands ?? []).map((br: any) => ({ name: br.name, link: br.link ?? null })),
      },
    }
  }

  if (category === 'community') {
    const { data: ca } = await supabase
      .from('community_activities')
      .select('id, contact_person')
      .eq('event_id', id)
      .single()
    if (!ca) return null

    const detail: CommunityDetail = {
      subcategory,
      date: null, time_start: null, time_end: null,
      what_organizer_offers: null,
      donation_type: null, target_amount: null, what_is_needed: null,
      contact_person: (ca as any).contact_person ?? null,
    }

    if (subcategory === 'outdoor') {
      const { data: oa } = await supabase
        .from('outdoor_activities')
        .select('date, time_start, time_end, what_organizer_offers')
        .eq('community_activity_id', (ca as any).id)
        .single()
      if (oa) {
        detail.date = (oa as any).date
        detail.time_start = (oa as any).time_start
        detail.time_end = (oa as any).time_end ?? null
        detail.what_organizer_offers = (oa as any).what_organizer_offers ?? null
      }
    } else if (subcategory === 'donation') {
      const { data: don } = await supabase
        .from('donations')
        .select('donation_type, target_amount, what_is_needed')
        .eq('community_activity_id', (ca as any).id)
        .single()
      if (don) {
        detail.donation_type = (don as any).donation_type
        detail.target_amount = (don as any).target_amount ?? null
        detail.what_is_needed = (don as any).what_is_needed ?? null
      }
    } else if (subcategory === 'workshop') {
      const { data: ws } = await supabase
        .from('workshops')
        .select('date, time_start, time_end, what_organizer_offers')
        .eq('community_activity_id', (ca as any).id)
        .single()
      if (ws) {
        detail.date = (ws as any).date
        detail.time_start = (ws as any).time_start
        detail.time_end = (ws as any).time_end ?? null
        detail.what_organizer_offers = (ws as any).what_organizer_offers ?? null
      }
    }

    return { kind: 'community', event, description, gallery_urls, detail }
  }

  if (category === 'charity') {
    const { data: ce } = await supabase
      .from('charity_events')
      .select('id, target_amount')
      .eq('event_id', id)
      .single()
    if (!ce) return null

    const detail: CharityDetail = {
      subcategory,
      date: null, time_start: null,
      target_amount: (ce as any).target_amount ?? null,
      cause: null, performers: null, guests: null, stream_link: null,
    }

    if (subcategory === 'concert') {
      const { data: cc } = await supabase
        .from('charity_concerts')
        .select('date, time_start, performers')
        .eq('charity_event_id', (ce as any).id)
        .single()
      if (cc) { detail.date = (cc as any).date; detail.time_start = (cc as any).time_start; detail.performers = (cc as any).performers }
    } else if (subcategory === 'meet_greet') {
      const { data: mg } = await supabase
        .from('meet_greets')
        .select('date, time_start, guests')
        .eq('charity_event_id', (ce as any).id)
        .single()
      if (mg) { detail.date = (mg as any).date; detail.time_start = (mg as any).time_start; detail.guests = (mg as any).guests }
    } else if (subcategory === 'livestream') {
      const { data: ls } = await supabase
        .from('charity_livestreams')
        .select('cause, time_start, stream_link')
        .eq('charity_event_id', (ce as any).id)
        .single()
      if (ls) { detail.cause = (ls as any).cause; detail.time_start = (ls as any).time_start; detail.stream_link = (ls as any).stream_link }
    } else if (subcategory === 'sport') {
      const { data: sa } = await supabase
        .from('sports_activities')
        .select('date, time_start, guests')
        .eq('charity_event_id', (ce as any).id)
        .single()
      if (sa) { detail.date = (sa as any).date; detail.time_start = (sa as any).time_start; detail.guests = (sa as any).guests ?? null }
    }

    return { kind: 'charity', event, description, gallery_urls, detail }
  }

  return null
}

// ============================================================
// MUTATION FUNCTIONS
// ============================================================

export async function approveEvent(eventId: string): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient()
  const isAdmin = await checkIsAdmin()
  if (!isAdmin) return { error: 'Acces interzis' }

  const { data: evt } = await supabase
    .from('events')
    .select('id, title, creator_id')
    .eq('id', eventId)
    .single()
  if (!evt) return { error: 'Eveniment negăsit' }

  const { error } = await supabase
    .from('events')
    .update({ status: 'approved', rejection_note: null })
    .eq('id', eventId)
  if (error) return { error: error.message }

  await createNotification(
    (evt as any).creator_id,
    'Eveniment aprobat ✅',
    `Evenimentul tău "${(evt as any).title}" a fost aprobat și este acum vizibil public.`,
    'event_approved'
  )
  return { ok: true }
}

export async function rejectEvent(eventId: string, note: string): Promise<{ ok: true } | { error: string }> {
  if (note.trim().length < 10) return { error: 'Motivul trebuie să aibă minim 10 caractere' }

  const supabase = await createClient()
  const isAdmin = await checkIsAdmin()
  if (!isAdmin) return { error: 'Acces interzis' }

  const { data: evt } = await supabase
    .from('events')
    .select('id, title, creator_id, status')
    .eq('id', eventId)
    .single()
  if (!evt) return { error: 'Eveniment negăsit' }
  const evtStatus = (evt as any).status
  if (evtStatus !== 'pending' && evtStatus !== 'contested') {
    return { error: 'Evenimentul nu poate fi respins în starea curentă' }
  }

  const { error } = await supabase
    .from('events')
    .update({ status: 'rejected', rejection_note: note.trim() })
    .eq('id', eventId)
  if (error) return { error: error.message }

  await createNotification(
    (evt as any).creator_id,
    'Eveniment respins ❌',
    `Evenimentul tău "${(evt as any).title}" a fost respins. Motiv: ${note.trim()}`,
    'event_rejected'
  )
  return { ok: true }
}

export async function approveOrg(orgId: string): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient()
  const isAdmin = await checkIsAdmin()
  if (!isAdmin) return { error: 'Acces interzis' }

  const { data: org } = await supabase
    .from('organizations')
    .select('id, name, owner_id')
    .eq('id', orgId)
    .single()
  if (!org) return { error: 'Organizație negăsită' }

  const { error } = await supabase
    .from('organizations')
    .update({ status: 'approved', rejection_note: null })
    .eq('id', orgId)
  if (error) return { error: error.message }

  await createNotification(
    (org as any).owner_id,
    'Organizație aprobată ✅',
    `Organizația "${(org as any).name}" a fost aprobată și este acum vizibilă public.`,
    'org_approved'
  )
  return { ok: true }
}

export async function rejectOrg(orgId: string, note: string): Promise<{ ok: true } | { error: string }> {
  if (note.trim().length < 10) return { error: 'Motivul trebuie să aibă minim 10 caractere' }

  const supabase = await createClient()
  const isAdmin = await checkIsAdmin()
  if (!isAdmin) return { error: 'Acces interzis' }

  const { data: org } = await supabase
    .from('organizations')
    .select('id, name, owner_id')
    .eq('id', orgId)
    .single()
  if (!org) return { error: 'Organizație negăsită' }
  if ((org as any).status !== 'pending') {
    return { error: 'Organizația nu poate fi respinsă în starea curentă' }
  }

  const { error } = await supabase
    .from('organizations')
    .update({ status: 'rejected', rejection_note: note.trim() })
    .eq('id', orgId)
  if (error) return { error: error.message }

  await createNotification(
    (org as any).owner_id,
    'Organizație respinsă ❌',
    `Organizația "${(org as any).name}" a fost respinsă. Motiv: ${note.trim()}`,
    'org_rejected'
  )
  return { ok: true }
}
