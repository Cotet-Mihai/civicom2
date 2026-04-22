'use server'

import { createClient } from '@/lib/supabase/server'

export async function getUserOrgId(userId: string): Promise<string | null> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle()

  return data?.organization_id ?? null
}
