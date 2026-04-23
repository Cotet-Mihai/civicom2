import type { Metadata } from 'next'
import { ResetPasswordFormClient } from './ResetPasswordFormClient'

export const metadata: Metadata = {
  title: 'Resetează parola',
}

export default function ResetPasswordPage() {
  return <ResetPasswordFormClient />
}
