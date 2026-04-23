import { FaqAccordionClient } from './FaqAccordionClient'

export function FaqSection() {
  return (
    <section className="bg-muted/50 py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="mx-auto max-w-2xl">
          <h2 className="mb-8 text-center font-heading text-2xl font-black uppercase tracking-tight text-foreground lg:text-4xl">
            Întrebări frecvente
          </h2>
          <FaqAccordionClient />
        </div>
      </div>
    </section>
  )
}
