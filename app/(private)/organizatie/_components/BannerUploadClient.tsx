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
      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Banner organizație</p>
      <div
        onClick={() => inputRef.current?.click()}
        className="relative w-full aspect-video rounded-2xl overflow-hidden border-2 border-dashed border-border bg-muted/30 flex items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors"
      >
        {bannerUrl ? (
          <Image src={bannerUrl} alt="Banner" fill className="object-cover" unoptimized />
        ) : (
          <div className="flex flex-col items-center gap-1 text-muted-foreground">
            {uploading ? <Upload size={20} className="animate-pulse" /> : <ImageIcon size={20} />}
            <span className="text-[10px]">{uploading ? 'Se încarcă...' : 'Banner organizație'}</span>
          </div>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      {bannerUrl && (
        <Button variant="ghost" size="sm" className="text-destructive text-xs h-7 px-2" onClick={() => onBannerChange(null)}>
          <X size={12} className="mr-1" /> Șterge banner
        </Button>
      )}
    </div>
  )
}
