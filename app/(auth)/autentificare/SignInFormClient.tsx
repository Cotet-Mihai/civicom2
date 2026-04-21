'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSignIn } from '@/hooks/useSignIn'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { InputPassword } from '@/components/ui/InputPassword'
import { Label } from '@/components/ui/label'

export function SignInFormClient() {
  const { handleSignIn, isLoading, error } = useSignIn()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    await handleSignIn({ email, password })
  }

  return (
    <div className="w-full max-w-sm space-y-6 animate-fade-in-up">
      <div className="space-y-1 text-center">
        <h1 className="font-heading text-2xl font-bold">Bun venit înapoi</h1>
        <p className="text-sm text-muted-foreground">
          Autentifică-te în contul tău CIVICOM
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

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Parolă</Label>
            <Link
              href="/reseteaza-parola"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Ai uitat parola?
            </Link>
          </div>
          <InputPassword
            id="password"
            placeholder="••••••••"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {error && (
          <p className="text-sm text-destructive">{translateError(error)}</p>
        )}

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Se autentifică...' : 'Autentifică-te'}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Nu ai cont?{' '}
        <Link
          href="/inregistrare"
          className="font-medium text-foreground hover:underline"
        >
          Înregistrează-te
        </Link>
      </p>
    </div>
  )
}

function translateError(error: string): string {
  if (error.includes('Invalid login credentials')) return 'Email sau parolă incorectă.'
  if (error.includes('Email not confirmed')) return 'Confirmă adresa de email înainte de autentificare.'
  if (error.includes('Too many requests')) return 'Prea multe încercări. Încearcă din nou mai târziu.'
  return error
}
