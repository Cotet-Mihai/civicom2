import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div className="mx-auto max-w-2xl px-4 lg:px-8 py-8 space-y-6">
      <Skeleton className="h-52 rounded-xl" />
      <Skeleton className="h-44 rounded-xl" />
    </div>
  )
}
