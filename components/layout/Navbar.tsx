import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { getAuthUser } from '@/services/auth.service'
import { getUserOrgId } from '@/services/organization.service'
import { NavbarMobileClient } from './NavbarMobileClient'
import { NavbarActionsClient } from './NavbarActionsClient'

export async function Navbar() {
  const user = await getAuthUser()

  const userName = user?.user_metadata?.display_name ?? user?.user_metadata?.name ?? 'Utilizator'
  const userEmail = user?.email ?? ''
  const orgId = user ? await getUserOrgId(user.id) : null

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 lg:px-8">

        {/* Stânga: hamburger mobil (doar logged out) + logo */}
        <div className="flex items-center gap-1">
          {!user && <NavbarMobileClient />}
          <Link
            href="/"
            className="font-heading text-xl font-extrabold tracking-tight text-primary"
          >
            CIVICOM✨
          </Link>
        </div>

        {/* Centru: navigație desktop */}
        <nav className="hidden items-center gap-1 md:flex">
          <Link href="/evenimente" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
            Evenimente
          </Link>
          <Link href="/organizatii" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
            Organizații
          </Link>
        </nav>

        {/* Dreapta: dashboard actions (logged in) sau auth buttons (logged out) */}
        {user ? (
          <NavbarActionsClient
            userName={userName}
            userEmail={userEmail}
            orgId={orgId}
          />
        ) : (
          <div className="hidden items-center gap-2 md:flex">
            <Link href="/autentificare" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
              Autentifică-te
            </Link>
            <Link href="/inregistrare" className={buttonVariants({ variant: 'default', size: 'sm' })}>
              Înregistrează-te
            </Link>
          </div>
        )}

      </div>
    </header>
  )
}
