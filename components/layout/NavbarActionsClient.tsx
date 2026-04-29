'use client'

import Link from 'next/link'
import {
    Plus, LogOut, User, LayoutDashboard,
    Calendar, FileText, AlertCircle, Building2,
} from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { signOut } from '@/services/auth.service'

type Props = {
    userName: string
    userEmail: string
    orgId: string | null
}

const navItems = [
    { label: 'Panou', href: '/panou', Icon: LayoutDashboard },
    { label: 'Evenimentele mele', href: '/panou/evenimente', Icon: Calendar },
    { label: 'Participări', href: '/panou/participari', Icon: Calendar },
    { label: 'Petiții semnate', href: '/panou/petitii', Icon: FileText },
    { label: 'Contestații', href: '/panou/contestatii', Icon: AlertCircle },
]

export function NavbarActionsClient({ userName, userEmail, orgId }: Props) {
    const initial = userName?.charAt(0).toUpperCase() ?? 'U'
    const orgHref = orgId ? `/organizatie/${orgId}/panou` : '/organizatie/creeaza'
    const orgLabel = orgId ? 'Organizația mea' : 'Solicită creare ONG'

    async function handleSignOut() {
        await signOut()
    }

    return (
        <>
            {/* ─── Desktop ─── */}
            <div className="hidden items-center gap-4 md:flex">
                <Link
                    href="/creeaza"
                    className={`${buttonVariants({ size: 'sm' })} gap-1.5 font-bold shadow-sm transition-all hover:ring-2 hover:ring-primary/20`}
                >
                    <Plus className="size-4" />
                    Creează eveniment
                </Link>

                <DropdownMenu>
                    <DropdownMenuTrigger
                        className="rounded-full ring-2 ring-transparent transition-all hover:ring-primary/50 focus:outline-none focus:ring-primary"
                        aria-label="Meniu utilizator"
                    >
                        <Avatar className="size-8 cursor-pointer border border-border/50">
                            <AvatarFallback className="bg-primary/10 text-sm font-bold text-primary">
                                {initial}
                            </AvatarFallback>
                        </Avatar>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent align="end" className="w-64 rounded-xl p-2 shadow-lg">
                        <div className="flex flex-col gap-0.5 px-2 py-2 pb-3">
                            <span className="font-heading text-sm font-bold tracking-tight">{userName}</span>
                            <span className="text-xs font-medium text-muted-foreground">{userEmail}</span>
                        </div>

                        <DropdownMenuSeparator />

                        <DropdownMenuGroup className="py-1">
                            {navItems.map(({ label, href, Icon }) => (
                                <DropdownMenuItem key={href} render={<Link href={href} />} className="flex cursor-pointer items-center gap-2 rounded-md font-medium">
                                    <Icon className="size-4 text-muted-foreground" />
                                    {label}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuGroup>

                        <DropdownMenuSeparator />

                        <DropdownMenuGroup className="py-1">
                            <DropdownMenuItem render={<Link href={orgHref} />} className="flex cursor-pointer items-center gap-2 rounded-md font-medium">
                                <Building2 className="size-4 text-muted-foreground" />
                                {orgLabel}
                            </DropdownMenuItem>
                            <DropdownMenuItem render={<Link href="/creeaza" />} className="flex cursor-pointer items-center gap-2 rounded-md font-medium text-primary focus:bg-primary/5 focus:text-primary">
                                <Plus className="size-4" />
                                Creează eveniment
                            </DropdownMenuItem>
                        </DropdownMenuGroup>

                        <DropdownMenuSeparator />

                        <DropdownMenuGroup className="pt-1">
                            <DropdownMenuItem render={<Link href="/profil" />} className="flex cursor-pointer items-center gap-2 rounded-md font-medium">
                                <User className="size-4 text-muted-foreground" />
                                Profil
                            </DropdownMenuItem>
                            <DropdownMenuItem variant="destructive" className="mt-1 cursor-pointer rounded-md font-bold focus:bg-destructive/10" onClick={handleSignOut}>
                                <LogOut className="size-4" />
                                Deconectare
                            </DropdownMenuItem>
                        </DropdownMenuGroup>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

        </>
    )
}