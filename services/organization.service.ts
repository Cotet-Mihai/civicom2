'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// ============================================================
// PUBLIC TYPES
// ============================================================

export type OrgListItem = {
  id: string
  name: string
  description: string | null
  logo_url: string | null
  banner_url: string | null
  website: string | null
  rating: number
  created_at: string
  categories: string[]
  members_count: number
}

export type OrgMember = {
  user_id: string
  name: string
  role: string
  joined_at: string
}

export type OrgDetail = {
  id: string
  name: string
  description: string | null
  website: string | null
  iban: string | null
  logo_url: string | null
  banner_url: string | null
  status: string
  rating: number
  owner_id: string
  created_at: string
  members: OrgMember[]
  events_count: number
  categories: string[]
  cui: string | null
  reg_number: string | null
  org_type: string | null
  email: string | null
  phone: string | null
  address: string | null
  postal_code: string | null
  city: string | null
  documents: OrgDocument[]
}

export type OrgEvent = {
  id: string
  title: string
  category: string
  subcategory: string | null
  status: string
  banner_url: string | null
  created_at: string
  participants_count: number
}

export type OrgStats = {
  membersCount: number
  eventsCount: number
  rating: number
}

export type OrgDocument = {
  id: string
  doc_type: string
  file_name: string
  storage_path: string
  created_at: string
}

// ============================================================
// INTERNAL ROW TYPES
// ============================================================

type OrgRow = {
  id: string; name: string; description: string | null
  logo_url: string | null; banner_url: string | null; website: string | null
  rating: number; created_at: string; categories: string[]
}

type OrgDetailRow = {
  id: string; name: string; description: string | null
  website: string | null; iban: string | null
  logo_url: string | null; banner_url: string | null; status: string; rating: number
  owner_id: string; created_at: string; categories: string[]
  cui: string | null; reg_number: string | null; org_type: string | null
  email: string | null; phone: string | null; address: string | null
  postal_code: string | null; city: string | null
}

type OrgMemberRow = {
  user_id: string; role: string; joined_at: string
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
// READ FUNCTIONS
// ============================================================

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

export async function getUserOrg(userId: string): Promise<{ id: string; name: string; logo_url: string | null } | null> {
  const orgId = await getUserOrgId(userId)
  if (!orgId) return null
  const supabase = await createClient()
  const { data: org } = await supabase
    .from('organizations')
    .select('id, name, logo_url')
    .eq('id', orgId)
    .single()
  return org ?? null
}

export async function getUserOrgByAuthId(
  authUserId: string
): Promise<{ id: string; name: string; logo_url: string | null } | null> {
  const supabase = await createClient()
  const { data: userRow } = await supabase
    .from('users')
    .select('id')
    .eq('auth_users_id', authUserId)
    .maybeSingle()
  if (!userRow) return null
  return getUserOrg(userRow.id)
}

export async function getOrgMemberRole(orgId: string): Promise<'admin' | 'member' | null> {
  const supabase = await createClient()
  const userId = await getCurrentUserId()
  if (!userId) return null
  const { data } = await supabase
    .from('organization_members')
    .select('role')
    .eq('organization_id', orgId)
    .eq('user_id', userId)
    .maybeSingle()
  return (data?.role as 'admin' | 'member') ?? null
}

export async function getOrganizations(filters?: { status?: string }): Promise<OrgListItem[]> {
  const adminClient = createAdminClient()
  const status = filters?.status ?? 'approved'
  const { data, error } = await adminClient
    .from('organizations')
    .select('id, name, description, logo_url, banner_url, website, rating, created_at, categories, organization_members(count)')
    .eq('status', status)
    .order('rating', { ascending: false })
  if (error) console.error('[getOrganizations]', error.message)
  return (data ?? []).map((row: Record<string, unknown>) => ({
    ...row,
    members_count: (row.organization_members as { count: number }[] | null)?.[0]?.count ?? 0,
  })) as OrgListItem[]
}

export async function getOrganizationById(id: string): Promise<OrgDetail | null> {
  const adminClient = createAdminClient()

  const { data: orgRaw, error: orgErr } = await adminClient
    .from('organizations')
    .select('id, name, description, website, iban, logo_url, banner_url, status, rating, owner_id, created_at, categories, cui, reg_number, org_type, email, phone, address, postal_code, city')
    .eq('id', id)
    .single()
  if (orgErr || !orgRaw) return null
  const org = orgRaw as OrgDetailRow

  const [{ data: membersRaw }, { count: events_count }, { data: docsRaw }] = await Promise.all([
    adminClient
      .from('organization_members')
      .select('user_id, role, joined_at, user:users!user_id(name)')
      .eq('organization_id', id)
      .order('joined_at', { ascending: true }),
    adminClient
      .from('events')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', id)
      .in('status', ['approved', 'completed']),
    adminClient
      .from('org_documents')
      .select('id, doc_type, file_name, storage_path, created_at')
      .eq('org_id', id)
      .order('created_at', { ascending: true }),
  ])

  const members: OrgMember[] = ((membersRaw ?? []) as unknown as OrgMemberRow[]).map(m => ({
    user_id: m.user_id,
    name: m.user?.name ?? 'Utilizator',
    role: m.role,
    joined_at: m.joined_at,
  }))

  const documents: OrgDocument[] = (docsRaw ?? []) as OrgDocument[]
  return { ...org, members, events_count: events_count ?? 0, documents }
}

export async function getOrganizationPublicEvents(orgId: string): Promise<OrgEvent[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('events')
    .select('id, title, category, subcategory, status, banner_url, created_at, participants_count')
    .eq('organization_id', orgId)
    .in('status', ['approved', 'completed'])
    .order('created_at', { ascending: false })
  if (error) console.error('[getOrganizationPublicEvents]', error.message)
  return (data ?? []) as OrgEvent[]
}

export async function getOrganizationEvents(orgId: string): Promise<OrgEvent[]> {
  const adminClient = createAdminClient()
  const role = await getOrgMemberRole(orgId)
  if (!role) return []
  const { data, error } = await adminClient
    .from('events')
    .select('id, title, category, subcategory, status, banner_url, created_at, participants_count')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })
  if (error) console.error('[getOrganizationEvents]', error.message)
  return (data ?? []) as OrgEvent[]
}

export async function getOrgDashboardStats(orgId: string): Promise<OrgStats> {
  const adminClient = createAdminClient()
  const [
    { count: membersCount },
    { count: eventsCount },
    { data: orgData },
  ] = await Promise.all([
    adminClient.from('organization_members').select('*', { count: 'exact', head: true }).eq('organization_id', orgId),
    adminClient.from('events').select('*', { count: 'exact', head: true }).eq('organization_id', orgId).in('status', ['approved', 'completed']),
    adminClient.from('organizations').select('rating').eq('id', orgId).single(),
  ])
  return {
    membersCount: membersCount ?? 0,
    eventsCount: eventsCount ?? 0,
    rating: (orgData as { rating: number } | null)?.rating ?? 0,
  }
}

export async function getOrganizationMembers(orgId: string): Promise<OrgMember[]> {
  const adminClient = createAdminClient()
  const role = await getOrgMemberRole(orgId)
  if (!role) return []
  const { data } = await adminClient
    .from('organization_members')
    .select('user_id, role, joined_at, user:users!user_id(name)')
    .eq('organization_id', orgId)
    .order('joined_at', { ascending: true })
  return ((data ?? []) as unknown as OrgMemberRow[]).map(m => ({
    user_id: m.user_id,
    name: m.user?.name ?? 'Utilizator',
    role: m.role,
    joined_at: m.joined_at,
  }))
}

export async function getOrganizationRatings(orgId: string): Promise<{ average: number; total: number }> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('organization_ratings')
    .select('rating')
    .eq('organization_id', orgId)
  const ratings = (data ?? []) as { rating: number }[]
  if (ratings.length === 0) return { average: 0, total: 0 }
  const average = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
  return { average: Math.round(average * 10) / 10, total: ratings.length }
}

export async function getUserRatingForOrganization(orgId: string): Promise<number | null> {
  const supabase = await createClient()
  const userId = await getCurrentUserId()
  if (!userId) return null
  const { data } = await supabase
    .from('organization_ratings')
    .select('rating')
    .eq('organization_id', orgId)
    .eq('user_id', userId)
    .maybeSingle()
  return (data as { rating: number } | null)?.rating ?? null
}

// ============================================================
// MUTATION FUNCTIONS
// ============================================================

export async function createOrganization(data: {
  name: string
  description?: string
  iban?: string
  website?: string
  logo_url?: string
  banner_url?: string
  categories: string[]
  cui?: string
  reg_number?: string
  org_type?: string
  email?: string
  phone?: string
  address?: string
  postal_code?: string
  city?: string
}): Promise<{ ok: true; orgId: string } | { error: string }> {
  if (data.name.trim().length < 2) return { error: 'Numele trebuie să aibă minim 2 caractere' }
  if (data.categories.length === 0)
    return { error: 'Selectează cel puțin un domeniu de activitate' }

  const supabase = await createClient()
  const userId = await getCurrentUserId()
  if (!userId) return { error: 'Neautentificat' }

  const { data: org, error: orgErr } = await supabase
    .from('organizations')
    .insert({
      name: data.name.trim(),
      description: data.description?.trim() || null,
      iban: data.iban?.trim() || null,
      website: data.website?.trim() || null,
      logo_url: data.logo_url || null,
      banner_url: data.banner_url || null,
      owner_id: userId,
      categories: data.categories,
      cui: data.cui?.trim() || null,
      reg_number: data.reg_number?.trim() || null,
      org_type: data.org_type || null,
      email: data.email?.trim() || null,
      phone: data.phone?.trim() || null,
      address: data.address?.trim() || null,
      postal_code: data.postal_code?.trim() || null,
      city: data.city?.trim() || null,
    })
    .select('id')
    .single()

  if (orgErr || !org) return { error: orgErr?.message ?? 'Eroare la creare organizație' }

  const { error: memberErr } = await supabase
    .from('organization_members')
    .insert({ organization_id: (org as { id: string }).id, user_id: userId, role: 'admin' })

  if (memberErr) console.error('[createOrganization] member insert', memberErr.message)

  return { ok: true, orgId: (org as { id: string }).id }
}

export async function updateOrganization(
  orgId: string,
  data: {
    name?: string
    description?: string | null
    website?: string | null
    iban?: string | null
    logo_url?: string | null
    banner_url?: string | null
    categories?: string[]
    cui?: string | null
    reg_number?: string | null
    org_type?: string | null
    email?: string | null
    phone?: string | null
    address?: string | null
    postal_code?: string | null
    city?: string | null
  }
): Promise<{ ok: true } | { error: string }> {
  const role = await getOrgMemberRole(orgId)
  if (role !== 'admin') return { error: 'Acces interzis — trebuie să fii admin ONG' }

  const supabase = await createClient()
  const update: Record<string, unknown> = {}
  if (data.name !== undefined) update.name = data.name.trim()
  if (data.description !== undefined) update.description = data.description || null
  if (data.website !== undefined) update.website = data.website || null
  if (data.iban !== undefined) update.iban = data.iban || null
  if (data.logo_url !== undefined) update.logo_url = data.logo_url || null
  if (data.banner_url !== undefined) update.banner_url = data.banner_url || null
  if (data.cui !== undefined) update.cui = data.cui?.trim() || null
  if (data.reg_number !== undefined) update.reg_number = data.reg_number?.trim() || null
  if (data.org_type !== undefined) update.org_type = data.org_type || null
  if (data.email !== undefined) update.email = data.email?.trim() || null
  if (data.phone !== undefined) update.phone = data.phone?.trim() || null
  if (data.address !== undefined) update.address = data.address?.trim() || null
  if (data.postal_code !== undefined) update.postal_code = data.postal_code?.trim() || null
  if (data.city !== undefined) update.city = data.city?.trim() || null
  if (data.categories !== undefined) {
    if (data.categories.length === 0)
      return { error: 'Selectează cel puțin un domeniu de activitate' }
    update.categories = data.categories
  }

  const { error } = await supabase.from('organizations').update(update).eq('id', orgId)
  if (error) return { error: error.message }
  return { ok: true }
}

export async function inviteMember(orgId: string, email: string): Promise<{ ok: true } | { error: string }> {
  const role = await getOrgMemberRole(orgId)
  if (role !== 'admin') return { error: 'Acces interzis' }

  const supabase = await createClient()
  const { data: targetUser } = await supabase
    .from('users')
    .select('id')
    .eq('email', email.trim().toLowerCase())
    .maybeSingle()
  if (!targetUser) return { error: 'Niciun utilizator găsit cu acest email' }

  const { error } = await supabase
    .from('organization_members')
    .insert({ organization_id: orgId, user_id: (targetUser as { id: string }).id, role: 'member' })

  if (error) {
    if (error.code === '23505') return { error: 'Utilizatorul este deja membru' }
    return { error: error.message }
  }
  return { ok: true }
}

export async function removeMember(orgId: string, targetUserId: string): Promise<{ ok: true } | { error: string }> {
  const role = await getOrgMemberRole(orgId)
  if (role !== 'admin') return { error: 'Acces interzis' }

  const supabase = await createClient()
  const { data: admins } = await supabase
    .from('organization_members')
    .select('user_id')
    .eq('organization_id', orgId)
    .eq('role', 'admin')

  if ((admins ?? []).length === 1 && (admins as { user_id: string }[])[0].user_id === targetUserId) {
    return { error: 'Nu poți elimina singurul admin al organizației' }
  }

  const { error } = await supabase
    .from('organization_members')
    .delete()
    .eq('organization_id', orgId)
    .eq('user_id', targetUserId)

  if (error) return { error: error.message }
  return { ok: true }
}

export async function updateMemberRole(
  orgId: string,
  targetUserId: string,
  newRole: 'admin' | 'member'
): Promise<{ ok: true } | { error: string }> {
  const role = await getOrgMemberRole(orgId)
  if (role !== 'admin') return { error: 'Acces interzis' }

  const supabase = await createClient()
  if (newRole === 'member') {
    const { data: admins } = await supabase
      .from('organization_members')
      .select('user_id')
      .eq('organization_id', orgId)
      .eq('role', 'admin')
    if ((admins ?? []).length === 1 && (admins as { user_id: string }[])[0].user_id === targetUserId) {
      return { error: 'Nu poți retrograda singurul admin al organizației' }
    }
  }

  const { error } = await supabase
    .from('organization_members')
    .update({ role: newRole })
    .eq('organization_id', orgId)
    .eq('user_id', targetUserId)

  if (error) return { error: error.message }
  return { ok: true }
}

export async function rateOrganization(orgId: string, rating: number): Promise<{ ok: true } | { error: string }> {
  if (rating < 1 || rating > 5) return { error: 'Rating trebuie să fie între 1 și 5' }

  const supabase = await createClient()
  const userId = await getCurrentUserId()
  if (!userId) return { error: 'Neautentificat' }

  const { error: upsertErr } = await supabase
    .from('organization_ratings')
    .upsert({ organization_id: orgId, user_id: userId, rating }, { onConflict: 'organization_id,user_id' })

  if (upsertErr) return { error: upsertErr.message }

  const { data: ratings } = await supabase
    .from('organization_ratings')
    .select('rating')
    .eq('organization_id', orgId)

  const avg = ratings && ratings.length > 0
    ? (ratings as { rating: number }[]).reduce((sum, r) => sum + r.rating, 0) / ratings.length
    : 0

  await supabase.from('organizations').update({ rating: avg }).eq('id', orgId)

  return { ok: true }
}

export async function addOrgDocument(
  orgId: string,
  docType: string,
  fileName: string,
  storagePath: string
): Promise<{ ok: true; doc: OrgDocument } | { error: string }> {
  const role = await getOrgMemberRole(orgId)
  if (role !== 'admin') return { error: 'Acces interzis' }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('org_documents')
    .insert({ org_id: orgId, doc_type: docType, file_name: fileName, storage_path: storagePath })
    .select('id, doc_type, file_name, storage_path, created_at')
    .single()

  if (error || !data) return { error: error?.message ?? 'Eroare la salvare document' }
  return { ok: true, doc: data as OrgDocument }
}

export async function removeOrgDocument(
  docId: string,
  orgId: string
): Promise<{ ok: true } | { error: string }> {
  const role = await getOrgMemberRole(orgId)
  if (role !== 'admin') return { error: 'Acces interzis' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('org_documents')
    .delete()
    .eq('id', docId)
    .eq('org_id', orgId)

  if (error) return { error: error.message }
  return { ok: true }
}
