import type { Metadata } from 'next'
import { SignInFormClient } from './SignInFormClient'

export const metadata: Metadata = {
  title: 'Autentificare',
}

export default function AutentificarePage() {
  return <SignInFormClient />
}
