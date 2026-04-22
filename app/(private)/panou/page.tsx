import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Panou',
}

export default function PanouPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <p className="text-muted-foreground">Panou utilizator — în curând (Etapa 9)</p>
    </div>
  )
}
