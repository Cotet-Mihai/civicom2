'use server'

import { createAdminClient } from '@/lib/supabase/admin'

export async function createNotification(
  userId: string,
  title: string,
  message: string,
  type?: string
): Promise<void> {
  const supabase = createAdminClient()
  await supabase.from('notifications').insert({ user_id: userId, title, message, type })
}
