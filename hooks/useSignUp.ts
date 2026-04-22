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
    confirmPassword: string
  }) {
    setIsLoading(true)
    setError(null)

    if (formData.password !== formData.confirmPassword) {
      setError('Parolele nu coincid.')
      setIsLoading(false)
      return
    }

    const result = await signUp({ name: formData.name, email: formData.email, password: formData.password })

    if (result?.error) {
      setError(result.error)
    } else {
      setSuccess(true)
    }

    setIsLoading(false)
  }

  return { handleSignUp, isLoading, error, success }
}
