import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Image from 'next/image'
import { Phone, Building2, Target, FileText, Images } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { getPetitionById, incrementViewCount } from '@/services/event.service'
import { EventBanner } from '@/components/shared/EventBanner'
import { ActionButtons } from '@/components/shared/ActionButtons'
import { SignatureCardClient } from '@/components/shared/SignatureCardClient'
import { FeedbackSection } from '@/components/shared/FeedbackSection'
import { RecentSignersClient } from './_components/RecentSignersClient'

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { id } = await params
    const event = await getPetitionById(id)
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
        alternates: { canonical: `/evenimente/petitie/${event.id}` },
    }
}

export default async function PetitionPage({ params }: Props) {
    const { id } = await params
    const event = await getPetitionById(id)
    if (!event) notFound()

    // fire-and-forget — nu blochează randarea
    incrementViewCount(id)

    const { petition } = event

    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Event',
        name: event.title,
        description: event.description,
        url: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://civicom.ro'}/evenimente/petitie/${event.id}`,
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
                    {/* Sidebar — apare primul pe mobil */}
                    <aside className="lg:col-span-4 space-y-4 order-first lg:order-last">
                        <SignatureCardClient
                            signaturesCount={event.participants_count}
                            targetSignatures={petition.target_signatures}
                            status={event.status}
                        />

                        <Card className="shadow-lg shadow-black/5 border-border">
                            <CardContent className="p-6 space-y-3">
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                    <Building2 size={14} />
                                    Adresat către
                                </h3>
                                <p className="text-sm font-bold text-foreground">
                                    {petition.requested_from}
                                </p>
                            </CardContent>
                        </Card>

                        <RecentSignersClient eventId={event.id} />

                        {petition.contact_person && (
                            <Card className="shadow-lg shadow-black/5 border-border">
                                <CardContent className="p-6 space-y-3">
                                    <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                        <Phone size={14} />
                                        Contact
                                    </h3>
                                    <div className="flex items-center gap-3">
                                        <div className="size-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-black text-xs text-primary shrink-0">
                                            {petition.contact_person.slice(0, 2).toUpperCase()}
                                        </div>
                                        <span className="text-sm font-medium text-foreground">
                                            {petition.contact_person}
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </aside>

                    {/* Conținut principal */}
                    <div className="lg:col-span-8 space-y-8">
                        <ActionButtons title={event.title} />

                        <div className="space-y-4">
                            <h1 className="text-2xl md:text-4xl font-black tracking-tighter leading-tight uppercase text-primary italic">
                                {event.title}
                            </h1>
                            <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                                {event.description}
                            </p>
                        </div>

                        <section className="space-y-3">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                <Target size={14} />
                                De ce e importantă
                            </h3>
                            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                                {petition.why_important}
                            </p>
                        </section>

                        <section className="space-y-3">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                <FileText size={14} />
                                Ce se solicită
                            </h3>
                            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                                {petition.what_is_requested}
                            </p>
                        </section>

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
