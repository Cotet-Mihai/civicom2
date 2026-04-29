import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { getAuthUser } from '@/services/auth.service'
import { getUserOrgId } from '@/services/organization.service'
import { NavbarMobileClient } from './NavbarMobileClient'
import { NavbarMobileActionsClient } from './NavbarMobileActionsClient'
import { NavbarActionsClient } from './NavbarActionsClient'

export async function Navbar() {
    const user = await getAuthUser()

    const userName = user?.user_metadata?.display_name ?? user?.user_metadata?.name ?? 'Utilizator'
    const userEmail = user?.email ?? ''
    const orgId = user ? await getUserOrgId(user.id) : null

    return (
        <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md shadow-sm transition-all duration-300">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 lg:px-8">

                {/* Stânga: hamburger mobil | logo desktop */}
                <div className="flex items-center gap-2">
                    <div className="md:hidden">
                        {user
                            ? <NavbarMobileActionsClient orgId={orgId} />
                            : <NavbarMobileClient />
                        }
                    </div>
                    <Link
                        href="/"
                        className="hidden md:block font-heading text-2xl font-black uppercase tracking-tighter text-primary transition-opacity hover:opacity-80"
                    >
                        CIVICOM<span className="text-primary">✨</span>
                    </Link>
                </div>

                {/* Centru: navigație desktop */}
                <nav className="hidden items-center gap-2 md:flex">
                    <Link
                        href="/evenimente"
                        className={`${buttonVariants({ variant: 'ghost', size: 'sm' })} font-semibold text-muted-foreground transition-colors hover:text-foreground`}
                    >
                        Evenimente
                    </Link>
                    <Link
                        href="/organizatii"
                        className={`${buttonVariants({ variant: 'ghost', size: 'sm' })} font-semibold text-muted-foreground transition-colors hover:text-foreground`}
                    >
                        Organizații
                    </Link>
                </nav>

                {/* Dreapta: logo mobil | actions desktop */}
                <div className="flex items-center gap-3">
                    <Link
                        href="/"
                        className="md:hidden font-heading text-2xl font-black uppercase tracking-tighter text-primary transition-opacity hover:opacity-80"
                    >
                        CIVICOM<span className="text-primary">✨</span>
                    </Link>
                    {user ? (
                        <NavbarActionsClient
                            userName={userName}
                            userEmail={userEmail}
                            orgId={orgId}
                        />
                    ) : (
                        <div className="hidden items-center gap-3 md:flex">
                            <Link
                                href="/autentificare"
                                className={`${buttonVariants({ variant: 'outline', size: 'sm' })} font-semibold transition-all hover:border-primary/50 hover:bg-transparent hover:text-primary`}
                            >
                                Autentifică-te
                            </Link>
                            <Link
                                href="/inregistrare"
                                className={`${buttonVariants({ variant: 'default', size: 'sm' })} font-bold shadow-sm transition-all hover:ring-2 hover:ring-primary/20`}
                            >
                                Înregistrează-te
                            </Link>
                        </div>
                    )}
                </div>

            </div>
        </header>
    )
}
