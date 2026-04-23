'use client'

import { Share2, Calendar, Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'

type Props = {
  title: string
  date?: string
  timeStart?: string
}

export function ActionButtons({ title, date, timeStart }: Props) {
  function handleShare() {
    const url = window.location.href
    if (typeof navigator.share === 'function') {
      navigator.share({ title, url }).catch(() => {})
    } else {
      navigator.clipboard.writeText(url).catch(() => {})
    }
  }

  function handleCalendar() {
    if (!date || !timeStart) return
    const dtStart = `${date}T${timeStart}`.replace(/[-:]/g, '').slice(0, 13) + '00Z'
    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//CIVICOM//RO',
      'BEGIN:VEVENT',
      `SUMMARY:${title}`,
      `DTSTART:${dtStart}`,
      `DTEND:${dtStart}`,
      `URL:${window.location.href}`,
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n')
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `${title.slice(0, 40).replace(/[^a-zA-Z0-9]/g, '-')}.ics`
    link.click()
    URL.revokeObjectURL(link.href)
  }

  function handlePrint() {
    window.print()
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Button variant="outline" size="sm" onClick={handleShare} className="gap-1.5">
        <Share2 size={14} />
        Distribuie
      </Button>
      {date && timeStart && (
        <Button variant="outline" size="sm" onClick={handleCalendar} className="gap-1.5">
          <Calendar size={14} />
          Adaugă în calendar
        </Button>
      )}
      <Button variant="outline" size="sm" onClick={handlePrint} className="gap-1.5">
        <Printer size={14} />
        Printează
      </Button>
    </div>
  )
}
