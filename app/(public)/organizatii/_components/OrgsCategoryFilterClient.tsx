'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { GraduationCap, Leaf, HeartPulse, Users, PawPrint, Music } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ORG_CATEGORY_LABELS, ORG_CATEGORIES } from '@/lib/constants'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import { useOrgsPending } from './OrgsPendingContext'

const SORT_LABELS: Record<string, string> = {
    rating: 'Evaluare',
    members: 'Membri',
    newest: 'Cele mai noi',
}

type CatConfig = {
    icon: LucideIcon
    inactive: string
    active: string
}

const CAT_CONFIG: Record<string, CatConfig> = {
    educatie: {
        icon: GraduationCap,
        inactive: 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:border-blue-300',
        active:   'border-blue-600 bg-blue-600 text-white shadow-sm',
    },
    mediu: {
        icon: Leaf,
        inactive: 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-300',
        active:   'border-emerald-600 bg-emerald-600 text-white shadow-sm',
    },
    sanatate: {
        icon: HeartPulse,
        inactive: 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 hover:border-rose-300',
        active:   'border-rose-600 bg-rose-600 text-white shadow-sm',
    },
    social: {
        icon: Users,
        inactive: 'border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100 hover:border-orange-300',
        active:   'border-orange-600 bg-orange-600 text-white shadow-sm',
    },
    animale: {
        icon: PawPrint,
        inactive: 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 hover:border-amber-300',
        active:   'border-amber-600 bg-amber-600 text-white shadow-sm',
    },
    cultura: {
        icon: Music,
        inactive: 'border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 hover:border-purple-300',
        active:   'border-purple-600 bg-purple-600 text-white shadow-sm',
    },
}

type Props = { filteredCount: number; totalCount: number }

export function OrgsCategoryFilterClient({ filteredCount, totalCount }: Props) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const { startTransition } = useOrgsPending()

    const cat = searchParams.get('cat') ?? ''
    const sort = searchParams.get('sort') ?? ''
    const q = searchParams.get('q') ?? ''

    function set(key: string, value: string) {
        const params = new URLSearchParams(searchParams.toString())
        if (value) params.set(key, value)
        else params.delete(key)
        startTransition(() => router.replace(`${pathname}?${params.toString()}`, { scroll: false }))
    }

    const hasFilter = !!(q || cat)

    return (
        <div className="space-y-3 border-t border-border/50 pt-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        onClick={() => set('cat', '')}
                        className={cn(
                            'rounded-full border px-4 py-1.5 text-sm font-semibold transition-all duration-200',
                            !cat
                                ? 'border-primary bg-primary text-white shadow-sm'
                                : 'border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 hover:border-primary/40'
                        )}
                    >
                        Toate domeniile
                    </button>

                    {ORG_CATEGORIES.map(c => {
                        const cfg = CAT_CONFIG[c]
                        const Icon = cfg.icon
                        const isActive = cat === c
                        return (
                            <button
                                key={c}
                                type="button"
                                onClick={() => set('cat', isActive ? '' : c)}
                                className={cn(
                                    'flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-semibold transition-all duration-200',
                                    isActive ? cfg.active : cfg.inactive
                                )}
                            >
                                <Icon size={13} />
                                {ORG_CATEGORY_LABELS[c]}
                            </button>
                        )
                    })}
                </div>

                <Select
                    value={sort || 'rating'}
                    onValueChange={v => set('sort', !v || v === 'rating' ? '' : v)}
                >
                    <SelectTrigger className="h-9 w-44 text-sm font-semibold">
                        <span className="flex flex-1 text-left">{SORT_LABELS[sort] ?? 'Evaluare'}</span>
                    </SelectTrigger>
                    <SelectContent alignItemWithTrigger={false}>
                        <SelectItem value="rating">Evaluare</SelectItem>
                        <SelectItem value="members">Membri</SelectItem>
                        <SelectItem value="newest">Cele mai noi</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {hasFilter && (
                <p className="text-sm text-muted-foreground">
                    <strong className="text-foreground">{filteredCount}</strong>
                    {' '}{filteredCount === 1 ? 'organizație găsită' : 'organizații găsite'}
                    {totalCount !== filteredCount && ` din ${totalCount}`}
                </p>
            )}
        </div>
    )
}
