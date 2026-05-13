# app/(private)/(dashboard)/organizatie/[id]/_components/

Componente locale reutilizate în paginile panoului ONG.

## Fisiere

### OrgTabsClient.tsx
- **Scop:** Bare de tab-uri pentru navigarea între paginile ONG — Panou / Evenimente / Membri / Setari — cu stare activă bazată pe `usePathname`
- **Tip:** Client Component
- **Exporturi principale:** `OrgTabsClient`
- **Props:** `{ orgId: string }`
- **Apelează:** `usePathname`, `cn` din `lib/utils`
- **Note:** Tab-ul activ detectat cu `pathname === tab.href`; stilizare pill activ cu `bg-background shadow-sm`

## Patterns & Conventii
- Componenta e plasată în `_components/` la nivel de `[id]/` pentru că este partajată de mai multe sub-pagini ONG

## Dependente
- **Importa din:** `next/navigation`, `@/lib/utils`, `next/link`
- **Este importat de:** Paginile ONG (panou, evenimente, membri, setari) dacă e nevoie de navigatie tab
