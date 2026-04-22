'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Mail } from 'lucide-react'
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
      <div className="w-full max-w-sm animate-fade-in text-center">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Mail className="size-5" />
        </div>
        <h2 className="font-heading text-xl font-bold text-foreground">Verifică emailul</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Dacă există un cont pentru{' '}
          <span className="font-medium text-foreground">{email}</span>,
          vei primi un link de resetare a parolei.
        </p>
        <Link
          href="/autentificare"
          className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
        >
          Înapoi la autentificare <ArrowRight className="size-3.5" />
        </Link>
      </div>
    )
  }

  return (
    <div className="w-full max-w-sm animate-fade-in-up">
      <div className="mb-7">
        <h1 className="font-heading text-[1.875rem] font-bold tracking-tight text-foreground">
          Resetează parola
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Introdu emailul și îți trimitem un link de resetare
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

        {error && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
            {error}
          </p>
        )}

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full gap-2"
        >
          {isLoading ? 'Se trimite...' : (
            <>Trimite link de resetare <ArrowRight className="size-4" /></>
          )}
        </Button>
      </form>

      <p className="mt-5 text-center">
        <Link
          href="/autentificare"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-3.5" /> Înapoi la autentificare
        </Link>
      </p>
    </div>
  )
}
