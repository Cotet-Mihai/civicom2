'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { uploadOrgBanner } from '@/lib/upload'
import { BannerCropperClient } from '@/app/(private)/creeaza/_components/BannerCropperClient'

type Props = {
    orgId: string
    bannerUrl: string | null
    onBannerChange: (url: string | null) => void
}

export function BannerUploadClient({ orgId, bannerUrl, onBannerChange }: Props) {
    const [uploading, setUploading] = useState(false)

    async function handleImageReady(croppedFile: File) {
        setUploading(true)
        const url = await uploadOrgBanner(croppedFile, orgId)
        setUploading(false)
        if (url) {
            onBannerChange(url)
        } else {
            toast.error('Eroare la încărcarea bannerului')
        }
    }

    return (
        <div className="space-y-2">
            <BannerCropperClient
                bannerUrl={bannerUrl}
                isUploading={uploading}
                onImageReady={handleImageReady}
                onRemove={() => onBannerChange(null)}
            />
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
