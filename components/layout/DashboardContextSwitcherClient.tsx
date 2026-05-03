'use client'

import { useSearchParams, usePathname, useRouter } from 'next/navigation'
import { ChevronDown } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

type Org = { id: string; name: string; logo_url: string | null }

type Props = {
  userName: string
  userEmail: string
  avatarUrl: string | null
  org: Org | null
}

export function DashboardContextSwitcherClient({ userName, userEmail, avatarUrl, org }: Props) {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()
  const isOrgContext = searchParams.get('context') === 'org' && !!org
  const userInitial = userName.charAt(0).toUpperCase()

  function switchTo(context: 'user' | 'org') {
    const basePath = pathname.split('?')[0]
    router.push(context === 'org' ? `${basePath}?context=org` : basePath)
  }

  if (!org) {
    return (
      <div className="flex items-center gap-3 px-4 py-4 border-b border-border">
        <Avatar className="size-9 shrink-0 border border-border/50">
          <AvatarImage src={avatarUrl ?? undefined} alt={userName} />
          <AvatarFallback className="bg-primary/10 text-sm font-bold text-primary">{userInitial}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="text-sm font-bold text-foreground truncate">{userName}</p>
          <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
        </div>
      </div>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex w-full items-center gap-3 px-4 py-4 border-b border-border hover:bg-muted/30 transition-colors focus:outline-none">
        <Avatar className="size-9 shrink-0 border border-border/50">
          {isOrgContext && org.logo_url
            ? <AvatarImage src={org.logo_url} alt={org.name} />
            : <AvatarImage src={!isOrgContext ? (avatarUrl ?? undefined) : undefined} alt={userName} />
          }
          <AvatarFallback className="bg-primary/10 text-sm font-bold text-primary">
            {isOrgContext ? org.name.charAt(0).toUpperCase() : userInitial}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0 text-left">
          <p className="text-sm font-bold text-foreground truncate">
            {isOrgContext ? org.name : userName}
          </p>
          <p className="text-xs text-muted-foreground">
            {isOrgContext ? 'Context ONG' : userEmail}
          </p>
        </div>
        <ChevronDown className="size-4 text-muted-foreground shrink-0" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-[260px] p-1.5">
        <DropdownMenuItem
          onClick={() => switchTo('user')}
          className={cn('gap-3 rounded-lg p-2 cursor-pointer', !isOrgContext && 'bg-primary/5 text-primary')}
        >
          <Avatar className="size-7">
            <AvatarImage src={avatarUrl ?? undefined} />
            <AvatarFallback className="text-xs bg-primary/10 text-primary">{userInitial}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-semibold">{userName}</p>
            <p className="text-xs text-muted-foreground">Cont personal</p>
          </div>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => switchTo('org')}
          className={cn('gap-3 rounded-lg p-2 cursor-pointer', isOrgContext && 'bg-primary/5 text-primary')}
        >
          <Avatar className="size-7">
            {org.logo_url && <AvatarImage src={org.logo_url} />}
            <AvatarFallback className="text-xs bg-primary/10 text-primary">
              {org.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-semibold">{org.name}</p>
            <p className="text-xs text-muted-foreground">Organizație</p>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
