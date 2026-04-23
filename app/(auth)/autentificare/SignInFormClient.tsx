'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
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
    <div className="w-full max-w-sm animate-fade-in-up">
      <div className="mb-7">
        <h1 className="font-heading text-[1.875rem] font-bold tracking-tight text-foreground">
          Bun venit înapoi
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Autentifică-te în contul tău CIVICOM✨
        </p>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
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

        <div className="flex flex-col gap-1.5">
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
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
            {translateError(error)}
          </p>
        )}

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full gap-2"
        >
          {isLoading ? 'Se autentifică...' : (
            <>Autentifică-te <ArrowRight className="size-4" /></>
          )}
        </Button>
      </form>

      <p className="mt-5 text-center text-sm text-muted-foreground">
        Nu ai cont?{' '}
        <Link href="/inregistrare" className="font-semibold text-primary hover:text-primary/80 transition-colors">
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
