import { Card, CardContent } from '@/components/ui/card'
import type { LucideIcon } from 'lucide-react'

type Props = {
  label: string
  value: number
  icon: LucideIcon
}

export function StatCardDashboard({ label, value, icon: Icon }: Props) {
  return (
    <Card className="shadow-sm shadow-black/5 border-border">
      <CardContent className="p-5 flex items-center gap-4">
        <div className="size-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
          <Icon size={18} className="text-primary" />
        </div>
        <div>
          <p className="text-3xl font-black italic tracking-tighter text-primary leading-none">{value}</p>
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-1">{label}</p>
        </div>
      </CardContent>
    </Card>
  )
}
