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
    categorii?: Array<'protest' | 'boycott' | 'petition' | 'community' | 'charity'>
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
    if (filters.categorii && filters.categorii.length > 0) {
        query = query.in('category', filters.categorii)
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

// ─── Boycott Detail ───────────────────────────────────────────────────────────

const SELECT_BOYCOTT = `
  id, title, description, banner_url, gallery_urls, category, subcategory,
  status, creator_id, creator_type, organization_id, view_count, participants_count, created_at,
  boycotts(
    reason, method,
    boycott_brands(
      id, name, link,
      boycott_alternatives(id, name, link, reason)
    )
  ),
  creator:users!creator_id(name, avatar_url),
  organization:organizations!organization_id(name, logo_url)
`

export type BoycottBrand = {
    id: string
    name: string
    link: string | null
    alternatives: Array<{ id: string; name: string; link: string; reason: string | null }>
}

export type BoycottDetail = {
    id: string
    title: string
    description: string
    banner_url: string | null
    gallery_urls: string[]
    category: 'boycott'
    subcategory: null
    status: 'pending' | 'approved' | 'rejected' | 'contested' | 'completed'
    creator_id: string
    creator_type: 'user' | 'ngo'
    organization_id: string | null
    view_count: number
    participants_count: number
    created_at: string
    boycott: {
        reason: string
        method: string
        brands: BoycottBrand[]
    }
    creator: { name: string; avatar_url: string | null }
    organization: { name: string; logo_url: string | null } | null
}

function mapBoycottRow(row: any): BoycottDetail {
    return {
        id: row.id,
        title: row.title,
        description: row.description,
        banner_url: row.banner_url,
        gallery_urls: row.gallery_urls ?? [],
        category: 'boycott',
        subcategory: null,
        status: row.status,
        creator_id: row.creator_id,
        creator_type: row.creator_type,
        organization_id: row.organization_id,
        view_count: row.view_count,
        participants_count: row.participants_count,
        created_at: row.created_at,
        boycott: {
            reason: row.boycotts?.reason ?? '',
            method: row.boycotts?.method ?? '',
            brands: (row.boycotts?.boycott_brands ?? []).map((b: any) => ({
                id: b.id,
                name: b.name,
                link: b.link ?? null,
                alternatives: (b.boycott_alternatives ?? []).map((a: any) => ({
                    id: a.id,
                    name: a.name,
                    link: a.link,
                    reason: a.reason ?? null,
                })),
            })),
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

export const getBoycottById = cache(async (id: string): Promise<BoycottDetail | null> => {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('events')
        .select(SELECT_BOYCOTT)
        .eq('id', id)
        .eq('category', 'boycott')
        .in('status', ['approved', 'completed'])
        .maybeSingle()

    if (error) console.error('[getBoycottById]', error.message)
    if (!data) return null

    return mapBoycottRow(data)
})

// ─── Community Detail ─────────────────────────────────────────────────────────

const SELECT_COMMUNITY = `
  id, title, description, banner_url, gallery_urls, category, subcategory,
  status, creator_id, creator_type, organization_id, view_count, participants_count, created_at,
  community_activities(
    contact_person,
    outdoor_activities(location, date, time_start, time_end, recommended_equipment, what_organizer_offers, max_participants),
    donations(donation_type, what_is_needed, target_amount),
    workshops(location, date, time_start, time_end, max_participants, recommended_equipment, what_organizer_offers)
  ),
  creator:users!creator_id(name, avatar_url),
  organization:organizations!organization_id(name, logo_url)
`

export type CommunityDetail = {
    id: string
    title: string
    description: string
    banner_url: string | null
    gallery_urls: string[]
    category: 'community'
    subcategory: 'outdoor' | 'donations' | 'workshop'
    status: 'pending' | 'approved' | 'rejected' | 'contested' | 'completed'
    creator_id: string
    creator_type: 'user' | 'ngo'
    organization_id: string | null
    view_count: number
    participants_count: number
    created_at: string
    community: {
        contact_person: string | null
        outdoor: {
            location: [number, number]
            date: string
            time_start: string
            time_end: string | null
            recommended_equipment: string | null
            what_organizer_offers: string | null
            max_participants: number | null
        } | null
        donation: {
            donation_type: 'material' | 'monetary'
            what_is_needed: string[] | null
            target_amount: number | null
        } | null
        workshop: {
            location: [number, number]
            date: string
            time_start: string
            time_end: string | null
            max_participants: number | null
            recommended_equipment: string | null
            what_organizer_offers: string | null
        } | null
    }
    creator: { name: string; avatar_url: string | null }
    organization: { name: string; logo_url: string | null } | null
}

function mapCommunityRow(row: any): CommunityDetail {
    const ca = row.community_activities
    return {
        id: row.id,
        title: row.title,
        description: row.description,
        banner_url: row.banner_url,
        gallery_urls: row.gallery_urls ?? [],
        category: 'community',
        subcategory: row.subcategory,
        status: row.status,
        creator_id: row.creator_id,
        creator_type: row.creator_type,
        organization_id: row.organization_id,
        view_count: row.view_count,
        participants_count: row.participants_count,
        created_at: row.created_at,
        community: {
            contact_person: ca?.contact_person ?? null,
            outdoor: ca?.outdoor_activities
                ? {
                    location: ca.outdoor_activities.location as [number, number],
                    date: ca.outdoor_activities.date,
                    time_start: ca.outdoor_activities.time_start,
                    time_end: ca.outdoor_activities.time_end ?? null,
                    recommended_equipment: ca.outdoor_activities.recommended_equipment ?? null,
                    what_organizer_offers: ca.outdoor_activities.what_organizer_offers ?? null,
                    max_participants: ca.outdoor_activities.max_participants ?? null,
                }
                : null,
            donation: ca?.donations
                ? {
                    donation_type: ca.donations.donation_type,
                    what_is_needed: ca.donations.what_is_needed ?? null,
                    target_amount: ca.donations.target_amount ?? null,
                }
                : null,
            workshop: ca?.workshops
                ? {
                    location: ca.workshops.location as [number, number],
                    date: ca.workshops.date,
                    time_start: ca.workshops.time_start,
                    time_end: ca.workshops.time_end ?? null,
                    max_participants: ca.workshops.max_participants ?? null,
                    recommended_equipment: ca.workshops.recommended_equipment ?? null,
                    what_organizer_offers: ca.workshops.what_organizer_offers ?? null,
                }
                : null,
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

export const getCommunityById = cache(async (id: string): Promise<CommunityDetail | null> => {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('events')
        .select(SELECT_COMMUNITY)
        .eq('id', id)
        .eq('category', 'community')
        .in('status', ['approved', 'completed'])
        .maybeSingle()

    if (error) console.error('[getCommunityById]', error.message)
    if (!data) return null

    return mapCommunityRow(data)
})

// ─── Charity Detail ───────────────────────────────────────────────────────────

const SELECT_CHARITY = `
  id, title, description, banner_url, gallery_urls, category, subcategory,
  status, creator_id, creator_type, organization_id, view_count, participants_count, created_at,
  charity_events(
    target_amount, collected_amount,
    charity_concerts(location, date, time_start, time_end, performers, ticket_price, ticket_link, max_participants),
    meet_greets(location, date, time_start, time_end, guests, ticket_price, ticket_link, max_participants),
    charity_livestreams(stream_link, cause, time_start, time_end, guests),
    sports_activities(location, date, time_start, time_end, guests, ticket_price, ticket_link, max_participants)
  ),
  creator:users!creator_id(name, avatar_url),
  organization:organizations!organization_id(name, logo_url)
`

export type CharityDetail = {
    id: string
    title: string
    description: string
    banner_url: string | null
    gallery_urls: string[]
    category: 'charity'
    subcategory: 'concert' | 'meet_greet' | 'livestream' | 'sport'
    status: 'pending' | 'approved' | 'rejected' | 'contested' | 'completed'
    creator_id: string
    creator_type: 'user' | 'ngo'
    organization_id: string | null
    view_count: number
    participants_count: number
    created_at: string
    charity: {
        target_amount: number | null
        collected_amount: number | null
        concert: {
            location: [number, number]
            date: string
            time_start: string
            time_end: string | null
            performers: string[]
            ticket_price: number | null
            ticket_link: string | null
            max_participants: number | null
        } | null
        meet_greet: {
            location: [number, number]
            date: string
            time_start: string
            time_end: string | null
            guests: string[]
            ticket_price: number | null
            ticket_link: string | null
            max_participants: number | null
        } | null
        livestream: {
            stream_link: string
            cause: string
            time_start: string
            time_end: string | null
            guests: string[] | null
        } | null
        sport: {
            location: [number, number]
            date: string
            time_start: string
            time_end: string | null
            guests: string[] | null
            ticket_price: number | null
            ticket_link: string | null
            max_participants: number | null
        } | null
    }
    creator: { name: string; avatar_url: string | null }
    organization: { name: string; logo_url: string | null } | null
}

function mapCharityRow(row: any): CharityDetail {
    const ce = row.charity_events
    return {
        id: row.id,
        title: row.title,
        description: row.description,
        banner_url: row.banner_url,
        gallery_urls: row.gallery_urls ?? [],
        category: 'charity',
        subcategory: row.subcategory,
        status: row.status,
        creator_id: row.creator_id,
        creator_type: row.creator_type,
        organization_id: row.organization_id,
        view_count: row.view_count,
        participants_count: row.participants_count,
        created_at: row.created_at,
        charity: {
            target_amount: ce?.target_amount ?? null,
            collected_amount: ce?.collected_amount ?? null,
            concert: ce?.charity_concerts
                ? {
                    location: ce.charity_concerts.location as [number, number],
                    date: ce.charity_concerts.date,
                    time_start: ce.charity_concerts.time_start,
                    time_end: ce.charity_concerts.time_end ?? null,
                    performers: ce.charity_concerts.performers ?? [],
                    ticket_price: ce.charity_concerts.ticket_price ?? null,
                    ticket_link: ce.charity_concerts.ticket_link ?? null,
                    max_participants: ce.charity_concerts.max_participants ?? null,
                }
                : null,
            meet_greet: ce?.meet_greets
                ? {
                    location: ce.meet_greets.location as [number, number],
                    date: ce.meet_greets.date,
                    time_start: ce.meet_greets.time_start,
                    time_end: ce.meet_greets.time_end ?? null,
                    guests: ce.meet_greets.guests ?? [],
                    ticket_price: ce.meet_greets.ticket_price ?? null,
                    ticket_link: ce.meet_greets.ticket_link ?? null,
                    max_participants: ce.meet_greets.max_participants ?? null,
                }
                : null,
            livestream: ce?.charity_livestreams
                ? {
                    stream_link: ce.charity_livestreams.stream_link,
                    cause: ce.charity_livestreams.cause,
                    time_start: ce.charity_livestreams.time_start,
                    time_end: ce.charity_livestreams.time_end ?? null,
                    guests: ce.charity_livestreams.guests ?? null,
                }
                : null,
            sport: ce?.sports_activities
                ? {
                    location: ce.sports_activities.location as [number, number],
                    date: ce.sports_activities.date,
                    time_start: ce.sports_activities.time_start,
                    time_end: ce.sports_activities.time_end ?? null,
                    guests: ce.sports_activities.guests ?? null,
                    ticket_price: ce.sports_activities.ticket_price ?? null,
                    ticket_link: ce.sports_activities.ticket_link ?? null,
                    max_participants: ce.sports_activities.max_participants ?? null,
                }
                : null,
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

export const getCharityById = cache(async (id: string): Promise<CharityDetail | null> => {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('events')
        .select(SELECT_CHARITY)
        .eq('id', id)
        .eq('category', 'charity')
        .in('status', ['approved', 'completed'])
        .maybeSingle()

    if (error) console.error('[getCharityById]', error.message)
    if (!data) return null

    return mapCharityRow(data)
})

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
