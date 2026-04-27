import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { getAdminEventDetail } from '@/services/admin.service'
import type { AdminEventDetail } from '@/services/admin.service'
import { AdminActionBarClient } from './_components/AdminActionBarClient'

export const metadata: Metadata = { title: 'Admin — Revizuire eveniment' }

type Props = { params: Promise<{ id: string }> }

// ---- inline field renderers ----

function Field({ label, value }: { label: string; value: string | number | null | undefined }) {
  if (value === null || value === undefined || value === '') return null
  return (
    <div className="text-sm">
      <span className="font-medium text-muted-foreground">{label}: </span>
      <span className="text-foreground">{value}</span>
    </div>
  )
}

function FieldList({ label, items }: { label: string; items: string[] | null | undefined }) {
  if (!items?.length) return null
  return (
    <div className="text-sm">
      <span className="font-medium text-muted-foreground">{label}: </span>
      <span className="text-foreground">{items.join(', ')}</span>
    </div>
  )
}

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border p-4 space-y-2">
      <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{title}</h3>
      {children}
    </div>
  )
}

function EventFields({ d }: { d: AdminEventDetail }) {
  if (d.kind === 'protest') {
    return (
      <DetailSection title="Detalii protest">
        <Field label="Dată" value={d.detail.date} />
        <Field label="Ora start" value={d.detail.time_start} />
        <Field label="Ora sfârșit" value={d.detail.time_end} />
        <Field label="Participanți max" value={d.detail.max_participants} />
        <Field label="Reguli siguranță" value={d.detail.safety_rules} />
        <Field label="Echipament recomandat" value={d.detail.recommended_equipment} />
        <Field label="Contact" value={d.detail.contact_person} />
      </DetailSection>
    )
  }
  if (d.kind === 'petition') {
    return (
      <DetailSection title="Detalii petiție">
        <Field label="Target semnături" value={d.detail.target_signatures} />
        <Field label="Ce se solicită" value={d.detail.what_is_requested} />
        <Field label="De la" value={d.detail.requested_from} />
        <Field label="De ce e important" value={d.detail.why_important} />
        <Field label="Contact" value={d.detail.contact_person} />
      </DetailSection>
    )
  }
  if (d.kind === 'boycott') {
    return (
      <DetailSection title="Detalii boycott">
        <Field label="Motiv" value={d.detail.reason} />
        <Field label="Metodă" value={d.detail.method} />
        {d.detail.brands.length > 0 && (
          <div className="text-sm">
            <span className="font-medium text-muted-foreground">Branduri: </span>
            <span className="text-foreground">{d.detail.brands.map(b => b.name).join(', ')}</span>
          </div>
        )}
      </DetailSection>
    )
  }
  if (d.kind === 'community') {
    return (
      <DetailSection title="Detalii activitate comunitară">
        <Field label="Tip" value={d.detail.subcategory} />
        <Field label="Dată" value={d.detail.date} />
        <Field label="Ora start" value={d.detail.time_start} />
        <Field label="Ora sfârșit" value={d.detail.time_end} />
        <Field label="Ce oferă organizatorul" value={d.detail.what_organizer_offers} />
        <Field label="Tip donație" value={d.detail.donation_type} />
        <Field label="Target donație" value={d.detail.target_amount} />
        <FieldList label="Ce este necesar" items={d.detail.what_is_needed} />
        <Field label="Contact" value={d.detail.contact_person} />
      </DetailSection>
    )
  }
  if (d.kind === 'charity') {
    return (
      <DetailSection title="Detalii eveniment caritabil">
        <Field label="Tip" value={d.detail.subcategory} />
        <Field label="Dată" value={d.detail.date} />
        <Field label="Ora start" value={d.detail.time_start} />
        <Field label="Target donații" value={d.detail.target_amount} />
        <Field label="Cauză" value={d.detail.cause} />
        <FieldList label="Artiști" items={d.detail.performers} />
        <FieldList label="Invitați" items={d.detail.guests} />
        <Field label="Link stream" value={d.detail.stream_link} />
      </DetailSection>
    )
  }
  return null
}

// ---- page ----

export default async function AdminEventDetailPage({ params }: Props) {
  const { id } = await params
  const detail = await getAdminEventDetail(id)
  if (!detail) notFound()

  const { event, description, gallery_urls } = detail

  return (
    <div className="mx-auto max-w-4xl px-4 lg:px-8 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/evenimente" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-xl font-black tracking-tight text-foreground truncate">{event.title}</h1>
      </div>

      <AdminActionBarClient
        eventId={event.id}
        currentStatus={event.status}
        rejectionNote={event.rejection_note}
      />

      {event.banner_url && (
        <div className="relative w-full aspect-[21/9] rounded-2xl overflow-hidden border border-border">
          <Image src={event.banner_url} alt={event.title} fill className="object-cover" unoptimized />
        </div>
      )}

      <div className="space-y-2">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Descriere</h3>
        <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{description}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm rounded-xl border border-border p-4">
        <div>
          <span className="font-medium text-muted-foreground">Creator: </span>
          <span className="text-foreground">{event.creator_name}</span>
        </div>
        <div>
          <span className="font-medium text-muted-foreground">Categorie: </span>
          <span className="text-foreground">{event.category}</span>
        </div>
        {event.subcategory && (
          <div>
            <span className="font-medium text-muted-foreground">Subtip: </span>
            <span className="text-foreground">{event.subcategory}</span>
          </div>
        )}
      </div>

      <EventFields d={detail} />

      {gallery_urls.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Galerie</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {gallery_urls.map((url, i) => (
              <div key={i} className="relative aspect-video rounded-xl overflow-hidden border border-border">
                <Image src={url} alt={`Galerie ${i + 1}`} fill className="object-cover" unoptimized />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
