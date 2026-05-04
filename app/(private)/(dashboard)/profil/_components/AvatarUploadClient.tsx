'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, Camera } from 'lucide-react'
import { createBrowserClient } from '@supabase/ssr'
import { updateAvatar } from '@/services/user.service'

type Props = {
  currentAvatarUrl: string | null
  name: string
  userId: string
}

const MAX_SIZE_BYTES = 2 * 1024 * 1024 // 2MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

export function AvatarUploadClient({ currentAvatarUrl, name, userId }: Props) {
  const [preview, setPreview] = useState<string | null>(currentAvatarUrl)
  const [isLoading, setIsLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const initials = name
    .split(' ')
    .filter(w => w.length > 0)
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > MAX_SIZE_BYTES) {
      toast.error('Fișierul trebuie să fie mai mic de 2MB')
      return
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error('Tip neacceptat. Sunt permise: JPG, PNG, WebP, GIF')
      return
    }

    if (preview && preview.startsWith('blob:')) {
      URL.revokeObjectURL(preview)
    }
    const localPreview = URL.createObjectURL(file)
    setPreview(localPreview)
    setIsLoading(true)

    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      const ext = file.name.split('.').pop() ?? 'jpg'
      const path = `${userId}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data } = supabase.storage.from('avatars').getPublicUrl(path)
      const result = await updateAvatar(data.publicUrl)
      if ('error' in result) throw new Error(result.error)

      toast.success('Avatar actualizat')
      router.refresh()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Eroare la upload'
      toast.error(message)
      setPreview(currentAvatarUrl)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={isLoading}
        className="relative size-24 rounded-full overflow-hidden border-2 border-primary/20 bg-primary/10 group cursor-pointer disabled:opacity-50"
      >
        {preview ? (
          <Image src={preview} alt="Avatar" fill className="object-cover" unoptimized />
        ) : (
          <span className="flex items-center justify-center w-full h-full font-black text-2xl text-primary">
            {initials}
          </span>
        )}
        <div className="absolute inset-0 bg-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          {isLoading
            ? <Loader2 size={20} className="text-white animate-spin" />
            : <Camera size={20} className="text-white" />
          }
        </div>
      </button>
      <p className="text-xs text-muted-foreground">Click pe imagine pentru a schimba (max 2MB)</p>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  )
}
