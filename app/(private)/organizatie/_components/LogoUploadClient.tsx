'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { Upload, X, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { uploadLogo } from '@/lib/upload'

type Props = {
  orgId: string
  logoUrl: string | null
  onLogoChange: (url: string | null) => void
}

export function LogoUploadClient({ orgId, logoUrl, onLogoChange }: Props) {
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const url = await uploadLogo(file, orgId)
    if (url) onLogoChange(url)
    setUploading(false)
  }

  return (
    <div className="space-y-2">
      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Logo organizație</p>
      <div
        onClick={() => inputRef.current?.click()}
        className="relative size-24 rounded-2xl overflow-hidden border-2 border-dashed border-border bg-muted/30 flex items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors"
      >
        {logoUrl ? (
          <Image src={logoUrl} alt="Logo" fill className="object-cover" unoptimized />
        ) : (
          <div className="flex flex-col items-center gap-1 text-muted-foreground">
            {uploading ? <Upload size={20} className="animate-pulse" /> : <Building2 size={20} />}
            <span className="text-[10px]">{uploading ? 'Se încarcă...' : 'Logo'}</span>
          </div>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      {logoUrl && (
        <Button variant="ghost" size="sm" className="text-destructive text-xs h-7 px-2" onClick={() => onLogoChange(null)}>
          <X size={12} className="mr-1" /> Șterge logo
        </Button>
      )}
    </div>
  )
}
