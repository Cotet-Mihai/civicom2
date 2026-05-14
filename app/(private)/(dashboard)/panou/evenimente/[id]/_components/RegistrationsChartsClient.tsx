'use client'

import { useMemo } from 'react'
import { AreaChart, Area, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, ReferenceLine } from 'recharts'
import { Card, CardContent } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { CalendarDays, Clock } from 'lucide-react'
import type { ProtestParticipant } from '@/services/stats.service'

type Props = {
  participants: ProtestParticipant[]
  createdAt: string
  protestDate: string
}

export function RegistrationsChartsClient({ participants, createdAt, protestDate }: Props) {
  const joined = participants.filter(p => p.status === 'joined')

  const dailyData = useMemo(() => {
    const start = new Date(createdAt)
    start.setHours(0, 0, 0, 0)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const days = Math.min(Math.ceil((today.getTime() - start.getTime()) / 86400000) + 1, 90)

    const dayMap: Record<string, number> = {}
    joined.forEach(p => {
      const date = new Date(p.joined_at)
      if (isNaN(date.getTime())) return
      const key = date.toLocaleDateString('ro-RO', { day: '2-digit', month: 'short' })
      dayMap[key] = (dayMap[key] ?? 0) + 1
    })

    return Array.from({ length: days }, (_, i) => {
      const d = new Date(start.getTime() + i * 86400000)
      const label = d.toLocaleDateString('ro-RO', { day: '2-digit', month: 'short' })
      return { label, count: dayMap[label] ?? 0 }
    })
  }, [joined, createdAt])

  const protestDateLabel = useMemo(() =>
    new Date(protestDate).toLocaleDateString('ro-RO', { day: '2-digit', month: 'short' })
  , [protestDate])

  const isProtestInFuture = new Date(protestDate) > new Date()

  const hourlyData = useMemo(() => {
    const hourMap: Record<number, number> = {}
    joined.forEach(p => {
      const date = new Date(p.joined_at)
      if (isNaN(date.getTime())) return
      const h = date.getHours()
      hourMap[h] = (hourMap[h] ?? 0) + 1
    })
    const maxCount = Math.max(...Object.values(hourMap), 0)
    return Array.from({ length: 24 }, (_, h) => ({
      label: `${h.toString().padStart(2, '0')}:00`,
      count: hourMap[h] ?? 0,
      isMax: (hourMap[h] ?? 0) === maxCount && maxCount > 0,
    }))
  }, [joined])

  const empty = (
    <div className="flex h-[200px] items-center justify-center rounded-xl bg-muted/50">
      <p className="text-sm text-muted-foreground">Nicio înregistrare</p>
    </div>
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 border-b border-border/50 pb-2">
        <CalendarDays className="size-5 text-primary" />
        <h2 className="font-heading text-xl font-bold tracking-tight text-foreground">
          Dinamica Înscrierilor
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        <Card className="overflow-hidden rounded-2xl border border-border bg-card/50 hover:border-primary/30 transition-all">
          <CardContent className="p-5 space-y-3">
            <h3 className="font-bold text-foreground text-sm">Înscrieri pe zile</h3>
            {joined.length === 0 ? empty : (
              <ChartContainer config={{ count: { label: 'Înscrieri', color: 'var(--primary)' } }} className="h-[220px] w-full">
                <AreaChart data={dailyData} margin={{ left: -16, right: 8, top: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="fill-inscriptions" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} allowDecimals={false} width={28} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  {isProtestInFuture && (
                    <ReferenceLine
                      x={protestDateLabel}
                      stroke="var(--muted-foreground)"
                      strokeDasharray="4 4"
                      label={{ value: 'Protest', position: 'top', fontSize: 10, fill: 'var(--muted-foreground)' }}
                    />
                  )}
                  <Area
                    type="monotone"
                    dataKey="count"
                    name="Înscrieri"
                    stroke="var(--primary)"
                    strokeWidth={2}
                    fill="url(#fill-inscriptions)"
                    dot={false}
                    activeDot={{ r: 4, strokeWidth: 0, fill: 'var(--primary)' }}
                  />
                </AreaChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-2xl border border-border bg-card/50 hover:border-primary/30 transition-all">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Clock className="size-4 text-primary" />
              <h3 className="font-bold text-foreground text-sm">Distribuție pe ore</h3>
            </div>
            {joined.length === 0 ? empty : (
              <ChartContainer config={{ count: { label: 'Înscrieri', color: 'var(--primary)' } }} className="h-[220px] w-full">
                <BarChart data={hourlyData} margin={{ left: -16, right: 4, top: 4, bottom: 0 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="label" tick={{ fontSize: 8, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} interval={3} />
                  <YAxis tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} allowDecimals={false} width={28} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" name="Înscrieri" radius={[3, 3, 0, 0]} barSize={8}>
                    {hourlyData.map((entry, i) => (
                      <Cell key={i} fill="var(--primary)" fillOpacity={entry.isMax ? 1 : 0.35} />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
