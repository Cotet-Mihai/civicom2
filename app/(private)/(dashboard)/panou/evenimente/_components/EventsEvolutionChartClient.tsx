'use client'

import { useState, useTransition, useEffect } from 'react'
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { Card, CardContent } from '@/components/ui/card'
import {
    ChartContainer,
    ChartLegend,
    ChartLegendContent,
    ChartTooltip,
    ChartTooltipContent,
} from '@/components/ui/chart'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import {
    getEvolutionData,
    getViewsEvolution,
    type TimeRange,
    type ViewRange,
    type EvolutionMetric,
    type EvolutionData,
} from '@/services/user.service'
import { TrendingUp, SlidersHorizontal, Check } from 'lucide-react'

const TIME_RANGES: { value: TimeRange; label: string }[] = [
    { value: '24h', label: 'Azi' },
    { value: '7d', label: '7 zile' },
    { value: '30d', label: '30 zile' },
    { value: '3m', label: '3 luni' },
    { value: '6m', label: '6 luni' },
    { value: 'all', label: 'Toate' },
]

const VIEW_RANGES: { value: ViewRange; label: string }[] = [
    { value: 'today', label: 'Azi' },
    { value: '7d', label: '7 zile' },
    { value: '30d', label: '30 zile' },
]

const METRICS: { value: EvolutionMetric; label: string }[] = [
    { value: 'views', label: 'Vizualizări' },
    { value: 'participants', label: 'Participanți' },
    { value: 'signatures', label: 'Semnături petiții' },
]

const TOP_N = 5

function SortedTooltipContent(props: any) {
    if (!props.payload) return <ChartTooltipContent {...props} />
    const sorted = { ...props, payload: [...props.payload].sort((a: any, b: any) => (b.value ?? 0) - (a.value ?? 0)) }
    return <ChartTooltipContent {...sorted} />
}

function makeEndDot(color: string, totalPoints: number) {
    return function EndDot({ cx, cy, index }: any) {
        if (index !== totalPoints - 1 || !cx || !cy) return null
        return (
            <g>
                <circle cx={cx} cy={cy} r={4} fill={color} opacity={0.35}>
                    <animate attributeName="r" values="4;11;4" dur="2s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.35;0;0.35" dur="2s" repeatCount="indefinite" />
                </circle>
                <circle cx={cx} cy={cy} r={4} fill={color} stroke="var(--background)" strokeWidth={2} />
            </g>
        )
    }
}

function topIds(data: EvolutionData): Set<string> {
    return new Set(data.series.slice(0, TOP_N).map(s => s.id))
}

type Props = {
    initialData: EvolutionData
    context?: 'user' | 'org'
    orgId?: string
}

export function EventsEvolutionChartClient({ initialData, context = 'user', orgId }: Props) {
    const [timeRange, setTimeRange] = useState<TimeRange>('24h')
    const [viewRange, setViewRange] = useState<ViewRange>('today')
    const [metric, setMetric] = useState<EvolutionMetric>('views')
    const [data, setData] = useState<EvolutionData>(initialData)
    const [selectedIds, setSelectedIds] = useState<Set<string>>(() => topIds(initialData))
    const [isPending, startTransition] = useTransition()

    useEffect(() => {
        setSelectedIds(topIds(data))
    }, [data])

    function fetchEvolution(range: TimeRange, m: EvolutionMetric) {
        startTransition(async () => {
            const result = await getEvolutionData(range, m, context, orgId)
            setData(result)
        })
    }

    function fetchViews(vRange: ViewRange) {
        startTransition(async () => {
            const result = await getViewsEvolution(context, vRange, orgId)
            setData(result)
        })
    }

    function handleRange(range: TimeRange) {
        setTimeRange(range)
        fetchEvolution(range, metric)
    }

    function handleViewRange(vRange: ViewRange) {
        setViewRange(vRange)
        fetchViews(vRange)
    }

    function handleMetric(m: EvolutionMetric) {
        setMetric(m)
        if (m === 'views') {
            fetchViews(viewRange)
        } else {
            fetchEvolution(timeRange, m)
        }
    }

    function toggleEvent(id: string) {
        setSelectedIds(prev => {
            const next = new Set(prev)
            if (next.has(id)) {
                if (next.size > 1) next.delete(id)
            } else {
                next.add(id)
            }
            return next
        })
    }

    const visibleSeries = data.series.filter(s => selectedIds.has(s.id))
    const chartConfig = Object.fromEntries(
        visibleSeries.map(s => [s.id, { label: s.name, color: s.color }])
    )
    const isEmpty = data.chartPoints.length === 0 || visibleSeries.length === 0

    const metricLabel = METRICS.find(m => m.value === metric)?.label ?? ''

    return (
        <Card className="overflow-hidden rounded-2xl border border-border bg-card/50 transition-all hover:border-primary/30">
            <CardContent className="p-5 space-y-4">

                {/* Header + selectors */}
                <div className="flex flex-col gap-3 border-b border-border/50 pb-4">
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                            <TrendingUp className="size-4 text-primary" />
                            <h3 className="font-bold text-foreground">Evoluție în timp</h3>
                        </div>

                        {/* Event selector */}
                        {data.series.length > 0 && (
                            <Popover>
                                <PopoverTrigger className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-background text-xs font-medium text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all cursor-default">
                                    <SlidersHorizontal className="size-3" />
                                    <span>{selectedIds.size} / {data.series.length} evenimente</span>
                                </PopoverTrigger>
                                <PopoverContent align="end" className="w-72 p-0">
                                    <div className="px-3 pt-3 pb-2 border-b border-border">
                                        <p className="text-xs font-semibold text-foreground">Selectează evenimente</p>
                                        <p className="text-xs text-muted-foreground mt-0.5">Sortate după {metricLabel.toLowerCase()}</p>
                                    </div>
                                    <div className="max-h-64 overflow-y-auto py-1">
                                        {data.series.map(s => {
                                            const isSelected = selectedIds.has(s.id)
                                            const value = data.eventValues[s.id] ?? 0
                                            return (
                                                <button
                                                    key={s.id}
                                                    onClick={() => toggleEvent(s.id)}
                                                    className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-muted/50 transition-colors cursor-default text-left"
                                                >
                                                    {/* Color dot + check */}
                                                    <div
                                                        className="size-4 rounded-sm flex items-center justify-center shrink-0 border"
                                                        style={{
                                                            backgroundColor: isSelected ? s.color : 'transparent',
                                                            borderColor: s.color,
                                                        }}
                                                    >
                                                        {isSelected && <Check className="size-2.5 text-white" strokeWidth={3} />}
                                                    </div>
                                                    <span className="flex-1 text-xs text-foreground truncate">{s.name}</span>
                                                    <span className="text-xs font-semibold tabular-nums text-muted-foreground shrink-0">
                                                        {value.toLocaleString('ro-RO')}
                                                    </span>
                                                </button>
                                            )
                                        })}
                                    </div>
                                    <div className="px-3 py-2 border-t border-border">
                                        <button
                                            onClick={() => setSelectedIds(topIds(data))}
                                            className="text-xs text-primary hover:underline cursor-default font-medium"
                                        >
                                            Resetează la top {Math.min(TOP_N, data.series.length)}
                                        </button>
                                    </div>
                                </PopoverContent>
                            </Popover>
                        )}
                    </div>

                    {/* Metric pills */}
                    <div className="flex gap-1.5 flex-wrap">
                        {METRICS.map(m => (
                            <button
                                key={m.value}
                                onClick={() => handleMetric(m.value)}
                                disabled={isPending}
                                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-default ${
                                    metric === m.value
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-muted text-muted-foreground hover:bg-muted/60'
                                }`}
                            >
                                {m.label}
                            </button>
                        ))}
                    </div>

                    {/* Time range tabs */}
                    <div className="flex gap-1 flex-wrap">
                        {metric === 'views'
                            ? VIEW_RANGES.map(r => (
                                <button
                                    key={r.value}
                                    onClick={() => handleViewRange(r.value)}
                                    disabled={isPending}
                                    className={`px-2.5 py-0.5 rounded-md text-xs font-medium transition-all cursor-default ${
                                        viewRange === r.value
                                            ? 'bg-foreground text-background'
                                            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                                    }`}
                                >
                                    {r.label}
                                </button>
                            ))
                            : TIME_RANGES.map(r => (
                                <button
                                    key={r.value}
                                    onClick={() => handleRange(r.value)}
                                    disabled={isPending}
                                    className={`px-2.5 py-0.5 rounded-md text-xs font-medium transition-all cursor-default ${
                                        timeRange === r.value
                                            ? 'bg-foreground text-background'
                                            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                                    }`}
                                >
                                    {r.label}
                                </button>
                            ))
                        }
                    </div>
                </div>

                {/* Chart */}
                <div className={`transition-opacity duration-200 ${isPending ? 'opacity-40' : 'opacity-100'}`}>
                    {isEmpty ? (
                        <div className="flex h-[220px] items-center justify-center rounded-xl bg-muted/50">
                            <p className="text-sm font-medium text-muted-foreground">
                                Nu există date pentru această perioadă
                            </p>
                        </div>
                    ) : (
                        <ChartContainer config={chartConfig} className="h-[260px] w-full">
                            <AreaChart
                                data={data.chartPoints}
                                margin={{ left: 0, right: 8, top: metric === 'views' ? 22 : 4, bottom: 0 }}
                            >
                                <defs>
                                    {visibleSeries.map(s => (
                                        <linearGradient key={s.id} id={`fill-${s.id}`} x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={s.color} stopOpacity={0.3} />
                                            <stop offset="95%" stopColor={s.color} stopOpacity={0.02} />
                                        </linearGradient>
                                    ))}
                                </defs>
                                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
                                <XAxis
                                    dataKey="label"
                                    tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                                    tickLine={false}
                                    axisLine={false}
                                    interval="preserveStartEnd"
                                />
                                <YAxis
                                    tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                                    tickLine={false}
                                    axisLine={false}
                                    allowDecimals={false}
                                    width={32}
                                />
                                <ChartTooltip content={metric === 'views' ? <SortedTooltipContent /> : <ChartTooltipContent />} />
                                <ChartLegend content={<ChartLegendContent />} />
                                {visibleSeries.map(s => (
                                    <Area
                                        key={s.id}
                                        type="monotone"
                                        dataKey={s.id}
                                        name={s.name}
                                        stroke={s.color}
                                        strokeWidth={2}
                                        fill={`url(#fill-${s.id})`}
                                        dot={metric === 'views'
                                            ? makeEndDot(s.color, data.chartPoints.length)
                                            : false
                                        }
                                        activeDot={{ r: 4, strokeWidth: 0, fill: s.color }}
                                    />
                                ))}
                            </AreaChart>
                        </ChartContainer>
                    )}
                </div>

            </CardContent>
        </Card>
    )
}
