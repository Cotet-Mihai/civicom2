'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { ViewRange } from '@/services/user.service'
export type { ViewRange }

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
      .select('user_id, status, joined_at, user:users!user_id(name, avatar_url, county, city, biological_sex, gender, birth_date, education_level)')
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
