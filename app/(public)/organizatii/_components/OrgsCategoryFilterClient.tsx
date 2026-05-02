'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useTransition } from 'react'
import { cn } from '@/lib/utils'
import { ORG_CATEGORY_LABELS, ORG_CATEGORIES } from '@/lib/constants'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

type Props = { filteredCount: number; totalCount: number }

export function OrgsCategoryFilterClient({ filteredCount, totalCount }: Props) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const [, startTransition] = useTransition()

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
        <div className="space-y-4 border-t border-border/50 pt-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        onClick={() => set('cat', '')}
                        className={cn(
                            'rounded-full border px-4 py-1.5 text-sm font-semibold transition-all duration-200',
                            !cat
                                ? 'border-primary bg-primary text-primary-foreground'
                                : 'border-border bg-background text-foreground hover:border-primary/50 hover:bg-primary/5'
                        )}
                    >
                        Toate domeniile
                    </button>
                    {ORG_CATEGORIES.map(c => (
                        <button
                            key={c}
                            type="button"
                            onClick={() => set('cat', cat === c ? '' : c)}
                            className={cn(
                                'rounded-full border px-4 py-1.5 text-sm font-semibold transition-all duration-200',
                                cat === c
                                    ? 'border-secondary bg-secondary text-secondary-foreground shadow-sm'
                                    : 'border-border bg-background text-foreground hover:border-primary/50 hover:bg-primary/5'
                            )}
                        >
                            {ORG_CATEGORY_LABELS[c]}
                        </button>
                    ))}
                </div>

                <Select
                    value={sort || 'rating'}
                    onValueChange={v => set('sort', !v || v === 'rating' ? '' : v)}
                >
                    <SelectTrigger className="h-9 w-44 text-sm font-semibold">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
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
