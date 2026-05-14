'use client'

import { useState, useTransition } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts'
import { Card, CardContent } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { TrendingUp } from 'lucide-react'
import { getEventViewsEvolution, type ViewRange, type SingleEventViewsData } from '@/services/stats.service'

const VIEW_RANGES: { value: ViewRange; label: string }[] = [
  { value: 'today', label: 'Azi' },
  { value: '7d',    label: '7 zile' },
  { value: '30d',   label: '30 zile' },
]

function makeEndDot(totalPoints: number) {
  return function EndDot({ cx, cy, index }: any) {
    if (index !== totalPoints - 1 || !cx || !cy) return null
    return (
      <g>
        <circle cx={cx} cy={cy} r={4} fill="var(--primary)" opacity={0.35}>
          <animate attributeName="r" values="4;11;4" dur="2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.35;0;0.35" dur="2s" repeatCount="indefinite" />
        </circle>
        <circle cx={cx} cy={cy} r={4} fill="var(--primary)" stroke="var(--background)" strokeWidth={2} />
      </g>
    )
  }
}

type Props = {
  eventId: string
  initialData: SingleEventViewsData
}

export function SingleEventViewsChartClient({ eventId, initialData }: Props) {
  const [range, setRange] = useState<ViewRange>('today')
  const [data, setData] = useState<SingleEventViewsData>(initialData)
  const [isPending, startTransition] = useTransition()

  function handleRange(r: ViewRange) {
    setRange(r)
    startTransition(async () => {
      const result = await getEventViewsEvolution(eventId, r)
      setData(result)
    })
  }

  const isEmpty = data.chartPoints.length === 0

  return (
    <Card className="overflow-hidden rounded-2xl border border-border bg-card/50 transition-all hover:border-primary/30">
      <CardContent className="p-5 space-y-4">

        <div className="flex flex-col gap-3 border-b border-border/50 pb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="size-4 text-primary" />
            <h3 className="font-bold text-foreground">Evoluție Vizualizări</h3>
          </div>
          <div className="flex gap-1 flex-wrap">
            {VIEW_RANGES.map(r => (
              <button
                key={r.value}
                onClick={() => handleRange(r.value)}
                disabled={isPending}
                className={`px-2.5 py-0.5 rounded-md text-xs font-medium transition-all cursor-default ${
                  range === r.value
                    ? 'bg-foreground text-background'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        <div className={`transition-opacity duration-200 ${isPending ? 'opacity-40' : 'opacity-100'}`}>
          {isEmpty ? (
            <div className="flex h-[220px] items-center justify-center rounded-xl bg-muted/50">
              <p className="text-sm font-medium text-muted-foreground">
                Nu există date pentru această perioadă
              </p>
            </div>
          ) : (
            <ChartContainer config={{ views: { label: 'Vizualizări', color: 'var(--primary)' } }} className="h-[260px] w-full">
              <AreaChart data={data.chartPoints} margin={{ left: 0, right: 8, top: 22, bottom: 0 }}>
                <defs>
                  <linearGradient id="fill-event-views" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.02} />
                  </linearGradient>
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
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="views"
                  name="Vizualizări"
                  stroke="var(--primary)"
                  strokeWidth={2}
                  fill="url(#fill-event-views)"
                  dot={makeEndDot(data.chartPoints.length)}
                  activeDot={{ r: 4, strokeWidth: 0, fill: 'var(--primary)' }}
                />
              </AreaChart>
            </ChartContainer>
          )}
        </div>

      </CardContent>
    </Card>
  )
}
