'use client'

import { useState } from 'react'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Pie, PieChart, Cell, Sector, Label } from 'recharts'
import { Card, CardContent } from '@/components/ui/card'
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from '@/components/ui/chart'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import type { EventsChartData } from '@/services/user.service'
import { PieChartIcon, BarChart3, SlidersHorizontal, Check } from 'lucide-react'

// ── Labels / colours ──────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<string, string> = {
    protest: 'Protest', boycott: 'Boycott', petition: 'Petiție',
    community: 'Comunitar', charity: 'Caritabil',
}
const STATUS_LABELS: Record<string, string> = {
    pending: 'În așteptare', approved: 'Aprobat', rejected: 'Respins',
    contested: 'Contestat', completed: 'Finalizat',
}
const CATEGORY_COLORS: Record<string, string> = {
    protest: 'var(--primary)', boycott: 'var(--secondary)',
    petition: '#f97316', community: '#06b6d4', charity: '#a855f7',
}
const STATUS_COLORS: Record<string, string> = {
    pending: 'var(--secondary)', approved: 'var(--primary)',
    rejected: 'var(--destructive)', contested: '#f97316', completed: '#6b7280',
}

const TOP_N = 5

// ── Shared selector popover ───────────────────────────────────────────────────

type SelectorItem = { id: string; label: string; value?: number; color?: string }

function SelectorPopover({
    items,
    selected,
    onToggle,
    onReset,
    resetLabel,
    valueLabel,
}: {
    items: SelectorItem[]
    selected: Set<string>
    onToggle: (id: string) => void
    onReset: () => void
    resetLabel: string
    valueLabel?: string
}) {
    return (
        <Popover>
            <PopoverTrigger className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-background text-xs font-medium text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all cursor-default">
                <SlidersHorizontal className="size-3" />
                <span>{selected.size} / {items.length}</span>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-64 p-0">
                <div className="px-3 pt-3 pb-2 border-b border-border">
                    <p className="text-xs font-semibold text-foreground">Selectează</p>
                    {valueLabel && <p className="text-xs text-muted-foreground mt-0.5">{valueLabel}</p>}
                </div>
                <div className="max-h-60 overflow-y-auto py-1">
                    {items.map(item => {
                        const isSelected = selected.has(item.id)
                        return (
                            <button
                                key={item.id}
                                onClick={() => onToggle(item.id)}
                                className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-muted/50 transition-colors cursor-default text-left"
                            >
                                <div
                                    className="size-4 rounded-sm flex items-center justify-center shrink-0 border"
                                    style={{
                                        backgroundColor: isSelected ? (item.color ?? 'var(--primary)') : 'transparent',
                                        borderColor: item.color ?? 'var(--primary)',
                                    }}
                                >
                                    {isSelected && <Check className="size-2.5 text-white" strokeWidth={3} />}
                                </div>
                                <span className="flex-1 text-xs text-foreground truncate">{item.label}</span>
                                {item.value !== undefined && (
                                    <span className="text-xs font-semibold tabular-nums text-muted-foreground shrink-0">
                                        {item.value.toLocaleString('ro-RO')}
                                    </span>
                                )}
                            </button>
                        )
                    })}
                </div>
                <div className="px-3 py-2 border-t border-border">
                    <button onClick={onReset} className="text-xs text-primary hover:underline cursor-default font-medium">
                        {resetLabel}
                    </button>
                </div>
            </PopoverContent>
        </Popover>
    )
}

// ── useSelector hook ──────────────────────────────────────────────────────────

function useSelector(ids: string[], defaultAll = false) {
    const [selected, setSelected] = useState<Set<string>>(
        () => new Set(defaultAll ? ids : ids.slice(0, TOP_N))
    )

    function toggle(id: string) {
        setSelected(prev => {
            const next = new Set(prev)
            if (next.has(id)) { if (next.size > 1) next.delete(id) }
            else next.add(id)
            return next
        })
    }

    function reset(all = false) {
        setSelected(new Set(all ? ids : ids.slice(0, TOP_N)))
    }

    return { selected, toggle, reset }
}

// ── Main component ────────────────────────────────────────────────────────────

type Props = { data: EventsChartData }

export function EventsChartsSection({ data }: Props) {
    // Bar chart selectors — top 5 by default
    const viewsSel = useSelector(data.allByViews.map(e => e.id), false)
    const participantsSel = useSelector(data.allByParticipants.map(e => e.id), false)

    // Pie chart selectors — all by default
    const categorySel = useSelector(data.byCategory.map(d => d.category), true)
    const statusSel = useSelector(data.byStatus.map(d => d.status), true)

    // Filtered data — clip axis labels to 15 chars so they always fit
    const clip = (s: string) => s.length > 15 ? s.slice(0, 15) + '…' : s
    const viewsData = data.allByViews
        .filter(e => viewsSel.selected.has(e.id))
        .map(e => ({ ...e, title: clip(e.title) }))
    const participantsData = data.allByParticipants
        .filter(e => participantsSel.selected.has(e.id))
        .map(e => ({ ...e, title: clip(e.title) }))

    // Dynamic chart height: 36px per bar, min 160px
    const viewsH = Math.max(160, viewsData.length * 36)
    const participantsH = Math.max(160, participantsData.length * 36)

    const categoryChartData = data.byCategory
        .filter(d => categorySel.selected.has(d.category))
        .map(d => ({ ...d, label: CATEGORY_LABELS[d.category] ?? d.category, fill: CATEGORY_COLORS[d.category] ?? '#ccc' }))

    const statusChartData = data.byStatus
        .filter(d => statusSel.selected.has(d.status))
        .map(d => ({ ...d, label: STATUS_LABELS[d.status] ?? d.status, fill: STATUS_COLORS[d.status] ?? '#ccc' }))

    // Center text state for donut charts
    const [centerCategory, setCenterCategory] = useState<string>('total')
    const totalCategoryCount = categoryChartData.reduce((s, d) => s + d.count, 0)
    const effectiveCenterCategory = centerCategory === 'total'
        ? { category: 'total', count: totalCategoryCount, label: 'Total', fill: 'var(--foreground)' }
        : (categoryChartData.find(d => d.category === centerCategory) ?? categoryChartData[0])

    const [centerStatus, setCenterStatus] = useState<string>(
        () => data.byStatus.some(d => d.status === 'approved') ? 'approved' : (data.byStatus[0]?.status ?? '')
    )
    const effectiveCenterData = statusChartData.find(d => d.status === centerStatus) ?? statusChartData[0]


    // Shared active shape — brightness + shadow via filter so the CSS transition in globals.css animates it
    const activeShape = ({ outerRadius = 0, ...props }: React.ComponentProps<typeof Sector>) => (
        <Sector {...props} outerRadius={outerRadius + 9} style={{ filter: 'brightness(1.18) drop-shadow(0 2px 8px rgba(0,0,0,0.18))' }} />
    )
    const normalShape = (props: React.ComponentProps<typeof Sector>) => (
        <Sector {...props} style={{ filter: 'none' }} />
    )

    return (
        <div className="space-y-6">

            <div className="flex items-center gap-2 border-b border-border/50 pb-2">
                <BarChart3 className="size-5 text-primary" />
                <h2 className="font-heading text-xl font-bold tracking-tight text-foreground">
                    Analiză Grafică
                </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Top vizualizări */}
                <Card className="overflow-hidden rounded-2xl border border-border bg-card/50 transition-all hover:border-primary/30">
                    <CardContent className="p-5">
                        <div className="mb-4 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                                <div className="h-4 w-1 rounded-full bg-primary" />
                                <h3 className="font-bold text-foreground">Top Vizualizări</h3>
                            </div>
                            {data.allByViews.length > 0 && (
                                <SelectorPopover
                                    items={data.allByViews.map(e => ({ id: e.id, label: e.title, value: e.view_count, color: 'var(--primary)' }))}
                                    selected={viewsSel.selected}
                                    onToggle={viewsSel.toggle}
                                    onReset={() => viewsSel.reset(false)}
                                    resetLabel={`Resetează la top ${Math.min(TOP_N, data.allByViews.length)}`}
                                    valueLabel="Sortate după vizualizări"
                                />
                            )}
                        </div>

                        {viewsData.length === 0
                            ? <div className="flex h-[160px] items-center justify-center rounded-xl bg-muted/50"><p className="text-sm font-medium text-muted-foreground">Nu există date suficiente</p></div>
                            : (
                                <div style={{ height: viewsH }}>
                                    <ChartContainer config={{ view_count: { label: 'Vizualizări', color: 'var(--primary)' } }} className="h-full w-full">
                                        <BarChart data={viewsData} layout="vertical" margin={{ left: 0, right: 8, top: 0, bottom: 0 }}>
                                            <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="var(--border)" />
                                            <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} />
                                            <YAxis type="category" dataKey="title" width={105} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} />
                                            <ChartTooltip content={<ChartTooltipContent />} />
                                            <Bar dataKey="view_count" fill="var(--color-view_count)" radius={[0, 4, 4, 0]} barSize={20} />
                                        </BarChart>
                                    </ChartContainer>
                                </div>
                            )
                        }
                    </CardContent>
                </Card>

                {/* Top participanți */}
                <Card className="overflow-hidden rounded-2xl border border-border bg-card/50 transition-all hover:border-primary/30">
                    <CardContent className="p-5">
                        <div className="mb-4 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                                <div className="h-4 w-1 rounded-full bg-secondary" />
                                <h3 className="font-bold text-foreground">Top Participanți</h3>
                            </div>
                            {data.allByParticipants.length > 0 && (
                                <SelectorPopover
                                    items={data.allByParticipants.map(e => ({ id: e.id, label: e.title, value: e.participants_count, color: 'var(--secondary)' }))}
                                    selected={participantsSel.selected}
                                    onToggle={participantsSel.toggle}
                                    onReset={() => participantsSel.reset(false)}
                                    resetLabel={`Resetează la top ${Math.min(TOP_N, data.allByParticipants.length)}`}
                                    valueLabel="Sortate după participanți"
                                />
                            )}
                        </div>

                        {participantsData.length === 0
                            ? <div className="flex h-[160px] items-center justify-center rounded-xl bg-muted/50"><p className="text-sm font-medium text-muted-foreground">Nu există date suficiente</p></div>
                            : (
                                <div style={{ height: participantsH }}>
                                    <ChartContainer config={{ participants_count: { label: 'Participanți', color: 'var(--secondary)' } }} className="h-full w-full">
                                        <BarChart data={participantsData} layout="vertical" margin={{ left: 0, right: 8, top: 0, bottom: 0 }}>
                                            <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="var(--border)" />
                                            <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} />
                                            <YAxis type="category" dataKey="title" width={105} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} />
                                            <ChartTooltip content={<ChartTooltipContent />} />
                                            <Bar dataKey="participants_count" fill="var(--color-participants_count)" radius={[0, 4, 4, 0]} barSize={20} />
                                        </BarChart>
                                    </ChartContainer>
                                </div>
                            )
                        }
                    </CardContent>
                </Card>

                {/* Distribuție categorii */}
                <Card className="overflow-hidden rounded-2xl border border-border bg-card/50 transition-all hover:border-primary/30">
                    <CardContent className="p-5">
                        <div className="mb-2 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                                <PieChartIcon className="size-4 text-muted-foreground" />
                                <h3 className="font-bold text-foreground">Distribuție pe Categorii</h3>
                            </div>
                            {data.byCategory.length > 0 && (
                                <SelectorPopover
                                    items={data.byCategory.map(d => ({
                                        id: d.category,
                                        label: CATEGORY_LABELS[d.category] ?? d.category,
                                        value: d.count,
                                        color: CATEGORY_COLORS[d.category] ?? '#ccc',
                                    }))}
                                    selected={categorySel.selected}
                                    onToggle={categorySel.toggle}
                                    onReset={() => categorySel.reset(true)}
                                    resetLabel="Selectează toate"
                                    valueLabel="Evenimente per categorie"
                                />
                            )}
                        </div>

                        {categoryChartData.length === 0
                            ? <div className="flex h-[200px] items-center justify-center rounded-xl bg-muted/50 mt-4"><p className="text-sm font-medium text-muted-foreground">Nu există date suficiente</p></div>
                            : (
                                <>
                                    <ChartContainer config={Object.fromEntries(categoryChartData.map(d => [d.category, { label: d.label, color: d.fill }]))} className="h-[190px] w-full">
                                        <PieChart>
                                            <Pie
                                                data={categoryChartData}
                                                dataKey="count"
                                                nameKey="label"
                                                innerRadius={45}
                                                outerRadius={78}
                                                paddingAngle={2}
                                                shape={normalShape}
                                                activeShape={activeShape}
                                            >
                                                {categoryChartData.map((entry) => (
                                                    <Cell key={entry.category} fill={entry.fill} stroke="transparent" />
                                                ))}
                                                <Label
                                                    content={({ viewBox }) => {
                                                        if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                                                            return (
                                                                <text textAnchor="middle" dominantBaseline="middle">
                                                                    <tspan x={viewBox.cx} y={(viewBox.cy ?? 0) - 8} fill={effectiveCenterCategory?.fill ?? 'var(--foreground)'} fontSize={26} fontWeight={700} fontFamily="var(--font-heading)">
                                                                        {effectiveCenterCategory?.count ?? 0}
                                                                    </tspan>
                                                                    <tspan x={viewBox.cx} y={(viewBox.cy ?? 0) + 14} fill="var(--muted-foreground)" fontSize={11}>
                                                                        {effectiveCenterCategory?.label ?? ''}
                                                                    </tspan>
                                                                </text>
                                                            )
                                                        }
                                                    }}
                                                />
                                            </Pie>
                                            <ChartTooltip content={<ChartTooltipContent nameKey="label" />} />
                                        </PieChart>
                                    </ChartContainer>

                                    {/* Legend */}
                                    <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 mt-1">
                                        {categoryChartData.map(d => (
                                            <div key={d.category} className="flex items-center gap-1.5">
                                                <span className="size-2 rounded-full shrink-0" style={{ backgroundColor: d.fill }} />
                                                <span className="text-xs text-muted-foreground">{d.label}</span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Center value selector */}
                                    <div className="mt-3 border-t border-border/50 pt-3">
                                        <p className="text-center text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">Valoare centrală</p>
                                        <div className="flex flex-wrap justify-center gap-1.5">
                                            <button
                                                onClick={() => setCenterCategory('total')}
                                                className="px-2.5 py-0.5 rounded-full text-xs font-medium transition-all cursor-default border"
                                                style={{
                                                    backgroundColor: centerCategory === 'total' ? 'var(--foreground)' : 'transparent',
                                                    borderColor: centerCategory === 'total' ? 'var(--foreground)' : 'var(--border)',
                                                    color: centerCategory === 'total' ? 'var(--background)' : 'var(--muted-foreground)',
                                                }}
                                            >
                                                Total
                                            </button>
                                            {categoryChartData.map(d => {
                                                const isActive = centerCategory === d.category
                                                return (
                                                    <button
                                                        key={d.category}
                                                        onClick={() => setCenterCategory(d.category)}
                                                        className="px-2.5 py-0.5 rounded-full text-xs font-medium transition-all cursor-default border"
                                                        style={{
                                                            backgroundColor: isActive ? d.fill : 'transparent',
                                                            borderColor: isActive ? d.fill : 'var(--border)',
                                                            color: isActive ? '#fff' : 'var(--muted-foreground)',
                                                        }}
                                                    >
                                                        {d.label}
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </div>
                                </>
                            )
                        }
                    </CardContent>
                </Card>

                {/* Distribuție statusuri */}
                <Card className="overflow-hidden rounded-2xl border border-border bg-card/50 transition-all hover:border-primary/30">
                    <CardContent className="p-5">
                        <div className="mb-2 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                                <PieChartIcon className="size-4 text-muted-foreground" />
                                <h3 className="font-bold text-foreground">Distribuție pe Statusuri</h3>
                            </div>
                            {data.byStatus.length > 0 && (
                                <SelectorPopover
                                    items={data.byStatus.map(d => ({
                                        id: d.status,
                                        label: STATUS_LABELS[d.status] ?? d.status,
                                        value: d.count,
                                        color: STATUS_COLORS[d.status] ?? '#ccc',
                                    }))}
                                    selected={statusSel.selected}
                                    onToggle={statusSel.toggle}
                                    onReset={() => statusSel.reset(true)}
                                    resetLabel="Selectează toate"
                                    valueLabel="Evenimente per status"
                                />
                            )}
                        </div>

                        {statusChartData.length === 0
                            ? <div className="flex h-[200px] items-center justify-center rounded-xl bg-muted/50 mt-4"><p className="text-sm font-medium text-muted-foreground">Nu există date suficiente</p></div>
                            : (
                                <>
                                    <ChartContainer config={Object.fromEntries(statusChartData.map(d => [d.status, { label: d.label, color: d.fill }]))} className="h-[190px] w-full">
                                        <PieChart>
                                            <Pie
                                                data={statusChartData}
                                                dataKey="count"
                                                nameKey="label"
                                                innerRadius={45}
                                                outerRadius={78}
                                                paddingAngle={2}
                                                shape={normalShape}
                                                activeShape={activeShape}
                                            >
                                                {statusChartData.map((entry) => (
                                                    <Cell key={entry.status} fill={entry.fill} stroke="transparent" />
                                                ))}
                                                <Label
                                                    content={({ viewBox }) => {
                                                        if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                                                            return (
                                                                <text textAnchor="middle" dominantBaseline="middle">
                                                                    <tspan x={viewBox.cx} y={(viewBox.cy ?? 0) - 8} fill={effectiveCenterData?.fill ?? 'var(--foreground)'} fontSize={26} fontWeight={700} fontFamily="var(--font-heading)">
                                                                        {effectiveCenterData?.count ?? 0}
                                                                    </tspan>
                                                                    <tspan x={viewBox.cx} y={(viewBox.cy ?? 0) + 14} fill="var(--muted-foreground)" fontSize={11}>
                                                                        {effectiveCenterData?.label ?? ''}
                                                                    </tspan>
                                                                </text>
                                                            )
                                                        }
                                                    }}
                                                />
                                            </Pie>
                                            <ChartTooltip content={<ChartTooltipContent nameKey="label" />} />
                                        </PieChart>
                                    </ChartContainer>

                                    {/* Legend */}
                                    <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 mt-1">
                                        {statusChartData.map(d => (
                                            <div key={d.status} className="flex items-center gap-1.5">
                                                <span className="size-2 rounded-full shrink-0" style={{ backgroundColor: d.fill }} />
                                                <span className="text-xs text-muted-foreground">{d.label}</span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Center value selector */}
                                    <div className="mt-3 border-t border-border/50 pt-3">
                                        <p className="text-center text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">Valoare centrală</p>
                                        <div className="flex flex-wrap justify-center gap-1.5">
                                            {statusChartData.map(d => {
                                                const isActive = effectiveCenterData?.status === d.status
                                                return (
                                                    <button
                                                        key={d.status}
                                                        onClick={() => setCenterStatus(d.status)}
                                                        className="px-2.5 py-0.5 rounded-full text-xs font-medium transition-all cursor-default border"
                                                        style={{
                                                            backgroundColor: isActive ? d.fill : 'transparent',
                                                            borderColor: isActive ? d.fill : 'var(--border)',
                                                            color: isActive ? '#fff' : 'var(--muted-foreground)',
                                                        }}
                                                    >
                                                        {d.label}
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </div>
                                </>
                            )
                        }
                    </CardContent>
                </Card>

            </div>
        </div>
    )
}
