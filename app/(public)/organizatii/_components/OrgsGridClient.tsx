'use client'

import type { ReactNode } from 'react'
import { useOrgsPending } from './OrgsPendingContext'
import { OrgsGridSkeleton } from './OrgsGridSkeleton'

export function OrgsGridClient({ children }: { children: ReactNode }) {
    const { isPending } = useOrgsPending()
    if (isPending) return <OrgsGridSkeleton />
    return <>{children}</>
}
