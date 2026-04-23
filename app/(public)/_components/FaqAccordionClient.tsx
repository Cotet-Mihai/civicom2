'use client'

import { useState } from 'react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

const FAQ_ITEMS = [
  {
    q: 'Ce este CIVICOM?',
    a: 'CIVICOM este platforma civică centralizată a României — un loc unde cetățenii, ONG-urile și instituțiile pot crea și participa la proteste, petiții, boicoturi, activități comunitare și evenimente caritabile.',
  },
  {
    q: 'Cine poate crea un eveniment?',
    a: 'Orice utilizator autentificat poate crea un eveniment. Evenimentele create de utilizatori individuali sau de ONG-uri sunt supuse unui proces de validare înainte de publicare.',
  },
  {
    q: 'Cum sunt validate evenimentele?',
    a: 'Fiecare eveniment creat trece printr-un proces de revizuire de către echipa de administrare CIVICOM. Evenimentele aprobate devin vizibile public; cele respinse pot fi contestate.',
  },
  {
    q: 'Pot participa fără cont?',
    a: 'Poți vizualiza toate evenimentele publice fără cont. Pentru a participa, a semna petiții sau a crea evenimente, ai nevoie de un cont CIVICOM.',
  },
  {
    q: 'Cum funcționează ONG-urile pe platformă?',
    a: 'Un utilizator poate solicita crearea unui profil de ONG. Cererea este analizată de echipa CIVICOM; după aprobare, ONG-ul poate crea evenimente și administra membri.',
  },
]

export function FaqAccordionClient() {
  const [expandedValues, setExpandedValues] = useState<string[]>([])

  return (
    <Accordion
      value={expandedValues}
      onValueChange={setExpandedValues}
      className="w-full"
    >
      {FAQ_ITEMS.map((item, i) => (
        <AccordionItem key={i} value={`item-${i}`}>
          <AccordionTrigger className="text-left font-semibold">
            {item.q}
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground">
            {item.a}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}
