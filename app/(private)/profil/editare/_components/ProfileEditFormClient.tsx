'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updateUserProfile } from '@/services/user.service'

type Props = {
  initialName: string
}

export function ProfileEditFormClient({ initialName }: Props) {
  const [name, setName] = useState(initialName)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (name.trim().length < 2) {
      toast.error('Numele trebuie să aibă minim 2 caractere')
      return
    }
    setIsLoading(true)
    const result = await updateUserProfile(name.trim())
    setIsLoading(false)
    if ('error' in result) { toast.error(result.error); return }
    toast.success('Profil actualizat')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nume complet</Label>
        <Input
          id="name"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Numele tău"
          minLength={2}
          required
        />
      </div>
      <Button type="submit" disabled={isLoading || name.trim() === initialName.trim()}>
        {isLoading && <Loader2 size={16} className="animate-spin mr-2" />}
        Salvează modificările
      </Button>
    </form>
  )
}
