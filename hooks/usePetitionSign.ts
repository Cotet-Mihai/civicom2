'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { getSignatureStatus, signPetition } from '@/services/participation.service'

export function usePetitionSign(eventId: string) {
  const [isSigned, setIsSigned] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    getSignatureStatus(eventId)
      .then(signed => {
        setIsSigned(signed)
        setIsLoading(false)
      })
      .catch(() => setIsLoading(false))
  }, [eventId])

  async function sign() {
    setIsLoading(true)
    const result = await signPetition(eventId)
    setIsLoading(false)
    if ('error' in result) { toast.error(result.error); return }
    setIsSigned(true)
    router.refresh()
  }

  return { isSigned, isLoading, sign }
}
