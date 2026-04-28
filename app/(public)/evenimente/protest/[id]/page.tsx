import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Image from 'next/image'
import { Phone, ShieldCheck, Package, Images } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { getProtestById, incrementViewCount } from '@/services/event.service'
import { getAuthUser } from '@/services/auth.service'
import { getParticipationStatus } from '@/services/participation.service'
import { hasCurrentUserSubmittedFeedback } from '@/services/feedback.service'
import { EventBanner } from '@/components/shared/EventBanner'
import { ActionButtons } from '@/components/shared/ActionButtons'
import { ParticipationCardClient } from '@/components/shared/ParticipationCardClient'
import { FeedbackFormClient } from '@/components/shared/FeedbackFormClient'
import { FeedbackSection } from '@/components/shared/FeedbackSection'
import { ProtestMapClient } from './_components/ProtestMapClient'

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const event = await getProtestById(id)
  if (!event) return { title: 'Eveniment negăsit' }
  return {
    title: event.title,
    description: event.description.slice(0, 160),
    openGraph: {
      title: event.title,
      description: event.description.slice(0, 160),
      images: event.banner_url ? [{ url: event.banner_url }] : [],
      type: 'article',
    },
    alternates: { canonical: `/evenimente/protest/${event.id}` },
  }
}

export default async function ProtestPage({ params }: Props) {
  const { id } = await params
  const event = await getProtestById(id)
  if (!event) notFound()

  // fire-and-forget — nu blochează randarea
  incrementViewCount(id)

  const user = await getAuthUser()
  let isParticipant = false
  let hasSubmittedFeedback = false
  if (user && event.status === 'completed') {
    const [participationStatus, feedbackExists] = await Promise.all([
      getParticipationStatus(event.id),
      hasCurrentUserSubmittedFeedback(event.id),
    ])
    isParticipant = participationStatus === 'joined'
    hasSubmittedFeedback = feedbackExists
  }

  const { protest } = event
  const mapLocation =
    protest.gathering?.location ?? protest.picket?.location ?? undefined
  const mapLocations = protest.march?.locations ?? undefined

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.title,
    description: event.description,
    startDate: `${protest.date}T${protest.time_start}`,
    ...(protest.time_end && { endDate: `${protest.date}T${protest.time_end}` }),
    ...(mapLocation && {
      location: {
        '@type': 'Place',
        geo: {
          '@type': 'GeoCoordinates',
          latitude: mapLocation[0],
          longitude: mapLocation[1],
        },
      },
    }),
    url: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://civicom.ro'}/evenimente/protest/${event.id}`,
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="mx-auto max-w-7xl px-4 lg:px-8 py-8 space-y-8">
        <EventBanner
          bannerUrl={event.banner_url}
          title={event.title}
          category={event.category}
          subcategory={event.subcategory}
          status={event.status}
          viewCount={event.view_count}
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Sidebar — apare primul pe mobil */}
          <aside className="lg:col-span-4 space-y-4 order-first lg:order-last">
            <ParticipationCardClient
              eventId={event.id}
              participantsCount={event.participants_count}
              maxParticipants={protest.max_participants}
              date={protest.date}
              timeStart={protest.time_start}
              timeEnd={protest.time_end}
              status={event.status}
            />

            <FeedbackFormClient
              eventId={event.id}
              isParticipant={isParticipant}
              hasSubmitted={hasSubmittedFeedback}
            />

            <ProtestMapClient
              subcategory={event.subcategory}
              location={mapLocation}
              locations={mapLocations}
            />

            {protest.contact_person && (
              <Card className="shadow-lg shadow-black/5 border-border">
                <CardContent className="p-6 space-y-3">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <Phone size={14} />
                    Contact
                  </h3>
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-black text-xs text-primary shrink-0">
                      {protest.contact_person.slice(0, 2).toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-foreground">
                      {protest.contact_person}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}
          </aside>

          {/* Conținut principal */}
          <div className="lg:col-span-8 space-y-8">
            <ActionButtons
              title={event.title}
              date={protest.date}
              timeStart={protest.time_start}
            />

            <div className="space-y-4">
              <h1 className="text-2xl md:text-4xl font-black tracking-tighter leading-tight uppercase text-primary italic">
                {event.title}
              </h1>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                {event.description}
              </p>
            </div>

            {protest.safety_rules && (
              <section className="space-y-3">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <ShieldCheck size={14} />
                  Reguli de siguranță
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                  {protest.safety_rules}
                </p>
              </section>
            )}

            {protest.recommended_equipment && (
              <section className="space-y-3">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <Package size={14} />
                  Echipament recomandat
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                  {protest.recommended_equipment}
                </p>
              </section>
            )}

            {event.gallery_urls.length > 0 && (
              <section className="space-y-3">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <Images size={14} />
                  Galerie foto
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {event.gallery_urls.map((url, i) => (
                    <div
                      key={i}
                      className="relative aspect-square rounded-xl overflow-hidden border border-border"
                    >
                      <Image
                        src={url}
                        alt={`Foto ${i + 1}`}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
              </section>
            )}

            <FeedbackSection eventId={event.id} status={event.status} />
          </div>
        </div>
      </div>
    </>
  )
}
