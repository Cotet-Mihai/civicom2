'use client'

import Link from 'next/link'
import {
  Menu, Plus, LogOut, User, LayoutDashboard,
  Calendar, FileText, AlertCircle, Building2,
} from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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

export function DashboardNavbarActionsClient({ userName, userEmail, orgId }: Props) {
  const initial = userName?.charAt(0).toUpperCase() ?? 'U'
  const orgHref = orgId ? `/organizatie/${orgId}/panou` : '/organizatie/creeaza'
  const orgLabel = orgId ? 'Organizația mea' : 'Solicită creare ONG'

  async function handleSignOut() {
    await signOut()
  }

  return (
    <>
      {/* ─── Desktop ─── */}
      <div className="hidden items-center gap-3 md:flex">
        <Link
          href="/creeaza"
          className={buttonVariants({ size: 'sm' }) + ' gap-1.5 bg-green-600 hover:bg-green-700 text-white'}
        >
          <Plus className="size-4" />
          Creează eveniment
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger
            className="rounded-full ring-2 ring-transparent hover:ring-green-500 transition-all focus:outline-none"
            aria-label="Meniu utilizator"
          >
            <Avatar className="size-8 cursor-pointer">
              <AvatarFallback className="bg-green-100 text-sm font-semibold text-green-700">
                {initial}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="flex flex-col gap-0.5">
              <span className="font-semibold">{userName}</span>
              <span className="text-xs font-normal text-muted-foreground">{userEmail}</span>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              {navItems.map(({ label, href, Icon }) => (
                <DropdownMenuItem key={href} render={<Link href={href} />} className="flex items-center gap-2 cursor-pointer">
                  <Icon className="size-4" />
                  {label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              <DropdownMenuItem render={<Link href={orgHref} />} className="flex items-center gap-2 cursor-pointer">
                <Building2 className="size-4" />
                {orgLabel}
              </DropdownMenuItem>
              <DropdownMenuItem render={<Link href="/creeaza" />} className="flex items-center gap-2 cursor-pointer">
                <Plus className="size-4" />
                Creează eveniment
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              <DropdownMenuItem render={<Link href="/profil" />} className="flex items-center gap-2 cursor-pointer">
                <User className="size-4" />
                Profil
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                className="cursor-pointer"
                onClick={handleSignOut}
              >
                <LogOut className="size-4" />
                Deconectare
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* ─── Mobil ─── */}
      <Sheet>
        <SheetTrigger
          className={buttonVariants({ variant: 'ghost', size: 'icon' }) + ' md:hidden'}
          aria-label="Deschide meniul"
        >
          <Menu className="size-5" />
        </SheetTrigger>

        <SheetContent side="left" className="flex w-72 flex-col">
          <SheetHeader>
            <SheetTitle className="text-left font-heading text-xl font-extrabold text-green-700">
              CIVICOM✨
            </SheetTitle>
          </SheetHeader>

          <div className="mt-4 flex flex-1 flex-col gap-0.5 overflow-y-auto">
            <p className="px-2 pb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Navigare
            </p>
            {navItems.map(({ label, href, Icon }) => (
              <Link
                key={href}
                href={href}
                className={buttonVariants({ variant: 'ghost', size: 'default' }) + ' justify-start gap-2'}
              >
                <Icon className="size-4" />
                {label}
              </Link>
            ))}

            <Separator className="my-2" />

            <Link
              href={orgHref}
              className={buttonVariants({ variant: 'ghost', size: 'default' }) + ' justify-start gap-2'}
            >
              <Building2 className="size-4" />
              {orgLabel}
            </Link>
            <Link
              href="/creeaza"
              className={buttonVariants({ variant: 'ghost', size: 'default' }) + ' justify-start gap-2'}
            >
              <Plus className="size-4" />
              Creează eveniment
            </Link>

            <Separator className="my-2" />

            <Link
              href="/profil"
              className={buttonVariants({ variant: 'ghost', size: 'default' }) + ' justify-start gap-2'}
            >
              <User className="size-4" />
              Profil
            </Link>
          </div>

          <div className="border-t border-border pt-4">
            <Button
              variant="destructive"
              className="w-full gap-2"
              onClick={handleSignOut}
            >
              <LogOut className="size-4" />
              Deconectare
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
