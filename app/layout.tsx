import type { Metadata } from 'next'
import { Montserrat, Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import { TooltipProvider } from "@/components/ui/tooltip"
import { PostHogProvider } from '@/components/providers/PostHogProvider'

const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-montserrat',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://civicom.ro'),
  title: {
    default: 'CIVICOM — Implicare Civică',
    template: '%s | CIVICOM',
  },
  description: 'Platforma de implicare civică. Creează și participă la proteste, petiții, boicoturi și activități comunitare.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="ro"
      className={`${montserrat.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <PostHogProvider>
          <TooltipProvider>{children}</TooltipProvider>
        </PostHogProvider>
        <Analytics />
      </body>
    </html>
  )
}
