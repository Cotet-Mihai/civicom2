'use server'

import { createClient } from '@/lib/supabase/server'

async function getUserId(): Promise<string | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('users').select('id').eq('auth_users_id', user.id).single()
  return data?.id ?? null
}

export type DashboardEvent = {
  id: string
  title: string
  category: string
  subcategory: string | null
  status: string
  participants_count: number
  view_count: number
  created_at: string
  banner_url: string | null
}

export type DashboardAppeal = {
  id: string
  event_id: string
  event_title: string
  status: string
  created_at: string
}

export type UserProfile = {
  id: string
  name: string
  email: string
  avatar_url: string | null
  phone: string | null
  birth_date: string | null
  county: string | null
  city: string | null
  gender: string | null
  biological_sex: string | null
  sexual_orientation: string | null
  education_level: string | null
  created_at: string
}

export async function getUserDashboardStats(): Promise<{
  eventsCreated: number
  participations: number
  petitionsSigned: number
  appeals: number
}> {
  const supabase = await createClient()
  const userId = await getUserId()
  if (!userId) return { eventsCreated: 0, participations: 0, petitionsSigned: 0, appeals: 0 }

  const [
    { count: eventsCreated },
    { count: participations },
    { count: petitionsSigned },
    { count: appeals },
  ] = await Promise.all([
    supabase.from('events').select('*', { count: 'exact', head: true }).eq('creator_id', userId),
    supabase.from('event_participants').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'joined'),
    supabase.from('petition_signatures').select('*', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('appeals').select('*', { count: 'exact', head: true }).eq('user_id', userId),
  ])

  return {
    eventsCreated: eventsCreated ?? 0,
    participations: participations ?? 0,
    petitionsSigned: petitionsSigned ?? 0,
    appeals: appeals ?? 0,
  }
}

export async function getUserCreatedEvents(limit?: number): Promise<DashboardEvent[]> {
  const supabase = await createClient()
  const userId = await getUserId()
  if (!userId) return []

  const query = supabase
    .from('events')
    .select('id, title, category, subcategory, status, participants_count, view_count, created_at, banner_url')
    .eq('creator_id', userId)
    .order('created_at', { ascending: false })

  const { data } = limit ? await query.limit(limit) : await query
  return (data ?? []) as DashboardEvent[]
}

export async function getUserParticipations(limit?: number): Promise<DashboardEvent[]> {
  const supabase = await createClient()
  const userId = await getUserId()
  if (!userId) return []

  const query = supabase
    .from('event_participants')
    .select('event:events!event_id(id, title, category, subcategory, status, participants_count, view_count, created_at, banner_url)')
    .eq('user_id', userId)
    .eq('status', 'joined')
    .order('joined_at', { ascending: false })

  const { data } = limit ? await query.limit(limit) : await query
  return ((data ?? []) as any[]).map((row: any) => row.event as DashboardEvent).filter(Boolean)
}

export async function getUserPetitionsSigned(limit?: number): Promise<DashboardEvent[]> {
  const supabase = await createClient()
  const userId = await getUserId()
  if (!userId) return []

  const query = supabase
    .from('petition_signatures')
    .select('event:events!event_id(id, title, category, subcategory, status, participants_count, created_at, banner_url)')
    .eq('user_id', userId)
    .order('joined_at', { ascending: false })

  const { data } = limit ? await query.limit(limit) : await query
  return ((data ?? []) as any[]).map((row: any) => row.event as DashboardEvent).filter(Boolean)
}

export async function getUserAppeals(): Promise<DashboardAppeal[]> {
  const supabase = await createClient()
  const userId = await getUserId()
  if (!userId) return []

  const { data } = await supabase
    .from('appeals')
    .select('id, event_id, status, created_at, event:events!event_id(title)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  return ((data ?? []) as any[]).map((row: any) => ({
    id: row.id,
    event_id: row.event_id,
    event_title: row.event?.title ?? 'Eveniment necunoscut',
    status: row.status,
    created_at: row.created_at,
  }))
}

export async function getUserProfile(): Promise<UserProfile | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('users')
    .select('id, name, avatar_url, phone, birth_date, county, city, gender, biological_sex, sexual_orientation, education_level, created_at')
    .eq('auth_users_id', user.id)
    .single()

  if (!data) return null
  return {
    id: data.id,
    name: data.name,
    email: user.email ?? '',
    avatar_url: data.avatar_url ?? null,
    phone: data.phone ?? null,
    birth_date: data.birth_date ?? null,
    county: data.county ?? null,
    city: data.city ?? null,
    gender: data.gender ?? null,
    biological_sex: data.biological_sex ?? null,
    sexual_orientation: data.sexual_orientation ?? null,
    education_level: data.education_level ?? null,
    created_at: data.created_at,
  }
}

export type UpdateProfileData = {
  name: string
  phone?: string
  birth_date?: string
  county?: string
  city?: string
  gender?: string
  biological_sex?: string
  sexual_orientation?: string
  education_level?: string
}

export async function updateUserProfile(data: UpdateProfileData): Promise<{ ok: true } | { error: string }> {
  if (data.name.trim().length < 2) return { error: 'Numele trebuie să aibă minim 2 caractere' }

  const supabase = await createClient()
  const userId = await getUserId()
  if (!userId) return { error: 'Neautentificat' }

  const { error } = await supabase
    .from('users')
    .update({
      name: data.name.trim(),
      phone: data.phone || null,
      birth_date: data.birth_date || null,
      county: data.county || null,
      city: data.city || null,
      gender: data.gender || null,
      biological_sex: data.biological_sex || null,
      sexual_orientation: data.sexual_orientation || null,
      education_level: data.education_level || null,
    })
    .eq('id', userId)

  if (error) return { error: error.message }

  await supabase.auth.updateUser({ data: { name: data.name.trim() } })

  return { ok: true }
}

export type EventsStats = {
  total: number
  approved: number
  pending: number
  completed: number
  rejected: number
  totalViews: number
  totalParticipants: number
  approvalRate: number
}

export type EventsChartData = {
  allByViews: { id: string; title: string; view_count: number }[]
  allByParticipants: { id: string; title: string; participants_count: number }[]
  byCategory: { category: string; count: number }[]
  byStatus: { status: string; count: number }[]
}

export async function getMyEventsStats(
  context: 'user' | 'org',
  orgId?: string
): Promise<EventsStats> {
  const supabase = await createClient()
  const userId = await getUserId()
  const empty = { total: 0, approved: 0, pending: 0, completed: 0, rejected: 0, totalViews: 0, totalParticipants: 0, approvalRate: 0 }
  if (!userId) return empty

  const query = supabase.from('events').select('status, view_count, participants_count')
  const { data } = await (
    context === 'org' && orgId
      ? query.eq('organization_id', orgId).eq('creator_type', 'ngo')
      : query.eq('creator_id', userId).eq('creator_type', 'user')
  )
  const events = data ?? []

  const total = events.length
  const approved = events.filter(e => e.status === 'approved').length
  const completed = events.filter(e => e.status === 'completed').length
  const approvalRate = total > 0 ? Math.round(((approved + completed) / total) * 100) : 0

  return {
    total,
    approved,
    pending: events.filter(e => e.status === 'pending' || e.status === 'contested').length,
    completed,
    rejected: events.filter(e => e.status === 'rejected').length,
    totalViews: events.reduce((s, e) => s + (e.view_count ?? 0), 0),
    totalParticipants: events.reduce((s, e) => s + (e.participants_count ?? 0), 0),
    approvalRate,
  }
}

export async function getMyEventsChartData(
  context: 'user' | 'org',
  orgId?: string
): Promise<EventsChartData> {
  const supabase = await createClient()
  const userId = await getUserId()
  if (!userId) return { allByViews: [], allByParticipants: [], byCategory: [], byStatus: [] }

  const query = supabase
    .from('events')
    .select('id, title, view_count, participants_count, category, status')
  const { data } = await (
    context === 'org' && orgId
      ? query.eq('organization_id', orgId)
      : query.eq('creator_id', userId)
  )
  const events = data ?? []

  const shorten = (title: string) => title.length > 22 ? title.slice(0, 22) + '…' : title

  const allByViews = [...events]
    .sort((a, b) => b.view_count - a.view_count)
    .map(e => ({ id: e.id, title: shorten(e.title), view_count: e.view_count }))

  const allByParticipants = [...events]
    .sort((a, b) => b.participants_count - a.participants_count)
    .map(e => ({ id: e.id, title: shorten(e.title), participants_count: e.participants_count }))

  const categoryMap: Record<string, number> = {}
  events.forEach(e => { categoryMap[e.category] = (categoryMap[e.category] ?? 0) + 1 })
  const byCategory = Object.entries(categoryMap).map(([category, count]) => ({ category, count }))

  const statusMap: Record<string, number> = {}
  events.forEach(e => { statusMap[e.status] = (statusMap[e.status] ?? 0) + 1 })
  const byStatus = Object.entries(statusMap).map(([status, count]) => ({ status, count }))

  return { allByViews, allByParticipants, byCategory, byStatus }
}

export async function getOrgCreatedEvents(orgId: string, limit?: number): Promise<DashboardEvent[]> {
  const supabase = await createClient()
  const query = supabase
    .from('events')
    .select('id, title, category, subcategory, status, participants_count, view_count, created_at, banner_url')
    .eq('organization_id', orgId)
    .eq('creator_type', 'ngo')
    .order('created_at', { ascending: false })
  const { data } = limit ? await query.limit(limit) : await query
  return (data ?? []) as DashboardEvent[]
}

export async function getUserAvatarUrl(authUserId: string): Promise<string | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('users')
    .select('avatar_url')
    .eq('auth_users_id', authUserId)
    .single()
  return data?.avatar_url ?? null
}

// ── Evolution chart ──────────────────────────────────────────────────────────

export type TimeRange = '24h' | '7d' | '30d' | '3m' | '6m' | 'all'
export type EvolutionMetric = 'participants' | 'views' | 'signatures'

export type EvolutionSeries = { id: string; name: string; color: string }
export type EvolutionData = {
  chartPoints: Array<Record<string, string | number>>
  series: EvolutionSeries[]
  eventValues: Record<string, number>  // eventId → metric value, for selector display
}

const SERIES_COLORS = [
  '#22c55e', '#eab308', '#f97316', '#3b82f6',
  '#a855f7', '#ec4899', '#06b6d4', '#f59e0b',
]

function getTimeConfig(range: TimeRange): {
  startDate: Date | null
  bucketKey: (d: Date) => string
  labels: string[]
} {
  const now = new Date()

  if (range === '24h') {
    const start = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const labels = Array.from({ length: 24 }, (_, i) => {
      const h = new Date(now.getTime() - (23 - i) * 60 * 60 * 1000)
      return `${h.getHours().toString().padStart(2, '0')}:00`
    })
    return { startDate: start, bucketKey: (d) => `${d.getHours().toString().padStart(2, '0')}:00`, labels }
  }

  if (range === '7d') {
    const start = new Date(now); start.setDate(now.getDate() - 6); start.setHours(0, 0, 0, 0)
    const labels = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start.getTime() + i * 86400000)
      return d.toLocaleDateString('ro-RO', { day: '2-digit', month: 'short' })
    })
    return { startDate: start, bucketKey: (d) => d.toLocaleDateString('ro-RO', { day: '2-digit', month: 'short' }), labels }
  }

  if (range === '30d') {
    const start = new Date(now); start.setDate(now.getDate() - 29); start.setHours(0, 0, 0, 0)
    const labels = Array.from({ length: 30 }, (_, i) => {
      const d = new Date(start.getTime() + i * 86400000)
      return d.toLocaleDateString('ro-RO', { day: '2-digit', month: 'short' })
    })
    return { startDate: start, bucketKey: (d) => d.toLocaleDateString('ro-RO', { day: '2-digit', month: 'short' }), labels }
  }

  if (range === '3m') {
    const start = new Date(now.getFullYear(), now.getMonth() - 2, 1)
    const labels = Array.from({ length: 3 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 2 + i, 1)
      return d.toLocaleDateString('ro-RO', { month: 'long', year: 'numeric' })
    })
    return {
      startDate: start,
      bucketKey: (d) => new Date(d.getFullYear(), d.getMonth(), 1).toLocaleDateString('ro-RO', { month: 'long', year: 'numeric' }),
      labels,
    }
  }

  if (range === '6m') {
    const start = new Date(now.getFullYear(), now.getMonth() - 5, 1)
    const labels = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1)
      return d.toLocaleDateString('ro-RO', { month: 'short', year: 'numeric' })
    })
    return {
      startDate: start,
      bucketKey: (d) => new Date(d.getFullYear(), d.getMonth(), 1).toLocaleDateString('ro-RO', { month: 'short', year: 'numeric' }),
      labels,
    }
  }

  return {
    startDate: null,
    bucketKey: (d) => new Date(d.getFullYear(), d.getMonth(), 1).toLocaleDateString('ro-RO', { month: 'short', year: 'numeric' }),
    labels: [],
  }
}

export async function getEvolutionData(
  timeRange: TimeRange,
  metric: EvolutionMetric,
  context: 'user' | 'org',
  orgId?: string,
): Promise<EvolutionData> {
  const supabase = await createClient()
  const userId = await getUserId()
  if (!userId) return { chartPoints: [], series: [], eventValues: {} }

  const { startDate, bucketKey, labels: predefinedLabels } = getTimeConfig(timeRange)

  const isPetition = metric === 'signatures'

  const eventsQuery = supabase
    .from('events')
    .select('id, title, participants_count, view_count, created_at')
  const scopedQuery = context === 'org' && orgId
    ? eventsQuery.eq('organization_id', orgId)
    : eventsQuery.eq('creator_id', userId)

  const { data: eventRows } = await (
    isPetition
      ? scopedQuery.eq('category', 'petition').order('participants_count', { ascending: false })
      : scopedQuery.neq('category', 'petition').order('participants_count', { ascending: false })
  )

  const events = eventRows ?? []
  if (events.length === 0) return { chartPoints: [], series: [], eventValues: {} }

  // Build label list
  let labels = predefinedLabels
  if (timeRange === 'all') {
    const labelDateMap = new Map<string, number>()
    for (const e of events) {
      const d = new Date(e.created_at)
      const label = bucketKey(d)
      const ts = new Date(d.getFullYear(), d.getMonth(), 1).getTime()
      if (!labelDateMap.has(label)) labelDateMap.set(label, ts)
    }
    const now = new Date()
    const currentLabel = bucketKey(now)
    if (!labelDateMap.has(currentLabel)) {
      labelDateMap.set(currentLabel, new Date(now.getFullYear(), now.getMonth(), 1).getTime())
    }
    labels = [...labelDateMap.entries()].sort((a, b) => a[1] - b[1]).map(([l]) => l)
  }

  if (labels.length === 0) return { chartPoints: [], series: [], eventValues: {} }

  // Each event shows its current metric value from the point it was created onward.
  // Events created before the range start appear from the first bucket (flat line).
  const chartPoints = labels.map(label => {
    const point: Record<string, string | number> = { label }
    for (const e of events) {
      const eventCreatedAt = new Date(e.created_at)
      // If event existed before the range start, treat it as present from bucket 0
      const effectiveStart = startDate && eventCreatedAt < startDate ? startDate : eventCreatedAt
      const effectiveLabel = bucketKey(effectiveStart)
      const effectiveIdx = labels.indexOf(effectiveLabel)
      const thisIdx = labels.indexOf(label)
      point[e.id] = (effectiveIdx !== -1 && thisIdx >= effectiveIdx)
        ? metric === 'views' ? (e.view_count ?? 0) : (e.participants_count ?? 0)
        : 0
    }
    return point
  })

  const series: EvolutionSeries[] = events.map((e, i) => ({
    id: e.id,
    name: e.title.length > 24 ? e.title.slice(0, 24) + '…' : e.title,
    color: SERIES_COLORS[i % SERIES_COLORS.length],
  }))

  const eventValues: Record<string, number> = {}
  for (const e of events) {
    eventValues[e.id] = metric === 'views' ? (e.view_count ?? 0) : (e.participants_count ?? 0)
  }

  return { chartPoints, series, eventValues }
}

export type CompleteProfileData = {
  name: string
  phone?: string
  birth_date: string
  county: string
  city?: string
  gender?: string
  biological_sex: string
  sexual_orientation?: string
  education_level: string
}

export async function completeProfile(data: CompleteProfileData): Promise<{ ok: true } | { error: string }> {
  if (data.name.trim().length < 2) return { error: 'Numele trebuie să aibă minim 2 caractere' }
  if (!data.birth_date) return { error: 'Data nașterii este obligatorie' }
  if (!data.county?.trim()) return { error: 'Județul este obligatoriu' }
  if (!data.biological_sex) return { error: 'Sexul biologic este obligatoriu' }
  if (!data.education_level) return { error: 'Nivelul de studii este obligatoriu' }

  const supabase = await createClient()
  const userId = await getUserId()
  if (!userId) return { error: 'Neautentificat' }

  const { error } = await supabase
    .from('users')
    .update({
      name: data.name.trim(),
      phone: data.phone || null,
      birth_date: data.birth_date,
      county: data.county.trim(),
      city: data.city?.trim() || null,
      gender: data.gender || null,
      biological_sex: data.biological_sex,
      sexual_orientation: data.sexual_orientation || null,
      education_level: data.education_level,
      is_profile_complete: true,
    })
    .eq('id', userId)

  if (error) return { error: error.message }
  return { ok: true }
}

export async function updateAvatar(avatarUrl: string): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient()
  const userId = await getUserId()
  if (!userId) return { error: 'Neautentificat' }

  const { error } = await supabase
    .from('users')
    .update({ avatar_url: avatarUrl })
    .eq('id', userId)

  if (error) return { error: error.message }
  return { ok: true }
}
