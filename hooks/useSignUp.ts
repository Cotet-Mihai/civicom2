'use client'

import { useState } from 'react'
import { signUp } from '@/services/auth.service'

export function useSignUp() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSignUp(formData: {
    name: string
    email: string
    password: string
  }) {
    setIsLoading(true)
    setError(null)

    const result = await signUp(formData)

    if (result?.error) {
      setError(result.error)
    } else {
      setSuccess(true)
    }

    setIsLoading(false)
  }

  return { handleSignUp, isLoading, error, success }
}
