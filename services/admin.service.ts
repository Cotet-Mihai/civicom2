'use server'

import { createClient } from '@/lib/supabase/server'
import { createNotification } from '@/services/notification.service'

// ============================================================
// PUBLIC TYPES
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
// INTERNAL ROW TYPES (Supabase query shapes — no generated DB types)
// ============================================================

type EventListRow = {
  id: string; title: string; category: string; subcategory: string | null
  status: string; rejection_note: string | null; creator_id: string
  banner_url: string | null; created_at: string
  creator: { name: string } | null
}

type OrgListRow = {
  id: string; name: string; description: string | null; owner_id: string
  status: string; rejection_note: string | null; logo_url: string | null
  created_at: string
  owner: { name: string } | null
}

type EventDetailRow = {
  id: string; title: string; description: string | null; category: string
  subcategory: string | null; status: string; rejection_note: string | null
  creator_id: string; banner_url: string | null; gallery_urls: string[] | null
  created_at: string
  creator: { name: string } | null
}

type ProtestRow = {
  date: string; time_start: string; time_end: string | null
  max_participants: number; safety_rules: string | null
  recommended_equipment: string | null; contact_person: string | null
}

type PetitionRow = {
  what_is_requested: string; requested_from: string
  target_signatures: number; why_important: string; contact_person: string | null
}

type BoycottRow = {
  reason: string; method: string
  boycott_brands: { name: string; link: string | null }[]
}

type CommunityActivityRow = { id: string; contact_person: string | null }

type OutdoorActivityRow = {
  date: string; time_start: string; time_end: string | null
  what_organizer_offers: string | null
}

type DonationRow = {
  donation_type: string; target_amount: number | null; what_is_needed: string[] | null
}

type WorkshopRow = {
  date: string; time_start: string; time_end: string | null
  what_organizer_offers: string | null
}

type CharityEventRow = { id: string; target_amount: number | null }

type CharityConcertRow = { date: string; time_start: string; performers: string[] | null }
type MeetGreetRow = { date: string; time_start: string; guests: string[] | null }
type LivestreamRow = { cause: string | null; time_start: string; stream_link: string | null }
type SportActivityRow = { date: string; time_start: string; guests: string[] | null }

type EventMutationRow = { id: string; title: string; creator_id: string; status: string }
type OrgMutationRow = { id: string; name: string; owner_id: string; status: string }

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

export async function getAdminStats(): Promise<{ pendingEvents: number; pendingOrgs: number; pendingAppeals: number }> {
  const supabase = await createClient()
  const [
    { count: pendingEvents, error: e1 },
    { count: pendingOrgs, error: e2 },
    { count: pendingAppeals, error: e3 },
  ] = await Promise.all([
    supabase.from('events').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('organizations').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('appeals').select('*', { count: 'exact', head: true }).in('status', ['pending', 'under_review']),
  ])
  if (e1) console.error('[getAdminStats] events', e1.message)
  if (e2) console.error('[getAdminStats] orgs', e2.message)
  if (e3) console.error('[getAdminStats] appeals', e3.message)
  return { pendingEvents: pendingEvents ?? 0, pendingOrgs: pendingOrgs ?? 0, pendingAppeals: pendingAppeals ?? 0 }
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
  return ((data ?? []) as unknown as EventListRow[]).map(row => ({
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
  return ((data ?? []) as unknown as OrgListRow[]).map(row => ({
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

  const { data: evtRaw } = await supabase
    .from('events')
    .select('id, title, description, category, subcategory, status, rejection_note, creator_id, banner_url, gallery_urls, created_at, creator:users!creator_id(name)')
    .eq('id', id)
    .single()

  if (!evtRaw) return null
  const evt = evtRaw as unknown as EventDetailRow

  const event: AdminEvent = {
    id: evt.id,
    title: evt.title,
    category: evt.category,
    subcategory: evt.subcategory ?? null,
    status: evt.status,
    rejection_note: evt.rejection_note ?? null,
    creator_id: evt.creator_id,
    creator_name: evt.creator?.name ?? 'Necunoscut',
    created_at: evt.created_at,
    banner_url: evt.banner_url ?? null,
  }
  const description: string = evt.description ?? ''
  const gallery_urls: string[] = evt.gallery_urls ?? []
  const category: string = evt.category
  const subcategory: string = evt.subcategory ?? ''

  if (category === 'protest') {
    const { data: pRaw, error: pErr } = await supabase
      .from('protests')
      .select('date, time_start, time_end, max_participants, safety_rules, recommended_equipment, contact_person')
      .eq('event_id', id)
      .single()
    if (pErr) console.error('[getAdminEventDetail] protests', pErr.message)
    if (!pRaw) return null
    const p = pRaw as unknown as ProtestRow
    return {
      kind: 'protest', event, description, gallery_urls,
      detail: {
        date: p.date,
        time_start: p.time_start,
        time_end: p.time_end ?? null,
        max_participants: p.max_participants,
        safety_rules: p.safety_rules ?? null,
        recommended_equipment: p.recommended_equipment ?? null,
        contact_person: p.contact_person ?? null,
      },
    }
  }

  if (category === 'petition') {
    const { data: pRaw, error: pErr } = await supabase
      .from('petitions')
      .select('what_is_requested, requested_from, target_signatures, why_important, contact_person')
      .eq('event_id', id)
      .single()
    if (pErr) console.error('[getAdminEventDetail] petitions', pErr.message)
    if (!pRaw) return null
    const p = pRaw as unknown as PetitionRow
    return {
      kind: 'petition', event, description, gallery_urls,
      detail: {
        target_signatures: p.target_signatures,
        what_is_requested: p.what_is_requested,
        requested_from: p.requested_from,
        why_important: p.why_important,
        contact_person: p.contact_person ?? null,
      },
    }
  }

  if (category === 'boycott') {
    const { data: bRaw, error: bErr } = await supabase
      .from('boycotts')
      .select('reason, method, boycott_brands(name, link)')
      .eq('event_id', id)
      .single()
    if (bErr) console.error('[getAdminEventDetail] boycotts', bErr.message)
    if (!bRaw) return null
    const b = bRaw as unknown as BoycottRow
    return {
      kind: 'boycott', event, description, gallery_urls,
      detail: {
        reason: b.reason,
        method: b.method,
        brands: (b.boycott_brands ?? []).map(br => ({ name: br.name, link: br.link ?? null })),
      },
    }
  }

  if (category === 'community') {
    const { data: caRaw, error: caErr } = await supabase
      .from('community_activities')
      .select('id, contact_person')
      .eq('event_id', id)
      .single()
    if (caErr) console.error('[getAdminEventDetail] community_activities', caErr.message)
    if (!caRaw) return null
    const ca = caRaw as unknown as CommunityActivityRow

    const detail: CommunityDetail = {
      subcategory,
      date: null, time_start: null, time_end: null,
      what_organizer_offers: null,
      donation_type: null, target_amount: null, what_is_needed: null,
      contact_person: ca.contact_person ?? null,
    }

    if (subcategory === 'outdoor') {
      const { data: oaRaw } = await supabase
        .from('outdoor_activities')
        .select('date, time_start, time_end, what_organizer_offers')
        .eq('community_activity_id', ca.id)
        .single()
      if (oaRaw) {
        const oa = oaRaw as unknown as OutdoorActivityRow
        detail.date = oa.date
        detail.time_start = oa.time_start
        detail.time_end = oa.time_end ?? null
        detail.what_organizer_offers = oa.what_organizer_offers ?? null
      }
    } else if (subcategory === 'donation') {
      const { data: donRaw } = await supabase
        .from('donations')
        .select('donation_type, target_amount, what_is_needed')
        .eq('community_activity_id', ca.id)
        .single()
      if (donRaw) {
        const don = donRaw as unknown as DonationRow
        detail.donation_type = don.donation_type
        detail.target_amount = don.target_amount ?? null
        detail.what_is_needed = don.what_is_needed ?? null
      }
    } else if (subcategory === 'workshop') {
      const { data: wsRaw } = await supabase
        .from('workshops')
        .select('date, time_start, time_end, what_organizer_offers')
        .eq('community_activity_id', ca.id)
        .single()
      if (wsRaw) {
        const ws = wsRaw as unknown as WorkshopRow
        detail.date = ws.date
        detail.time_start = ws.time_start
        detail.time_end = ws.time_end ?? null
        detail.what_organizer_offers = ws.what_organizer_offers ?? null
      }
    }

    return { kind: 'community', event, description, gallery_urls, detail }
  }

  if (category === 'charity') {
    const { data: ceRaw, error: ceErr } = await supabase
      .from('charity_events')
      .select('id, target_amount')
      .eq('event_id', id)
      .single()
    if (ceErr) console.error('[getAdminEventDetail] charity_events', ceErr.message)
    if (!ceRaw) return null
    const ce = ceRaw as unknown as CharityEventRow

    const detail: CharityDetail = {
      subcategory,
      date: null, time_start: null,
      target_amount: ce.target_amount ?? null,
      cause: null, performers: null, guests: null, stream_link: null,
    }

    if (subcategory === 'concert') {
      const { data: ccRaw } = await supabase
        .from('charity_concerts')
        .select('date, time_start, performers')
        .eq('charity_event_id', ce.id)
        .single()
      if (ccRaw) {
        const cc = ccRaw as unknown as CharityConcertRow
        detail.date = cc.date; detail.time_start = cc.time_start; detail.performers = cc.performers
      }
    } else if (subcategory === 'meet_greet') {
      const { data: mgRaw } = await supabase
        .from('meet_greets')
        .select('date, time_start, guests')
        .eq('charity_event_id', ce.id)
        .single()
      if (mgRaw) {
        const mg = mgRaw as unknown as MeetGreetRow
        detail.date = mg.date; detail.time_start = mg.time_start; detail.guests = mg.guests
      }
    } else if (subcategory === 'livestream') {
      const { data: lsRaw } = await supabase
        .from('charity_livestreams')
        .select('cause, time_start, stream_link')
        .eq('charity_event_id', ce.id)
        .single()
      if (lsRaw) {
        const ls = lsRaw as unknown as LivestreamRow
        detail.cause = ls.cause; detail.time_start = ls.time_start; detail.stream_link = ls.stream_link
      }
    } else if (subcategory === 'sport') {
      const { data: saRaw } = await supabase
        .from('sports_activities')
        .select('date, time_start, guests')
        .eq('charity_event_id', ce.id)
        .single()
      if (saRaw) {
        const sa = saRaw as unknown as SportActivityRow
        detail.date = sa.date; detail.time_start = sa.time_start; detail.guests = sa.guests ?? null
      }
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

  const { data: evtRaw } = await supabase
    .from('events')
    .select('id, title, creator_id, status')
    .eq('id', eventId)
    .single()
  if (!evtRaw) return { error: 'Eveniment negăsit' }
  const evt = evtRaw as unknown as EventMutationRow
  if (evt.status !== 'pending' && evt.status !== 'contested') {
    return { error: 'Evenimentul nu poate fi aprobat în starea curentă' }
  }

  const { error } = await supabase
    .from('events')
    .update({ status: 'approved', rejection_note: null })
    .eq('id', eventId)
  if (error) return { error: error.message }

  await createNotification(
    evt.creator_id,
    'Eveniment aprobat ✅',
    `Evenimentul tău "${evt.title}" a fost aprobat și este acum vizibil public.`,
    'event_approved'
  )
  return { ok: true }
}

export async function rejectEvent(eventId: string, note: string): Promise<{ ok: true } | { error: string }> {
  if (note.trim().length < 10) return { error: 'Motivul trebuie să aibă minim 10 caractere' }

  const supabase = await createClient()
  const isAdmin = await checkIsAdmin()
  if (!isAdmin) return { error: 'Acces interzis' }

  const { data: evtRaw } = await supabase
    .from('events')
    .select('id, title, creator_id, status')
    .eq('id', eventId)
    .single()
  if (!evtRaw) return { error: 'Eveniment negăsit' }
  const evt = evtRaw as unknown as EventMutationRow
  if (evt.status !== 'pending' && evt.status !== 'contested') {
    return { error: 'Evenimentul nu poate fi respins în starea curentă' }
  }

  const { error } = await supabase
    .from('events')
    .update({ status: 'rejected', rejection_note: note.trim() })
    .eq('id', eventId)
  if (error) return { error: error.message }

  await createNotification(
    evt.creator_id,
    'Eveniment respins ❌',
    `Evenimentul tău "${evt.title}" a fost respins. Motiv: ${note.trim()}`,
    'event_rejected'
  )
  return { ok: true }
}

export async function approveOrg(orgId: string): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient()
  const isAdmin = await checkIsAdmin()
  if (!isAdmin) return { error: 'Acces interzis' }

  const { data: orgRaw } = await supabase
    .from('organizations')
    .select('id, name, owner_id, status')
    .eq('id', orgId)
    .single()
  if (!orgRaw) return { error: 'Organizație negăsită' }
  const org = orgRaw as unknown as OrgMutationRow
  if (org.status !== 'pending') {
    return { error: 'Organizația nu poate fi aprobată în starea curentă' }
  }

  const { error } = await supabase
    .from('organizations')
    .update({ status: 'approved', rejection_note: null })
    .eq('id', orgId)
  if (error) return { error: error.message }

  await createNotification(
    org.owner_id,
    'Organizație aprobată ✅',
    `Organizația "${org.name}" a fost aprobată și este acum vizibilă public.`,
    'org_approved'
  )
  return { ok: true }
}

export async function rejectOrg(orgId: string, note: string): Promise<{ ok: true } | { error: string }> {
  if (note.trim().length < 10) return { error: 'Motivul trebuie să aibă minim 10 caractere' }

  const supabase = await createClient()
  const isAdmin = await checkIsAdmin()
  if (!isAdmin) return { error: 'Acces interzis' }

  const { data: orgRaw } = await supabase
    .from('organizations')
    .select('id, name, owner_id, status')
    .eq('id', orgId)
    .single()
  if (!orgRaw) return { error: 'Organizație negăsită' }
  const org = orgRaw as unknown as OrgMutationRow
  if (org.status !== 'pending') {
    return { error: 'Organizația nu poate fi respinsă în starea curentă' }
  }

  const { error } = await supabase
    .from('organizations')
    .update({ status: 'rejected', rejection_note: note.trim() })
    .eq('id', orgId)
  if (error) return { error: error.message }

  await createNotification(
    org.owner_id,
    'Organizație respinsă ❌',
    `Organizația "${org.name}" a fost respinsă. Motiv: ${note.trim()}`,
    'org_rejected'
  )
  return { ok: true }
}
