import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Image from 'next/image'
import { Phone, Package, Gift, Images, HandHeart, TrendingUp } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { getCommunityById, incrementViewCount } from '@/services/event.service'
import { EventBanner } from '@/components/shared/EventBanner'
import { ActionButtons } from '@/components/shared/ActionButtons'
import { ParticipationCardClient } from '@/components/shared/ParticipationCardClient'
import { LocationMapClient } from '@/components/shared/LocationMapClient'
import { FeedbackSection } from '@/components/shared/FeedbackSection'

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { id } = await params
    const event = await getCommunityById(id)
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
        alternates: { canonical: `/evenimente/comunitar/${event.id}` },
    }
}

export default async function CommunityPage({ params }: Props) {
    const { id } = await params
    const event = await getCommunityById(id)
    if (!event) notFound()

    incrementViewCount(id)

    const { community } = event
    const { outdoor, donation, workshop } = community

    const hasLocation = !!(outdoor?.location ?? workshop?.location)
    const location = outdoor?.location ?? workshop?.location
    const date = outdoor?.date ?? workshop?.date
    const timeStart = outdoor?.time_start ?? workshop?.time_start
    const timeEnd = outdoor?.time_end ?? workshop?.time_end ?? null
    const maxParticipants = outdoor?.max_participants ?? workshop?.max_participants ?? undefined
    const whatOrganizerOffers = outdoor?.what_organizer_offers ?? workshop?.what_organizer_offers
    const equipment = outdoor?.recommended_equipment ?? workshop?.recommended_equipment

    const donationPct =
        donation?.target_amount && donation.target_amount > 0
            ? Math.min(100, 0) // collected_amount not in community donations
            : 0

    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Event',
        name: event.title,
        description: event.description,
        ...(date && timeStart && { startDate: `${date}T${timeStart}` }),
        ...(timeEnd && date && { endDate: `${date}T${timeEnd}` }),
        ...(location && {
            location: {
                '@type': 'Place',
                geo: {
                    '@type': 'GeoCoordinates',
                    latitude: location[0],
                    longitude: location[1],
                },
            },
        }),
        url: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://civicom.ro'}/evenimente/comunitar/${event.id}`,
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
                    {/* Sidebar */}
                    <aside className="lg:col-span-4 space-y-4 order-first lg:order-last">
                        <ParticipationCardClient
                            eventId={event.id}
                            participantsCount={event.participants_count}
                            maxParticipants={maxParticipants}
                            date={date}
                            timeStart={timeStart}
                            timeEnd={timeEnd}
                            status={event.status}
                        />

                        {hasLocation && location && (
                            <LocationMapClient location={location} />
                        )}

                        {community.contact_person && (
                            <Card className="shadow-lg shadow-black/5 border-border">
                                <CardContent className="p-6 space-y-3">
                                    <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                        <Phone size={14} />
                                        Contact
                                    </h3>
                                    <div className="flex items-center gap-3">
                                        <div className="size-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-black text-xs text-primary shrink-0">
                                            {community.contact_person.slice(0, 2).toUpperCase()}
                                        </div>
                                        <span className="text-sm font-medium text-foreground">
                                            {community.contact_person}
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
                            date={date}
                            timeStart={timeStart}
                        />

                        <div className="space-y-4">
                            <h1 className="text-2xl md:text-4xl font-black tracking-tighter leading-tight uppercase text-primary italic">
                                {event.title}
                            </h1>
                            <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                                {event.description}
                            </p>
                        </div>

                        {whatOrganizerOffers && (
                            <section className="space-y-3">
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                    <Gift size={14} />
                                    Ce oferă organizatorul
                                </h3>
                                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                                    {whatOrganizerOffers}
                                </p>
                            </section>
                        )}

                        {equipment && (
                            <section className="space-y-3">
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                    <Package size={14} />
                                    Echipament recomandat
                                </h3>
                                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                                    {equipment}
                                </p>
                            </section>
                        )}

                        {/* Donații — material */}
                        {donation && donation.donation_type === 'material' && donation.what_is_needed && donation.what_is_needed.length > 0 && (
                            <section className="space-y-3">
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                    <HandHeart size={14} />
                                    Ce este necesar
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {donation.what_is_needed.map((item, i) => (
                                        <span
                                            key={i}
                                            className="rounded-full border border-border bg-muted/50 px-3 py-1 text-sm font-medium text-foreground"
                                        >
                                            {item}
                                        </span>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Donații — monetar */}
                        {donation && donation.donation_type === 'monetary' && donation.target_amount && (
                            <section className="space-y-3">
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                    <TrendingUp size={14} />
                                    Progres strângere fonduri
                                </h3>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">Obiectiv</span>
                                        <span className="font-bold text-foreground">
                                            {donation.target_amount.toLocaleString('ro-RO')} RON
                                        </span>
                                    </div>
                                    <Progress value={donationPct} className="h-2 bg-muted" />
                                </div>
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
