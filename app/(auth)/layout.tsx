import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col lg:flex-row">

      {/* Form panel */}
      <div className="flex flex-1 flex-col bg-[oklch(0.985_0_0)] p-6 md:p-10 lg:w-1/2 lg:flex-none">
        <div className="flex min-h-full flex-1 flex-col">
          <Link href="/" className="auth-logo-link self-start">
            <span className="auth-logo-text">CIVICOM✨</span>
          </Link>
          <div className="flex flex-1 items-center justify-center py-8">
            {children}
          </div>
          <p className="auth-footer-note pt-4 text-center text-xs text-[oklch(0.62_0_0)]">
            Prin utilizare, ești de acord cu{' '}
            <Link href="/" className="underline underline-offset-2">Termenii de utilizare</Link>.
          </p>
        </div>
      </div>

      {/* Image panel — desktop only */}
      <div className="relative hidden overflow-hidden lg:block lg:flex-1" aria-hidden="true">
        <Image
          src="/auth_panel.webp"
          alt=""
          fill
          className="object-cover object-top"
          priority
          sizes="50vw"
        />
        <div className="auth-image-overlay">
          <div>
            <p className="auth-image-tagline">Fii vocea schimbării.</p>
            <p className="auth-image-desc">Alătură-te comunității civice active din România.</p>
          </div>
        </div>
      </div>

    </div>
  )
}
