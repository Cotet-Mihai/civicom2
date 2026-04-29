'use client'

import Link from 'next/link'
import {
    Menu, Plus, LogOut, User, LayoutDashboard,
    Calendar, FileText, AlertCircle, Building2, MapPin,
} from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import { signOut } from '@/services/auth.service'

type Props = {
    orgId: string | null
}

const navItems = [
    { label: 'Panou', href: '/panou', Icon: LayoutDashboard },
    { label: 'Evenimentele mele', href: '/panou/evenimente', Icon: Calendar },
    { label: 'Participări', href: '/panou/participari', Icon: Calendar },
    { label: 'Petiții semnate', href: '/panou/petitii', Icon: FileText },
    { label: 'Contestații', href: '/panou/contestatii', Icon: AlertCircle },
]

export function NavbarMobileActionsClient({ orgId }: Props) {
    const orgHref = orgId ? `/organizatie/${orgId}/panou` : '/organizatie/creeaza'
    const orgLabel = orgId ? 'Organizația mea' : 'Solicită creare ONG'

    async function handleSignOut() {
        await signOut()
    }

    return (
        <Sheet>
            <SheetTrigger
                className={`${buttonVariants({ variant: 'ghost', size: 'icon' })} md:hidden hover:bg-primary/5 hover:text-primary`}
                aria-label="Deschide meniul"
            >
                <Menu className="size-5" />
            </SheetTrigger>

            <SheetContent side="left" className="flex w-[300px] flex-col border-r-border/50 bg-background/95 backdrop-blur-md sm:w-[350px] p-2">
                <SheetHeader className="pb-2">
                    <SheetTitle className="text-left font-heading text-2xl font-black uppercase tracking-tighter text-primary">
                        CIVICOM<span className="text-primary">✨</span>
                    </SheetTitle>
                </SheetHeader>

                <div className="mt-4 flex flex-1 flex-col gap-1 overflow-y-auto">
                    <p className="px-2 pb-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        Explorează
                    </p>
                    <Link href="/evenimente" className={`${buttonVariants({ variant: 'ghost', size: 'default' })} justify-start gap-3 font-semibold`}>
                        <MapPin className="size-4 text-primary" />
                        Evenimente
                    </Link>
                    <Link href="/organizatii" className={`${buttonVariants({ variant: 'ghost', size: 'default' })} justify-start gap-3 font-semibold`}>
                        <Building2 className="size-4 text-primary" />
                        Organizații
                    </Link>

                    <Separator className="my-4 opacity-50" />

                    <p className="px-2 pb-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        Contul meu
                    </p>
                    {navItems.map(({ label, href, Icon }) => (
                        <Link key={href} href={href} className={`${buttonVariants({ variant: 'ghost', size: 'default' })} justify-start gap-3 font-medium text-muted-foreground hover:text-foreground`}>
                            <Icon className="size-4" />
                            {label}
                        </Link>
                    ))}

                    <Separator className="my-4 opacity-50" />

                    <Link href={orgHref} className={`${buttonVariants({ variant: 'ghost', size: 'default' })} justify-start gap-3 font-medium text-muted-foreground hover:text-foreground`}>
                        <Building2 className="size-4" />
                        {orgLabel}
                    </Link>
                    <Link href="/creeaza" className={`${buttonVariants({ variant: 'secondary', size: 'default' })} mt-2 justify-start gap-3 font-bold text-primary hover:bg-primary/10`}>
                        <Plus className="size-4" />
                        Creează eveniment
                    </Link>

                    <Separator className="my-4 opacity-50" />

                    <Link href="/profil" className={`${buttonVariants({ variant: 'ghost', size: 'default' })} justify-start gap-3 font-medium text-muted-foreground hover:text-foreground`}>
                        <User className="size-4" />
                        Profil
                    </Link>
                </div>

                <div className="border-t border-border/50 pt-4">
                    <Button variant="destructive" className="w-full gap-2 font-bold" onClick={handleSignOut}>
                        <LogOut className="size-4" />
                        Deconectare
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    )
}
