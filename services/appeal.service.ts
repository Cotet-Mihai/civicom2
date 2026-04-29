'use server'

import { createClient } from '@/lib/supabase/server'
import { createNotification } from '@/services/notification.service'

// ============================================================
// TYPES
// ============================================================

export type AdminAppeal = {
  id: string
  event_id: string
  event_title: string
  event_status: string
  event_rejection_note: string | null
  creator_name: string
  reason: string
  status: string
  admin_note: string | null
  created_at: string
}

type AppealRow = {
  id: string
  event_id: string
  user_id: string
  reason: string
  status: string
  admin_note: string | null
  created_at: string
  event: { title: string; status: string; rejection_note: string | null; creator_id: string } | null
  user: { name: string } | null
}

type AppealDetailRow = {
  id: string
  event_id: string
  user_id: string
  reason: string
  status: string
  event: { title: string; status: string; creator_id: string } | null
}

// ============================================================
// USER ACTIONS
// ============================================================

export async function createAppeal(
  eventId: string,
  reason: string
): Promise<{ ok: true } | { error: string }> {
  if (reason.trim().length < 20) return { error: 'Motivul trebuie să aibă minim 20 de caractere' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Neautentificat' }

  const { data: userRow } = await supabase
    .from('users')
    .select('id')
    .eq('auth_users_id', user.id)
    .single()
  if (!userRow) return { error: 'Utilizator negăsit' }

  // Verify event is rejected and belongs to current user
  const { data: evtRow } = await supabase
    .from('events')
    .select('id, status, creator_id')
    .eq('id', eventId)
    .single()
  if (!evtRow) return { error: 'Eveniment negăsit' }
  if (evtRow.creator_id !== userRow.id) return { error: 'Nu ești creatorul acestui eveniment' }
  if (evtRow.status !== 'rejected') return { error: 'Poți contesta doar un eveniment respins' }

  // Check no existing pending/under_review appeal
  const { data: existingAppeal } = await supabase
    .from('appeals')
    .select('id, status')
    .eq('event_id', eventId)
    .eq('user_id', userRow.id)
    .in('status', ['pending', 'under_review'])
    .maybeSingle()
  if (existingAppeal) return { error: 'Ai deja o contestație activă pentru acest eveniment' }

  // Insert appeal
  const { error: insertError } = await supabase
    .from('appeals')
    .insert({ event_id: eventId, user_id: userRow.id, reason: reason.trim(), status: 'pending' })
  if (insertError) return { error: insertError.message }

  // Update event status to contested
  const { error: updateError } = await supabase
    .from('events')
    .update({ status: 'contested' })
    .eq('id', eventId)
  if (updateError) return { error: updateError.message }

  return { ok: true }
}

// ============================================================
// ADMIN ACTIONS
// ============================================================

export async function getAllAppeals(): Promise<AdminAppeal[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('appeals')
    .select(`
      id, event_id, user_id, reason, status, admin_note, created_at,
      event:events!event_id(title, status, rejection_note, creator_id),
      user:users!user_id(name)
    `)
    .in('status', ['pending', 'under_review'])
    .order('created_at', { ascending: true })

  if (error) {
    console.error('[getAllAppeals]', error.message)
    return []
  }

  return ((data ?? []) as unknown as AppealRow[]).map(row => ({
    id: row.id,
    event_id: row.event_id,
    event_title: row.event?.title ?? 'Eveniment necunoscut',
    event_status: row.event?.status ?? '',
    event_rejection_note: row.event?.rejection_note ?? null,
    creator_name: row.user?.name ?? 'Necunoscut',
    reason: row.reason,
    status: row.status,
    admin_note: row.admin_note ?? null,
    created_at: row.created_at,
  }))
}

export async function resolveAppeal(
  appealId: string,
  decision: 'approved' | 'rejected',
  adminNote: string
): Promise<{ ok: true } | { error: string }> {
  if (decision === 'rejected' && adminNote.trim().length < 10) {
    return { error: 'Motivul respingerii trebuie să aibă minim 10 caractere' }
  }

  const supabase = await createClient()

  // Get current admin user DB id
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Neautentificat' }
  const { data: adminRow } = await supabase
    .from('users')
    .select('id, role')
    .eq('auth_users_id', user.id)
    .single()
  if (!adminRow || adminRow.role !== 'admin') return { error: 'Acces interzis' }

  // Fetch appeal with event info
  const { data: appealRaw } = await supabase
    .from('appeals')
    .select('id, event_id, user_id, status, event:events!event_id(title, status, creator_id)')
    .eq('id', appealId)
    .single()
  if (!appealRaw) return { error: 'Contestație negăsită' }
  const appeal = appealRaw as unknown as AppealDetailRow
  if (appeal.status === 'resolved') return { error: 'Contestația a fost deja rezolvată' }
  if (appeal.event?.status !== 'contested') return { error: 'Evenimentul nu mai este în starea contestat' }

  const eventId = appeal.event_id
  const creatorId = appeal.event?.creator_id ?? appeal.user_id
  const eventTitle = appeal.event?.title ?? 'evenimentul tău'

  // Update event status
  if (decision === 'approved') {
    const { error: evtErr } = await supabase
      .from('events')
      .update({ status: 'approved', rejection_note: null })
      .eq('id', eventId)
    if (evtErr) return { error: evtErr.message }
  } else {
    const { error: evtErr } = await supabase
      .from('events')
      .update({ status: 'rejected', rejection_note: adminNote.trim() })
      .eq('id', eventId)
    if (evtErr) return { error: evtErr.message }
  }

  // Mark appeal resolved
  const { error: appealErr } = await supabase
    .from('appeals')
    .update({
      status: 'resolved',
      admin_note: adminNote.trim() || null,
      reviewed_by: adminRow.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', appealId)
  if (appealErr) return { error: appealErr.message }

  // Send notification to creator
  if (decision === 'approved') {
    try {
      await createNotification(
        creatorId,
        'Contestație aprobată ✅',
        `Contestația ta pentru evenimentul "${eventTitle}" a fost aprobată. Evenimentul este acum vizibil public.`,
        'appeal_approved'
      )
    } catch (err) {
      console.error('[resolveAppeal] notification failed:', err)
    }
  } else {
    try {
      await createNotification(
        creatorId,
        'Contestație respinsă ❌',
        `Contestația ta pentru evenimentul "${eventTitle}" a fost respinsă. Motiv: ${adminNote.trim()}`,
        'appeal_rejected'
      )
    } catch (err) {
      console.error('[resolveAppeal] notification failed:', err)
    }
  }

  return { ok: true }
}
