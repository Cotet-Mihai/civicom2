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
        <div className="space-y-3">
            {/* Același container identic cu cel de la logo */}
            <div
                onClick={() => inputRef.current?.click()}
                className="group relative flex w-full aspect-video cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-border bg-transparent transition-all hover:border-primary/50 hover:bg-primary/5"
            >
                {bannerUrl ? (
                    /* Aici păstrăm object-cover deoarece vrem ca bannerul să umple complet zona */
                    <Image src={bannerUrl} alt="Banner" fill className="object-cover transition-transform duration-500 group-hover:scale-105" unoptimized />
                ) : (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground transition-colors group-hover:text-primary">
                        {uploading ? <Upload size={24} className="animate-pulse" /> : <ImageIcon size={24} />}
                        <span className="text-xs font-medium">{uploading ? 'Se încarcă...' : 'Încarcă bannerul'}</span>
                    </div>
                )}
            </div>
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />

            {bannerUrl && (
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 px-3 text-xs font-semibold text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => onBannerChange(null)}
                >
                    <X size={14} className="mr-1.5" /> Șterge banner
                </Button>
            )}
        </div>
    )
}