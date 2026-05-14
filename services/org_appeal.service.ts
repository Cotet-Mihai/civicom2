'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createNotification } from '@/services/notification.service'

// ============================================================
// TYPES
// ============================================================

export type AdminOrgAppeal = {
  id: string
  org_id: string
  org_name: string
  org_status: string
  org_rejection_note: string | null
  org_logo_url: string | null
  owner_name: string
  reason: string
  status: string
  admin_note: string | null
  created_at: string
  is_edited: boolean
}

type OrgAppealRow = {
  id: string
  org_id: string
  user_id: string
  reason: string
  status: string
  admin_note: string | null
  created_at: string
  org: {
    name: string
    status: string
    rejection_note: string | null
    owner_id: string
    logo_url: string | null
    is_edited: boolean
  } | null
  user: { name: string } | null
}

// ============================================================
// HELPERS
// ============================================================

async function getCurrentUserId(): Promise<string | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('users').select('id').eq('auth_users_id', user.id).single()
  return data?.id ?? null
}

// ============================================================
// USER ACTIONS
// ============================================================

export async function createOrgAppeal(
  orgId: string,
  reason: string
): Promise<{ ok: true } | { error: string }> {
  if (reason.trim().length < 20) return { error: 'Motivul trebuie să aibă minim 20 de caractere' }

  const supabase = await createClient()
  const userId = await getCurrentUserId()
  if (!userId) return { error: 'Neautentificat' }

  // Fetch org and verify status + ownership/admin
  const { data: org } = await supabase
    .from('organizations')
    .select('id, name, status, owner_id')
    .eq('id', orgId)
    .single()
  if (!org) return { error: 'Organizație negăsită' }

  // Check user is owner or org admin
  const isOwner = org.owner_id === userId
  if (!isOwner) {
    const { data: memberRow } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', orgId)
      .eq('user_id', userId)
      .maybeSingle()
    if (!memberRow || memberRow.role !== 'admin') {
      return { error: 'Nu ești proprietarul sau administratorul acestei organizații' }
    }
  }

  if (org.status !== 'rejected') {
    return { error: 'Poți contesta doar o organizație respinsă' }
  }

  // Check no existing pending/under_review appeal for this org + user
  const { data: existingAppeal } = await supabase
    .from('org_appeals')
    .select('id')
    .eq('org_id', orgId)
    .eq('user_id', userId)
    .in('status', ['pending', 'under_review'])
    .maybeSingle()
  if (existingAppeal) return { error: 'Ai deja o contestație activă pentru această organizație' }

  // Insert appeal
  const { error: insertError } = await supabase
    .from('org_appeals')
    .insert({ org_id: orgId, user_id: userId, reason: reason.trim(), status: 'pending' })
  if (insertError) return { error: insertError.message }

  // Update org status to contested
  const { error: updateError } = await supabase
    .from('organizations')
    .update({ status: 'contested', contested_at: new Date().toISOString() })
    .eq('id', orgId)
  if (updateError) return { error: updateError.message }

  return { ok: true }
}

// ============================================================
// ADMIN ACTIONS
// ============================================================

export async function getAllOrgAppeals(): Promise<AdminOrgAppeal[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('org_appeals')
    .select(`
      id, org_id, user_id, reason, status, admin_note, created_at,
      org:organizations!org_id(name, status, rejection_note, owner_id, logo_url, is_edited),
      user:users!user_id(name)
    `)
    .in('status', ['pending', 'under_review'])
    .order('created_at', { ascending: true })

  if (error) {
    console.error('[getAllOrgAppeals]', error.message)
    return []
  }

  return ((data ?? []) as unknown as OrgAppealRow[]).map(row => ({
    id: row.id,
    org_id: row.org_id,
    org_name: row.org?.name ?? 'Organizație necunoscută',
    org_status: row.org?.status ?? '',
    org_rejection_note: row.org?.rejection_note ?? null,
    org_logo_url: row.org?.logo_url ?? null,
    owner_name: row.user?.name ?? 'Necunoscut',
    reason: row.reason,
    status: row.status,
    admin_note: row.admin_note ?? null,
    created_at: row.created_at,
    is_edited: row.org?.is_edited ?? false,
  }))
}

export async function resolveOrgAppeal(
  appealId: string,
  decision: 'approved' | 'rejected',
  adminNote: string
): Promise<{ ok: true } | { error: string }> {
  if (decision === 'rejected' && adminNote.trim().length < 10) {
    return { error: 'Motivul respingerii trebuie să aibă minim 10 caractere' }
  }

  const supabase = await createClient()

  // Verify admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Neautentificat' }
  const { data: adminRow } = await supabase
    .from('users')
    .select('id, role')
    .eq('auth_users_id', user.id)
    .single()
  if (!adminRow || adminRow.role !== 'admin') return { error: 'Acces interzis' }

  // Fetch appeal + org info
  const { data: appealRaw } = await supabase
    .from('org_appeals')
    .select('id, org_id, user_id, status, org:organizations!org_id(name, status, owner_id)')
    .eq('id', appealId)
    .single()
  if (!appealRaw) return { error: 'Contestație negăsită' }

  type AppealDetailRow = {
    id: string
    org_id: string
    user_id: string
    status: string
    org: { name: string; status: string; owner_id: string } | null
  }
  const appeal = appealRaw as unknown as AppealDetailRow

  if (appeal.status === 'resolved') return { error: 'Contestația a fost deja rezolvată' }
  if (appeal.org?.status !== 'contested') return { error: 'Organizația nu mai este în starea contestat' }

  const orgId = appeal.org_id
  const ownerId = appeal.org?.owner_id ?? appeal.user_id
  const orgName = appeal.org?.name ?? 'organizația ta'

  const adminClient = createAdminClient()

  // Update organization status
  if (decision === 'approved') {
    const { error: orgErr } = await adminClient
      .from('organizations')
      .update({
        status: 'approved',
        rejection_note: null,
        is_edited: false,
        previous_snapshot: null,
        contested_at: null,
      })
      .eq('id', orgId)
    if (orgErr) return { error: orgErr.message }
  } else {
    const { error: orgErr } = await adminClient
      .from('organizations')
      .update({ status: 'rejected', rejection_note: adminNote.trim() })
      .eq('id', orgId)
    if (orgErr) return { error: orgErr.message }
  }

  // Mark appeal resolved
  const { error: appealErr } = await supabase
    .from('org_appeals')
    .update({
      status: 'resolved',
      admin_note: adminNote.trim() || null,
      reviewed_by: adminRow.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', appealId)
  if (appealErr) return { error: appealErr.message }

  // Send notification to org owner
  if (decision === 'approved') {
    try {
      await createNotification(
        ownerId,
        'Contestație aprobată ✅',
        `Contestația pentru organizația "${orgName}" a fost aprobată. Organizația este acum vizibilă public.`,
        'org_appeal_approved',
        `/organizatie/${orgId}/panou`
      )
    } catch (err) {
      console.error('[resolveOrgAppeal] notification failed:', err)
    }
  } else {
    try {
      await createNotification(
        ownerId,
        'Contestație respinsă ❌',
        `Contestația pentru organizația "${orgName}" a fost respinsă. Motiv: ${adminNote.trim()}`,
        'org_appeal_rejected',
        `/organizatie/${orgId}/panou`
      )
    } catch (err) {
      console.error('[resolveOrgAppeal] notification failed:', err)
    }
  }

  return { ok: true }
}
