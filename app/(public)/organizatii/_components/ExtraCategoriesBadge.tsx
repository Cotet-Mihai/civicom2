'use client'

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Badge } from '@/components/ui/badge'
import { ORG_CATEGORY_LABELS } from '@/lib/constants'

export function ExtraCategoriesBadge({ categories }: { categories: string[] }) {
    if (categories.length === 0) return null
    return (
        <Tooltip>
            <TooltipTrigger>
                <Badge variant="outline" className="cursor-default text-[10px] px-2 py-0.5 font-semibold text-muted-foreground">
                    +{categories.length}
                </Badge>
            </TooltipTrigger>
            <TooltipContent side="top" className="flex flex-col gap-1">
                {categories.map(cat => (
                    <span key={cat}>{ORG_CATEGORY_LABELS[cat] ?? cat}</span>
                ))}
            </TooltipContent>
        </Tooltip>
    )
}
