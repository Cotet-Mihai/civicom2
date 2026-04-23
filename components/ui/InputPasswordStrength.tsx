'use client'

import { useState, useId } from 'react'
import { Info, Check, X } from 'lucide-react'
import { InputPassword } from './InputPassword'
import { HoverCard, HoverCardTrigger, HoverCardContent } from './hover-card'
import { cn } from '@/lib/utils'

interface InputPasswordStrengthProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
}

const BARS = 5

const REQUIREMENTS = [
  { text: 'Minim 8 caractere', test: (p: string) => p.length >= 8 },
  { text: 'Cel puțin o literă mare (A–Z)', test: (p: string) => /[A-Z]/.test(p) },
  { text: 'Cel puțin o cifră (0–9)', test: (p: string) => /[0-9]/.test(p) },
  { text: 'Cel puțin un caracter special (!@#$…)', test: (p: string) => /[^A-Za-z0-9]/.test(p) },
  { text: 'Minim 12 caractere (recomandat)', test: (p: string) => p.length >= 12 },
]

function getStrength(password: string): {
  score: number
  label: string
  color: string
} {
  if (password.length === 0) return { score: 0, label: 'Periculos de slabă', color: '' }

  const met = REQUIREMENTS.filter(r => r.test(password)).length

  if (met <= 1) return { score: 1, label: 'Foarte slabă', color: 'bg-destructive' }
  if (met === 2) return { score: 2, label: 'Slabă', color: 'bg-orange-500' }
  if (met === 3) return { score: 3, label: 'Medie', color: 'bg-yellow-500' }
  if (met === 4) return { score: 4, label: 'Bună', color: 'bg-blue-500' }
  return { score: 5, label: 'Puternică', color: 'bg-green-500' }
}

export function InputPasswordStrength({
  label,
  onChange,
  ...props
}: InputPasswordStrengthProps) {
  const [password, setPassword] = useState('')
  const id = useId()
  const strength = getStrength(password)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setPassword(e.target.value)
    onChange?.(e)
  }

  return (
    <div className="space-y-2">
      {label && (
        <div className="flex items-center gap-1.5">
          <label htmlFor={id} className="text-sm font-medium leading-none">
            {label}
          </label>
          <HoverCard>
            <HoverCardTrigger
              className="text-muted-foreground hover:text-foreground transition-colors cursor-default"
              aria-label="Cerințe parolă"
            >
              <Info className="size-3.5" />
            </HoverCardTrigger>
            <HoverCardContent side="right" align="start" className="w-64">
              <p className="mb-2 text-xs font-semibold text-foreground">Cerințe parolă</p>
              <ul className="space-y-1.5">
                {REQUIREMENTS.map((req) => {
                  const met = password.length > 0 && req.test(password)
                  return (
                    <li key={req.text} className="flex items-center gap-2 text-xs">
                      <span className={cn(
                        'flex size-4 shrink-0 items-center justify-center rounded-full transition-colors duration-200',
                        met ? 'bg-green-500/15 text-green-600' : 'bg-muted text-muted-foreground'
                      )}>
                        {met ? <Check className="size-2.5" /> : <X className="size-2.5" />}
                      </span>
                      <span className={cn(
                        'transition-colors duration-200',
                        met ? 'text-foreground' : 'text-muted-foreground'
                      )}>
                        {req.text}
                      </span>
                    </li>
                  )
                })}
              </ul>
            </HoverCardContent>
          </HoverCard>
        </div>
      )}
      <InputPassword id={id} onChange={handleChange} {...props} />
      <div className="space-y-1">
        <div className="flex gap-1">
          {Array.from({ length: BARS }, (_, i) => i + 1).map((step) => (
            <div
              key={step}
              className={cn(
                'h-1 flex-1 rounded-full transition-colors duration-300',
                strength.score >= step ? strength.color : 'bg-muted'
              )}
            />
          ))}
        </div>
        <p className={cn(
          'text-xs transition-colors duration-300',
          strength.score === 0 ? 'text-muted-foreground/60' : 'text-muted-foreground'
        )}>
          {strength.label}
        </p>
      </div>
    </div>
  )
}
