'use client'

import { createContext, useContext, useTransition, type ReactNode } from 'react'

type Ctx = {
    isPending: boolean
    startTransition: (fn: () => void) => void
}

const OrgsPendingCtx = createContext<Ctx>({
    isPending: false,
    startTransition: (fn) => fn(),
})

export function OrgsPendingProvider({ children }: { children: ReactNode }) {
    const [isPending, startTransition] = useTransition()
    return (
        <OrgsPendingCtx.Provider value={{ isPending, startTransition }}>
            {children}
        </OrgsPendingCtx.Provider>
    )
}

export function useOrgsPending() {
    return useContext(OrgsPendingCtx)
}
