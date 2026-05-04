'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

type Props = {
  eventId: string
}

export function EditEventWarningModalClient({ eventId }: Props) {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  function handleConfirm() {
    setOpen(false)
    router.push(`/evenimente/${eventId}/editare`)
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5 text-xs"
        onClick={() => setOpen(true)}
      >
        <Pencil className="size-3" />
        Editează
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="size-5 text-destructive" />
              Atenție
            </DialogTitle>
            <DialogDescription className="text-sm leading-relaxed pt-1">
              Dacă editezi acest eveniment, el va reveni în starea{' '}
              <span className="font-semibold text-foreground">„În așteptare"</span> și nu va mai fi
              vizibil public până la revalidarea de către un administrator.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Anulează
            </Button>
            <Button onClick={handleConfirm}>
              Da, continuă
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
