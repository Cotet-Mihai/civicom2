import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { PublicNavbarMobileClient } from './PublicNavbarMobileClient'

export function PublicNavbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 lg:px-8">

        {/* Stânga: hamburger mobil + logo */}
        <div className="flex items-center gap-1">
          <PublicNavbarMobileClient />
          <Link
            href="/"
            className="font-heading text-xl font-extrabold tracking-tight text-green-700"
          >
            CIVICOM✨
          </Link>
        </div>

        {/* Centru: navigație desktop */}
        <nav className="hidden items-center gap-1 md:flex">
          <Link
            href="/evenimente"
            className={buttonVariants({ variant: 'ghost', size: 'sm' })}
          >
            Evenimente
          </Link>
          <Link
            href="/organizatii"
            className={buttonVariants({ variant: 'ghost', size: 'sm' })}
          >
            Organizații
          </Link>
        </nav>

        {/* Dreapta: butoane auth desktop */}
        <div className="hidden items-center gap-2 md:flex">
          <Link
            href="/autentificare"
            className={buttonVariants({ variant: 'outline', size: 'sm' })}
          >
            Autentifică-te
          </Link>
          <Link
            href="/inregistrare"
            className={buttonVariants({ variant: 'default', size: 'sm' }) + ' bg-green-600 hover:bg-green-700 text-white'}
          >
            Înregistrează-te
          </Link>
        </div>

      </div>
    </header>
  )
}
