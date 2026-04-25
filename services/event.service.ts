'use server'

import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'

export type EventPreview = {
    id: string
    title: string
    description: string
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
    'id, title, description, banner_url, category, subcategory, status, created_at, participants_count, view_count, ' +
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
        description: row.description,
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

// ─── Protest Detail ──────────────────────────────────────────────────────────

const SELECT_PROTEST = `
  id, title, description, banner_url, gallery_urls, category, subcategory,
  status, creator_id, creator_type, organization_id, view_count, participants_count, created_at,
  protests(
    date, time_start, time_end, max_participants, recommended_equipment, safety_rules, contact_person,
    gatherings(location),
    marches(locations),
    pickets(location)
  ),
  creator:users!creator_id(name, avatar_url),
  organization:organizations!organization_id(name, logo_url)
`

export type ProtestDetail = {
    id: string
    title: string
    description: string
    banner_url: string | null
    gallery_urls: string[]
    category: 'protest'
    subcategory: 'gathering' | 'march' | 'picket'
    status: 'pending' | 'approved' | 'rejected' | 'contested' | 'completed'
    creator_id: string
    creator_type: 'user' | 'ngo'
    organization_id: string | null
    view_count: number
    participants_count: number
    created_at: string
    protest: {
        date: string
        time_start: string
        time_end: string | null
        max_participants: number
        recommended_equipment: string | null
        safety_rules: string | null
        contact_person: string | null
        gathering: { location: [number, number] } | null
        march: { locations: [number, number][] } | null
        picket: { location: [number, number] } | null
    }
    creator: { name: string; avatar_url: string | null }
    organization: { name: string; logo_url: string | null } | null
}

function mapProtestRow(row: any): ProtestDetail {
    return {
        id: row.id,
        title: row.title,
        description: row.description,
        banner_url: row.banner_url,
        gallery_urls: row.gallery_urls ?? [],
        category: 'protest',
        subcategory: row.subcategory,
        status: row.status,
        creator_id: row.creator_id,
        creator_type: row.creator_type,
        organization_id: row.organization_id,
        view_count: row.view_count,
        participants_count: row.participants_count,
        created_at: row.created_at,
        protest: {
            date: row.protests?.date ?? '',
            time_start: row.protests?.time_start ?? '',
            time_end: row.protests?.time_end ?? null,
            max_participants: row.protests?.max_participants ?? 0,
            recommended_equipment: row.protests?.recommended_equipment ?? null,
            safety_rules: row.protests?.safety_rules ?? null,
            contact_person: row.protests?.contact_person ?? null,
            gathering: row.protests?.gatherings ?? null,
            march: row.protests?.marches ?? null,
            picket: row.protests?.pickets ?? null,
        },
        creator: {
            name: row.creator?.name ?? 'Anonim',
            avatar_url: row.creator?.avatar_url ?? null,
        },
        organization: row.organization
            ? { name: row.organization.name, logo_url: row.organization.logo_url ?? null }
            : null,
    }
}

export const getProtestById = cache(async (id: string): Promise<ProtestDetail | null> => {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('events')
        .select(SELECT_PROTEST)
        .eq('id', id)
        .eq('category', 'protest')
        .in('status', ['approved', 'completed'])
        .maybeSingle()

    if (error) console.error('[getProtestById]', error.message)
    if (!data) return null

    return mapProtestRow(data)
})

export async function incrementViewCount(id: string): Promise<void> {
    const supabase = await createClient()
    const { error } = await supabase.rpc('increment_view_count', { event_id: id })
    if (error) console.error('[incrementViewCount]', error.message)
}

// ─── Petition Detail ─────────────────────────────────────────────────────────

const SELECT_PETITION = `
  id, title, description, banner_url, gallery_urls, category, subcategory,
  status, creator_id, creator_type, organization_id, view_count, participants_count, created_at,
  petitions(
    what_is_requested, requested_from, target_signatures, why_important, contact_person
  ),
  creator:users!creator_id(name, avatar_url),
  organization:organizations!organization_id(name, logo_url)
`

export type PetitionDetail = {
    id: string
    title: string
    description: string
    banner_url: string | null
    gallery_urls: string[]
    category: 'petition'
    subcategory: null
    status: 'pending' | 'approved' | 'rejected' | 'contested' | 'completed'
    creator_id: string
    creator_type: 'user' | 'ngo'
    organization_id: string | null
    view_count: number
    participants_count: number
    created_at: string
    petition: {
        what_is_requested: string
        requested_from: string
        target_signatures: number
        why_important: string
        contact_person: string | null
    }
    creator: { name: string; avatar_url: string | null }
    organization: { name: string; logo_url: string | null } | null
}

function mapPetitionRow(row: any): PetitionDetail {
    return {
        id: row.id,
        title: row.title,
        description: row.description,
        banner_url: row.banner_url,
        gallery_urls: row.gallery_urls ?? [],
        category: 'petition',
        subcategory: null,
        status: row.status,
        creator_id: row.creator_id,
        creator_type: row.creator_type,
        organization_id: row.organization_id,
        view_count: row.view_count,
        participants_count: row.participants_count,
        created_at: row.created_at,
        petition: {
            what_is_requested: row.petitions?.what_is_requested ?? '',
            requested_from: row.petitions?.requested_from ?? '',
            target_signatures: row.petitions?.target_signatures ?? 0,
            why_important: row.petitions?.why_important ?? '',
            contact_person: row.petitions?.contact_person ?? null,
        },
        creator: {
            name: row.creator?.name ?? 'Anonim',
            avatar_url: row.creator?.avatar_url ?? null,
        },
        organization: row.organization
            ? { name: row.organization.name, logo_url: row.organization.logo_url ?? null }
            : null,
    }
}

export const getPetitionById = cache(async (id: string): Promise<PetitionDetail | null> => {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('events')
        .select(SELECT_PETITION)
        .eq('id', id)
        .eq('category', 'petition')
        .in('status', ['approved', 'completed'])
        .maybeSingle()

    if (error) console.error('[getPetitionById]', error.message)
    if (!data) return null

    return mapPetitionRow(data)
})
