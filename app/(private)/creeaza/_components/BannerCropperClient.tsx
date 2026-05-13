'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import Cropper from 'react-easy-crop'
import type { Area } from 'react-easy-crop'
import { UploadCloud, Image as ImageIcon, Check, RefreshCw, Loader2 } from 'lucide-react'
import { getCroppedWebP } from '@/lib/upload'

type Props = {
  bannerUrl: string | null
  isUploading?: boolean
  onImageReady: (file: File) => void
  onRemove?: () => void
}

export function BannerCropperClient({ bannerUrl, isUploading, onImageReady, onRemove }: Props) {
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return
    const objectUrl = URL.createObjectURL(file)
    setImageSrc(objectUrl)
    setCrop({ x: 0, y: 0 })
    setZoom(1)
  }, [])

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    maxFiles: 1,
    noClick: !!imageSrc || !!bannerUrl || !!isUploading,
  })

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels)
  }, [])

  async function handleApplyCrop(e: React.MouseEvent) {
    e.stopPropagation()
    if (!imageSrc || !croppedAreaPixels) return
    setIsProcessing(true)
    try {
      const file = await getCroppedWebP(imageSrc, croppedAreaPixels)
      URL.revokeObjectURL(imageSrc)
      setImageSrc(null)
      onImageReady(file)
    } finally {
      setIsProcessing(false)
    }
  }

  function handleReplace(e: React.MouseEvent) {
    e.stopPropagation()
    open()
  }

  const isEditing = !!imageSrc
  const hasPreview = !imageSrc && !!bannerUrl
  const isEmpty = !imageSrc && !bannerUrl && !isUploading

  return (
    <div
      {...getRootProps()}
      className={`relative w-full aspect-[21/9] overflow-hidden rounded-xl border-2 transition-colors duration-200 group flex items-center justify-center bg-muted/50 ${
        isDragActive
          ? 'border-primary bg-primary/5'
          : isEditing
            ? 'border-primary/40'
            : 'border-dashed border-border'
      }`}
    >
      <input {...getInputProps()} />

      {/* STARE 1: Goală — drag & drop */}
      {isEmpty && (
        <div className="flex flex-col items-center justify-center text-muted-foreground cursor-pointer p-6 text-center w-full h-full select-none">
          <UploadCloud className="w-10 h-10 mb-3 text-muted-foreground/60" />
          <p className="text-sm font-medium">Click sau drag & drop</p>
          <p className="text-xs mt-1 text-muted-foreground/70">pentru a încărca imaginea de banner</p>
          <p className="text-xs mt-0.5 text-muted-foreground/50">Vei putea face crop după încărcare</p>
        </div>
      )}

      {/* STARE: Se încarcă pe Supabase */}
      {isUploading && !imageSrc && (
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <Loader2 className="w-7 h-7 animate-spin" />
          <p className="text-sm font-medium">Se încarcă...</p>
        </div>
      )}

      {/* STARE 2: Editare — inline cropper */}
      {isEditing && (
        <div className="absolute inset-0 z-10 w-full h-full">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={21 / 9}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            showGrid={false}
            style={{
              containerStyle: { background: '#000' },
              cropAreaStyle: { border: '2px solid hsl(var(--primary))' },
            }}
          />

          {/* Controale — buton confirmare */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2">
            <span className="text-xs text-white bg-black/60 px-3 py-1 rounded-full backdrop-blur-sm whitespace-nowrap">
              Trage pentru a repoziționa · Scroll pentru zoom
            </span>
            <button
              onClick={handleApplyCrop}
              disabled={isProcessing}
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 px-5 py-2 text-sm font-semibold rounded-lg shadow-lg transition-all disabled:opacity-60"
            >
              {isProcessing
                ? <RefreshCw size={14} className="animate-spin" />
                : <Check size={14} />
              }
              {isProcessing ? 'Se procesează...' : 'Aplică încadrarea'}
            </button>
          </div>
        </div>
      )}

      {/* STARE 3: Preview final + hover overlay */}
      {hasPreview && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={bannerUrl!} alt="Banner" className="object-cover w-full h-full" />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center z-10 gap-3">
            <button
              onClick={handleReplace}
              className="inline-flex items-center gap-2 bg-background text-foreground hover:bg-muted px-4 py-2 text-sm font-medium rounded-lg shadow-md transition-all"
            >
              <ImageIcon size={14} />
              Schimbă imaginea
            </button>
            {onRemove && (
              <button
                onClick={(e) => { e.stopPropagation(); onRemove() }}
                className="inline-flex items-center gap-2 bg-destructive text-destructive-foreground hover:bg-destructive/90 px-4 py-2 text-sm font-medium rounded-lg shadow-md transition-all"
              >
                Șterge
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}
