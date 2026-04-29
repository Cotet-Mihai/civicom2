'use client'

import { createContext, useContext, useTransition, type ReactNode } from 'react'

type Ctx = {
    isPending: boolean
    startTransition: (fn: () => void) => void
}

const FiltersPendingCtx = createContext<Ctx>({
    isPending: false,
    startTransition: (fn) => fn(),
})

export function FiltersPendingProvider({ children }: { children: ReactNode }) {
    const [isPending, startTransition] = useTransition()
    return (
        <FiltersPendingCtx.Provider value={{ isPending, startTransition }}>
            {children}
        </FiltersPendingCtx.Provider>
    )
}

export function useFiltersPending() {
    return useContext(FiltersPendingCtx)
}
