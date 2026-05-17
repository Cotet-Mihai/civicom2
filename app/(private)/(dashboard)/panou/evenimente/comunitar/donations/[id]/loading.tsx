import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div className="px-4 lg:px-8 py-8 pb-16 space-y-10">
      <div className="space-y-3 border-b border-border/50 pb-6">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-10 w-3/4" />
        <div className="flex gap-2"><Skeleton className="h-5 w-20 rounded-full" /><Skeleton className="h-5 w-24 rounded-full" /></div>
      </div>
      <Skeleton className="h-32 w-full rounded-2xl" />
      <Skeleton className="h-36 w-full rounded-2xl" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-52 rounded-2xl" />)}
      </div>
      <Skeleton className="h-64 w-full rounded-2xl" />
      <Skeleton className="h-72 w-full rounded-2xl" />
      <Skeleton className="h-96 w-full rounded-2xl" />
    </div>
  )
}
