'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { useFiltersPending } from './FiltersPendingContext'

type Props = { cauta?: string }

export function MobileSearchBarClient({ cauta }: Props) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { startTransition } = useFiltersPending()
    const [value, setValue] = useState(cauta ?? '')
    const timeout = useRef<ReturnType<typeof setTimeout> | null>(null)

    useEffect(() => { setValue(cauta ?? '') }, [cauta])

    function handleChange(val: string) {
        setValue(val)
        if (timeout.current) clearTimeout(timeout.current)
        timeout.current = setTimeout(() => {
            const params = new URLSearchParams(searchParams.toString())
            if (val) {
                params.set('cauta', val)
            } else {
                params.delete('cauta')
            }
            startTransition(() => {
                router.replace('/evenimente?' + params.toString())
            })
        }, 400)
    }

    return (
        <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
                type="search"
                placeholder="Caută evenimente..."
                value={value}
                onChange={(e) => handleChange(e.target.value)}
                className="pl-9"
            />
        </div>
    )
}
