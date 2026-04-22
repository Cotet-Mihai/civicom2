'use server'

import { createClient } from '@/lib/supabase/server'

export type EventPreview = {
  id: string
  title: string
  banner_url: string | null
  category: 'protest' | 'boycott' | 'petition' | 'community' | 'charity'
  subcategory: string | null
  status: string
  date: string
  created_at: string
  participants_count: number
  view_count: number
}

export type EventFilters = {
  cauta?: string
  categorie?: string
  sort?: 'data_desc' | 'data_asc' | 'participanti'
  data_de?: string
  data_pana?: string
}

export async function getEvents(
  filters: EventFilters,
  page: number = 1,
  pageSize: number = 12
): Promise<{ events: EventPreview[]; total: number }> {
  const supabase = await createClient()

  let query = supabase
    .from('events')
    .select(
      'id, title, banner_url, category, subcategory, status, date, created_at, participants_count, view_count',
      { count: 'exact' }
    )
    .in('status', ['approved', 'completed'])

  if (filters.cauta) {
    query = query.ilike('title', `%${filters.cauta}%`)
  }
  if (filters.categorie) {
    query = query.eq('category', filters.categorie)
  }
  if (filters.data_de) {
    query = query.gte('date', filters.data_de)
  }
  if (filters.data_pana) {
    query = query.lte('date', filters.data_pana)
  }

  if (filters.sort === 'data_asc') {
    query = query.order('date', { ascending: true })
  } else if (filters.sort === 'participanti') {
    query = query.order('participants_count', { ascending: false })
  } else {
    query = query.order('date', { ascending: false })
  }

  const from = (page - 1) * pageSize
  query = query.range(from, from + pageSize - 1)

  const { data, count, error } = await query
  if (error) console.error('[getEvents]', error.message)

  return { events: data ?? [], total: count ?? 0 }
}
