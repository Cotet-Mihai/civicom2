'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useEffect, useRef, useState, useTransition } from 'react'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { ORG_CATEGORY_LABELS } from '@/lib/constants'
import { cn } from '@/lib/utils'

const POPULAR = ['mediu', 'educatie', 'sanatate', 'animale', 'social']

export function OrgsSearchBarClient() {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const [, startTransition] = useTransition()

    const cat = searchParams.get('cat') ?? ''
    const [inputValue, setInputValue] = useState(() => searchParams.get('q') ?? '')
    const mountRef = useRef(true)

    useEffect(() => {
        if (mountRef.current) { mountRef.current = false; return }
        const timer = setTimeout(() => {
            const params = new URLSearchParams(searchParams.toString())
            if (inputValue) params.set('q', inputValue)
            else params.delete('q')
            startTransition(() => router.replace(`${pathname}?${params.toString()}`, { scroll: false }))
        }, 350)
        return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [inputValue])

    function setCategory(term: string) {
        const params = new URLSearchParams(searchParams.toString())
        if (cat === term) params.delete('cat')
        else params.set('cat', term)
        startTransition(() => router.replace(`${pathname}?${params.toString()}`, { scroll: false }))
    }

    return (
        <div className="space-y-3">
            <div className="relative">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    value={inputValue}
                    onChange={e => setInputValue(e.target.value)}
                    placeholder="Caută un ONG după nume sau domeniu..."
                    className="h-12 bg-card pl-10 pr-10 text-base border-border focus-visible:ring-primary/20"
                />
                {inputValue && (
                    <button
                        type="button"
                        onClick={() => setInputValue('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                    >
                        <X className="size-4" />
                    </button>
                )}
            </div>

            {!inputValue && (
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
                    <span className="text-xs font-medium text-muted-foreground">Căutări populare:</span>
                    {POPULAR.map(term => (
                        <button
                            key={term}
                            type="button"
                            onClick={() => setCategory(term)}
                            className={cn(
                                'text-xs font-semibold transition-colors',
                                cat === term ? 'text-primary' : 'text-muted-foreground hover:text-primary'
                            )}
                        >
                            {ORG_CATEGORY_LABELS[term]}
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}
