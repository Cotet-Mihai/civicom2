import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Acasă',
}

export default function HomePage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <p className="text-muted-foreground">Homepage — în curând (Etapa 4)</p>
    </div>
  )
}
