'use client'

import Link from 'next/link'
import { Menu } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'

export function NavbarMobileClient() {
  return (
    <Sheet>
      <SheetTrigger
        className={buttonVariants({ variant: 'ghost', size: 'icon' }) + ' md:hidden'}
        aria-label="Deschide meniul"
      >
        <Menu className="size-5" />
      </SheetTrigger>

      <SheetContent side="left" className="flex w-72 flex-col">
        <SheetHeader>
          <SheetTitle className="text-left font-heading text-xl font-extrabold text-primary">
            CIVICOM✨
          </SheetTitle>
        </SheetHeader>

        <nav className="mt-6 flex flex-1 flex-col gap-1">
          <Link href="/" className={buttonVariants({ variant: 'ghost', size: 'default' }) + ' justify-start'}>
            Acasă
          </Link>
          <Link href="/evenimente" className={buttonVariants({ variant: 'ghost', size: 'default' }) + ' justify-start'}>
            Evenimente
          </Link>
          <Link href="/organizatii" className={buttonVariants({ variant: 'ghost', size: 'default' }) + ' justify-start'}>
            Organizații
          </Link>
        </nav>

        <div className="flex flex-col gap-2 border-t border-border pt-4">
          <Link href="/autentificare" className={buttonVariants({ variant: 'outline' }) + ' w-full justify-center'}>
            Autentifică-te
          </Link>
          <Link href="/inregistrare" className={buttonVariants({ variant: 'default' }) + ' w-full justify-center'}>
            Înregistrează-te
          </Link>
        </div>
      </SheetContent>
    </Sheet>
  )
}
