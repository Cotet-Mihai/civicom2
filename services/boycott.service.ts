'use server'

import { createClient } from '@/lib/supabase/server'

type BrandInput = {
  name: string
  link?: string | null
  alternatives?: Array<{ name: string; link: string; reason?: string | null }>
}

type EventBase = {
  title: string
  description: string
  banner_url: string | null
  gallery_urls: string[]
  organization_id?: string | null
}

type BoycottData = {
  reason: string
  method: string
  brands: BrandInput[]
}

export async function createBoycott(
  eventBase: EventBase,
  boycottData: BoycottData
): Promise<{ id: string } | { error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Neautentificat' }

  const { data: userData } = await supabase.from('users').select('id').eq('auth_users_id', user.id).single()
  if (!userData) return { error: 'Utilizator negăsit' }

  const creatorType = eventBase.organization_id ? 'ngo' : 'user'

  const { data: evt, error: evtErr } = await supabase.from('events').insert({
    title: eventBase.title,
    description: eventBase.description,
    banner_url: eventBase.banner_url,
    gallery_urls: eventBase.gallery_urls,
    category: 'boycott',
    subcategory: null,
    status: 'pending',
    creator_id: userData.id,
    creator_type: creatorType,
    organization_id: eventBase.organization_id ?? null,
  }).select('id').single()

  if (evtErr || !evt) return { error: evtErr?.message ?? 'Eroare creare eveniment' }

  const { data: bo, error: boErr } = await supabase.from('boycotts').insert({
    event_id: evt.id,
    reason: boycottData.reason,
    method: boycottData.method,
  }).select('id').single()

  if (boErr || !bo) return { error: boErr?.message ?? 'Eroare creare boycott' }

  for (const brand of boycottData.brands) {
    const { data: b } = await supabase.from('boycott_brands').insert({
      boycott_id: bo.id,
      name: brand.name,
      link: brand.link ?? null,
    }).select('id').single()

    if (b && brand.alternatives?.length) {
      await supabase.from('boycott_alternatives').insert(
        brand.alternatives.map(a => ({ brand_id: b.id, name: a.name, link: a.link, reason: a.reason ?? null }))
      )
    }
  }

  return { id: evt.id }
}
