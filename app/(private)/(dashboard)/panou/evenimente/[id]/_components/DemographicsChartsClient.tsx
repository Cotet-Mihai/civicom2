'use client'

import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Label } from 'recharts'
import { Card, CardContent } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import type { ProtestParticipant } from '@/services/stats.service'

const CHART_COLORS = [
  'var(--primary)', 'var(--secondary)', '#f97316', '#06b6d4',
  '#a855f7', '#ec4899', '#f59e0b', '#6b7280',
]

function groupBy(values: string[]) {
  const map: Record<string, number> = {}
  values.forEach(v => { map[v] = (map[v] ?? 0) + 1 })
  return Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count], i) => ({ name, count, fill: CHART_COLORS[i % CHART_COLORS.length] }))
}

function getAgeGroup(birthDate: string | null): string {
  if (!birthDate) return 'Necunoscut'
  const age = new Date().getFullYear() - new Date(birthDate).getFullYear()
  if (age < 18) return '<18'
  if (age < 25) return '18-24'
  if (age < 35) return '25-34'
  if (age < 45) return '35-44'
  if (age < 55) return '45-54'
  return '55+'
}

const AGE_ORDER = ['18-24', '25-34', '35-44', '45-54', '55+', '<18', 'Necunoscut']

const SEX_LABELS: Record<string, string> = { M: 'Masculin', F: 'Feminin', other: 'Altul' }
const EDU_LABELS: Record<string, string> = {
  none: 'Fără studii', primary: 'Primar', secondary: 'Secundar',
  high_school: 'Liceu', vocational: 'Profesional', bachelor: 'Licență',
  master: 'Masterat', phd: 'Doctorat',
}

type Props = { participants: ProtestParticipant[] }

const empty = (
  <div className="flex h-[180px] items-center justify-center rounded-xl bg-muted/50">
    <p className="text-sm text-muted-foreground">Date insuficiente</p>
  </div>
)

function DonutChart({ data, title }: { data: { name: string; count: number; fill: string }[]; title: string }) {
  const totalCount = data.reduce((s, d) => s + d.count, 0)
  return (
    <Card className="overflow-hidden rounded-2xl border border-border bg-card/50 hover:border-primary/30 transition-all">
      <CardContent className="p-4">
        <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3">{title}</h4>
        {data.length === 0 ? empty : (
          <>
            <ChartContainer
              config={Object.fromEntries(data.map(d => [d.name, { label: d.name, color: d.fill }]))}
              className="h-[160px] w-full"
            >
              <PieChart>
                <Pie data={data} dataKey="count" nameKey="name" innerRadius={42} outerRadius={68} paddingAngle={2}>
                  {data.map((d, i) => <Cell key={i} fill={d.fill} stroke="transparent" />)}
                  <Label
                    content={({ viewBox }) => {
                      if (!viewBox || !('cx' in viewBox)) return null
                      return (
                        <text textAnchor="middle" dominantBaseline="middle">
                          <tspan x={viewBox.cx} y={(viewBox.cy ?? 0) - 7} fontSize={22} fontWeight={700} fill="var(--foreground)" fontFamily="var(--font-heading)">
                            {totalCount}
                          </tspan>
                          <tspan x={viewBox.cx} y={(viewBox.cy ?? 0) + 12} fontSize={10} fill="var(--muted-foreground)">
                            total
                          </tspan>
                        </text>
                      )
                    }}
                  />
                </Pie>
                <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
              </PieChart>
            </ChartContainer>
            <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 mt-1">
              {data.map((d, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full shrink-0" style={{ backgroundColor: d.fill }} />
                  <span className="text-xs text-muted-foreground">
                    {d.name} ({totalCount > 0 ? Math.round((d.count / totalCount) * 100) : 0}%)
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

function VerticalBarChart({ data, title }: { data: { name: string; count: number; fill: string }[]; title: string }) {
  return (
    <Card className="overflow-hidden rounded-2xl border border-border bg-card/50 hover:border-primary/30 transition-all">
      <CardContent className="p-4">
        <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3">{title}</h4>
        {data.length === 0 ? empty : (
          <ChartContainer config={{ count: { label: 'Participanți', color: 'var(--primary)' } }} className="h-[180px] w-full">
            <BarChart data={data} margin={{ left: -16, right: 8, top: 0, bottom: 0 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} allowDecimals={false} width={28} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="count" name="Participanți" radius={[4, 4, 0, 0]} barSize={28}>
                {data.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Bar>
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}

function HorizontalBarChart({ data, title }: { data: { name: string; count: number }[]; title: string }) {
  const h = Math.max(140, data.length * 40)
  return (
    <Card className="overflow-hidden rounded-2xl border border-border bg-card/50 hover:border-primary/30 transition-all">
      <CardContent className="p-4">
        <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3">{title}</h4>
        {data.length === 0 ? empty : (
          <div style={{ height: h }}>
            <ChartContainer config={{ count: { label: 'Participanți', color: 'var(--primary)' } }} className="h-full w-full">
              <BarChart data={data} layout="vertical" margin={{ left: 0, right: 8, top: 0, bottom: 0 }}>
                <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis type="number" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" name="Participanți" fill="var(--primary)" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ChartContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function DemographicsChartsClient({ participants }: Props) {
  const sexData = groupBy(participants.map(p => p.biological_sex ? (SEX_LABELS[p.biological_sex] ?? p.biological_sex) : 'Necunoscut'))

  const ageRaw: Record<string, number> = {}
  participants.forEach(p => { const g = getAgeGroup(p.birth_date); ageRaw[g] = (ageRaw[g] ?? 0) + 1 })
  const ageData = AGE_ORDER
    .filter(g => ageRaw[g] !== undefined)
    .map((g, i) => ({ name: g, count: ageRaw[g], fill: CHART_COLORS[i % CHART_COLORS.length] }))

  const genderData = groupBy(participants.map(p => p.gender ?? 'Necunoscut'))

  const eduData = groupBy(participants.map(p => p.education_level ? (EDU_LABELS[p.education_level] ?? p.education_level) : 'Necunoscut'))

  const countyMap: Record<string, number> = {}
  participants.forEach(p => { if (p.county) countyMap[p.county] = (countyMap[p.county] ?? 0) + 1 })
  const countyData = Object.entries(countyMap).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, count]) => ({ name, count }))

  const cityMap: Record<string, number> = {}
  participants.forEach(p => { if (p.city) cityMap[p.city] = (cityMap[p.city] ?? 0) + 1 })
  const cityData = Object.entries(cityMap).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, count]) => ({ name, count }))

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <DonutChart data={sexData} title="Sex Biologic" />
      <VerticalBarChart data={ageData} title="Grupă de Vârstă" />
      <DonutChart data={genderData} title="Gen" />
      <DonutChart data={eduData} title="Nivel Studii" />
      <HorizontalBarChart data={countyData} title="Top Județe" />
      <HorizontalBarChart data={cityData} title="Top Orașe" />
    </div>
  )
}
