import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div className="px-4 lg:px-8 py-8 space-y-6">
      <Skeleton className="h-8 w-36" />
      <Skeleton className="h-96 rounded-xl" />
    </div>
  )
}
