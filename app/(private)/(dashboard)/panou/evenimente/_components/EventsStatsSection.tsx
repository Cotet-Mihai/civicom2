import { CalendarCheck, Clock, CheckCircle2, XCircle, Hash } from 'lucide-react'
import { StatCardDashboard } from '@/components/shared/StatCardDashboard'
import type { EventsStats } from '@/services/user.service'

export function EventsStatsSection({ stats }: { stats: EventsStats }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
      <StatCardDashboard label="Total" value={stats.total} icon={Hash} />
      <StatCardDashboard label="Aprobate" value={stats.approved} icon={CalendarCheck} />
      <StatCardDashboard label="În așteptare" value={stats.pending} icon={Clock} />
      <StatCardDashboard label="Finalizate" value={stats.completed} icon={CheckCircle2} />
      <StatCardDashboard label="Respinse" value={stats.rejected} icon={XCircle} />
    </div>
  )
}
