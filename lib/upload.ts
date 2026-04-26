import { createBrowserClient } from '@supabase/ssr'

function getClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export async function uploadBanner(file: File, userId: string): Promise<string | null> {
  const supabase = getClient()
  const ext = file.name.split('.').pop()
  const path = `${userId}/${Date.now()}.${ext}`
  const { error } = await supabase.storage.from('banners').upload(path, file, { upsert: true })
  if (error) { console.error('[uploadBanner]', error.message); return null }
  const { data } = supabase.storage.from('banners').getPublicUrl(path)
  return data.publicUrl
}

export async function uploadGalleryImages(files: File[], userId: string): Promise<string[]> {
  const supabase = getClient()
  const urls: string[] = []
  for (const file of files) {
    const ext = file.name.split('.').pop()
    const path = `${userId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
    const { error } = await supabase.storage.from('gallery').upload(path, file, { upsert: true })
    if (error) { console.error('[uploadGallery]', error.message); continue }
    const { data } = supabase.storage.from('gallery').getPublicUrl(path)
    urls.push(data.publicUrl)
  }
  return urls
}
