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
    .select('id, name, avatar_url, created_at')
    .eq('auth_users_id', user.id)
    .single()

  if (!data) return null
  return {
    id: data.id,
    name: data.name,
    email: user.email ?? '',
    avatar_url: data.avatar_url ?? null,
    created_at: data.created_at,
  }
}

export async function updateUserProfile(name: string): Promise<{ ok: true } | { error: string }> {
  if (name.trim().length < 2) return { error: 'Numele trebuie să aibă minim 2 caractere' }

  const supabase = await createClient()
  const userId = await getUserId()
  if (!userId) return { error: 'Neautentificat' }

  const { error } = await supabase
    .from('users')
    .update({ name: name.trim() })
    .eq('id', userId)

  if (error) return { error: error.message }

  // Sync auth metadata so Navbar reflects the new name after router.refresh()
  await supabase.auth.updateUser({ data: { name: name.trim() } })

  return { ok: true }
}

export type EventsStats = {
  total: number
  approved: number
  pending: number
  completed: number
  rejected: number
}

export type EventsChartData = {
  topByViews: { title: string; view_count: number }[]
  topByParticipants: { title: string; participants_count: number }[]
  byCategory: { category: string; count: number }[]
  byStatus: { status: string; count: number }[]
  byMonth: { month: string; count: number }[]
}

export async function getMyEventsStats(
  context: 'user' | 'org',
  orgId?: string
): Promise<EventsStats> {
  const supabase = await createClient()
  const userId = await getUserId()
  if (!userId) return { total: 0, approved: 0, pending: 0, completed: 0, rejected: 0 }

  const query = supabase.from('events').select('status')
  const { data } = await (
    context === 'org' && orgId
      ? query.eq('organization_id', orgId).eq('creator_type', 'ngo')
      : query.eq('creator_id', userId).eq('creator_type', 'user')
  )
  const events = data ?? []

  return {
    total: events.length,
    approved: events.filter(e => e.status === 'approved').length,
    pending: events.filter(e => e.status === 'pending' || e.status === 'contested').length,
    completed: events.filter(e => e.status === 'completed').length,
    rejected: events.filter(e => e.status === 'rejected').length,
  }
}

export async function getMyEventsChartData(
  context: 'user' | 'org',
  orgId?: string
): Promise<EventsChartData> {
  const supabase = await createClient()
  const userId = await getUserId()
  if (!userId) return { topByViews: [], topByParticipants: [], byCategory: [], byStatus: [], byMonth: [] }

  const query = supabase
    .from('events')
    .select('title, view_count, participants_count, category, status, created_at')
  const { data } = await (
    context === 'org' && orgId
      ? query.eq('organization_id', orgId).eq('creator_type', 'ngo')
      : query.eq('creator_id', userId).eq('creator_type', 'user')
  )
  const events = data ?? []

  const shorten = (title: string) => title.length > 22 ? title.slice(0, 22) + '…' : title

  const topByViews = [...events]
    .sort((a, b) => b.view_count - a.view_count)
    .slice(0, 5)
    .map(e => ({ title: shorten(e.title), view_count: e.view_count }))

  const topByParticipants = [...events]
    .sort((a, b) => b.participants_count - a.participants_count)
    .slice(0, 5)
    .map(e => ({ title: shorten(e.title), participants_count: e.participants_count }))

  const categoryMap: Record<string, number> = {}
  events.forEach(e => { categoryMap[e.category] = (categoryMap[e.category] ?? 0) + 1 })
  const byCategory = Object.entries(categoryMap).map(([category, count]) => ({ category, count }))

  const statusMap: Record<string, number> = {}
  events.forEach(e => { statusMap[e.status] = (statusMap[e.status] ?? 0) + 1 })
  const byStatus = Object.entries(statusMap).map(([status, count]) => ({ status, count }))

  const now = new Date()
  const byMonth = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
    const label = d.toLocaleDateString('ro-RO', { month: 'short', year: '2-digit' })
    const count = events.filter(e => {
      const ed = new Date(e.created_at)
      return ed.getFullYear() === d.getFullYear() && ed.getMonth() === d.getMonth()
    }).length
    return { month: label, count }
  })

  return { topByViews, topByParticipants, byCategory, byStatus, byMonth }
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
