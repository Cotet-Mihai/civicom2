'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { inviteMember } from '@/services/organization.service'

type Props = { orgId: string }

export function InviteMemberFormClient({ orgId }: Props) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    const result = await inviteMember(orgId, email)
    setLoading(false)
    if ('error' in result) { toast.error(result.error); return }
    toast.success('Membru adăugat cu succes!')
    setEmail('')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input
        type="email"
        placeholder="email@utilizator.ro"
        value={email}
        onChange={e => setEmail(e.target.value)}
        required
        className="flex-1"
      />
      <Button type="submit" disabled={loading} size="sm">
        {loading ? 'Se adaugă...' : 'Invită'}
      </Button>
    </form>
  )
}
