'use server'

import { createClient } from '@/lib/supabase/server'

export type EventSuggestion = {
    id: string
    content: string
    created_at: string
    user_name: string
    user_email: string
}

export async function getSuggestions(): Promise<EventSuggestion[]> {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('event_suggestions')
        .select('id, content, created_at, users(name, email)')
        .order('created_at', { ascending: false })

    if (error || !data) return []

    return data.map((s: any) => ({
        id: s.id,
        content: s.content,
        created_at: s.created_at,
        user_name: s.users?.name ?? '—',
        user_email: s.users?.email ?? '—',
    }))
}

export async function createEventSuggestion(content: string): Promise<{ error?: string }> {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Neautentificat' }

    const { data: profile } = await supabase
        .from('users')
        .select('id')
        .eq('auth_users_id', user.id)
        .single()

    if (!profile) return { error: 'Utilizatorul nu a fost găsit' }

    const { error } = await supabase
        .from('event_suggestions')
        .insert({ user_id: profile.id, content: content.trim() })

    if (error) return { error: error.message }
    return {}
}
