'use server'

import { createClient } from '@/lib/supabase/server'
import type { EventPreview } from './event.service'
export type { EventPreview } from './event.service'

export type HomepageStats = {
  eventsCount: number
  volunteersCount: number
  orgsCount: number
  citiesCount: number
}

export type OrgPreview = {
  id: string
  name: string
  logo_url: string | null
}

export async function getHomepageStats(): Promise<HomepageStats> {
  const supabase = await createClient()

  const [eventsResult, volunteersResult, orgsResult] = await Promise.all([
    supabase
      .from('events')
      .select('*', { count: 'exact', head: true })
      .in('status', ['approved', 'completed']),
    supabase.from('users').select('*', { count: 'exact', head: true }),
    supabase
      .from('organizations')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'approved'),
  ])

  return {
    eventsCount: eventsResult.count ?? 0,
    volunteersCount: volunteersResult.count ?? 0,
    orgsCount: orgsResult.count ?? 0,
    citiesCount: 12, // hardcodat — tabelul events nu are câmp city normalizat
  }
}

export async function getRecentEvents(limit: number): Promise<EventPreview[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('events')
    .select(
      'id, title, banner_url, category, subcategory, status, date, created_at, participants_count, view_count'
    )
    .in('status', ['approved', 'completed'])
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) console.error('[getRecentEvents]', error.message)
  return data ?? []
}

export async function getApprovedOrgs(): Promise<OrgPreview[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('organizations')
    .select('id, name, logo_url')
    .eq('status', 'approved')
    .order('created_at', { ascending: true })

  if (error) console.error('[getApprovedOrgs]', error.message)
  return data ?? []
}
