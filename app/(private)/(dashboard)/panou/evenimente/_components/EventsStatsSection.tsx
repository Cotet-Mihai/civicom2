import { CalendarCheck, Clock, CheckCircle2, XCircle, Hash, Eye, Users, TrendingUp } from 'lucide-react'
import type { EventsStats } from '@/services/user.service'
import { StatsBanner } from '@/components/shared/StatsBanner'

const STATUS_ITEMS = [
    { key: 'total',     label: 'Total',        icon: Hash,          color: 'bg-foreground' },
    { key: 'approved',  label: 'Aprobate',     icon: CalendarCheck, color: 'bg-primary' },
    { key: 'completed', label: 'Finalizate',   icon: CheckCircle2,  color: 'bg-primary/60' },
    { key: 'pending',   label: 'În așteptare', icon: Clock,         color: 'bg-secondary' },
    { key: 'rejected',  label: 'Respinse',     icon: XCircle,       color: 'bg-destructive' },
] as const

export function EventsStatsSection({ stats }: { stats: EventsStats }) {
    return (
        <div className="space-y-3">
            <StatsBanner
                badge="Impact Civic"
                title="Reach-ul tău total"
                subtitle="Cumulat pe toate evenimentele tale"
                items={[
                    { icon: Eye,        iconClassName: 'size-4 text-primary',    value: stats.totalViews,        label: 'Vizualizări' },
                    { icon: Users,      iconClassName: 'size-4 text-secondary',  value: stats.totalParticipants, label: 'Participanți' },
                    { icon: TrendingUp, iconClassName: 'size-4 text-green-400',  value: `${stats.approvalRate}%`, label: 'Aprobare' },
                ]}
            />

            <div className="flex flex-wrap gap-2">
                {STATUS_ITEMS.map(({ key, label, icon: Icon, color }) => (
                    <div key={key} className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 shadow-sm">
                        <span className={`flex size-6 shrink-0 items-center justify-center rounded-md ${color}`}>
                            <Icon size={13} className="text-background" />
                        </span>
                        <span className="text-xs font-semibold text-muted-foreground">{label}</span>
                        <span className="font-heading text-base font-black tracking-tight text-foreground">
                            {stats[key].toLocaleString('ro-RO')}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    )
}
