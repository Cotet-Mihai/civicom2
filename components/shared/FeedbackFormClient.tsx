'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Star, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { submitFeedback } from '@/services/feedback.service'

type Props = {
  eventId: string
  isParticipant: boolean
  hasSubmitted: boolean
}

export function FeedbackFormClient({ eventId, isParticipant, hasSubmitted }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [rating, setRating] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)

  if (!isParticipant || hasSubmitted) return null

  async function handleSubmit() {
    if (rating === 0) { toast.error('Selectează un rating'); return }
    setLoading(true)
    const result = await submitFeedback(eventId, rating, comment.trim() || null)
    setLoading(false)
    if ('error' in result) { toast.error(result.error); return }
    toast.success('Feedback trimis! Mulțumim.')
    router.refresh()
  }

  return (
    <Card className="shadow-lg shadow-black/5 border-border">
      <CardContent className="p-6 space-y-4">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          <Star size={14} />
          Evaluează evenimentul
        </h3>

        {!open ? (
          <Button className="w-full" onClick={() => setOpen(true)}>
            Evaluează evenimentul
          </Button>
        ) : (
          <div className="space-y-4">
            <div className="flex gap-1 justify-center">
              {[1, 2, 3, 4, 5].map(i => (
                <Star
                  key={i}
                  size={32}
                  className={`cursor-pointer transition-colors ${
                    i <= (hovered || rating)
                      ? 'fill-secondary text-secondary'
                      : 'text-muted-foreground/30'
                  }`}
                  onMouseEnter={() => setHovered(i)}
                  onMouseLeave={() => setHovered(0)}
                  onClick={() => setRating(i)}
                />
              ))}
            </div>
            <Textarea
              placeholder="Comentariu opțional..."
              value={comment}
              onChange={e => setComment(e.target.value)}
              rows={3}
            />
            <Button
              className="w-full"
              onClick={handleSubmit}
              disabled={loading || rating === 0}
            >
              {loading ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
              {loading ? 'Se trimite...' : 'Trimite feedback'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
