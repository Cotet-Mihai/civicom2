'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { ViewRange } from '@/services/user.service'

async function getUserId(): Promise<string | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('users').select('id').eq('auth_users_id', user.id).single()
  return data?.id ?? null
}

export type ProtestParticipant = {
  user_id: string
  name: string
  avatar_url: string | null
  county: string | null
  city: string | null
  status: 'joined' | 'cancelled'
  joined_at: string
  biological_sex: string | null
  gender: string | null
  sexual_orientation: string | null
  birth_date: string | null
  education_level: string | null
}

export type ProtestFeedbackItem = {
  id: string
  rating: number
  comment: string | null
  created_at: string
  user_name: string
  user_avatar: string | null
}

export type ProtestStatsData = {
  id: string
  title: string
  subcategory: 'gathering' | 'march' | 'picket'
  status: string
  view_count: number
  participants_count: number
  created_at: string
  date: string
  time_start: string
  time_end: string | null
  max_participants: number
  participants: ProtestParticipant[]
  feedback: ProtestFeedbackItem[]
  averageRating: number
}

export async function getProtestStats(
  eventId: string,
  context: 'user' | 'org',
  orgId?: string
): Promise<ProtestStatsData | null> {
  const supabase = await createClient()
  const admin = createAdminClient()
  const userId = await getUserId()
  if (!userId) return null

  const { data: event } = await supabase
    .from('events')
    .select('id, title, subcategory, status, view_count, participants_count, created_at, creator_id, creator_type, organization_id, category')
    .eq('id', eventId)
    .single()

  if (!event || event.category !== 'protest') return null

  if (context === 'user') {
    if (event.creator_id !== userId || event.creator_type !== 'user') return null
  } else if (context === 'org' && orgId) {
    const { data: membership } = await supabase
      .from('organization_members')
      .select('user_id')
      .eq('organization_id', orgId)
      .eq('user_id', userId)
      .single()
    if (!membership || event.organization_id !== orgId) return null
  } else {
    return null
  }

  const [protestResult, participantsResult, feedbackResult] = await Promise.all([
    admin
      .from('protests')
      .select('date, time_start, time_end, max_participants')
      .eq('event_id', eventId)
      .single(),
    admin
      .from('event_participants')
      .select('user_id, status, joined_at, user:users!user_id(name, avatar_url, county, city, biological_sex, gender, sexual_orientation, birth_date, education_level)')
      .eq('event_id', eventId)
      .order('joined_at', { ascending: true }),
    event.status === 'completed'
      ? admin
          .from('event_feedback')
          .select('id, rating, comment, created_at, user:users!user_id(name, avatar_url)')
          .eq('event_id', eventId)
          .order('created_at', { ascending: false })
      : Promise.resolve({ data: [] as any[], error: null }),
  ])

  if (protestResult.error) console.error('[getProtestStats] protests', protestResult.error.message)
  if (participantsResult.error) console.error('[getProtestStats] participants', participantsResult.error.message)
  if (!protestResult.data) return null

  const participants: ProtestParticipant[] = (participantsResult.data ?? []).map((row: any) => ({
    user_id: row.user_id,
    name: row.user?.name ?? 'Utilizator necunoscut',
    avatar_url: row.user?.avatar_url ?? null,
    county: row.user?.county ?? null,
    city: row.user?.city ?? null,
    status: row.status as 'joined' | 'cancelled',
    joined_at: row.joined_at,
    biological_sex: row.user?.biological_sex ?? null,
    gender: row.user?.gender ?? null,
    sexual_orientation: row.user?.sexual_orientation ?? null,
    birth_date: row.user?.birth_date ?? null,
    education_level: row.user?.education_level ?? null,
  }))

  const feedbackItems: ProtestFeedbackItem[] = ((feedbackResult as any).data ?? []).map((row: any) => ({
    id: row.id,
    rating: row.rating,
    comment: row.comment ?? null,
    created_at: row.created_at,
    user_name: row.user?.name ?? 'Utilizator necunoscut',
    user_avatar: row.user?.avatar_url ?? null,
  }))

  const averageRating = feedbackItems.length > 0
    ? feedbackItems.reduce((s, f) => s + f.rating, 0) / feedbackItems.length
    : 0

  return {
    id: event.id,
    title: event.title,
    subcategory: event.subcategory as 'gathering' | 'march' | 'picket',
    status: event.status,
    view_count: event.view_count,
    participants_count: event.participants_count,
    created_at: event.created_at,
    date: protestResult.data.date,
    time_start: protestResult.data.time_start,
    time_end: protestResult.data.time_end ?? null,
    max_participants: protestResult.data.max_participants,
    participants,
    feedback: feedbackItems,
    averageRating,
  }
}

export type SingleEventViewsData = {
  chartPoints: Array<{ label: string; views: number }>
  range: ViewRange
}

export async function getEventViewsEvolution(
  eventId: string,
  range: ViewRange
): Promise<SingleEventViewsData> {
  const admin = createAdminClient()
  const now = new Date()

  let startDate: Date
  let labels: string[]
  let bucketKey: (d: Date) => string

  if (range === 'today') {
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
    const currentHour = now.getHours()
    labels = Array.from({ length: currentHour + 1 }, (_, i) =>
      `${i.toString().padStart(2, '0')}:00`
    )
    bucketKey = (d) => `${d.getHours().toString().padStart(2, '0')}:00`
  } else if (range === '7d') {
    startDate = new Date(now)
    startDate.setDate(now.getDate() - 6)
    startDate.setHours(0, 0, 0, 0)
    labels = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startDate.getTime() + i * 86400000)
      return d.toLocaleDateString('ro-RO', { day: '2-digit', month: 'short' })
    })
    bucketKey = (d) => d.toLocaleDateString('ro-RO', { day: '2-digit', month: 'short' })
  } else {
    startDate = new Date(now)
    startDate.setDate(now.getDate() - 29)
    startDate.setHours(0, 0, 0, 0)
    labels = Array.from({ length: 30 }, (_, i) => {
      const d = new Date(startDate.getTime() + i * 86400000)
      return d.toLocaleDateString('ro-RO', { day: '2-digit', month: 'short' })
    })
    bucketKey = (d) => d.toLocaleDateString('ro-RO', { day: '2-digit', month: 'short' })
  }

  const [{ data: snapshots }, { data: eventRow }] = await Promise.all([
    admin
      .from('event_view_snapshots')
      .select('taken_at, view_count')
      .eq('event_id', eventId)
      .gte('taken_at', startDate.toISOString())
      .order('taken_at', { ascending: true }),
    admin
      .from('events')
      .select('view_count')
      .eq('id', eventId)
      .single(),
  ])

  const bucketMap: Record<string, number> = {}
  for (const snap of snapshots ?? []) {
    const key = bucketKey(new Date(snap.taken_at))
    bucketMap[key] = Math.max(bucketMap[key] ?? 0, snap.view_count)
  }

  let lastKnown = 0
  const filledPoints: Array<{ label: string; views: number }> = labels.map((label) => {
    if (bucketMap[label] !== undefined) lastKnown = bucketMap[label]
    return { label, views: lastKnown }
  })

  filledPoints.push({ label: 'Acum', views: eventRow?.view_count ?? lastKnown })

  return { chartPoints: filledPoints, range }
}

// ─── Private helpers (shared across all stat types) ───────────────────────────

type BaseEvent = {
  id: string; title: string; subcategory: string | null; status: string
  view_count: number; participants_count: number; created_at: string
}

async function checkEventAccess(
  supabase: Awaited<ReturnType<typeof createClient>>,
  eventId: string,
  category: string,
  userId: string,
  context: 'user' | 'org',
  orgId?: string
): Promise<BaseEvent | null> {
  const { data: event } = await supabase
    .from('events')
    .select('id, title, subcategory, status, view_count, participants_count, created_at, creator_id, creator_type, organization_id, category')
    .eq('id', eventId)
    .single()
  if (!event || event.category !== category) return null
  if (context === 'user') {
    if (event.creator_id !== userId || event.creator_type !== 'user') return null
  } else if (context === 'org' && orgId) {
    const { data: membership } = await supabase
      .from('organization_members').select('user_id')
      .eq('organization_id', orgId).eq('user_id', userId).single()
    if (!membership || event.organization_id !== orgId) return null
  } else {
    return null
  }
  return { id: event.id, title: event.title, subcategory: event.subcategory, status: event.status, view_count: event.view_count, participants_count: event.participants_count, created_at: event.created_at }
}

function parseParticipantRow(row: any): ProtestParticipant {
  return {
    user_id: row.user_id,
    name: row.user?.name ?? 'Utilizator necunoscut',
    avatar_url: row.user?.avatar_url ?? null,
    county: row.user?.county ?? null,
    city: row.user?.city ?? null,
    status: row.status as 'joined' | 'cancelled',
    joined_at: row.joined_at,
    biological_sex: row.user?.biological_sex ?? null,
    gender: row.user?.gender ?? null,
    sexual_orientation: row.user?.sexual_orientation ?? null,
    birth_date: row.user?.birth_date ?? null,
    education_level: row.user?.education_level ?? null,
  }
}

async function fetchParticipants(admin: ReturnType<typeof createAdminClient>, eventId: string): Promise<ProtestParticipant[]> {
  const { data, error } = await admin
    .from('event_participants')
    .select('user_id, status, joined_at, user:users!user_id(name, avatar_url, county, city, biological_sex, gender, sexual_orientation, birth_date, education_level)')
    .eq('event_id', eventId)
    .order('joined_at', { ascending: true })
  if (error) console.error('[fetchParticipants]', error.message)
  return (data ?? []).map(parseParticipantRow)
}

async function fetchFeedbackData(
  admin: ReturnType<typeof createAdminClient>,
  eventId: string,
  status: string
): Promise<{ feedback: ProtestFeedbackItem[]; averageRating: number }> {
  if (status !== 'completed') return { feedback: [], averageRating: 0 }
  const { data } = await admin
    .from('event_feedback')
    .select('id, rating, comment, created_at, user:users!user_id(name, avatar_url)')
    .eq('event_id', eventId)
    .order('created_at', { ascending: false })
  const feedback: ProtestFeedbackItem[] = (data ?? []).map((row: any) => ({
    id: row.id, rating: row.rating, comment: row.comment ?? null,
    created_at: row.created_at,
    user_name: row.user?.name ?? 'Utilizator necunoscut',
    user_avatar: row.user?.avatar_url ?? null,
  }))
  const averageRating = feedback.length > 0
    ? feedback.reduce((s, f) => s + f.rating, 0) / feedback.length : 0
  return { feedback, averageRating }
}

// ─── BOYCOTT ─────────────────────────────────────────────────────────────────

export type BoycottBrandStat = {
  id: string
  name: string
  link: string | null
  alternatives: Array<{ name: string; link: string | null; reason: string | null }>
}

export type BoycottStatsData = {
  id: string; title: string; status: string; view_count: number
  participants_count: number; created_at: string
  reason: string; method: string; brands: BoycottBrandStat[]
  participants: ProtestParticipant[]; feedback: ProtestFeedbackItem[]; averageRating: number
}

export async function getBoycottStats(
  eventId: string,
  context: 'user' | 'org',
  orgId?: string
): Promise<BoycottStatsData | null> {
  const supabase = await createClient()
  const admin = createAdminClient()
  const userId = await getUserId()
  if (!userId) return null

  const event = await checkEventAccess(supabase, eventId, 'boycott', userId, context, orgId)
  if (!event) return null

  const [boycottResult, participants, feedbackData] = await Promise.all([
    admin.from('boycotts')
      .select('reason, method, brands:boycott_brands(id, name, link, alternatives:boycott_alternatives(name, link, reason))')
      .eq('event_id', eventId).single(),
    fetchParticipants(admin, eventId),
    fetchFeedbackData(admin, eventId, event.status),
  ])

  if (!boycottResult.data) return null

  const brands: BoycottBrandStat[] = (boycottResult.data.brands as any[] ?? []).map((b: any) => ({
    id: b.id, name: b.name, link: b.link ?? null,
    alternatives: (b.alternatives ?? []).map((a: any) => ({ name: a.name, link: a.link ?? null, reason: a.reason ?? null })),
  }))

  return { ...event, reason: boycottResult.data.reason, method: boycottResult.data.method, brands, participants, ...feedbackData }
}

// ─── PETITION ────────────────────────────────────────────────────────────────

export type PetitionSigner = {
  user_id: string; name: string; email: string; county: string | null
  signed_at: string
  biological_sex: string | null; gender: string | null; sexual_orientation: string | null
  birth_date: string | null; education_level: string | null
}

export type PetitionStatsData = {
  id: string; title: string; status: string; view_count: number
  participants_count: number; created_at: string
  target_signatures: number; what_is_requested: string
  requested_from: string; why_important: string; contact_person: string | null
  signers: PetitionSigner[]
  feedback: ProtestFeedbackItem[]; averageRating: number
}

export async function getPetitionStats(
  eventId: string,
  context: 'user' | 'org',
  orgId?: string
): Promise<PetitionStatsData | null> {
  const supabase = await createClient()
  const admin = createAdminClient()
  const userId = await getUserId()
  if (!userId) return null

  const event = await checkEventAccess(supabase, eventId, 'petition', userId, context, orgId)
  if (!event) return null

  const [petitionResult, signersResult, feedbackData] = await Promise.all([
    admin.from('petitions')
      .select('target_signatures, what_is_requested, requested_from, why_important, contact_person')
      .eq('event_id', eventId).single(),
    admin.from('petition_signatures')
      .select('user_id, joined_at, user:users!user_id(name, email, county, biological_sex, gender, sexual_orientation, birth_date, education_level)')
      .eq('event_id', eventId).order('joined_at', { ascending: false }),
    fetchFeedbackData(admin, eventId, event.status),
  ])

  if (!petitionResult.data) return null

  const signers: PetitionSigner[] = (signersResult.data ?? []).map((row: any) => ({
    user_id: row.user_id,
    name: row.user?.name ?? 'Utilizator necunoscut',
    email: row.user?.email ?? '',
    county: row.user?.county ?? null,
    signed_at: row.joined_at,
    biological_sex: row.user?.biological_sex ?? null,
    gender: row.user?.gender ?? null,
    sexual_orientation: row.user?.sexual_orientation ?? null,
    birth_date: row.user?.birth_date ?? null,
    education_level: row.user?.education_level ?? null,
  }))

  return {
    ...event,
    target_signatures: petitionResult.data.target_signatures,
    what_is_requested: petitionResult.data.what_is_requested,
    requested_from: petitionResult.data.requested_from,
    why_important: petitionResult.data.why_important,
    contact_person: petitionResult.data.contact_person ?? null,
    signers,
    ...feedbackData,
  }
}

// ─── COMMUNITY OUTDOOR & WORKSHOP (shared shape) ─────────────────────────────

export type CommunityPhysicalStatsData = {
  id: string; title: string; subcategory: 'outdoor' | 'workshop'; status: string
  view_count: number; participants_count: number; created_at: string
  date: string; time_start: string; time_end: string | null
  max_participants: number | null; recommended_equipment: string | null
  what_organizer_offers: string | null
  participants: ProtestParticipant[]; feedback: ProtestFeedbackItem[]; averageRating: number
}

export async function getOutdoorActivityStats(
  eventId: string,
  context: 'user' | 'org',
  orgId?: string
): Promise<CommunityPhysicalStatsData | null> {
  const supabase = await createClient()
  const admin = createAdminClient()
  const userId = await getUserId()
  if (!userId) return null

  const event = await checkEventAccess(supabase, eventId, 'community', userId, context, orgId)
  if (!event || event.subcategory !== 'outdoor') return null

  const [communityResult, participants, feedbackData] = await Promise.all([
    admin.from('community_activities').select('id').eq('event_id', eventId).single(),
    fetchParticipants(admin, eventId),
    fetchFeedbackData(admin, eventId, event.status),
  ])
  if (!communityResult.data) return null

  const { data: sub } = await admin.from('outdoor_activities')
    .select('date, time_start, time_end, recommended_equipment, what_organizer_offers, max_participants')
    .eq('community_activity_id', communityResult.data.id).single()
  if (!sub) return null

  return { ...event, subcategory: 'outdoor', date: sub.date, time_start: sub.time_start, time_end: sub.time_end ?? null, max_participants: sub.max_participants ?? null, recommended_equipment: sub.recommended_equipment ?? null, what_organizer_offers: sub.what_organizer_offers ?? null, participants, ...feedbackData }
}

export async function getWorkshopStats(
  eventId: string,
  context: 'user' | 'org',
  orgId?: string
): Promise<CommunityPhysicalStatsData | null> {
  const supabase = await createClient()
  const admin = createAdminClient()
  const userId = await getUserId()
  if (!userId) return null

  const event = await checkEventAccess(supabase, eventId, 'community', userId, context, orgId)
  if (!event || event.subcategory !== 'workshop') return null

  const [communityResult, participants, feedbackData] = await Promise.all([
    admin.from('community_activities').select('id').eq('event_id', eventId).single(),
    fetchParticipants(admin, eventId),
    fetchFeedbackData(admin, eventId, event.status),
  ])
  if (!communityResult.data) return null

  const { data: sub } = await admin.from('workshops')
    .select('date, time_start, time_end, max_participants, recommended_equipment, what_organizer_offers')
    .eq('community_activity_id', communityResult.data.id).single()
  if (!sub) return null

  return { ...event, subcategory: 'workshop', date: sub.date, time_start: sub.time_start, time_end: sub.time_end ?? null, max_participants: sub.max_participants ?? null, recommended_equipment: sub.recommended_equipment ?? null, what_organizer_offers: sub.what_organizer_offers ?? null, participants, ...feedbackData }
}

// ─── COMMUNITY DONATIONS ──────────────────────────────────────────────────────

export type DonationActivityStatsData = {
  id: string; title: string; status: string; view_count: number
  participants_count: number; created_at: string
  donation_type: 'material' | 'monetary'; what_is_needed: string[] | null; target_amount: number | null
  participants: ProtestParticipant[]; feedback: ProtestFeedbackItem[]; averageRating: number
}

export async function getDonationActivityStats(
  eventId: string,
  context: 'user' | 'org',
  orgId?: string
): Promise<DonationActivityStatsData | null> {
  const supabase = await createClient()
  const admin = createAdminClient()
  const userId = await getUserId()
  if (!userId) return null

  const event = await checkEventAccess(supabase, eventId, 'community', userId, context, orgId)
  if (!event || event.subcategory !== 'donations') return null

  const [communityResult, participants, feedbackData] = await Promise.all([
    admin.from('community_activities').select('id').eq('event_id', eventId).single(),
    fetchParticipants(admin, eventId),
    fetchFeedbackData(admin, eventId, event.status),
  ])
  if (!communityResult.data) return null

  const { data: sub } = await admin.from('donations')
    .select('donation_type, what_is_needed, target_amount')
    .eq('community_activity_id', communityResult.data.id).single()
  if (!sub) return null

  return { ...event, donation_type: sub.donation_type as 'material' | 'monetary', what_is_needed: sub.what_is_needed ?? null, target_amount: sub.target_amount ?? null, participants, ...feedbackData }
}

// ─── CHARITY LIVE EVENTS (concert / meet_greet / sport) ──────────────────────

export type CharityLiveEventStatsData = {
  id: string; title: string; subcategory: 'concert' | 'meet_greet' | 'sport'
  status: string; view_count: number; participants_count: number; created_at: string
  date: string; time_start: string; time_end: string | null
  max_participants: number | null; ticket_price: number | null
  performers: string[] | null; guests: string[] | null
  target_amount: number | null; collected_amount: number | null
  participants: ProtestParticipant[]; feedback: ProtestFeedbackItem[]; averageRating: number
}

export async function getCharityConcertStats(
  eventId: string,
  context: 'user' | 'org',
  orgId?: string
): Promise<CharityLiveEventStatsData | null> {
  const supabase = await createClient()
  const admin = createAdminClient()
  const userId = await getUserId()
  if (!userId) return null

  const event = await checkEventAccess(supabase, eventId, 'charity', userId, context, orgId)
  if (!event || event.subcategory !== 'concert') return null

  const [charityResult, participants, feedbackData] = await Promise.all([
    admin.from('charity_events').select('id, target_amount, collected_amount').eq('event_id', eventId).single(),
    fetchParticipants(admin, eventId),
    fetchFeedbackData(admin, eventId, event.status),
  ])
  if (!charityResult.data) return null

  const { data: sub } = await admin.from('charity_concerts')
    .select('date, time_start, time_end, performers, ticket_price, max_participants')
    .eq('charity_event_id', charityResult.data.id).single()
  if (!sub) return null

  return { ...event, subcategory: 'concert', date: sub.date, time_start: sub.time_start, time_end: sub.time_end ?? null, max_participants: sub.max_participants ?? null, ticket_price: sub.ticket_price ?? null, performers: sub.performers ?? null, guests: null, target_amount: charityResult.data.target_amount ?? null, collected_amount: charityResult.data.collected_amount ?? null, participants, ...feedbackData }
}

export async function getMeetGreetStats(
  eventId: string,
  context: 'user' | 'org',
  orgId?: string
): Promise<CharityLiveEventStatsData | null> {
  const supabase = await createClient()
  const admin = createAdminClient()
  const userId = await getUserId()
  if (!userId) return null

  const event = await checkEventAccess(supabase, eventId, 'charity', userId, context, orgId)
  if (!event || event.subcategory !== 'meet_greet') return null

  const [charityResult, participants, feedbackData] = await Promise.all([
    admin.from('charity_events').select('id, target_amount, collected_amount').eq('event_id', eventId).single(),
    fetchParticipants(admin, eventId),
    fetchFeedbackData(admin, eventId, event.status),
  ])
  if (!charityResult.data) return null

  const { data: sub } = await admin.from('meet_greets')
    .select('date, time_start, time_end, guests, ticket_price, max_participants')
    .eq('charity_event_id', charityResult.data.id).single()
  if (!sub) return null

  return { ...event, subcategory: 'meet_greet', date: sub.date, time_start: sub.time_start, time_end: sub.time_end ?? null, max_participants: sub.max_participants ?? null, ticket_price: sub.ticket_price ?? null, performers: null, guests: sub.guests ?? null, target_amount: charityResult.data.target_amount ?? null, collected_amount: charityResult.data.collected_amount ?? null, participants, ...feedbackData }
}

export async function getSportActivityStats(
  eventId: string,
  context: 'user' | 'org',
  orgId?: string
): Promise<CharityLiveEventStatsData | null> {
  const supabase = await createClient()
  const admin = createAdminClient()
  const userId = await getUserId()
  if (!userId) return null

  const event = await checkEventAccess(supabase, eventId, 'charity', userId, context, orgId)
  if (!event || event.subcategory !== 'sport') return null

  const [charityResult, participants, feedbackData] = await Promise.all([
    admin.from('charity_events').select('id, target_amount, collected_amount').eq('event_id', eventId).single(),
    fetchParticipants(admin, eventId),
    fetchFeedbackData(admin, eventId, event.status),
  ])
  if (!charityResult.data) return null

  const { data: sub } = await admin.from('sports_activities')
    .select('date, time_start, time_end, guests, ticket_price, max_participants')
    .eq('charity_event_id', charityResult.data.id).single()
  if (!sub) return null

  return { ...event, subcategory: 'sport', date: sub.date, time_start: sub.time_start, time_end: sub.time_end ?? null, max_participants: sub.max_participants ?? null, ticket_price: sub.ticket_price ?? null, performers: null, guests: sub.guests ?? null, target_amount: charityResult.data.target_amount ?? null, collected_amount: charityResult.data.collected_amount ?? null, participants, ...feedbackData }
}

// ─── CHARITY LIVESTREAM ───────────────────────────────────────────────────────

export type LivestreamStatsData = {
  id: string; title: string; status: string; view_count: number
  participants_count: number; created_at: string
  time_start: string; time_end: string | null
  stream_link: string; cause: string; guests: string[] | null
  target_amount: number | null; collected_amount: number | null
  participants: ProtestParticipant[]; feedback: ProtestFeedbackItem[]; averageRating: number
}

export async function getLivestreamStats(
  eventId: string,
  context: 'user' | 'org',
  orgId?: string
): Promise<LivestreamStatsData | null> {
  const supabase = await createClient()
  const admin = createAdminClient()
  const userId = await getUserId()
  if (!userId) return null

  const event = await checkEventAccess(supabase, eventId, 'charity', userId, context, orgId)
  if (!event || event.subcategory !== 'livestream') return null

  const [charityResult, participants, feedbackData] = await Promise.all([
    admin.from('charity_events').select('id, target_amount, collected_amount').eq('event_id', eventId).single(),
    fetchParticipants(admin, eventId),
    fetchFeedbackData(admin, eventId, event.status),
  ])
  if (!charityResult.data) return null

  const { data: sub } = await admin.from('charity_livestreams')
    .select('stream_link, cause, time_start, time_end, guests')
    .eq('charity_event_id', charityResult.data.id).single()
  if (!sub) return null

  return { ...event, time_start: sub.time_start, time_end: sub.time_end ?? null, stream_link: sub.stream_link, cause: sub.cause, guests: sub.guests ?? null, target_amount: charityResult.data.target_amount ?? null, collected_amount: charityResult.data.collected_amount ?? null, participants, ...feedbackData }
}
