'use client'

import { useState, useId } from 'react'
import { InputPassword } from './InputPassword'
import { cn } from '@/lib/utils'

interface InputPasswordStrengthProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
}

function getStrength(password: string): {
  score: number
  label: string
  color: string
} {
  let score = 0
  if (password.length >= 8) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++

  if (score === 0) return { score: 0, label: '', color: '' }
  if (score === 1) return { score: 1, label: 'Slabă', color: 'bg-destructive' }
  if (score === 2) return { score: 2, label: 'Medie', color: 'bg-yellow-500' }
  if (score === 3) return { score: 3, label: 'Bună', color: 'bg-blue-500' }
  return { score: 4, label: 'Puternică', color: 'bg-green-500' }
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
        <label htmlFor={id} className="text-sm font-medium leading-none">
          {label}
        </label>
      )}
      <InputPassword id={id} onChange={handleChange} {...props} />
      {password.length > 0 && (
        <div className="space-y-1">
          <div className="flex gap-1">
            {[1, 2, 3, 4].map((step) => (
              <div
                key={step}
                className={cn(
                  'h-1 flex-1 rounded-full transition-colors duration-300',
                  strength.score >= step ? strength.color : 'bg-muted'
                )}
              />
            ))}
          </div>
          <p className="text-xs text-muted-foreground">{strength.label}</p>
        </div>
      )}
    </div>
  )
}
