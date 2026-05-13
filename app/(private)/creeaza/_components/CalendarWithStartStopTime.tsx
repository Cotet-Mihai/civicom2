'use client'

import { useState } from 'react'
import { ChevronDownIcon } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

type Props = {
  date: { value: Date | undefined; set: (v: Date | undefined) => void }
  fromTime: { value: string; set: (v: string) => void }
  toTime: { value: string; set: (v: string) => void }
}

export function CalendarWithStartStopTime({ date, fromTime, toTime }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <div className="flex gap-6 flex-wrap">
      <div className="flex flex-col gap-3">
        <Label htmlFor="date" className="px-1">Când se organizează?</Label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger
            id="date"
            className={cn(buttonVariants({ variant: 'outline' }), 'w-52 justify-between font-normal')}
          >
            {date.value ? date.value.toLocaleDateString('ro-RO') : 'Selectează data'}
            <ChevronDownIcon />
          </PopoverTrigger>
          <PopoverContent className="w-auto overflow-hidden p-0" align="start">
            <Calendar
              mode="single"
              selected={date.value}
              captionLayout="dropdown"
              onSelect={(d: Date | undefined) => {
                if (!d) return
                date.set(d)
                setOpen(false)
              }}
              disabled={(d: Date) => {
                const today = new Date()
                today.setHours(0, 0, 0, 0)
                return d < today
              }}
            />
          </PopoverContent>
        </Popover>
      </div>
      <div className="flex gap-4 items-end">
        <div className="flex flex-col gap-3">
          <Label htmlFor="time-from" className="px-1">De la</Label>
          <Input
            type="time"
            id="time-from"
            step="60"
            value={fromTime.value}
            onChange={e => fromTime.set(e.target.value)}
            className="bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden"
          />
        </div>
        <div className="flex flex-col gap-3">
          <Label htmlFor="time-to" className="px-1">Până la</Label>
          <Input
            type="time"
            id="time-to"
            step="60"
            value={toTime.value}
            onChange={e => toTime.set(e.target.value)}
            className="bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden"
          />
        </div>
      </div>
    </div>
  )
}
