import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { ArrowLeft, Globe, Mail, Phone, MapPin, CreditCard, FileText, Users, Star, Download, AlertCircle } from 'lucide-react'
import { getAdminOrgDetail } from '@/services/admin.service'
import type { AdminOrgDetail } from '@/services/admin.service'
import { AdminOrgDetailActionBarClient } from './_components/AdminOrgDetailActionBarClient'
import { ORG_CATEGORY_LABELS, ORG_TYPE_LABELS, ORG_DOC_TYPE_LABELS } from '@/lib/constants'

export const metadata: Metadata = { title: 'Admin — Revizuire organizație' }

type Props = { params: Promise<{ id: string }> }

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('ro-RO', { day: 'numeric', month: 'short', year: 'numeric' })
}

function Field({ label, value }: { label: string; value: string | number | null | undefined }) {
  if (value === null || value === undefined || value === '') return null
  return (
    <div className="text-sm">
      <span className="font-medium text-muted-foreground">{label}: </span>
      <span className="text-foreground">{String(value)}</span>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border p-4 space-y-3">
      <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{title}</h3>
      {children}
    </div>
  )
}

function RatingStars({ rating }: { rating: number }) {
  const rounded = Math.round(rating)
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} size={14} className={i <= rounded ? 'text-secondary fill-secondary' : 'text-muted-foreground/30 fill-muted-foreground/20'} />
      ))}
      {rating > 0 && <span className="text-xs text-muted-foreground ml-1">{rating.toFixed(1)}</span>}
    </div>
  )
}

const STATUS_CLASSES: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  approved: 'bg-primary/10 text-primary border-primary/20',
  rejected: 'bg-destructive/10 text-destructive border-destructive/20',
  contested: 'bg-orange-50 text-orange-700 border-orange-200',
}
const STATUS_LABEL: Record<string, string> = {
  pending: 'În așteptare', approved: 'Aprobată', rejected: 'Respinsă', contested: 'Contestată',
}

// ---- full detail sections ----

function OrgInfoSections({ org }: { org: AdminOrgDetail }) {
  return (
    <div className="space-y-4">

      {/* Status + rejection note */}
      <Section title="Status">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${STATUS_CLASSES[org.status] ?? ''}`}>
            {STATUS_LABEL[org.status] ?? org.status}
          </span>
          {org.is_edited && (
            <span className="text-xs bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full font-bold border border-amber-200">Editat de proprietar</span>
          )}
        </div>
        {org.rejection_note && (
          <div className="flex items-start gap-2 text-sm">
            <AlertCircle size={14} className="text-destructive shrink-0 mt-0.5" />
            <div>
              <span className="font-medium text-destructive">Motiv respingere: </span>
              <span className="text-foreground">{org.rejection_note}</span>
            </div>
          </div>
        )}
      </Section>

      {/* Informații generale */}
      <Section title="Informații generale">
        {org.description && (
          <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{org.description}</p>
        )}
        {org.categories.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {org.categories.map(cat => (
              <span key={cat} className="text-xs bg-primary/10 text-primary px-2.5 py-0.5 rounded-full font-medium border border-primary/20">
                {ORG_CATEGORY_LABELS[cat] ?? cat}
              </span>
            ))}
          </div>
        )}
        {org.website && (
          <div className="flex items-center gap-1.5 text-sm">
            <Globe size={14} className="text-primary shrink-0" />
            <a href={org.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate">
              {org.website}
            </a>
          </div>
        )}
        {org.iban && (
          <div className="flex items-center gap-1.5 text-sm">
            <CreditCard size={14} className="text-muted-foreground shrink-0" />
            <span className="font-mono text-foreground">{org.iban}</span>
          </div>
        )}
      </Section>

      {/* Date juridice */}
      <Section title="Date juridice">
        <Field label="Tip organizație" value={org.org_type ? (ORG_TYPE_LABELS[org.org_type] ?? org.org_type) : null} />
        <Field label="CUI / CIF" value={org.cui} />
        <Field label="Nr. înregistrare" value={org.reg_number} />
        {org.email && (
          <div className="flex items-center gap-1.5 text-sm">
            <Mail size={14} className="text-muted-foreground shrink-0" />
            <span className="text-foreground">{org.email}</span>
          </div>
        )}
        {org.phone && (
          <div className="flex items-center gap-1.5 text-sm">
            <Phone size={14} className="text-muted-foreground shrink-0" />
            <span className="text-foreground">{org.phone}</span>
          </div>
        )}
      </Section>

      {/* Sediu */}
      {(org.address || org.city || org.county || org.postal_code) && (
        <Section title="Sediu">
          <div className="flex items-start gap-1.5 text-sm">
            <MapPin size={14} className="text-muted-foreground shrink-0 mt-0.5" />
            <span className="text-foreground">
              {[org.address, org.city, org.county, org.postal_code].filter(Boolean).join(', ')}
            </span>
          </div>
        </Section>
      )}

      {/* Membri */}
      {org.members.length > 0 && (
        <Section title={`Membri (${org.members.length})`}>
          <div className="space-y-2">
            {org.members.map(member => (
              <div key={member.user_id} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="size-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-[10px] font-black text-primary shrink-0">
                    {member.name.slice(0, 2).toUpperCase()}
                  </div>
                  <span className="text-foreground font-medium">{member.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${member.role === 'admin' ? 'bg-primary/10 text-primary border-primary/20' : 'bg-muted text-muted-foreground border-border'}`}>
                    {member.role}
                  </span>
                  <span className="text-xs text-muted-foreground">{formatDate(member.joined_at)}</span>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Documente */}
      <Section title={`Documente (${org.documents.length} / ${Object.keys(ORG_DOC_TYPE_LABELS).length})`}>
        {org.documents.length === 0 ? (
          <p className="text-sm text-muted-foreground">Niciun document încărcat.</p>
        ) : (
          <div className="space-y-2">
            {org.documents.map(doc => (
              <div key={doc.id} className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2">
                <FileText size={14} className="text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{doc.file_name}</p>
                  <p className="text-xs text-muted-foreground">{ORG_DOC_TYPE_LABELS[doc.doc_type] ?? doc.doc_type}</p>
                </div>
                {doc.download_url ? (
                  <a
                    href={doc.download_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    download={doc.file_name}
                    className="shrink-0 flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 transition-colors px-2 py-1 rounded-md hover:bg-primary/10"
                  >
                    <Download size={13} />
                    Descarcă
                  </a>
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </div>
            ))}
          </div>
        )}
      </Section>

    </div>
  )
}

// ---- snapshot column ----

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function SnapshotColumn({ snap }: { snap: Record<string, unknown> }) {
  const s = snap as any
  const categories: string[] = Array.isArray(s.categories) ? s.categories : []

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
      {s.logo_url && (
        <div className="relative size-16 rounded-xl overflow-hidden border border-border">
          <Image src={s.logo_url} alt="Logo anterior" fill className="object-cover" unoptimized />
        </div>
      )}
      {s.name && (
        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Nume</p>
          <p className="text-sm font-semibold text-foreground">{s.name}</p>
        </div>
      )}
      {s.description && (
        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Descriere</p>
          <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{s.description}</p>
        </div>
      )}
      {categories.length > 0 && (
        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Categorii</p>
          <div className="flex flex-wrap gap-1.5">
            {categories.map((cat: string) => (
              <span key={cat} className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium border border-amber-200">
                {ORG_CATEGORY_LABELS[cat] ?? cat}
              </span>
            ))}
          </div>
        </div>
      )}
      {s.org_type && <Field label="Tip" value={ORG_TYPE_LABELS[s.org_type] ?? s.org_type} />}
      {s.website && <Field label="Website" value={s.website} />}
      {s.email && <Field label="Email" value={s.email} />}
      {s.phone && <Field label="Telefon" value={s.phone} />}
      {s.address && <Field label="Adresă" value={s.address} />}
      {s.city && <Field label="Oraș" value={s.city} />}
      {s.county && <Field label="Județ" value={s.county} />}
      {s.iban && <Field label="IBAN" value={s.iban} />}
    </div>
  )
}

// ---- current column ----

function CurrentColumn({ org }: { org: AdminOrgDetail }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 pb-1 border-b border-green-200">
        <span className="text-[10px] font-black uppercase tracking-widest text-green-700">Versiunea curentă</span>
        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">Nou</span>
      </div>

      {org.banner_url && (
        <div className="relative w-full aspect-[21/9] rounded-xl overflow-hidden border border-border">
          <Image src={org.banner_url} alt={org.name} fill className="object-cover" unoptimized />
        </div>
      )}
      {org.logo_url && (
        <div className="relative size-16 rounded-xl overflow-hidden border border-border">
          <Image src={org.logo_url} alt={org.name} fill className="object-cover" unoptimized />
        </div>
      )}
      <div className="space-y-1">
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Nume</p>
        <p className="text-sm font-semibold text-foreground">{org.name}</p>
      </div>
      {org.description && (
        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Descriere</p>
          <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{org.description}</p>
        </div>
      )}
      {org.categories.length > 0 && (
        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Categorii</p>
          <div className="flex flex-wrap gap-1.5">
            {org.categories.map(cat => (
              <span key={cat} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium border border-primary/20">
                {ORG_CATEGORY_LABELS[cat] ?? cat}
              </span>
            ))}
          </div>
        </div>
      )}
      {org.org_type && <Field label="Tip" value={ORG_TYPE_LABELS[org.org_type] ?? org.org_type} />}
      {org.website && <Field label="Website" value={org.website} />}
      {org.email && <Field label="Email" value={org.email} />}
      {org.phone && <Field label="Telefon" value={org.phone} />}
      {org.address && <Field label="Adresă" value={org.address} />}
      {org.city && <Field label="Oraș" value={org.city} />}
      {org.county && <Field label="Județ" value={org.county} />}
      {org.iban && <Field label="IBAN" value={org.iban} />}
    </div>
  )
}

// ---- page ----

export default async function AdminOrgDetailPage({ params }: Props) {
  const { id } = await params
  const org = await getAdminOrgDetail(id)
  if (!org) notFound()

  const showComparison = org.is_edited && org.previous_snapshot !== null

  return (
    <div className={`mx-auto px-4 lg:px-8 py-8 space-y-6 ${showComparison ? 'max-w-7xl' : 'max-w-4xl'}`}>

      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/admin/organizatii" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-xl font-black tracking-tight text-foreground truncate">{org.name}</h1>
        {org.is_edited && (
          <span className="shrink-0 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold border border-amber-200">Editat</span>
        )}
      </div>

      {/* Action bar */}
      <AdminOrgDetailActionBarClient
        orgId={org.id}
        currentStatus={org.status}
        rejectionNote={org.rejection_note}
      />

      {/* Comparison view */}
      {showComparison ? (
        <>
          <p className="text-sm text-muted-foreground">
            Proprietarul a editat organizația. Comparați versiunea anterioară (stânga) cu versiunea curentă (dreapta).
          </p>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-amber-200 bg-amber-50/30 p-4 space-y-4">
              <SnapshotColumn snap={org.previous_snapshot!} />
            </div>
            <div className="rounded-2xl border border-green-200 bg-green-50/30 p-4 space-y-4">
              <CurrentColumn org={org} />
            </div>
          </div>

          {/* Extra sections below comparison */}
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground uppercase tracking-widest font-black">Date juridice, membri și documente</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(org.cui || org.reg_number || org.org_type || org.email || org.phone) && (
                <Section title="Date juridice">
                  <Field label="Tip" value={org.org_type ? (ORG_TYPE_LABELS[org.org_type] ?? org.org_type) : null} />
                  <Field label="CUI" value={org.cui} />
                  <Field label="Nr. înregistrare" value={org.reg_number} />
                  {org.email && (
                    <div className="flex items-center gap-1.5 text-sm">
                      <Mail size={13} className="text-muted-foreground shrink-0" />
                      <span>{org.email}</span>
                    </div>
                  )}
                  {org.phone && (
                    <div className="flex items-center gap-1.5 text-sm">
                      <Phone size={13} className="text-muted-foreground shrink-0" />
                      <span>{org.phone}</span>
                    </div>
                  )}
                </Section>
              )}
              {org.members.length > 0 && (
                <Section title={`Membri (${org.members.length})`}>
                  <div className="space-y-1.5">
                    {org.members.map(member => (
                      <div key={member.user_id} className="flex items-center justify-between text-sm">
                        <span className="font-medium text-foreground">{member.name}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${member.role === 'admin' ? 'bg-primary/10 text-primary border-primary/20' : 'bg-muted text-muted-foreground border-border'}`}>
                          {member.role}
                        </span>
                      </div>
                    ))}
                  </div>
                </Section>
              )}
            </div>

            {/* Documents always shown in full below comparison */}
            <Section title={`Documente (${org.documents.length} / ${Object.keys(ORG_DOC_TYPE_LABELS).length})`}>
              {org.documents.length === 0 ? (
                <p className="text-sm text-muted-foreground">Niciun document încărcat.</p>
              ) : (
                <div className="space-y-2">
                  {org.documents.map(doc => (
                    <div key={doc.id} className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2">
                      <FileText size={14} className="text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{doc.file_name}</p>
                        <p className="text-xs text-muted-foreground">{ORG_DOC_TYPE_LABELS[doc.doc_type] ?? doc.doc_type}</p>
                      </div>
                      {doc.download_url ? (
                        <a
                          href={doc.download_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          download={doc.file_name}
                          className="shrink-0 flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 transition-colors px-2 py-1 rounded-md hover:bg-primary/10"
                        >
                          <Download size={13} />
                          Descarcă
                        </a>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Section>
          </div>
        </>
      ) : (
        <>
          {/* Banner */}
          {org.banner_url && (
            <div className="relative w-full aspect-[21/9] rounded-2xl overflow-hidden border border-border">
              <Image src={org.banner_url} alt={org.name} fill className="object-cover" unoptimized />
            </div>
          )}

          {/* Logo + Name + Rating + Owner */}
          <div className="flex items-start gap-4">
            {org.logo_url ? (
              <div className="relative size-16 rounded-xl overflow-hidden border border-border shrink-0">
                <Image src={org.logo_url} alt={org.name} fill className="object-cover" unoptimized />
              </div>
            ) : (
              <div className="size-16 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                <Users size={24} className="text-primary" />
              </div>
            )}
            <div className="space-y-1">
              <h2 className="text-lg font-black tracking-tight text-foreground">{org.name}</h2>
              <RatingStars rating={org.rating} />
              <p className="text-xs text-muted-foreground">
                Proprietar: <span className="font-medium text-foreground">{org.owner_name}</span>
                {' '}· Creat: {formatDate(org.created_at)}
              </p>
            </div>
          </div>

          {/* All detail sections */}
          <OrgInfoSections org={org} />
        </>
      )}
    </div>
  )
}
