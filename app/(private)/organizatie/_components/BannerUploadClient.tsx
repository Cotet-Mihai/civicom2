'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { Upload, X, ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { uploadOrgBanner } from '@/lib/upload'

type Props = {
    orgId: string
    bannerUrl: string | null
    onBannerChange: (url: string | null) => void
}

export function BannerUploadClient({ orgId, bannerUrl, onBannerChange }: Props) {
    const [uploading, setUploading] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)

    async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (!file) return
        setUploading(true)
        const url = await uploadOrgBanner(file, orgId)
        if (url) onBannerChange(url)
        setUploading(false)
    }

    return (
        <div className="space-y-2">
            <div
                onClick={() => inputRef.current?.click()}
                className="group relative w-full overflow-hidden rounded-xl border border-border cursor-pointer transition-all hover:border-primary/50"
                style={{ aspectRatio: '16/9' }}
            >
                {bannerUrl ? (
                    <>
                        <Image
                            src={bannerUrl}
                            alt="Banner"
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                            unoptimized
                        />
                        {/* Overlay la hover cu indicație de schimbare */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 flex items-center justify-center">
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 bg-background/90 backdrop-blur-sm rounded-lg px-3 py-1.5">
                                <Upload size={13} className="text-foreground" />
                                <span className="text-xs font-semibold text-foreground">Schimbă bannerul</span>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-muted to-muted/60 flex flex-col items-center justify-center gap-2 transition-colors group-hover:from-primary/15">
                        <div className="flex size-8 items-center justify-center rounded-full bg-background/80 shadow-sm text-muted-foreground group-hover:text-primary transition-colors">
                            {uploading ? <Upload size={15} className="animate-pulse" /> : <ImageIcon size={15} />}
                        </div>
                        <span className="text-[11px] font-semibold text-muted-foreground group-hover:text-primary transition-colors">
                            {uploading ? 'Se încarcă...' : 'Încarcă banner'}
                        </span>
                    </div>
                )}
            </div>
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />

            {bannerUrl && (
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2.5 text-xs font-semibold text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => onBannerChange(null)}
                >
                    <X size={12} className="mr-1" /> Șterge
                </Button>
            )}
        </div>
    )
}
