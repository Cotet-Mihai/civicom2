'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { getParticipationStatus, joinEvent, leaveEvent } from '@/services/participation.service'

export function useEventParticipation(eventId: string) {
  const [isJoined, setIsJoined] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    getParticipationStatus(eventId)
      .then(status => {
        setIsJoined(status === 'joined')
        setIsLoading(false)
      })
      .catch(() => setIsLoading(false))
  }, [eventId])

  async function join() {
    setIsLoading(true)
    const result = await joinEvent(eventId)
    setIsLoading(false)
    if ('error' in result) { toast.error(result.error); return }
    setIsJoined(true)
    router.refresh()
  }

  async function leave() {
    setIsLoading(true)
    const result = await leaveEvent(eventId)
    setIsLoading(false)
    if ('error' in result) { toast.error(result.error); return }
    setIsJoined(false)
    router.refresh()
  }

  return { isJoined, isLoading, join, leave }
}
