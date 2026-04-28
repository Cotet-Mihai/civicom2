'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Trash2, ShieldCheck, ShieldOff } from 'lucide-react'
import { removeMember, updateMemberRole } from '@/services/organization.service'

type Props = {
  orgId: string
  userId: string
  currentRole: string
}

export function MemberActionsClient({ orgId, userId, currentRole }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleToggleRole() {
    const newRole = currentRole === 'admin' ? 'member' : 'admin'
    setLoading(true)
    const result = await updateMemberRole(orgId, userId, newRole)
    setLoading(false)
    if ('error' in result) { toast.error(result.error); return }
    toast.success(`Rol actualizat la ${newRole}`)
    router.refresh()
  }

  async function handleRemove() {
    setLoading(true)
    const result = await removeMember(orgId, userId)
    setLoading(false)
    if ('error' in result) { toast.error(result.error); return }
    toast.success('Membru eliminat')
    router.refresh()
  }

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="sm"
        disabled={loading}
        onClick={handleToggleRole}
        className="h-7 px-2 text-xs gap-1"
        title={currentRole === 'admin' ? 'Retrogradează la member' : 'Promovează la admin'}
      >
        {currentRole === 'admin' ? <ShieldOff size={12} /> : <ShieldCheck size={12} />}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        disabled={loading}
        onClick={handleRemove}
        className="h-7 px-2 text-destructive hover:text-destructive"
      >
        <Trash2 size={12} />
      </Button>
    </div>
  )
}
