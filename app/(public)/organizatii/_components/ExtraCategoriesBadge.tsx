'use client'

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { ORG_CATEGORY_LABELS, ORG_CATEGORY_BADGE_CLASSES } from '@/lib/constants'

export function ExtraCategoriesBadge({ categories }: { categories: string[] }) {
    if (categories.length === 0) return null
    return (
        <Tooltip>
            <TooltipTrigger>
                <Badge
                    variant="outline"
                    className="cursor-default text-[10px] px-2 py-0.5 font-semibold border-border text-muted-foreground hover:bg-muted/60"
                >
                    +{categories.length}
                </Badge>
            </TooltipTrigger>
            <TooltipContent
                side="top"
                sideOffset={6}
                className="bg-card text-foreground border border-border shadow-xl rounded-xl p-2 flex flex-col gap-1.5"
                arrowClassName="bg-card"
            >
                {categories.map(cat => (
                    <span
                        key={cat}
                        className={cn(
                            'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold',
                            ORG_CATEGORY_BADGE_CLASSES[cat] ?? 'bg-muted text-muted-foreground'
                        )}
                    >
                        {ORG_CATEGORY_LABELS[cat] ?? cat}
                    </span>
                ))}
            </TooltipContent>
        </Tooltip>
    )
}
