'use server'

import { createClient } from '@/lib/supabase/server'

export type EventFeedback = {
  id: string
  user_id: string
  rating: number
  comment: string | null
  created_at: string
  user: { name: string; avatar_url: string | null }
}

export type FeedbackSummary = {
  feedbacks: EventFeedback[]
  averageRating: number
  totalCount: number
}

export async function getFeedback(eventId: string): Promise<FeedbackSummary> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('event_feedback')
    .select('id, user_id, rating, comment, created_at, user:users!user_id(name, avatar_url)')
    .eq('event_id', eventId)
    .order('created_at', { ascending: false })

  if (error) console.error('[getFeedback]', error.message)

  const feedbacks: EventFeedback[] = (data ?? []).map((row: any) => ({
    id: row.id,
    user_id: row.user_id,
    rating: row.rating,
    comment: row.comment ?? null,
    created_at: row.created_at,
    user: {
      name: row.user?.name ?? 'Anonim',
      avatar_url: row.user?.avatar_url ?? null,
    },
  }))

  const averageRating =
    feedbacks.length > 0
      ? feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length
      : 0

  return { feedbacks, averageRating, totalCount: feedbacks.length }
}

export async function getUserFeedback(
  eventId: string,
  userId: string
): Promise<EventFeedback | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('event_feedback')
    .select('id, user_id, rating, comment, created_at, user:users!user_id(name, avatar_url)')
    .eq('event_id', eventId)
    .eq('user_id', userId)
    .maybeSingle()

  if (error) console.error('[getUserFeedback]', error.message)
  if (!data) return null

  return {
    id: data.id,
    user_id: data.user_id,
    rating: data.rating,
    comment: data.comment ?? null,
    created_at: data.created_at,
    user: {
      name: (data as any).user?.name ?? 'Anonim',
      avatar_url: (data as any).user?.avatar_url ?? null,
    },
  }
}
