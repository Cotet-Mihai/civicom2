'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { Upload, X, ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { uploadBanner, uploadGalleryImages } from '@/lib/upload'

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
  const bannerRef = useRef<HTMLInputElement>(null)
  const galleryRef = useRef<HTMLInputElement>(null)

  async function handleBanner(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingBanner(true)
    const url = await uploadBanner(file, userId)
    if (url) onBannerChange(url)
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
        <div
          onClick={() => bannerRef.current?.click()}
          className="relative w-full aspect-[21/9] rounded-2xl overflow-hidden border-2 border-dashed border-border bg-muted/30 flex items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors"
        >
          {bannerUrl ? (
            <Image src={bannerUrl} alt="Banner" fill className="object-cover" />
          ) : (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <ImageIcon size={32} />
              <span className="text-sm font-medium">
                {uploadingBanner ? 'Se încarcă...' : 'Click pentru a adăuga banner'}
              </span>
            </div>
          )}
        </div>
        <input ref={bannerRef} type="file" accept="image/*" className="hidden" onChange={handleBanner} />
        {bannerUrl && (
          <Button variant="ghost" size="sm" className="text-destructive" onClick={() => onBannerChange(null)}>
            <X size={14} className="mr-1" /> Șterge banner
          </Button>
        )}
      </div>

      {/* Gallery */}
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
                  onClick={() => removeGalleryImage(i)}
                  className="absolute top-1 right-1 size-5 rounded-full bg-destructive text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={10} />
                </button>
              </div>
            ))}
          </div>
        )}
        <Button variant="outline" size="sm" onClick={() => galleryRef.current?.click()} disabled={uploadingGallery} className="gap-1.5">
          <Upload size={14} />
          {uploadingGallery ? 'Se încarcă...' : 'Adaugă fotografii'}
        </Button>
        <input ref={galleryRef} type="file" accept="image/*" multiple className="hidden" onChange={handleGallery} />
      </div>
    </div>
  )
}
