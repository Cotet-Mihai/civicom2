'use server'

import { createClient } from '@/lib/supabase/server'

export type HomepageStats = {
  eventsCount: number
  volunteersCount: number
  orgsCount: number
  citiesCount: number
}

export type EventPreview = {
  id: string
  title: string
  banner_url: string | null
  category: string
  subcategory: string | null
  status: string
  created_at: string
  creator_id: string
  organization_id: string | null
  participants_count: number
  view_count: number
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
    supabase
      .from('users')
      .select('*', { count: 'exact', head: true }),
    supabase
      .from('organizations')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'approved'),
  ])

  return {
    eventsCount: eventsResult.count ?? 0,
    volunteersCount: volunteersResult.count ?? 0,
    orgsCount: orgsResult.count ?? 0,
    citiesCount: 12,
  }
}

export async function getRecentEvents(limit: number): Promise<EventPreview[]> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('events')
    .select('id, title, banner_url, category, subcategory, status, created_at, creator_id, organization_id, participants_count, view_count')
    .in('status', ['approved', 'completed'])
    .order('created_at', { ascending: false })
    .limit(limit)

  return data ?? []
}

export async function getApprovedOrgs(): Promise<OrgPreview[]> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('organizations')
    .select('id, name, logo_url')
    .eq('status', 'approved')
    .order('created_at', { ascending: true })

  return data ?? []
}
