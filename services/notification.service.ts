'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export type Notification = {
  id: string
  title: string
  message: string
  type: string | null
  read: boolean
  created_at: string
}

export async function createNotification(
  userId: string,
  title: string,
  message: string,
  type?: string
): Promise<void> {
  const supabase = createAdminClient()
  await supabase.from('notifications').insert({ user_id: userId, title, message, type })
}

export async function getUserNotifications(): Promise<Notification[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []
  const { data, error } = await supabase
    .from('notifications')
    .select('id, title, message, type, read, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20)
  if (error) return []
  return data ?? []
}

export async function markAllNotificationsAsRead(): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', user.id)
    .eq('read', false)
}
