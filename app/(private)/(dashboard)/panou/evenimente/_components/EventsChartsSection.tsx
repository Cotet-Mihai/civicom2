'use client'

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Line, LineChart, Pie, PieChart, Cell } from 'recharts'
import { Card, CardContent } from '@/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart'
import type { EventsChartData } from '@/services/user.service'

const CATEGORY_LABELS: Record<string, string> = {
  protest: 'Protest', boycott: 'Boycott', petition: 'Petiție',
  community: 'Comunitar', charity: 'Caritabil',
}
const STATUS_LABELS: Record<string, string> = {
  pending: 'În așteptare', approved: 'Aprobat', rejected: 'Respins',
  contested: 'Contestat', completed: 'Finalizat',
}
const CATEGORY_COLORS: Record<string, string> = {
  protest: 'hsl(var(--primary))', boycott: 'hsl(var(--secondary))',
  petition: '#f97316', community: '#06b6d4', charity: '#a855f7',
}
const STATUS_COLORS: Record<string, string> = {
  pending: 'hsl(var(--secondary))', approved: 'hsl(var(--primary))',
  rejected: 'hsl(var(--destructive))', contested: '#f97316', completed: '#6b7280',
}

type Props = { data: EventsChartData }

export function EventsChartsSection({ data }: Props) {
  const categoryChartData = data.byCategory.map(d => ({
    ...d,
    label: CATEGORY_LABELS[d.category] ?? d.category,
    fill: CATEGORY_COLORS[d.category] ?? '#ccc',
  }))
  const statusChartData = data.byStatus.map(d => ({
    ...d,
    label: STATUS_LABELS[d.status] ?? d.status,
    fill: STATUS_COLORS[d.status] ?? '#ccc',
  }))

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top vizualizări */}
        <Card className="p-4 shadow-sm border-border">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4">Top vizualizări</p>
          {data.topByViews.length === 0
            ? <p className="text-sm text-muted-foreground py-8 text-center">Nu există date</p>
            : (
              <ChartContainer config={{ view_count: { label: 'Vizualizări', color: 'hsl(var(--primary))' } }} className="h-[180px]">
                <BarChart data={data.topByViews} layout="vertical" margin={{ left: 0, right: 8, top: 0, bottom: 0 }}>
                  <CartesianGrid horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="title" width={110} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="view_count" fill="var(--color-view_count)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ChartContainer>
            )
          }
        </Card>

        {/* Top participanți */}
        <Card className="p-4 shadow-sm border-border">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4">Top participanți</p>
          {data.topByParticipants.length === 0
            ? <p className="text-sm text-muted-foreground py-8 text-center">Nu există date</p>
            : (
              <ChartContainer config={{ participants_count: { label: 'Participanți', color: 'hsl(var(--secondary))' } }} className="h-[180px]">
                <BarChart data={data.topByParticipants} layout="vertical" margin={{ left: 0, right: 8, top: 0, bottom: 0 }}>
                  <CartesianGrid horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="title" width={110} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="participants_count" fill="var(--color-participants_count)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ChartContainer>
            )
          }
        </Card>

        {/* Distribuție categorii */}
        <Card className="p-4 shadow-sm border-border">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4">Pe categorii</p>
          {data.byCategory.length === 0
            ? <p className="text-sm text-muted-foreground py-8 text-center">Nu există date</p>
            : (
              <ChartContainer config={Object.fromEntries(categoryChartData.map(d => [d.category, { label: d.label, color: d.fill }]))} className="h-[200px]">
                <PieChart>
                  <Pie data={categoryChartData} dataKey="count" nameKey="label" innerRadius={55} outerRadius={75}>
                    {categoryChartData.map((entry) => (
                      <Cell key={entry.category} fill={entry.fill} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent nameKey="label" />} />
                  <ChartLegend content={<ChartLegendContent nameKey="label" />} />
                </PieChart>
              </ChartContainer>
            )
          }
        </Card>

        {/* Distribuție statusuri */}
        <Card className="p-4 shadow-sm border-border">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4">Pe statusuri</p>
          {data.byStatus.length === 0
            ? <p className="text-sm text-muted-foreground py-8 text-center">Nu există date</p>
            : (
              <ChartContainer config={Object.fromEntries(statusChartData.map(d => [d.status, { label: d.label, color: d.fill }]))} className="h-[200px]">
                <PieChart>
                  <Pie data={statusChartData} dataKey="count" nameKey="label" innerRadius={55} outerRadius={75}>
                    {statusChartData.map((entry) => (
                      <Cell key={entry.status} fill={entry.fill} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent nameKey="label" />} />
                  <ChartLegend content={<ChartLegendContent nameKey="label" />} />
                </PieChart>
              </ChartContainer>
            )
          }
        </Card>
      </div>

      {/* Activitate lunară - full width */}
      <Card className="p-4 shadow-sm border-border">
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4">Activitate lunară (ultimele 6 luni)</p>
        <ChartContainer config={{ count: { label: 'Evenimente', color: 'hsl(var(--primary))' } }} className="h-[160px]">
          <LineChart data={data.byMonth} margin={{ left: 0, right: 8, top: 4, bottom: 0 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Line type="monotone" dataKey="count" stroke="var(--color-count)" strokeWidth={2} dot={{ fill: 'var(--color-count)', r: 3 }} />
          </LineChart>
        </ChartContainer>
      </Card>
    </div>
  )
}
