import type { LucideIcon } from 'lucide-react'

export type StatBannerItem = {
    icon: LucideIcon
    iconClassName?: string
    value: string | number
    label: string
}

type Props = {
    badge?: string
    title: string
    subtitle?: string
    items: StatBannerItem[]
}

export function StatsBanner({ badge, title, subtitle, items }: Props) {
    return (
        <div className="relative overflow-hidden rounded-2xl bg-foreground px-6 py-7 md:px-10 cursor-default">
            <div className="absolute left-1/2 top-0 -translate-x-1/2 blur-3xl opacity-20 pointer-events-none">
                <div className="aspect-[1100/300] w-[900px] bg-gradient-to-tr from-primary/50 to-primary" />
            </div>

            <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div>
                    {badge && (
                        <p className="text-[10px] font-black uppercase tracking-widest text-background/50">{badge}</p>
                    )}
                    <h2 className="font-heading text-xl font-black tracking-tight text-background md:text-2xl">
                        {title}
                    </h2>
                    {subtitle && (
                        <p className="mt-1 text-xs text-background/40">{subtitle}</p>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-4 md:flex md:flex-wrap md:gap-y-4 md:gap-x-0 md:divide-x md:divide-background/10">
                    {items.map((item, i) => (
                        <div key={i} className="flex flex-col items-center gap-1 md:px-6 md:first:pl-6">
                            <item.icon className={item.iconClassName ?? 'size-4 text-primary'} />
                            <span className="font-heading text-3xl font-black tracking-tighter text-background md:text-4xl">
                                {typeof item.value === 'number' ? item.value.toLocaleString('ro-RO') : item.value}
                            </span>
                            <span className="text-[10px] font-semibold uppercase tracking-widest text-background/50">
                                {item.label}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
