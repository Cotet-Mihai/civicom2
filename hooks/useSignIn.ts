'use client'

import { useState } from 'react'
import { signIn } from '@/services/auth.service'

export function useSignIn() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSignIn(formData: { email: string; password: string }) {
    setIsLoading(true)
    setError(null)

    const result = await signIn(formData)

    if (result?.error) {
      setError(result.error)
      setIsLoading(false)
    }
  }

  return { handleSignIn, isLoading, error }
}
