'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { SlidersHorizontal, GraduationCap, Leaf, HeartPulse, Users, PawPrint, Music } from 'lucide-react'
import { useOrgsPending } from './OrgsPendingContext'
import type { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { ORG_CATEGORY_LABELS, ORG_CATEGORIES } from '@/lib/constants'

const CAT_CONFIG: Record<string, { icon: LucideIcon; inactive: string; active: string }> = {
    educatie: {
        icon: GraduationCap,
        inactive: 'border-blue-200 bg-blue-50 text-blue-700',
        active:   'border-blue-600 bg-blue-600 text-white shadow-sm',
    },
    mediu: {
        icon: Leaf,
        inactive: 'border-emerald-200 bg-emerald-50 text-emerald-700',
        active:   'border-emerald-600 bg-emerald-600 text-white shadow-sm',
    },
    sanatate: {
        icon: HeartPulse,
        inactive: 'border-rose-200 bg-rose-50 text-rose-700',
        active:   'border-rose-600 bg-rose-600 text-white shadow-sm',
    },
    social: {
        icon: Users,
        inactive: 'border-orange-200 bg-orange-50 text-orange-700',
        active:   'border-orange-600 bg-orange-600 text-white shadow-sm',
    },
    animale: {
        icon: PawPrint,
        inactive: 'border-amber-200 bg-amber-50 text-amber-700',
        active:   'border-amber-600 bg-amber-600 text-white shadow-sm',
    },
    cultura: {
        icon: Music,
        inactive: 'border-purple-200 bg-purple-50 text-purple-700',
        active:   'border-purple-600 bg-purple-600 text-white shadow-sm',
    },
}

const CAT_ICON_BG: Record<string, string> = {
    educatie: 'bg-blue-500',
    mediu:    'bg-emerald-500',
    sanatate: 'bg-rose-500',
    social:   'bg-orange-500',
    animale:  'bg-amber-500',
    cultura:  'bg-purple-500',
}

const CAT_TEXT: Record<string, string> = {
    educatie: 'text-blue-700',
    mediu:    'text-emerald-700',
    sanatate: 'text-rose-700',
    social:   'text-orange-700',
    animale:  'text-amber-700',
    cultura:  'text-purple-700',
}

const SORT_OPTIONS = [
    { value: '',        label: 'Evaluare' },
    { value: 'members', label: 'Membri' },
    { value: 'newest',  label: 'Cele mai noi' },
]

export function OrgsMobileFABClient() {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const { startTransition } = useOrgsPending()

    const cat = searchParams.get('cat') ?? ''
    const sort = searchParams.get('sort') ?? ''

    function set(key: string, value: string) {
        const params = new URLSearchParams(searchParams.toString())
        if (value) params.set(key, value)
        else params.delete(key)
        startTransition(() => router.replace(`${pathname}?${params.toString()}`, { scroll: false }))
    }

    const activeCount = [cat, sort].filter(Boolean).length

    return (
        <div className="fixed bottom-6 right-6 z-40 lg:hidden">
            <Sheet>
                <SheetTrigger
                    render={
                        <Button className="relative size-14 rounded-xl shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40" />
                    }
                >
                    <SlidersHorizontal className="size-6" />
                    {activeCount > 0 && (
                        <span className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-secondary text-[11px] font-black text-secondary-foreground">
                            {activeCount}
                        </span>
                    )}
                </SheetTrigger>

                <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl px-6 pb-8">
                    <SheetHeader className="text-left pb-5">
                        <SheetTitle className="flex items-center gap-2 font-heading text-xl font-black uppercase tracking-tight text-foreground">
                            <SlidersHorizontal className="size-5 text-primary" />
                            Filtre
                        </SheetTitle>
                    </SheetHeader>

                    {/* Domeniu */}
                    <div className="space-y-1 mb-6">
                        <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-3">Domeniu</p>

                        {/* Toate domeniile */}
                        <button
                            type="button"
                            onClick={() => set('cat', '')}
                            className={cn(
                                'flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all',
                                !cat ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-muted'
                            )}
                        >
                            <span className={cn('flex size-8 shrink-0 items-center justify-center rounded-lg', !cat ? 'bg-primary text-white' : 'bg-muted text-muted-foreground')}>
                                <SlidersHorizontal size={15} />
                            </span>
                            Toate domeniile
                            {!cat && <span className="ml-auto text-primary">✓</span>}
                        </button>

                        {/* Categorii */}
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
                                        'flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all',
                                        isActive ? 'bg-muted' : 'text-foreground hover:bg-muted'
                                    )}
                                >
                                    <span className={cn('flex size-8 shrink-0 items-center justify-center rounded-lg text-white', CAT_ICON_BG[c])}>
                                        <Icon size={15} />
                                    </span>
                                    <span className={isActive ? CAT_TEXT[c] : ''}>{ORG_CATEGORY_LABELS[c]}</span>
                                    {isActive && <span className={cn('ml-auto', CAT_TEXT[c])}>✓</span>}
                                </button>
                            )
                        })}
                    </div>

                    {/* Sortare */}
                    <div className="space-y-3">
                        <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Sortare</p>
                        <div className="flex flex-wrap gap-2">
                            {SORT_OPTIONS.map(opt => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => set('sort', opt.value)}
                                    className={cn(
                                        'rounded-full border px-4 py-2 text-sm font-semibold transition-all',
                                        sort === opt.value
                                            ? 'border-primary bg-primary text-white shadow-sm'
                                            : 'border-border bg-background text-foreground hover:border-primary/40 hover:bg-primary/5'
                                    )}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    )
}
