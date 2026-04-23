'use server'

import { createClient } from '@/lib/supabase/server'

export type EventPreview = {
  id: string
  title: string
  banner_url: string | null
  category: 'protest' | 'boycott' | 'petition' | 'community' | 'charity'
  subcategory: string | null
  status: 'pending' | 'approved' | 'rejected' | 'contested' | 'completed'
  date: string        // din subtabel (protests, outdoor_activities etc.) sau created_at fallback
  created_at: string
  participants_count: number
  view_count: number
}

export type EventFilters = {
  cauta?: string
  categorie?: 'protest' | 'boycott' | 'petition' | 'community' | 'charity'
  sort?: 'data_desc' | 'data_asc' | 'participanti'
  data_de?: string
  data_pana?: string
}

const SELECT_FIELDS =
  'id, title, banner_url, category, subcategory, status, created_at, participants_count, view_count, ' +
  'protests(date), ' +
  'community_activities(outdoor_activities(date), workshops(date)), ' +
  'charity_events(charity_concerts(date), meet_greets(date), sports_activities(date))'

// Tipuri care au dată în subtabel: protest, community (outdoor/workshop), charity (concert/meet_greet/sport)
// Tipuri fără dată (boycott, petition, donation, livestream): fallback la created_at
function extractDate(row: any): string {
  const d =
    row.protests?.date ??
    row.community_activities?.outdoor_activities?.date ??
    row.community_activities?.workshops?.date ??
    row.charity_events?.charity_concerts?.date ??
    row.charity_events?.meet_greets?.date ??
    row.charity_events?.sports_activities?.date
  return d ?? (row.created_at as string).slice(0, 10)
}

function mapRow(row: any): EventPreview {
  return {
    id: row.id,
    title: row.title,
    banner_url: row.banner_url,
    category: row.category,
    subcategory: row.subcategory,
    status: row.status,
    date: extractDate(row),
    created_at: row.created_at,
    participants_count: row.participants_count,
    view_count: row.view_count,
  }
}

export async function getEvents(
  filters: EventFilters,
  page: number = 1,
  pageSize: number = 12
): Promise<{ events: EventPreview[]; total: number }> {
  const supabase = await createClient()

  let query = supabase
    .from('events')
    .select(SELECT_FIELDS, { count: 'exact' })
    .in('status', ['approved', 'completed'])

  if (filters.cauta) {
    query = query.ilike('title', `%${filters.cauta}%`)
  }
  if (filters.categorie) {
    query = query.eq('category', filters.categorie)
  }
  if (filters.data_de) {
    query = query.gte('created_at', filters.data_de)
  }
  if (filters.data_pana) {
    query = query.lte('created_at', filters.data_pana)
  }

  if (filters.sort === 'data_asc') {
    query = query.order('created_at', { ascending: true })
  } else if (filters.sort === 'participanti') {
    query = query
      .order('participants_count', { ascending: false })
      .order('created_at', { ascending: false })
  } else {
    query = query.order('created_at', { ascending: false })
  }

  const from = (page - 1) * pageSize
  query = query.range(from, from + pageSize - 1)

  const { data, count, error } = await query
  if (error) console.error('[getEvents]', error.message)

  return { events: (data ?? []).map(mapRow), total: count ?? 0 }
}

export async function getRecentEvents(limit: number): Promise<EventPreview[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('events')
    .select(SELECT_FIELDS)
    .in('status', ['approved', 'completed'])
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) console.error('[getRecentEvents]', error.message)
  return (data ?? []).map(mapRow)
}
