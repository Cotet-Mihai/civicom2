'use client'

import { useEffect, useRef } from 'react'

type Props = {
  onIntersect: () => void
  hasMore: boolean
}

export function InfiniteScrollTrigger({ onIntersect, hasMore }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!hasMore) return
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) onIntersect()
      },
      { threshold: 0.1 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [onIntersect, hasMore])

  return <div ref={ref} className="h-10" aria-hidden />
}
