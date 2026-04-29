// app/sitemap.ts
import type { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'

const CATEGORY_SLUG: Record<string, string> = {
  protest: 'protest',
  boycott: 'boycott',
  petition: 'petitie',
  community: 'comunitar',
  charity: 'caritabil',
}

const BASE = 'https://civicom.ro'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient()

  const [{ data: events }, { data: orgs }] = await Promise.all([
    supabase
      .from('events')
      .select('id, category, updated_at')
      .in('status', ['approved', 'completed'])
      .order('updated_at', { ascending: false }),
    supabase
      .from('organizations')
      .select('id, updated_at')
      .eq('status', 'approved')
      .order('updated_at', { ascending: false }),
  ])

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE}/`, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${BASE}/evenimente`, lastModified: new Date(), changeFrequency: 'hourly', priority: 0.9 },
    { url: `${BASE}/organizatii`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
  ]

  const eventRoutes: MetadataRoute.Sitemap = (events ?? [])
    .filter(e => CATEGORY_SLUG[e.category])
    .map(e => ({
      url: `${BASE}/evenimente/${CATEGORY_SLUG[e.category]}/${e.id}`,
      lastModified: new Date(e.updated_at),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))

  const orgRoutes: MetadataRoute.Sitemap = (orgs ?? []).map(o => ({
    url: `${BASE}/organizatii/${o.id}`,
    lastModified: new Date(o.updated_at),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }))

  return [...staticRoutes, ...eventRoutes, ...orgRoutes]
}
