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

// ---- shared field renderers ----

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

// ---- current version field renderers ----

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

// ---- snapshot (old version) field renderers ----

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function SnapshotFields({ snap, kind }: { snap: Record<string, unknown>; kind: string }) {
  const s = snap as any
  if (kind === 'protest') {
    return (
      <DetailSection title="Detalii protest">
        <Field label="Dată" value={s.date} />
        <Field label="Ora start" value={s.time_start} />
        <Field label="Ora sfârșit" value={s.time_end} />
        <Field label="Participanți max" value={s.max_participants} />
        <Field label="Reguli siguranță" value={s.safety_rules} />
        <Field label="Echipament recomandat" value={s.recommended_equipment} />
        <Field label="Contact" value={s.contact_person} />
      </DetailSection>
    )
  }
  if (kind === 'petition') {
    return (
      <DetailSection title="Detalii petiție">
        <Field label="Target semnături" value={s.target_signatures} />
        <Field label="Ce se solicită" value={s.what_is_requested} />
        <Field label="De la" value={s.requested_from} />
        <Field label="De ce e important" value={s.why_important} />
        <Field label="Contact" value={s.contact_person} />
      </DetailSection>
    )
  }
  if (kind === 'boycott') {
    const brands: { name: string }[] = Array.isArray(s.brands) ? s.brands : []
    return (
      <DetailSection title="Detalii boycott">
        <Field label="Motiv" value={s.reason} />
        <Field label="Metodă" value={s.method} />
        {brands.length > 0 && (
          <div className="text-sm">
            <span className="font-medium text-muted-foreground">Branduri: </span>
            <span className="text-foreground">{brands.map(b => b.name).join(', ')}</span>
          </div>
        )}
      </DetailSection>
    )
  }
  if (kind === 'community') {
    const needed: string[] | null = Array.isArray(s.what_is_needed) ? s.what_is_needed : null
    return (
      <DetailSection title="Detalii activitate comunitară">
        <Field label="Dată" value={s.date} />
        <Field label="Ora start" value={s.time_start} />
        <Field label="Ora sfârșit" value={s.time_end} />
        <Field label="Ce oferă organizatorul" value={s.what_organizer_offers} />
        <Field label="Tip donație" value={s.donation_type} />
        <Field label="Target donație" value={s.target_amount} />
        <FieldList label="Ce este necesar" items={needed} />
        <Field label="Contact" value={s.contact_person} />
      </DetailSection>
    )
  }
  if (kind === 'charity') {
    const performers: string[] | null = Array.isArray(s.performers) ? s.performers : null
    const guests: string[] | null = Array.isArray(s.guests) ? s.guests : null
    return (
      <DetailSection title="Detalii eveniment caritabil">
        <Field label="Dată" value={s.date} />
        <Field label="Ora start" value={s.time_start} />
        <Field label="Target donații" value={s.target_amount} />
        <Field label="Cauză" value={s.cause} />
        <FieldList label="Artiști" items={performers} />
        <FieldList label="Invitați" items={guests} />
        <Field label="Link stream" value={s.stream_link} />
      </DetailSection>
    )
  }
  return null
}

// ---- comparison columns ----

function SnapshotColumn({ snap, kind }: { snap: Record<string, unknown>; kind: string }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const s = snap as any
  const galleryUrls: string[] = Array.isArray(s.gallery_urls) ? s.gallery_urls : []

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 pb-1 border-b border-amber-200">
        <span className="text-[10px] font-black uppercase tracking-widest text-amber-700">Înainte de editare</span>
        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold">Vechi</span>
      </div>

      {s.banner_url && (
        <div className="relative w-full aspect-[21/9] rounded-xl overflow-hidden border border-border">
          <Image src={s.banner_url} alt="Banner anterior" fill className="object-cover" unoptimized />
        </div>
      )}

      <div className="space-y-1">
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Titlu</p>
        <p className="text-sm font-semibold text-foreground">{s.title}</p>
      </div>

      <div className="space-y-1">
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Descriere</p>
        <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{s.description}</p>
      </div>

      <SnapshotFields snap={snap} kind={kind} />

      {galleryUrls.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Galerie</p>
          <div className="grid grid-cols-2 gap-2">
            {galleryUrls.map((url, i) => (
              <div key={i} className="relative aspect-video rounded-lg overflow-hidden border border-border">
                <Image src={url} alt={`Galerie ${i + 1}`} fill className="object-cover" unoptimized />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function CurrentColumn({ detail, description, gallery_urls }: { detail: AdminEventDetail; description: string; gallery_urls: string[] }) {
  const { event } = detail
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 pb-1 border-b border-green-200">
        <span className="text-[10px] font-black uppercase tracking-widest text-green-700">Versiunea curentă</span>
        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">Nou</span>
      </div>

      {event.banner_url && (
        <div className="relative w-full aspect-[21/9] rounded-xl overflow-hidden border border-border">
          <Image src={event.banner_url} alt={event.title} fill className="object-cover" unoptimized />
        </div>
      )}

      <div className="space-y-1">
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Titlu</p>
        <p className="text-sm font-semibold text-foreground">{event.title}</p>
      </div>

      <div className="space-y-1">
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Descriere</p>
        <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{description}</p>
      </div>

      <EventFields d={detail} />

      {gallery_urls.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Galerie</p>
          <div className="grid grid-cols-2 gap-2">
            {gallery_urls.map((url, i) => (
              <div key={i} className="relative aspect-video rounded-lg overflow-hidden border border-border">
                <Image src={url} alt={`Galerie ${i + 1}`} fill className="object-cover" unoptimized />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ---- page ----

export default async function AdminEventDetailPage({ params }: Props) {
  const { id } = await params
  const detail = await getAdminEventDetail(id)
  if (!detail) notFound()

  const { event, description, gallery_urls } = detail
  const showComparison = event.is_edited && event.previous_snapshot !== null

  return (
    <div className={`mx-auto px-4 lg:px-8 py-8 space-y-6 ${showComparison ? 'max-w-7xl' : 'max-w-4xl'}`}>
      <div className="flex items-center gap-3">
        <Link href="/admin/evenimente" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-xl font-black tracking-tight text-foreground truncate">{event.title}</h1>
        {event.is_edited && (
          <span className="shrink-0 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold">Editat</span>
        )}
      </div>

      <AdminActionBarClient
        eventId={event.id}
        currentStatus={event.status}
        rejectionNote={event.rejection_note}
      />

      {showComparison ? (
        <>
          <p className="text-sm text-muted-foreground">
            Creatorul a editat acest eveniment. Comparați versiunea anterioară (stânga) cu versiunea curentă (dreapta).
          </p>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-amber-200 bg-amber-50/30 p-4 space-y-4">
              <SnapshotColumn snap={event.previous_snapshot!} kind={event.category} />
            </div>
            <div className="rounded-2xl border border-green-200 bg-green-50/30 p-4 space-y-4">
              <CurrentColumn detail={detail} description={description} gallery_urls={gallery_urls} />
            </div>
          </div>
        </>
      ) : (
        <>
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
            {event.org_name && (
              <div>
                <span className="font-medium text-muted-foreground">ONG: </span>
                <span className="text-foreground">{event.org_name}</span>
              </div>
            )}
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
        </>
      )}
    </div>
  )
}
