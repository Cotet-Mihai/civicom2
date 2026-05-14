'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { MapPin, Info, CheckCircle2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { ImageUploadClient } from '@/app/(private)/creeaza/_components/ImageUploadClient'
import { updateEvent, type EditEventData, type UpdateEventPayload } from '@/services/edit.service'

const REASONS = [
  { value: 'unethical practices', label: 'Practici neetice' },
  { value: 'environmental issues', label: 'Probleme de mediu' },
  { value: 'exploitation of workers', label: 'Exploatare muncitori' },
  { value: 'political position', label: 'Poziție politică' },
  { value: 'other', label: 'Altele' },
]

const METHODS = [
  { value: 'not buying anymore', label: 'Nu mai cumpăr' },
  { value: 'public pressure', label: 'Presiune publică' },
  { value: 'inform people', label: 'Informare publică' },
  { value: 'any', label: 'Orice mod' },
]

type FormState = {
  title: string
  description: string
  bannerUrl: string | null
  galleryUrls: string[]
  date: string
  timeStart: string
  timeEnd: string
  isLimited: boolean
  maxParticipants: string
  safetyRules: string
  equipment: string
  contactPerson: string
  targetSignatures: string
  whatIsRequested: string
  requestedFrom: string
  whyImportant: string
  reason: string
  method: string
  whatOrganizerOffers: string
  targetAmount: string
  whatIsNeeded: string
  cause: string
  performers: string
  guests: string
  streamLink: string
}

function initState(data: EditEventData): FormState {
  const base: FormState = {
    title: data.base.title,
    description: data.base.description,
    bannerUrl: data.base.banner_url,
    galleryUrls: data.base.gallery_urls,
    date: '', timeStart: '', timeEnd: '',
    isLimited: false, maxParticipants: '',
    safetyRules: '', equipment: '', contactPerson: '',
    targetSignatures: '', whatIsRequested: '', requestedFrom: '', whyImportant: '',
    reason: '', method: '',
    whatOrganizerOffers: '', targetAmount: '', whatIsNeeded: '',
    cause: '', performers: '', guests: '', streamLink: '',
  }

  if (data.kind === 'protest') {
    return {
      ...base,
      date: data.date ?? '',
      timeStart: data.time_start ?? '',
      timeEnd: data.time_end ?? '',
      isLimited: data.max_participants > 0,
      maxParticipants: data.max_participants > 0 ? String(data.max_participants) : '',
      safetyRules: data.safety_rules ?? '',
      equipment: data.recommended_equipment ?? '',
      contactPerson: data.contact_person ?? '',
    }
  }

  if (data.kind === 'petition') {
    return {
      ...base,
      targetSignatures: String(data.target_signatures),
      whatIsRequested: data.what_is_requested,
      requestedFrom: data.requested_from,
      whyImportant: data.why_important,
      contactPerson: data.contact_person ?? '',
    }
  }

  if (data.kind === 'boycott') {
    return { ...base, reason: data.reason, method: data.method }
  }

  if (data.kind === 'community') {
    return {
      ...base,
      date: data.date ?? '',
      timeStart: data.time_start ?? '',
      timeEnd: data.time_end ?? '',
      whatOrganizerOffers: data.what_organizer_offers ?? '',
      targetAmount: data.target_amount != null ? String(data.target_amount) : '',
      whatIsNeeded: (data.what_is_needed ?? []).join(', '),
      contactPerson: data.contact_person ?? '',
    }
  }

  if (data.kind === 'charity') {
    return {
      ...base,
      date: data.date ?? '',
      timeStart: data.time_start ?? '',
      targetAmount: data.target_amount != null ? String(data.target_amount) : '',
      cause: data.cause ?? '',
      performers: (data.performers ?? []).join(', '),
      guests: (data.guests ?? []).join(', '),
      streamLink: data.stream_link ?? '',
    }
  }

  return base
}

type Props = {
  eventId: string
  data: EditEventData
  authUserId: string
}

export function EditEventFormClient({ eventId, data, authUserId }: Props) {
  const [form, setForm] = useState<FormState>(() => initState(data))
  const [submitting, setSubmitting] = useState(false)
  const [showResubmitDialog, setShowResubmitDialog] = useState(false)
  const router = useRouter()
  const isRejected = data.base.status === 'rejected'

  function set<K extends keyof FormState>(key: K, val: FormState[K]) {
    setForm(f => ({ ...f, [key]: val }))
  }

  async function handleSubmit() {
    if (!form.title.trim()) { toast.error('Titlul este obligatoriu'); return }
    if (!form.description.trim()) { toast.error('Descrierea este obligatorie'); return }
    if (!form.bannerUrl) { toast.error('Bannerul este obligatoriu'); return }

    setSubmitting(true)

    let payload: UpdateEventPayload

    if (data.kind === 'protest') {
      if (!form.date || !form.timeStart) { toast.error('Data și ora de start sunt obligatorii'); setSubmitting(false); return }
      payload = {
        kind: 'protest',
        title: form.title, description: form.description,
        banner_url: form.bannerUrl, gallery_urls: form.galleryUrls,
        date: form.date,
        time_start: form.timeStart,
        time_end: form.timeEnd || null,
        max_participants: form.isLimited ? Number(form.maxParticipants) : 0,
        safety_rules: form.safetyRules || null,
        recommended_equipment: form.equipment || null,
        contact_person: form.contactPerson || null,
      }
    } else if (data.kind === 'petition') {
      if (!form.targetSignatures || Number(form.targetSignatures) < 1) { toast.error('Numărul de semnături este obligatoriu'); setSubmitting(false); return }
      if (!form.whatIsRequested.trim()) { toast.error('Câmpul „Ce se solicită" este obligatoriu'); setSubmitting(false); return }
      if (!form.requestedFrom.trim()) { toast.error('Câmpul „De la cine" este obligatoriu'); setSubmitting(false); return }
      if (!form.whyImportant.trim()) { toast.error('Câmpul „De ce este importantă" este obligatoriu'); setSubmitting(false); return }
      payload = {
        kind: 'petition',
        title: form.title, description: form.description,
        banner_url: form.bannerUrl, gallery_urls: form.galleryUrls,
        target_signatures: Number(form.targetSignatures),
        what_is_requested: form.whatIsRequested,
        requested_from: form.requestedFrom,
        why_important: form.whyImportant,
        contact_person: form.contactPerson || null,
      }
    } else if (data.kind === 'boycott') {
      if (!form.reason) { toast.error('Motivul boycott-ului este obligatoriu'); setSubmitting(false); return }
      if (!form.method) { toast.error('Metoda de boycott este obligatorie'); setSubmitting(false); return }
      payload = {
        kind: 'boycott',
        title: form.title, description: form.description,
        banner_url: form.bannerUrl, gallery_urls: form.galleryUrls,
        reason: form.reason, method: form.method,
      }
    } else if (data.kind === 'community') {
      payload = {
        kind: 'community',
        title: form.title, description: form.description,
        banner_url: form.bannerUrl, gallery_urls: form.galleryUrls,
        contact_person: form.contactPerson || null,
        date: form.date || null,
        time_start: form.timeStart || null,
        time_end: form.timeEnd || null,
        what_organizer_offers: form.whatOrganizerOffers || null,
        target_amount: form.targetAmount ? Number(form.targetAmount) : null,
        what_is_needed: form.whatIsNeeded
          ? form.whatIsNeeded.split(',').map(s => s.trim()).filter(Boolean)
          : null,
      }
    } else {
      // charity
      payload = {
        kind: 'charity',
        title: form.title, description: form.description,
        banner_url: form.bannerUrl, gallery_urls: form.galleryUrls,
        target_amount: form.targetAmount ? Number(form.targetAmount) : null,
        date: form.date || null,
        time_start: form.timeStart || null,
        cause: form.cause || null,
        performers: form.performers ? form.performers.split(',').map(s => s.trim()).filter(Boolean) : null,
        guests: form.guests ? form.guests.split(',').map(s => s.trim()).filter(Boolean) : null,
        stream_link: form.streamLink || null,
      }
    }

    const result = await updateEvent(eventId, payload)
    setSubmitting(false)

    if ('error' in result) {
      toast.error(result.error)
    } else if (isRejected) {
      setShowResubmitDialog(true)
    } else {
      toast.success('Eveniment actualizat!')
      router.push('/panou/evenimente')
    }
  }

  const hasLocation = data.kind === 'protest'
    || (data.kind === 'community' && (data.base.subcategory === 'outdoor' || data.base.subcategory === 'workshop'))
    || (data.kind === 'charity' && data.base.subcategory !== 'livestream')

  return (
    <div className="space-y-6">

      {/* Informații de bază */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Informații de bază</h3>
        <div className="space-y-2">
          <Label htmlFor="title">Titlu *</Label>
          <Input id="title" value={form.title} onChange={e => set('title', e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Descriere *</Label>
          <Textarea id="description" rows={5} value={form.description} onChange={e => set('description', e.target.value)} />
        </div>
      </div>

      {/* Detalii specifice per categorie */}
      {data.kind === 'protest' && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Detalii protest</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Data *</Label>
              <Input type="date" id="date" value={form.date} onChange={e => set('date', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time-start">Ora start *</Label>
              <Input type="time" id="time-start" step="60" value={form.timeStart}
                onChange={e => set('timeStart', e.target.value)}
                className="appearance-none [&::-webkit-calendar-picker-indicator]:hidden" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time-end">Ora sfârșit</Label>
              <Input type="time" id="time-end" step="60" value={form.timeEnd}
                onChange={e => set('timeEnd', e.target.value)}
                className="appearance-none [&::-webkit-calendar-picker-indicator]:hidden" />
            </div>
          </div>
          <div className="flex gap-3 items-center flex-wrap">
            <Label>Participanți</Label>
            <ToggleGroup
              className="border"
              value={[form.isLimited ? 'yes' : 'no']}
              onValueChange={v => { if (v.length) set('isLimited', v[0] === 'yes') }}
            >
              <ToggleGroupItem value="yes" className="aria-pressed:bg-secondary aria-pressed:text-secondary-foreground">Limitat</ToggleGroupItem>
              <ToggleGroupItem value="no" className="aria-pressed:bg-secondary aria-pressed:text-secondary-foreground">Nelimitat</ToggleGroupItem>
            </ToggleGroup>
            {form.isLimited && (
              <Input type="number" min="1" placeholder="ex: 3000"
                value={form.maxParticipants} onChange={e => set('maxParticipants', e.target.value)}
                className="w-36" />
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="equipment">Echipament recomandat</Label>
            <Input id="equipment" placeholder="ex: pancarte, fluiere, umbrelă"
              value={form.equipment} onChange={e => set('equipment', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="safety">Reguli de siguranță</Label>
            <Textarea id="safety" rows={3} value={form.safetyRules}
              onChange={e => set('safetyRules', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact">Persoană de contact</Label>
            <Input id="contact" placeholder="ex: Ion Popescu <ion@mail.com>"
              value={form.contactPerson} onChange={e => set('contactPerson', e.target.value)} />
          </div>
          <LocationReadonlyNote />
        </div>
      )}

      {data.kind === 'petition' && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Detalii petiție</h3>
          <div className="space-y-2">
            <Label htmlFor="target-sigs">Număr semnături țintă *</Label>
            <Input id="target-sigs" type="number" min="1" value={form.targetSignatures}
              onChange={e => set('targetSignatures', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="what-requested">Ce se solicită *</Label>
            <Textarea id="what-requested" rows={3} value={form.whatIsRequested}
              onChange={e => set('whatIsRequested', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="from-whom">De la cine *</Label>
            <Input id="from-whom" value={form.requestedFrom}
              onChange={e => set('requestedFrom', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="why-important">De ce este importantă *</Label>
            <Textarea id="why-important" rows={3} value={form.whyImportant}
              onChange={e => set('whyImportant', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact-pet">Persoană de contact</Label>
            <Input id="contact-pet" placeholder="ex: Ion Popescu <ion@mail.com>"
              value={form.contactPerson} onChange={e => set('contactPerson', e.target.value)} />
          </div>
        </div>
      )}

      {data.kind === 'boycott' && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Detalii boycott</h3>
          <div className="space-y-2">
            <Label>Motiv *</Label>
            <ToggleGroup
              className="border flex-wrap justify-start"
              value={[form.reason]}
              onValueChange={v => { if (v.length) set('reason', v[0]) }}
            >
              {REASONS.map(r => (
                <ToggleGroupItem key={r.value} value={r.value} className="aria-pressed:bg-secondary aria-pressed:text-secondary-foreground">
                  {r.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
          <div className="space-y-2">
            <Label>Metodă *</Label>
            <ToggleGroup
              className="border flex-wrap justify-start"
              value={[form.method]}
              onValueChange={v => { if (v.length) set('method', v[0]) }}
            >
              {METHODS.map(m => (
                <ToggleGroupItem key={m.value} value={m.value} className="aria-pressed:bg-secondary aria-pressed:text-secondary-foreground">
                  {m.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
          {data.brands.length > 0 && (
            <div className="space-y-2">
              <Label className="text-muted-foreground">Branduri (nu pot fi modificate)</Label>
              <div className="flex flex-wrap gap-2">
                {data.brands.map((b, i) => (
                  <span key={i} className="text-xs bg-muted border border-border px-2 py-1 rounded-md text-foreground">
                    {b.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {data.kind === 'community' && data.base.subcategory !== 'donation' && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            Detalii {data.base.subcategory === 'outdoor' ? 'activitate în aer liber' : 'workshop'}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date-comm">Data</Label>
              <Input type="date" id="date-comm" value={form.date} onChange={e => set('date', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time-start-comm">Ora start</Label>
              <Input type="time" id="time-start-comm" step="60" value={form.timeStart}
                onChange={e => set('timeStart', e.target.value)}
                className="appearance-none [&::-webkit-calendar-picker-indicator]:hidden" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time-end-comm">Ora sfârșit</Label>
              <Input type="time" id="time-end-comm" step="60" value={form.timeEnd}
                onChange={e => set('timeEnd', e.target.value)}
                className="appearance-none [&::-webkit-calendar-picker-indicator]:hidden" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="what-offers">Ce oferă organizatorul</Label>
            <Textarea id="what-offers" rows={3} value={form.whatOrganizerOffers}
              onChange={e => set('whatOrganizerOffers', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact-comm">Persoană de contact</Label>
            <Input id="contact-comm" placeholder="ex: Ion Popescu <ion@mail.com>"
              value={form.contactPerson} onChange={e => set('contactPerson', e.target.value)} />
          </div>
          <LocationReadonlyNote />
        </div>
      )}

      {data.kind === 'community' && data.base.subcategory === 'donation' && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Detalii donații</h3>
          <div className="space-y-2">
            <Label htmlFor="target-amount-don">Sumă țintă (RON)</Label>
            <Input id="target-amount-don" type="number" min="0"
              value={form.targetAmount} onChange={e => set('targetAmount', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="what-needed">Ce este necesar</Label>
            <Input id="what-needed" placeholder="ex: haine, mâncare, medicamente (separate prin virgulă)"
              value={form.whatIsNeeded} onChange={e => set('whatIsNeeded', e.target.value)} />
            <p className="text-xs text-muted-foreground">Separă elementele prin virgulă</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact-don">Persoană de contact</Label>
            <Input id="contact-don" placeholder="ex: Ion Popescu <ion@mail.com>"
              value={form.contactPerson} onChange={e => set('contactPerson', e.target.value)} />
          </div>
        </div>
      )}

      {data.kind === 'charity' && data.base.subcategory !== 'livestream' && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            Detalii {data.base.subcategory === 'concert' ? 'concert caritabil' : data.base.subcategory === 'meet_greet' ? 'meet & greet' : 'activitate sportivă'}
          </h3>
          <div className="space-y-2">
            <Label htmlFor="target-amount-ch">Sumă țintă donații (RON)</Label>
            <Input id="target-amount-ch" type="number" min="0"
              value={form.targetAmount} onChange={e => set('targetAmount', e.target.value)} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date-ch">Data</Label>
              <Input type="date" id="date-ch" value={form.date} onChange={e => set('date', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time-start-ch">Ora start</Label>
              <Input type="time" id="time-start-ch" step="60" value={form.timeStart}
                onChange={e => set('timeStart', e.target.value)}
                className="appearance-none [&::-webkit-calendar-picker-indicator]:hidden" />
            </div>
          </div>
          {data.base.subcategory === 'concert' && (
            <div className="space-y-2">
              <Label htmlFor="performers">Artiști (separate prin virgulă)</Label>
              <Input id="performers" placeholder="ex: Trupa X, Artist Y"
                value={form.performers} onChange={e => set('performers', e.target.value)} />
            </div>
          )}
          {(data.base.subcategory === 'meet_greet' || data.base.subcategory === 'sport') && (
            <div className="space-y-2">
              <Label htmlFor="guests">Invitați (separate prin virgulă)</Label>
              <Input id="guests" placeholder="ex: Ion Popescu, Maria Ion"
                value={form.guests} onChange={e => set('guests', e.target.value)} />
            </div>
          )}
          <LocationReadonlyNote />
        </div>
      )}

      {data.kind === 'charity' && data.base.subcategory === 'livestream' && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Detalii livestream caritabil</h3>
          <div className="space-y-2">
            <Label htmlFor="target-amount-ls">Sumă țintă donații (RON)</Label>
            <Input id="target-amount-ls" type="number" min="0"
              value={form.targetAmount} onChange={e => set('targetAmount', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="time-start-ls">Ora start</Label>
            <Input type="time" id="time-start-ls" step="60" value={form.timeStart}
              onChange={e => set('timeStart', e.target.value)}
              className="appearance-none [&::-webkit-calendar-picker-indicator]:hidden" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cause">Cauza livestream-ului</Label>
            <Textarea id="cause" rows={3} value={form.cause}
              onChange={e => set('cause', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="stream-link">Link stream</Label>
            <Input id="stream-link" placeholder="https://..." type="url"
              value={form.streamLink} onChange={e => set('streamLink', e.target.value)} />
          </div>
        </div>
      )}

      {/* Media */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Media</h3>
        <ImageUploadClient
          userId={authUserId}
          bannerUrl={form.bannerUrl}
          galleryUrls={form.galleryUrls}
          onBannerChange={v => set('bannerUrl', v)}
          onGalleryChange={v => set('galleryUrls', v)}
        />
      </div>

      {/* Avertisment status */}
      {isRejected && (
        <div className="flex items-start gap-2 rounded-lg bg-destructive/10 border border-destructive/20 p-3">
          <Info size={14} className="text-destructive mt-0.5 shrink-0" />
          <p className="text-sm text-destructive">
            Evenimentul a fost <span className="font-semibold">respins</span>. Salvând modificările, cererea va fi retrimisă spre revalidare.
          </p>
        </div>
      )}
      {!isRejected && (data.base.status === 'approved' || data.base.status === 'contested') && (
        <div className="flex items-start gap-2 rounded-lg bg-secondary/20 border border-secondary/30 p-3">
          <Info size={14} className="text-foreground mt-0.5 shrink-0" />
          <p className="text-sm text-foreground">
            Salvarea modificărilor va pune evenimentul înapoi în starea{' '}
            <span className="font-semibold">„În așteptare"</span> până la revalidarea de către un administrator.
          </p>
        </div>
      )}

      <div className="flex gap-3 justify-end pb-8">
        <Button variant="outline" onClick={() => router.push('/panou/evenimente')} disabled={submitting}>
          Anulează
        </Button>
        <Button onClick={handleSubmit} disabled={submitting}>
          {submitting ? 'Se salvează...' : (isRejected ? 'Retrimite cererea' : 'Salvează modificările')}
        </Button>
      </div>

      <Dialog open={showResubmitDialog} onOpenChange={setShowResubmitDialog}>
        <DialogContent className="max-w-sm text-center">
          <DialogHeader className="items-center">
            <div className="flex items-center justify-center size-14 rounded-full bg-primary/10 mb-2">
              <CheckCircle2 size={28} className="text-primary" />
            </div>
            <DialogTitle className="text-xl font-black">Cerere retrimisă!</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Modificările tale au fost salvate și evenimentul a fost retrimis spre revalidare. Vei fi notificat când un administrator ia o decizie.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-col gap-2 mt-2">
            <Button className="w-full" onClick={() => router.push('/panou/evenimente')}>
              Mergi la panou
            </Button>
            <Button variant="outline" className="w-full" onClick={() => setShowResubmitDialog(false)}>
              Rămâi pe pagină
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function LocationReadonlyNote() {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-muted/60 border border-border/50 px-3 py-2">
      <MapPin size={13} className="text-muted-foreground shrink-0" />
      <p className="text-xs text-muted-foreground">Locația nu poate fi modificată din această pagină.</p>
    </div>
  )
}
