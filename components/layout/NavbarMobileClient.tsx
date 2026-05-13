'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, MapPin, Building2, Home } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet'

export function NavbarMobileClient() {
    const [open, setOpen] = useState(false)

    return (
        <>
            <button
                className={`${buttonVariants({ variant: 'ghost', size: 'icon' })} md:hidden hover:bg-primary/5 hover:text-primary`}
                aria-label="Deschide meniul"
                onClick={() => setOpen(true)}
            >
                <Menu className="size-5" />
            </button>

            <Sheet open={open} onOpenChange={setOpen}>
                <SheetContent side="left" className="flex w-[300px] flex-col border-r-border/50 bg-background/95 backdrop-blur-md sm:w-[350px]">
                    <SheetHeader className="pb-4">
                        <SheetTitle className="text-left font-heading text-2xl font-black uppercase tracking-tighter text-primary">
                            CIVICOM<span className="text-primary">✨</span>
                        </SheetTitle>
                    </SheetHeader>

                    <nav className="mt-4 flex flex-1 flex-col gap-2">
                        <Link
                            href="/"
                            onClick={() => setOpen(false)}
                            className={`${buttonVariants({ variant: 'ghost', size: 'lg' })} justify-start gap-3 font-semibold text-muted-foreground hover:text-foreground`}
                        >
                            <Home className="size-5" />
                            Acasă
                        </Link>
                        <Link
                            href="/evenimente"
                            onClick={() => setOpen(false)}
                            className={`${buttonVariants({ variant: 'ghost', size: 'lg' })} justify-start gap-3 font-semibold text-muted-foreground hover:text-foreground`}
                        >
                            <MapPin className="size-5" />
                            Evenimente
                        </Link>
                        <Link
                            href="/organizatii"
                            onClick={() => setOpen(false)}
                            className={`${buttonVariants({ variant: 'ghost', size: 'lg' })} justify-start gap-3 font-semibold text-muted-foreground hover:text-foreground`}
                        >
                            <Building2 className="size-5" />
                            Organizații
                        </Link>
                    </nav>

                    <div className="flex flex-col gap-3 border-t border-border/50 pt-6">
                        <Link
                            href="/autentificare"
                            onClick={() => setOpen(false)}
                            className={`${buttonVariants({ variant: 'outline', size: 'lg' })} w-full justify-center font-bold transition-all hover:border-primary/50 hover:text-primary`}
                        >
                            Autentifică-te
                        </Link>
                        <Link
                            href="/inregistrare"
                            onClick={() => setOpen(false)}
                            className={`${buttonVariants({ variant: 'default', size: 'lg' })} w-full justify-center font-bold shadow-md transition-all hover:ring-2 hover:ring-primary/20`}
                        >
                            Înregistrează-te
                        </Link>
                    </div>
                </SheetContent>
            </Sheet>
        </>
    )
}
