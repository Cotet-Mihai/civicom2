'use client'

import { useState } from 'react'
import { sendPasswordResetEmail, updatePassword } from '@/services/auth.service'

export function useResetPassword() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSendReset(email: string) {
    setIsLoading(true)
    setError(null)

    const result = await sendPasswordResetEmail(email)

    if (result?.error) {
      setError(result.error)
    } else {
      setSuccess(true)
    }

    setIsLoading(false)
  }

  async function handleUpdatePassword(password: string) {
    setIsLoading(true)
    setError(null)

    const result = await updatePassword(password)

    if (result?.error) {
      setError(result.error)
      setIsLoading(false)
    }
  }

  return { handleSendReset, handleUpdatePassword, isLoading, error, success }
}
