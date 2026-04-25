'use server'

import { createClient } from '@/lib/supabase/server'

export type RecentSigner = {
    id: string
    user_id: string
    name: string
    avatar_url: string | null
    signed_at: string
}

export async function getRecentSigners(eventId: string, limit = 5): Promise<RecentSigner[]> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('petition_signatures')
        .select('id, user_id, joined_at, user:users!user_id(name, avatar_url)')
        .eq('event_id', eventId)
        .order('joined_at', { ascending: false })
        .limit(limit)

    if (error) console.error('[getRecentSigners]', error.message)

    return (data ?? []).map((row: any) => ({
        id: row.id,
        user_id: row.user_id,
        name: row.user?.name ?? 'Anonim',
        avatar_url: row.user?.avatar_url ?? null,
        signed_at: row.joined_at,
    }))
}
