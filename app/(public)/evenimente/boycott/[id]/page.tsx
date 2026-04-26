import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { ExternalLink, Images, AlertCircle, Zap, Building2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { getBoycottById, incrementViewCount } from '@/services/event.service'
import { EventBanner } from '@/components/shared/EventBanner'
import { ActionButtons } from '@/components/shared/ActionButtons'
import { ParticipationCardClient } from '@/components/shared/ParticipationCardClient'
import { FeedbackSection } from '@/components/shared/FeedbackSection'

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { id } = await params
    const event = await getBoycottById(id)
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
        alternates: { canonical: `/evenimente/boycott/${event.id}` },
    }
}

export default async function BoycottPage({ params }: Props) {
    const { id } = await params
    const event = await getBoycottById(id)
    if (!event) notFound()

    incrementViewCount(id)

    const { boycott } = event
    const organizer = event.organization ?? { name: event.creator.name, logo_url: event.creator.avatar_url }

    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Event',
        name: event.title,
        description: event.description,
        url: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://civicom.ro'}/evenimente/boycott/${event.id}`,
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
                    subcategory={null}
                    status={event.status}
                    viewCount={event.view_count}
                />

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
                    {/* Sidebar */}
                    <aside className="lg:col-span-4 space-y-4 order-first lg:order-last">
                        <ParticipationCardClient
                            participantsCount={event.participants_count}
                            status={event.status}
                        />

                        <Card className="shadow-lg shadow-black/5 border-border">
                            <CardContent className="p-6 space-y-3">
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                    <Building2 size={14} />
                                    Organizat de
                                </h3>
                                <div className="flex items-center gap-3">
                                    <div className="size-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-black text-xs text-primary shrink-0">
                                        {organizer.name.slice(0, 2).toUpperCase()}
                                    </div>
                                    <span className="text-sm font-medium text-foreground">
                                        {organizer.name}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    </aside>

                    {/* Conținut principal */}
                    <div className="lg:col-span-8 space-y-8">
                        <ActionButtons title={event.title} />

                        <div className="space-y-4">
                            <h1 className="text-2xl md:text-4xl font-black tracking-tighter leading-tight uppercase text-primary italic">
                                {event.title}
                            </h1>
                            <div className="flex flex-wrap gap-2">
                                <Badge variant="outline" className="gap-1.5 text-xs font-semibold">
                                    <AlertCircle size={12} />
                                    {boycott.reason}
                                </Badge>
                                <Badge variant="outline" className="gap-1.5 text-xs font-semibold">
                                    <Zap size={12} />
                                    {boycott.method}
                                </Badge>
                            </div>
                            <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                                {event.description}
                            </p>
                        </div>

                        {boycott.brands.length > 0 && (
                            <section className="space-y-4">
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                    Branduri & Alternative
                                </h3>
                                <div className="space-y-3">
                                    {boycott.brands.map((brand) => (
                                        <div
                                            key={brand.id}
                                            className="rounded-xl border border-border bg-muted/30 p-4 space-y-3"
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="font-bold text-foreground">
                                                    {brand.name}
                                                </span>
                                                {brand.link && (
                                                    <Link
                                                        href={brand.link}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-muted-foreground hover:text-primary transition-colors"
                                                    >
                                                        <ExternalLink size={14} />
                                                    </Link>
                                                )}
                                            </div>

                                            {brand.alternatives.length > 0 && (
                                                <div className="space-y-2">
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                                        Alternative
                                                    </p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {brand.alternatives.map((alt) => (
                                                            <Link
                                                                key={alt.id}
                                                                href={alt.link}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary hover:bg-primary/10 transition-colors"
                                                            >
                                                                {alt.name}
                                                                <ExternalLink size={10} />
                                                            </Link>
                                                        ))}
                                                    </div>
                                                    {brand.alternatives[0]?.reason && (
                                                        <p className="text-xs text-muted-foreground">
                                                            {brand.alternatives[0].reason}
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}
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
