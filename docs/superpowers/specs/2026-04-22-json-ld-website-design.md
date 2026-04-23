# JSON-LD WebSite + Sitelinks Searchbox — Design Spec

**Data:** 2026-04-22  
**Etapă:** 3 — Homepage  
**Fișier modificat:** `app/(public)/page.tsx`

## Ce se adaugă

Un singur bloc `<script type="application/ld+json">` inline în Server Component-ul homepage-ului, cu schema `WebSite` de la schema.org.

## Schema

```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "url": "https://civicom.ro",
  "name": "CIVICOM",
  "description": "Platforma de implicare civică. Creează și participă la proteste, petiții, boicoturi și activități comunitare.",
  "potentialAction": {
    "@type": "SearchAction",
    "target": {
      "@type": "EntryPoint",
      "urlTemplate": "https://civicom.ro/evenimente?cauta={search_term_string}"
    },
    "query-input": "required name=search_term_string"
  }
}
```

## Decizii

- **Parametru search:** `cauta=` (română, consistent cu brandul)
- **Locație:** inline în `page.tsx` ca fragment `<>` — nu componentă separată (prea simplu)
- **Nu** se pune în `layout.tsx` — JSON-LD WebSite aparține strict homepage-ului

## Note implementare

- `metadataBase` e deja `https://civicom.ro` în root `layout.tsx` — URL-urile sunt consistente
- Etapa 4 trebuie să implementeze filtrul `?cauta=` pe `/evenimente`
