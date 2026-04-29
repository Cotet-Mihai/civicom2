// app/robots.ts
import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/evenimente', '/organizatii'],
        disallow: ['/panou', '/profil', '/creeaza', '/organizatie', '/admin', '/autentificare', '/inregistrare', '/reseteaza-parola'],
      },
    ],
    sitemap: 'https://civicom.ro/sitemap.xml',
  }
}
