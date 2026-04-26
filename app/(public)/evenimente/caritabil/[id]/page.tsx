import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { Mic2, Users2, Heart, Radio, TrendingUp, Ticket, Play, Images } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { buttonVariants } from '@/components/ui/button'
import { getCharityById, incrementViewCount } from '@/services/event.service'
import { EventBanner } from '@/components/shared/EventBanner'
import { ActionButtons } from '@/components/shared/ActionButtons'
import { ParticipationCardClient } from '@/components/shared/ParticipationCardClient'
import { LocationMapClient } from '@/components/shared/LocationMapClient'
import { FeedbackSection } from '@/components/shared/FeedbackSection'

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { id } = await params
    const event = await getCharityById(id)
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
        alternates: { canonical: `/evenimente/caritabil/${event.id}` },
    }
}

export default async function CharityPage({ params }: Props) {
    const { id } = await params
    const event = await getCharityById(id)
    if (!event) notFound()

    incrementViewCount(id)

    const { charity } = event
    const { concert, meet_greet, livestream, sport } = charity

    const subtypeData = concert ?? meet_greet ?? sport
    const date = subtypeData?.date
    const timeStart = subtypeData?.time_start ?? livestream?.time_start
    const timeEnd = subtypeData?.time_end ?? livestream?.time_end ?? null
    const maxParticipants = subtypeData?.max_participants ?? undefined
    const location = subtypeData?.location
    const ticketPrice = concert?.ticket_price ?? meet_greet?.ticket_price ?? sport?.ticket_price
    const ticketLink = concert?.ticket_link ?? meet_greet?.ticket_link ?? sport?.ticket_link
    const performers = concert?.performers
    const guests = meet_greet?.guests ?? sport?.guests ?? livestream?.guests
    const cause = livestream?.cause
    const streamLink = livestream?.stream_link

    const collectedPct =
        charity.target_amount && charity.target_amount > 0
            ? Math.min(100, Math.round(((charity.collected_amount ?? 0) / charity.target_amount) * 100))
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
        url: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://civicom.ro'}/evenimente/caritabil/${event.id}`,
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
                        {/* Progress donații */}
                        {charity.target_amount && (
                            <Card className="shadow-lg shadow-black/5 border-border">
                                <CardContent className="p-6 space-y-4">
                                    <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                        <TrendingUp size={14} />
                                        Strângere fonduri
                                    </h3>
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-muted-foreground">Colectat</span>
                                            <span className="text-3xl font-black italic tracking-tighter text-primary leading-none">
                                                {(charity.collected_amount ?? 0).toLocaleString('ro-RO')}{' '}
                                                <span className="text-sm font-normal text-muted-foreground not-italic">
                                                    / {charity.target_amount.toLocaleString('ro-RO')} RON
                                                </span>
                                            </span>
                                        </div>
                                        <Progress value={collectedPct} className="h-2 bg-muted" />
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Bilet / Link live */}
                        {ticketLink && (
                            <Link
                                href={ticketLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={buttonVariants({ variant: 'default' }) + ' w-full gap-2'}
                            >
                                <Ticket size={16} />
                                {ticketPrice
                                    ? `Cumpără bilet — ${ticketPrice.toLocaleString('ro-RO')} RON`
                                    : 'Cumpără bilet'}
                            </Link>
                        )}

                        {streamLink && (
                            <Link
                                href={streamLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={buttonVariants({ variant: 'default' }) + ' w-full gap-2'}
                            >
                                <Play size={16} />
                                Urmărește live
                            </Link>
                        )}

                        <ParticipationCardClient
                            participantsCount={event.participants_count}
                            maxParticipants={maxParticipants}
                            date={date}
                            timeStart={timeStart}
                            timeEnd={timeEnd}
                            status={event.status}
                        />

                        {location && (
                            <LocationMapClient location={location} />
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

                        {cause && (
                            <section className="space-y-3">
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                    <Heart size={14} />
                                    Cauza susținută
                                </h3>
                                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                                    {cause}
                                </p>
                            </section>
                        )}

                        {performers && performers.length > 0 && (
                            <section className="space-y-3">
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                    <Mic2 size={14} />
                                    Artiști
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {performers.map((p, i) => (
                                        <span
                                            key={i}
                                            className="rounded-full border border-border bg-muted/50 px-3 py-1 text-sm font-semibold text-foreground"
                                        >
                                            {p}
                                        </span>
                                    ))}
                                </div>
                            </section>
                        )}

                        {guests && guests.length > 0 && (
                            <section className="space-y-3">
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                    <Users2 size={14} />
                                    {livestream ? 'Invitați' : event.subcategory === 'meet_greet' ? 'Invitați speciali' : 'Participanți speciali'}
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {guests.map((g, i) => (
                                        <span
                                            key={i}
                                            className="rounded-full border border-border bg-muted/50 px-3 py-1 text-sm font-semibold text-foreground"
                                        >
                                            {g}
                                        </span>
                                    ))}
                                </div>
                            </section>
                        )}

                        {livestream && (
                            <section className="space-y-3">
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                    <Radio size={14} />
                                    Program
                                </h3>
                                <p className="text-sm text-muted-foreground font-medium">
                                    {livestream.time_start}{livestream.time_end ? ` – ${livestream.time_end}` : ''}
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
