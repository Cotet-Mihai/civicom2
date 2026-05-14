'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export type Notification = {
  id: string
  title: string
  message: string
  type: string | null
  link: string | null
  read: boolean
  created_at: string
}

export async function createNotification(
  userId: string,
  title: string,
  message: string,
  type?: string,
  link?: string
): Promise<void> {
  const supabase = createAdminClient()
  await supabase.from('notifications').insert({ user_id: userId, title, message, type, link: link ?? null })
}

export async function getUserNotifications(): Promise<Notification[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []
  const { data: userRow } = await supabase
    .from('users')
    .select('id')
    .eq('auth_users_id', user.id)
    .single()
  if (!userRow) return []
  const { data, error } = await supabase
    .from('notifications')
    .select('id, title, message, type, link, read, created_at')
    .eq('user_id', userRow.id)
    .order('created_at', { ascending: false })
    .limit(20)
  if (error) return []
  return data ?? []
}

export async function markNotificationAsRead(notificationId: string): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  const { data: userRow } = await supabase
    .from('users')
    .select('id')
    .eq('auth_users_id', user.id)
    .single()
  if (!userRow) return
  await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', notificationId)
    .eq('user_id', userRow.id)
}

export async function markAllNotificationsAsRead(): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  const { data: userRow } = await supabase
    .from('users')
    .select('id')
    .eq('auth_users_id', user.id)
    .single()
  if (!userRow) return
  await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', userRow.id)
    .eq('read', false)
}

export async function deleteNotification(notificationId: string): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  const { data: userRow } = await supabase
    .from('users')
    .select('id')
    .eq('auth_users_id', user.id)
    .single()
  if (!userRow) return
  await supabase
    .from('notifications')
    .delete()
    .eq('id', notificationId)
    .eq('user_id', userRow.id)
}
