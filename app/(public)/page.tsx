import type { Metadata } from 'next'
import { HeroSection } from './_components/HeroSection'

export const metadata: Metadata = {
  title: 'Acasă',
  description: 'CIVICOM — platforma civică unde găsești și creezi proteste, petiții, boicoturi și acțiuni comunitare din România.',
}

export default function HomePage() {
  return (
    <main>
      <HeroSection />
    </main>
  )
}
