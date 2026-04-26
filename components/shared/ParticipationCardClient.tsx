'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Calendar, Clock, Users, Loader2 } from 'lucide-react'
import { useEventParticipation } from '@/hooks/useEventParticipation'

type Props = {
  eventId: string
  participantsCount: number
  maxParticipants?: number
  date?: string
  timeStart?: string
  timeEnd?: string | null
  status: string
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('ro-RO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function ParticipationCardClient({
  eventId,
  participantsCount,
  maxParticipants,
  date,
  timeStart,
  timeEnd,
  status,
}: Props) {
  const { isJoined, isLoading, join, leave } = useEventParticipation(eventId)
  const pct =
    maxParticipants && maxParticipants > 0
      ? Math.min(100, Math.round((participantsCount / maxParticipants) * 100))
      : 0
  const isCompleted = status === 'completed'
  const isApproved = status === 'approved'
  const isFull = !!maxParticipants && participantsCount >= maxParticipants

  return (
    <Card className="shadow-lg shadow-black/5 border-border">
      <CardContent className="p-6 space-y-4">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          <Users size={14} />
          Participare
        </h3>

        {date && timeStart && (
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground font-medium">
              <Calendar size={14} className="text-primary" />
              {formatDate(date)}
            </div>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground font-medium">
              <Clock size={14} className="text-primary" />
              {timeStart}{timeEnd ? ` – ${timeEnd}` : ''}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Participanți</span>
            <span className="text-3xl font-black italic tracking-tighter text-primary leading-none">
              {participantsCount}{' '}
              {maxParticipants ? (
                <span className="text-sm font-normal text-muted-foreground not-italic">
                  / {maxParticipants}
                </span>
              ) : null}
            </span>
          </div>
          {maxParticipants ? <Progress value={pct} className="h-2 bg-muted" /> : null}
        </div>

        {isCompleted ? (
          <div className="rounded-lg bg-primary/10 border border-primary/20 px-4 py-2.5 text-center text-sm font-semibold text-primary">
            Eveniment finalizat
          </div>
        ) : isApproved ? (
          isJoined ? (
            <Button
              variant="outline"
              className="w-full text-destructive border-destructive/30 hover:bg-destructive/5"
              onClick={leave}
              disabled={isLoading}
            >
              {isLoading ? <Loader2 size={16} className="animate-spin" /> : 'Renunță'}
            </Button>
          ) : (
            <Button
              className="w-full"
              onClick={join}
              disabled={isLoading || isFull}
            >
              {isLoading
                ? <Loader2 size={16} className="animate-spin" />
                : isFull
                ? 'Complet'
                : 'Participă'}
            </Button>
          )
        ) : null}
      </CardContent>
    </Card>
  )
}
