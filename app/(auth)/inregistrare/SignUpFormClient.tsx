'use client'

import { useState } from 'react'
import Link from 'next/link'
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
      <div className="w-full max-w-sm space-y-4 text-center animate-fade-in">
        <div className="text-4xl">✉️</div>
        <h2 className="font-heading text-xl font-bold">Verifică emailul</h2>
        <p className="text-sm text-muted-foreground">
          Ți-am trimis un link de confirmare la <strong>{email}</strong>.
          Accesează-l pentru a activa contul.
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
        <h1 className="font-heading text-2xl font-bold">Creează un cont</h1>
        <p className="text-sm text-muted-foreground">
          Alătură-te comunității CIVICOM
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
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
          <p className="text-sm text-destructive">{translateError(error)}</p>
        )}

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Se creează contul...' : 'Creează cont'}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Ai deja cont?{' '}
        <Link
          href="/autentificare"
          className="font-medium text-foreground hover:underline"
        >
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
