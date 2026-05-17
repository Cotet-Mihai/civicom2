'use client'

import { useState } from 'react'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Sector, Label } from 'recharts'
import { Card, CardContent } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { PieChart as PieChartIcon, BarChart3, MapPin } from 'lucide-react'
import type { ProtestParticipant } from '@/services/stats.service'

const CHART_COLORS = [
  'var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)',
  'var(--chart-5)', 'var(--chart-6)', 'var(--chart-7)', 'var(--chart-8)',
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

const SEX_LABELS: Record<string, string> = {
  male: 'Masculin', female: 'Feminin', intersex: 'Intersex', prefer_not_to_say: 'Prefer să nu spun',
}
const GENDER_LABELS: Record<string, string> = {
  male: 'Masculin', female: 'Feminin', non_binary: 'Non-binar', other: 'Altul', prefer_not_to_say: 'Prefer să nu spun',
}
const ORIENTATION_LABELS: Record<string, string> = {
  heterosexual: 'Heterosexual/ă', gay: 'Gay', lesbian: 'Lesbiană', bisexual: 'Bisexual/ă',
  pansexual: 'Pansexual/ă', asexual: 'Asexual/ă', other: 'Altă orientare', prefer_not_to_say: 'Prefer să nu spun',
}
const EDU_LABELS: Record<string, string> = {
  none: 'Fără studii', primary: 'Primar', secondary: 'Secundar',
  high_school: 'Liceu', vocational: 'Profesional', bachelor: 'Licență',
  master: 'Masterat', phd: 'Doctorat', doctorate: 'Doctorat',
}

type ChartEntry = { name: string; count: number; fill: string }
type Props = { participants: ProtestParticipant[] }

const emptyState = (
  <div className="flex h-[190px] items-center justify-center rounded-xl bg-muted/50">
    <p className="text-sm text-muted-foreground">Date insuficiente</p>
  </div>
)

function activeShapeFn({ outerRadius = 0, ...props }: React.ComponentProps<typeof Sector>) {
  return <Sector {...props} outerRadius={outerRadius + 9} style={{ filter: 'brightness(1.18) drop-shadow(0 2px 8px rgba(0,0,0,0.18))' }} />
}
function normalShapeFn(props: React.ComponentProps<typeof Sector>) {
  return <Sector {...props} style={{ filter: 'none' }} />
}

// Interactive donut — matches EventsChartsSection "Distribuție pe Categorii" style exactly
function InteractiveDonut({ data }: { data: ChartEntry[] }) {
  const [centerName, setCenterName] = useState<string | null>(null)

  if (data.length === 0) return emptyState

  const total = data.reduce((s, d) => s + d.count, 0)
  const effectiveCenter = centerName ? data.find(d => d.name === centerName) ?? null : null
  const displayCount = effectiveCenter ? effectiveCenter.count : total
  const displayLabel = effectiveCenter ? effectiveCenter.name : 'Total'
  const displayColor = effectiveCenter ? effectiveCenter.fill : 'var(--foreground)'

  return (
    <>
      <ChartContainer
        config={Object.fromEntries(data.map(d => [d.name, { label: d.name, color: d.fill }]))}
        className="h-[190px] w-full"
      >
        <PieChart>
          <Pie
            data={data}
            dataKey="count"
            nameKey="name"
            innerRadius={45}
            outerRadius={78}
            paddingAngle={2}
            shape={normalShapeFn}
            activeShape={activeShapeFn}
          >
            {data.map((d, i) => <Cell key={i} fill={d.fill} stroke="transparent" />)}
            <Label
              content={({ viewBox }) => {
                if (!viewBox || !('cx' in viewBox)) return null
                return (
                  <text textAnchor="middle" dominantBaseline="middle">
                    <tspan x={viewBox.cx} y={(viewBox.cy ?? 0) - 8} fill={displayColor} fontSize={26} fontWeight={700} fontFamily="var(--font-heading)">
                      {displayCount}
                    </tspan>
                    <tspan x={viewBox.cx} y={(viewBox.cy ?? 0) + 14} fill="var(--muted-foreground)" fontSize={11}>
                      {displayLabel}
                    </tspan>
                  </text>
                )
              }}
            />
          </Pie>
          <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
        </PieChart>
      </ChartContainer>

      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 mt-1">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <span className="size-2 rounded-full shrink-0" style={{ backgroundColor: d.fill }} />
            <span className="text-xs text-muted-foreground">{d.name}</span>
          </div>
        ))}
      </div>

      <div className="mt-3 border-t border-border/50 pt-3">
        <p className="text-center text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">Valoare centrală</p>
        <div className="flex flex-wrap justify-center gap-1.5">
          <button
            onClick={() => setCenterName(null)}
            className="px-2.5 py-0.5 rounded-full text-xs font-medium transition-all cursor-default border"
            style={{
              backgroundColor: centerName === null ? 'var(--foreground)' : 'transparent',
              borderColor: centerName === null ? 'var(--foreground)' : 'var(--border)',
              color: centerName === null ? 'var(--background)' : 'var(--muted-foreground)',
            }}
          >
            Total
          </button>
          {data.map((d, i) => {
            const isActive = centerName === d.name
            return (
              <button
                key={i}
                onClick={() => setCenterName(d.name)}
                className="px-2.5 py-0.5 rounded-full text-xs font-medium transition-all cursor-default border"
                style={{
                  backgroundColor: isActive ? d.fill : 'transparent',
                  borderColor: isActive ? d.fill : 'var(--border)',
                  color: isActive ? '#fff' : 'var(--muted-foreground)',
                }}
              >
                {d.name}
              </button>
            )
          })}
        </div>
      </div>
    </>
  )
}

// Identity card: tabs for sex / gen / orientare, one full interactive donut at a time
type IdentityTab = 'sex' | 'gen' | 'orientare'

function IdentityCard({ sexData, genderData, orientationData }: {
  sexData: ChartEntry[]
  genderData: ChartEntry[]
  orientationData: ChartEntry[]
}) {
  const [tab, setTab] = useState<IdentityTab>('sex')
  const tabs: { id: IdentityTab; label: string; data: ChartEntry[] }[] = [
    { id: 'sex', label: 'Sex Biologic', data: sexData },
    { id: 'gen', label: 'Gen', data: genderData },
    { id: 'orientare', label: 'Orientare', data: orientationData },
  ]
  const current = tabs.find(t => t.id === tab)!

  return (
    <Card className="overflow-hidden rounded-2xl border border-border bg-card/50 transition-all hover:border-primary/30">
      <CardContent className="p-5">
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <PieChartIcon className="size-4 text-muted-foreground" />
            <h3 className="font-bold text-foreground">Identitate</h3>
          </div>
          <div className="flex gap-1">
            {tabs.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-2.5 py-0.5 rounded-md text-xs font-medium transition-all cursor-default ${
                  tab === t.id
                    ? 'bg-foreground text-background'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
        {/* key resets InteractiveDonut state when tab changes */}
        <InteractiveDonut key={tab} data={current.data} />
      </CardContent>
    </Card>
  )
}

// Vertical bar chart (age / education)
function VerticalBarCard({ data, title }: { data: ChartEntry[]; title: string }) {
  return (
    <Card className="overflow-hidden rounded-2xl border border-border bg-card/50 transition-all hover:border-primary/30">
      <CardContent className="p-5">
        <div className="mb-4 flex items-center gap-2">
          <BarChart3 className="size-4 text-muted-foreground" />
          <h3 className="font-bold text-foreground">{title}</h3>
        </div>
        {data.length === 0
          ? emptyState
          : (
            <ChartContainer config={{ count: { label: 'Participanți', color: 'var(--primary)' } }} className="h-[190px] w-full">
              <BarChart data={data} margin={{ left: -16, right: 8, top: 0, bottom: 0 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} allowDecimals={false} width={28} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" name="Participanți" radius={[4, 4, 0, 0]} barSize={28}>
                  {data.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Bar>
              </BarChart>
            </ChartContainer>
          )
        }
      </CardContent>
    </Card>
  )
}

// Location card: tab switcher between județe and orașe, each as interactive donut
type LocationTab = 'judete' | 'orase'

function LocationCard({ countyData, cityData }: {
  countyData: { name: string; count: number }[]
  cityData: { name: string; count: number }[]
}) {
  const [tab, setTab] = useState<LocationTab>('judete')

  const countyEntries: ChartEntry[] = countyData.map((d, i) => ({ ...d, fill: CHART_COLORS[i % CHART_COLORS.length] }))
  const cityEntries: ChartEntry[] = cityData.map((d, i) => ({ ...d, fill: CHART_COLORS[i % CHART_COLORS.length] }))

  const tabs: { id: LocationTab; label: string; data: ChartEntry[] }[] = [
    { id: 'judete', label: 'Județe', data: countyEntries },
    { id: 'orase', label: 'Orașe', data: cityEntries },
  ]
  const current = tabs.find(t => t.id === tab)!

  return (
    <Card className="overflow-hidden rounded-2xl border border-border bg-card/50 transition-all hover:border-primary/30">
      <CardContent className="p-5">
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <MapPin className="size-4 text-muted-foreground" />
            <h3 className="font-bold text-foreground">Localizare</h3>
          </div>
          <div className="flex gap-1">
            {tabs.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-2.5 py-0.5 rounded-md text-xs font-medium transition-all cursor-default ${
                  tab === t.id
                    ? 'bg-foreground text-background'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <InteractiveDonut key={tab} data={current.data} />
      </CardContent>
    </Card>
  )
}

// Main export
export function DemographicsChartsClient({ participants }: Props) {
  const sexData = groupBy(participants.map(p =>
    p.biological_sex ? (SEX_LABELS[p.biological_sex] ?? p.biological_sex) : 'Necunoscut'
  ))

  const ageRaw: Record<string, number> = {}
  participants.forEach(p => { const g = getAgeGroup(p.birth_date); ageRaw[g] = (ageRaw[g] ?? 0) + 1 })
  const ageData = AGE_ORDER
    .filter(g => ageRaw[g] !== undefined)
    .map((g, i) => ({ name: g, count: ageRaw[g], fill: CHART_COLORS[i % CHART_COLORS.length] }))

  const genderData = groupBy(participants.map(p =>
    p.gender ? (GENDER_LABELS[p.gender] ?? p.gender) : 'Necunoscut'
  ))

  const orientationData = groupBy(participants.map(p =>
    p.sexual_orientation ? (ORIENTATION_LABELS[p.sexual_orientation] ?? p.sexual_orientation) : 'Necunoscut'
  ))

  const eduData = groupBy(participants.map(p =>
    p.education_level ? (EDU_LABELS[p.education_level] ?? p.education_level) : 'Necunoscut'
  ))

  const countyMap: Record<string, number> = {}
  participants.forEach(p => { if (p.county) countyMap[p.county] = (countyMap[p.county] ?? 0) + 1 })
  const countyData = Object.entries(countyMap).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, count]) => ({ name, count }))

  const cityMap: Record<string, number> = {}
  participants.forEach(p => { if (p.city) cityMap[p.city] = (cityMap[p.city] ?? 0) + 1 })
  const cityData = Object.entries(cityMap).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, count]) => ({ name, count }))

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <IdentityCard sexData={sexData} genderData={genderData} orientationData={orientationData} />
      <VerticalBarCard data={ageData} title="Grupă de Vârstă" />
      <LocationCard countyData={countyData} cityData={cityData} />
      <VerticalBarCard data={eduData} title="Nivel Studii" />
    </div>
  )
}
