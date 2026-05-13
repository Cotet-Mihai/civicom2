'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { Upload, X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { uploadBanner, uploadGalleryImages } from '@/lib/upload'
import { BannerCropperClient } from './BannerCropperClient'

type Props = {
  userId: string
  bannerUrl: string | null
  galleryUrls: string[]
  onBannerChange: (url: string | null) => void
  onGalleryChange: (urls: string[]) => void
}

export function ImageUploadClient({ userId, bannerUrl, galleryUrls, onBannerChange, onGalleryChange }: Props) {
  const [uploadingBanner, setUploadingBanner] = useState(false)
  const [uploadingGallery, setUploadingGallery] = useState(false)
  const galleryRef = useRef<HTMLInputElement>(null)

  async function handleBannerImageReady(croppedFile: File) {
    setUploadingBanner(true)
    const url = await uploadBanner(croppedFile, userId)
    if (url) {
      onBannerChange(url)
    } else {
      toast.error('Eroare la încărcarea bannerului')
    }
    setUploadingBanner(false)
  }

  async function handleGallery(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    setUploadingGallery(true)
    const urls = await uploadGalleryImages(files, userId)
    onGalleryChange([...galleryUrls, ...urls])
    setUploadingGallery(false)
  }

  function removeGalleryImage(index: number) {
    onGalleryChange(galleryUrls.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="space-y-2">
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
          Banner eveniment *
        </p>
        <BannerCropperClient
          bannerUrl={bannerUrl}
          isUploading={uploadingBanner}
          onImageReady={handleBannerImageReady}
          onRemove={() => onBannerChange(null)}
        />
      </div>

      {/* Galerie */}
      <div className="space-y-2">
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
          Galerie foto (opțional)
        </p>
        {galleryUrls.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {galleryUrls.map((url, i) => (
              <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-border group">
                <Image src={url} alt={`Foto ${i + 1}`} fill className="object-cover" />
                <button
                  type="button"
                  onClick={() => removeGalleryImage(i)}
                  className="absolute top-1 right-1 size-5 rounded-full bg-destructive text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={10} />
                </button>
              </div>
            ))}
          </div>
        )}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => galleryRef.current?.click()}
          disabled={uploadingGallery}
          className="gap-1.5"
        >
          {uploadingGallery ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
          {uploadingGallery ? 'Se încarcă...' : 'Adaugă fotografii'}
        </Button>
        <input
          ref={galleryRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleGallery}
        />
      </div>
    </div>
  )
}
