'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
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
  org_id: string | null
  org_name: string | null
  created_at: string
  banner_url: string | null
  is_edited: boolean
  previous_snapshot: Record<string, unknown> | null
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
  is_edited: boolean
}

export type AdminOrgDetail = {
  id: string
  name: string
  description: string | null
  website: string | null
  iban: string | null
  logo_url: string | null
  banner_url: string | null
  status: string
  rejection_note: string | null
  rating: number
  owner_id: string
  owner_name: string
  created_at: string
  categories: string[]
  cui: string | null
  reg_number: string | null
  org_type: string | null
  email: string | null
  phone: string | null
  address: string | null
  postal_code: string | null
  county: string | null
  city: string | null
  is_edited: boolean
  previous_snapshot: Record<string, unknown> | null
  members: { user_id: string; name: string; role: string; joined_at: string }[]
  documents: { id: string; doc_type: string; file_name: string; storage_path: string; download_url: string | null; created_at: string }[]
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
  organization_id: string | null
  banner_url: string | null; created_at: string
  is_edited: boolean
  creator: { name: string } | null
  organization: { name: string } | null
}

type OrgListRow = {
  id: string; name: string; description: string | null; owner_id: string
  status: string; rejection_note: string | null; logo_url: string | null
  created_at: string; is_edited: boolean
  owner: { name: string } | null
}

type OrgDetailRow = {
  id: string; name: string; description: string | null; website: string | null
  iban: string | null; logo_url: string | null; banner_url: string | null
  status: string; rejection_note: string | null; rating: number; owner_id: string
  created_at: string; categories: string[] | null; cui: string | null
  reg_number: string | null; org_type: string | null; email: string | null
  phone: string | null; address: string | null; postal_code: string | null
  county: string | null; city: string | null; is_edited: boolean
  previous_snapshot: Record<string, unknown> | null
  owner: { name: string } | null
}

type OrgMemberRow = {
  user_id: string; role: string; joined_at: string
  users: { name: string } | null
}

type OrgDocumentRow = {
  id: string; doc_type: string; file_name: string; storage_path: string; created_at: string
}

type EventDetailRow = {
  id: string; title: string; description: string | null; category: string
  subcategory: string | null; status: string; rejection_note: string | null
  creator_id: string; organization_id: string | null; banner_url: string | null; gallery_urls: string[] | null
  created_at: string
  is_edited: boolean
  previous_snapshot: Record<string, unknown> | null
  creator: { name: string } | null
  organization: { name: string } | null
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

const EVENT_CATEGORY_URL: Record<string, string> = {
  protest: 'protest', boycott: 'boycott', petition: 'petitie', community: 'comunitar', charity: 'caritabil',
}

type EventMutationRow = { id: string; title: string; creator_id: string; status: string; category: string }
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
    .select('id, title, category, subcategory, status, rejection_note, creator_id, organization_id, banner_url, created_at, is_edited, creator:users!creator_id(name), organization:organizations!organization_id(name)')
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
    org_id: row.organization_id ?? null,
    org_name: row.organization?.name ?? null,
    created_at: row.created_at,
    banner_url: row.banner_url ?? null,
    is_edited: row.is_edited ?? false,
    previous_snapshot: null,
  }))
}

export async function getPendingOrgs(): Promise<AdminOrg[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('organizations')
    .select('id, name, description, owner_id, status, rejection_note, logo_url, created_at, is_edited, owner:users!owner_id(name)')
    .in('status', ['pending', 'contested'])
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
    is_edited: row.is_edited ?? false,
  }))
}

export async function getAdminOrgDetail(id: string): Promise<AdminOrgDetail | null> {
  const adminSupabase = createAdminClient()

  const { data: orgRaw, error: orgErr } = await adminSupabase
    .from('organizations')
    .select('id, name, description, website, iban, logo_url, banner_url, status, rejection_note, rating, owner_id, created_at, categories, cui, reg_number, org_type, email, phone, address, postal_code, county, city, is_edited, previous_snapshot, owner:users!owner_id(name)')
    .eq('id', id)
    .single()
  if (orgErr || !orgRaw) {
    if (orgErr) console.error('[getAdminOrgDetail] org', orgErr.message)
    return null
  }
  const org = orgRaw as unknown as OrgDetailRow

  const { data: membersRaw, error: membersErr } = await adminSupabase
    .from('organization_members')
    .select('user_id, role, joined_at, users(name)')
    .eq('organization_id', id)
    .order('joined_at', { ascending: true })
  if (membersErr) console.error('[getAdminOrgDetail] members', membersErr.message)

  const { data: docsRaw, error: docsErr } = await adminSupabase
    .from('org_documents')
    .select('id, doc_type, file_name, storage_path, created_at')
    .eq('org_id', id)
    .order('created_at', { ascending: true })
  if (docsErr) console.error('[getAdminOrgDetail] documents', docsErr.message)

  const members = ((membersRaw ?? []) as unknown as OrgMemberRow[]).map(m => ({
    user_id: m.user_id,
    name: m.users?.name ?? 'Necunoscut',
    role: m.role,
    joined_at: m.joined_at,
  }))

  const docRows = (docsRaw ?? []) as unknown as OrgDocumentRow[]
  const signedUrls = await Promise.all(
    docRows.map(d =>
      adminSupabase.storage.from('org-documents').createSignedUrl(d.storage_path, 3600)
    )
  )
  const documents = docRows.map((d, i) => ({
    id: d.id,
    doc_type: d.doc_type,
    file_name: d.file_name,
    storage_path: d.storage_path,
    download_url: signedUrls[i]?.data?.signedUrl ?? null,
    created_at: d.created_at,
  }))

  return {
    id: org.id,
    name: org.name,
    description: org.description ?? null,
    website: org.website ?? null,
    iban: org.iban ?? null,
    logo_url: org.logo_url ?? null,
    banner_url: org.banner_url ?? null,
    status: org.status,
    rejection_note: org.rejection_note ?? null,
    rating: org.rating ?? 0,
    owner_id: org.owner_id,
    owner_name: org.owner?.name ?? 'Necunoscut',
    created_at: org.created_at,
    categories: org.categories ?? [],
    cui: org.cui ?? null,
    reg_number: org.reg_number ?? null,
    org_type: org.org_type ?? null,
    email: org.email ?? null,
    phone: org.phone ?? null,
    address: org.address ?? null,
    postal_code: org.postal_code ?? null,
    county: org.county ?? null,
    city: org.city ?? null,
    is_edited: org.is_edited ?? false,
    previous_snapshot: org.previous_snapshot ?? null,
    members,
    documents,
  }
}

export async function getAdminEventDetail(id: string): Promise<AdminEventDetail | null> {
  const supabase = await createClient()

  const { data: evtRaw } = await supabase
    .from('events')
    .select('id, title, description, category, subcategory, status, rejection_note, creator_id, organization_id, banner_url, gallery_urls, created_at, is_edited, previous_snapshot, creator:users!creator_id(name), organization:organizations!organization_id(name)')
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
    org_id: evt.organization_id ?? null,
    org_name: evt.organization?.name ?? null,
    created_at: evt.created_at,
    banner_url: evt.banner_url ?? null,
    is_edited: evt.is_edited ?? false,
    previous_snapshot: evt.previous_snapshot ?? null,
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
    .select('id, title, creator_id, status, category')
    .eq('id', eventId)
    .single()
  if (!evtRaw) return { error: 'Eveniment negăsit' }
  const evt = evtRaw as unknown as EventMutationRow
  if (evt.status !== 'pending' && evt.status !== 'contested') {
    return { error: 'Evenimentul nu poate fi aprobat în starea curentă' }
  }

  const { error } = await supabase
    .from('events')
    .update({ status: 'approved', rejection_note: null, is_edited: false, previous_snapshot: null })
    .eq('id', eventId)
  if (error) return { error: error.message }

  await createNotification(
    evt.creator_id,
    'Eveniment aprobat ✅',
    `Evenimentul tău "${evt.title}" a fost aprobat și este acum vizibil public.`,
    'event_approved',
    `/evenimente/${EVENT_CATEGORY_URL[evt.category] ?? evt.category}/${eventId}`
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
    .select('id, title, creator_id, status, category')
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
    'event_rejected',
    '/panou/evenimente'
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
  if (org.status !== 'pending' && org.status !== 'contested') {
    return { error: 'Organizația nu poate fi aprobată în starea curentă' }
  }

  const adminClient = createAdminClient()
  const { error } = await adminClient
    .from('organizations')
    .update({ status: 'approved', rejection_note: null, is_edited: false, previous_snapshot: null, contested_at: null })
    .eq('id', orgId)
  if (error) return { error: error.message }

  // Close any active org appeals
  if (org.status === 'contested') {
    await adminClient
      .from('org_appeals')
      .update({ status: 'resolved', admin_note: 'Aprobat direct de admin.' })
      .eq('org_id', orgId)
      .in('status', ['pending', 'under_review'])
  }

  await createNotification(
    org.owner_id,
    'Organizație aprobată ✅',
    `Organizația "${org.name}" a fost aprobată și este acum vizibilă public.`,
    'org_approved',
    `/organizatie/${orgId}/panou`
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
  if (org.status !== 'pending' && org.status !== 'contested') {
    return { error: 'Organizația nu poate fi respinsă în starea curentă' }
  }

  const adminClient = createAdminClient()
  const { error } = await adminClient
    .from('organizations')
    .update({ status: 'rejected', rejection_note: note.trim() })
    .eq('id', orgId)
  if (error) return { error: error.message }

  // Close any active org appeals
  if (org.status === 'contested') {
    await adminClient
      .from('org_appeals')
      .update({ status: 'resolved', admin_note: note.trim() })
      .eq('org_id', orgId)
      .in('status', ['pending', 'under_review'])
  }

  await createNotification(
    org.owner_id,
    'Organizație respinsă ❌',
    `Organizația "${org.name}" a fost respinsă. Motiv: ${note.trim()}`,
    'org_rejected',
    `/organizatie/${orgId}/panou`
  )
  return { ok: true }
}
