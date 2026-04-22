'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Mail } from 'lucide-react'
import { useSignUp } from '@/hooks/useSignUp'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { InputPasswordStrength } from '@/components/ui/InputPasswordStrength'
import { Label } from '@/components/ui/label'

export function SignUpFormClient() {
  const { handleSignUp, isLoading, error, success } = useSignUp()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    await handleSignUp({ name, email, password })
  }

  if (success) {
    return (
      <div className="w-full max-w-sm animate-fade-in text-center">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-green-100 text-green-600">
          <Mail className="size-5" />
        </div>
        <h2 className="font-heading text-xl font-bold text-foreground">Verifică emailul</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Ți-am trimis un link de confirmare la{' '}
          <span className="font-medium text-foreground">{email}</span>.
          <br />Accesează-l pentru a activa contul.
        </p>
        <Link
          href="/autentificare"
          className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-green-600 hover:text-green-700 transition-colors"
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
          Creează un cont
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Alătură-te comunității CIVICOM✨
        </p>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="name">Nume complet</Label>
          <Input
            id="name"
            type="text"
            placeholder="Ion Popescu"
            autoComplete="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

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

        <InputPasswordStrength
          label="Parolă"
          placeholder="Minim 8 caractere"
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
            {translateError(error)}
          </p>
        )}

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full gap-2 bg-green-600 text-white hover:bg-green-700"
        >
          {isLoading ? 'Se creează contul...' : (
            <>Creează cont <ArrowRight className="size-4" /></>
          )}
        </Button>
      </form>

      <p className="mt-5 text-center text-sm text-muted-foreground">
        Ai deja cont?{' '}
        <Link href="/autentificare" className="font-semibold text-green-600 hover:text-green-700 transition-colors">
          Autentifică-te
        </Link>
      </p>
    </div>
  )
}

function translateError(error: string): string {
  if (error.includes('User already registered')) return 'Există deja un cont cu acest email.'
  if (error.includes('Password should be')) return 'Parola trebuie să aibă minim 8 caractere.'
  if (error.includes('Unable to validate email')) return 'Adresă de email invalidă.'
  return error
}
