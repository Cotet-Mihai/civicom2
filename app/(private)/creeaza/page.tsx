import type { Metadata } from 'next'
import { getAuthUser } from '@/services/auth.service'
import { getUserOrgs } from '@/services/organization.service'
import { CreatePageClient } from './_components/CreatePageClient'

export const metadata: Metadata = { title: 'Creează eveniment — CIVICOM', robots: { index: false } }

export default async function CreateSelectPage() {
    const user = await getAuthUser()
    const userName = user?.user_metadata?.display_name ?? user?.user_metadata?.name ?? 'Tu'
    const orgs = user ? await getUserOrgs(user.id) : []
    return <CreatePageClient orgs={orgs} userName={userName} />
}
