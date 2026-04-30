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
        <div className="space-y-3">
            {/* Container-ul acum este dreptunghiular (aspect-video) și ia toată lățimea, exact ca bannerul */}
            <div
                onClick={() => inputRef.current?.click()}
                className="group relative flex w-full aspect-video cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-border bg-transparent transition-all hover:border-primary/50 hover:bg-primary/5"
            >
                {logoUrl ? (
                    /* Folosim object-contain ca să nu tăiem logo-ul și p-4 ca să aibă un spațiu de respirație de la margini */
                    <Image src={logoUrl} alt="Logo" fill className="object-contain p-4 transition-transform duration-500 group-hover:scale-105" unoptimized />
                ) : (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground transition-colors group-hover:text-primary">
                        {uploading ? <Upload size={24} className="animate-pulse" /> : <Building2 size={24} />}
                        <span className="text-xs font-medium">{uploading ? 'Se încarcă...' : 'Încarcă logo-ul'}</span>
                    </div>
                )}
            </div>
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />

            {/* Butonul de ștergere stilizat fin */}
            {logoUrl && (
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 px-3 text-xs font-semibold text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => onLogoChange(null)}
                >
                    <X size={14} className="mr-1.5" /> Șterge logo
                </Button>
            )}
        </div>
    )
}