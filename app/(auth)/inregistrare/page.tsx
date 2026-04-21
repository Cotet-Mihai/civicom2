import type { Metadata } from 'next'
import { SignUpFormClient } from './SignUpFormClient'

export const metadata: Metadata = {
  title: 'Înregistrare',
}

export default function InregistrarePage() {
  return <SignUpFormClient />
}
