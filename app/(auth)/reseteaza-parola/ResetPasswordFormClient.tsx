'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useResetPassword } from '@/hooks/useResetPassword'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function ResetPasswordFormClient() {
  const { handleSendReset, isLoading, error, success } = useResetPassword()
  const [email, setEmail] = useState('')

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    await handleSendReset(email)
  }

  if (success) {
    return (
      <div className="w-full max-w-sm space-y-4 text-center animate-fade-in">
        <div className="text-4xl">📬</div>
        <h2 className="font-heading text-xl font-bold">Verifică emailul</h2>
        <p className="text-sm text-muted-foreground">
          Dacă există un cont pentru <strong>{email}</strong>, vei primi un link
          de resetare a parolei.
        </p>
        <Link
          href="/autentificare"
          className="text-sm font-medium hover:underline"
        >
          Înapoi la autentificare
        </Link>
      </div>
    )
  }

  return (
    <div className="w-full max-w-sm space-y-6 animate-fade-in-up">
      <div className="space-y-1 text-center">
        <h1 className="font-heading text-2xl font-bold">Resetează parola</h1>
        <p className="text-sm text-muted-foreground">
          Introdu emailul și îți trimitem un link de resetare
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="tu@exemplu.ro"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Se trimite...' : 'Trimite link de resetare'}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        <Link
          href="/autentificare"
          className="font-medium text-foreground hover:underline"
        >
          Înapoi la autentificare
        </Link>
      </p>
    </div>
  )
}
