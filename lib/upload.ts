import { createBrowserClient } from '@supabase/ssr'

function getClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

async function convertToWebP(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = document.createElement('img')
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) { reject(new Error('Canvas indisponibil')); return }
      ctx.drawImage(img, 0, 0)
      canvas.toBlob(
        blob => blob
          ? resolve(new File([blob], 'image.webp', { type: 'image/webp' }))
          : reject(new Error('Conversie eșuată')),
        'image/webp',
        0.9
      )
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Imagine invalidă')) }
    img.src = url
  })
}

// Crops an image (given as a data URL or object URL) to pixelCrop,
// scales output to 2100×900 banner resolution and returns a WebP File.
export async function getCroppedWebP(
  imageSrc: string,
  pixelCrop: { x: number; y: number; width: number; height: number }
): Promise<File> {
  const OUTPUT_WIDTH = 2100
  const OUTPUT_HEIGHT = 900
  const QUALITY = 0.8

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = document.createElement('img')
    image.onload = () => resolve(image)
    image.onerror = reject
    image.src = imageSrc
  })
  const canvas = document.createElement('canvas')
  canvas.width = OUTPUT_WIDTH
  canvas.height = OUTPUT_HEIGHT
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(
    img,
    pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height,
    0, 0, OUTPUT_WIDTH, OUTPUT_HEIGHT
  )
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      blob => blob
        ? resolve(new File([blob], 'banner.webp', { type: 'image/webp' }))
        : reject(new Error('Crop eșuat')),
      'image/webp',
      QUALITY
    )
  })
}

// Banner is already a WebP File coming from the cropper — just upload it.
export async function uploadBanner(file: File, userId: string): Promise<string | null> {
  const supabase = getClient()
  const path = `${userId}/${Date.now()}.webp`
  const { error } = await supabase.storage
    .from('banners')
    .upload(path, file, { upsert: true, contentType: 'image/webp' })
  if (error) { console.error('[uploadBanner]', error.message); return null }
  const { data } = supabase.storage.from('banners').getPublicUrl(path)
  return data.publicUrl
}

export async function uploadGalleryImages(files: File[], userId: string): Promise<string[]> {
  const supabase = getClient()
  const urls: string[] = []
  for (const file of files) {
    const webpFile = await convertToWebP(file).catch(() => file)
    const path = `${userId}/${Date.now()}_${Math.random().toString(36).slice(2)}.webp`
    const { error } = await supabase.storage
      .from('gallery')
      .upload(path, webpFile, { upsert: true, contentType: 'image/webp' })
    if (error) { console.error('[uploadGallery]', error.message); continue }
    const { data } = supabase.storage.from('gallery').getPublicUrl(path)
    urls.push(data.publicUrl)
  }
  return urls
}

export async function uploadLogo(file: File, orgId: string): Promise<string | null> {
  const supabase = getClient()
  const webpFile = await convertToWebP(file).catch(() => file)
  const path = `${orgId}/${Date.now()}.webp`
  const { error } = await supabase.storage
    .from('logos')
    .upload(path, webpFile, { upsert: true, contentType: 'image/webp' })
  if (error) { console.error('[uploadLogo]', error.message); return null }
  const { data } = supabase.storage.from('logos').getPublicUrl(path)
  return data.publicUrl
}

export async function uploadOrgBanner(file: File, orgId: string): Promise<string | null> {
  const supabase = getClient()
  const webpFile = await convertToWebP(file).catch(() => file)
  const path = `${orgId}/${Date.now()}.webp`
  const { error } = await supabase.storage
    .from('org-banners')
    .upload(path, webpFile, { upsert: true, contentType: 'image/webp' })
  if (error) { console.error('[uploadOrgBanner]', error.message); return null }
  const { data } = supabase.storage.from('org-banners').getPublicUrl(path)
  return data.publicUrl
}

export async function uploadOrgDocument(file: File, orgId: string): Promise<string | null> {
  const supabase = getClient()
  const path = `${orgId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${file.name.split('.').pop()}`
  const { error } = await supabase.storage
    .from('org-documents')
    .upload(path, file, { upsert: false })
  if (error) { console.error('[uploadOrgDocument]', error.message); return null }
  return path
}
