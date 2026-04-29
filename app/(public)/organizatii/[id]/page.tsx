import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Building2, Globe, Star, Users, CalendarDays, CreditCard } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import {
  getOrganizationById,
  getOrganizationPublicEvents,
  getOrganizationRatings,
  getUserRatingForOrganization,
} from '@/services/organization.service'
import { getAuthUser } from '@/services/auth.service'
import { EventCard } from '@/components/shared/EventCard'
import { OrgRatingClient } from './_components/OrgRatingClient'

type PageProps = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const org = await getOrganizationById(id)
  if (!org) return { title: 'Organizație negăsită' }
  return {
    title: org.name,
    description: org.description ?? `Pagina organizației ${org.name} pe CIVICOM.`,
    openGraph: {
      title: org.name,
      description: org.description ?? '',
      images: org.logo_url ? [{ url: org.logo_url }] : [],
    },
    alternates: { canonical: `/organizatii/${id}` },
  }
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('ro-RO', { month: 'long', year: 'numeric' })
}

export default async function OrganizatieDetailPage({ params }: PageProps) {
  const { id } = await params

  const [org, events, ratings, user] = await Promise.all([
    getOrganizationById(id),
    getOrganizationPublicEvents(id),
    getOrganizationRatings(id),
    getAuthUser(),
  ])

  if (!org || org.status !== 'approved') notFound()

  const userRating = user ? await getUserRatingForOrganization(id) : null
  const isAuthenticated = !!user

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: org.name,
    description: org.description ?? undefined,
    url: org.website ?? undefined,
    logo: org.logo_url ?? undefined,
    foundingDate: org.created_at.split('T')[0],
    aggregateRating: ratings.total > 0 ? {
      '@type': 'AggregateRating',
      ratingValue: ratings.average,
      reviewCount: ratings.total,
      bestRating: 5,
      worstRating: 1,
    } : undefined,
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8 lg:py-16">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">

          {/* ── Left column ── */}
          <div className="lg:col-span-8 space-y-8">

            {/* Header */}
            <div className="flex items-start gap-5">
              {org.logo_url ? (
                <div className="relative size-20 lg:size-24 rounded-2xl overflow-hidden border border-border shrink-0">
                  <Image src={org.logo_url} alt={org.name} fill sizes="(max-width: 1024px) 80px, 96px" className="object-cover" />
                </div>
              ) : (
                <div className="size-20 lg:size-24 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                  <Building2 size={32} className="text-primary" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-black tracking-tight text-foreground lg:text-3xl">{org.name}</h1>
                <p className="text-xs text-muted-foreground mt-1">Membră din {formatDate(org.created_at)}</p>
                {org.website && (
                  <a
                    href={org.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline mt-2"
                  >
                    <Globe size={14} /> {org.website}
                  </a>
                )}
              </div>
            </div>

            {/* Description */}
            {org.description && (
              <div>
                <h2 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">
                  Despre organizație
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">{org.description}</p>
              </div>
            )}

            {/* IBAN */}
            {org.iban && (
              <div>
                <h2 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1.5">
                  <CreditCard size={12} /> Cont donații
                </h2>
                <code className="text-sm font-mono bg-muted px-3 py-1.5 rounded-lg border border-border text-foreground">
                  {org.iban}
                </code>
              </div>
            )}

            {/* Members */}
            {org.members.length > 0 && (
              <div>
                <h2 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-1.5">
                  <Users size={12} /> Echipă ({org.members.length})
                </h2>
                <div className="flex flex-wrap gap-2">
                  {org.members.map(m => (
                    <div key={m.user_id} className="flex items-center gap-2 bg-muted/50 rounded-full px-3 py-1.5 border border-border/50">
                      <div className="size-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-[10px] font-black text-primary">
                        {m.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-xs font-medium text-foreground">{m.name}</span>
                      {m.role === 'admin' && (
                        <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4">Admin</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Events */}
            {events.length > 0 && (
              <div>
                <h2 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-1.5">
                  <CalendarDays size={12} /> Evenimente ({org.events_count})
                </h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {events.slice(0, 6).map(event => (
                    <EventCard
                      key={event.id}
                      event={{
                        id: event.id,
                        title: event.title,
                        description: '',
                        category: event.category as 'protest' | 'boycott' | 'petition' | 'community' | 'charity',
                        subcategory: event.subcategory,
                        status: event.status as 'pending' | 'approved' | 'rejected' | 'contested' | 'completed',
                        banner_url: event.banner_url,
                        date: event.created_at.slice(0, 10),
                        created_at: event.created_at,
                        participants_count: event.participants_count,
                        view_count: 0,
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Sidebar ── */}
          <aside className="lg:col-span-4 space-y-6">
            {/* Stats card */}
            <Card className="p-6 shadow-lg bg-white shadow-black/5 border-border">
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Rating mediu</p>
                  <div className="flex items-center gap-2">
                    <span className="text-3xl font-black italic tracking-tighter text-primary">
                      {ratings.average > 0 ? ratings.average.toFixed(1) : '—'}
                    </span>
                    <div>
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map(i => (
                          <Star key={i} size={14} className={i <= Math.round(ratings.average) ? 'fill-secondary text-secondary' : 'text-muted-foreground/30'} />
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">{ratings.total} evaluări</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border/50">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Membri</p>
                    <p className="text-xl font-black text-foreground">{org.members.length}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Evenimente</p>
                    <p className="text-xl font-black text-foreground">{org.events_count}</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Rating widget */}
            <Card className="p-6 shadow-lg bg-white shadow-black/5 border-border">
              <OrgRatingClient orgId={id} initialRating={userRating} isAuthenticated={isAuthenticated} />
            </Card>

            {/* Back link */}
            <Link href="/organizatii" className={buttonVariants({ variant: 'outline' }) + ' w-full'}>
              ← Toate organizațiile
            </Link>
          </aside>
        </div>
      </div>
    </>
  )
}
