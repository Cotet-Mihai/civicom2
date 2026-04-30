export const CATEGORY_LABELS: Record<string, string> = {
  protest: 'Protest',
  boycott: 'Boycott',
  petition: 'Petiție',
  community: 'Comunitar',
  charity: 'Caritabil',
}

export const CATEGORY_ROUTES: Record<string, string> = {
  protest: 'protest',
  boycott: 'boycott',
  petition: 'petitie',
  community: 'comunitar',
  charity: 'caritabil',
}

export const ORG_CATEGORY_LABELS: Record<string, string> = {
  educatie: 'Educație',
  mediu: 'Mediu',
  sanatate: 'Sănătate',
  social: 'Social',
  animale: 'Animale',
  cultura: 'Cultură',
}

export const ORG_CATEGORIES = Object.keys(ORG_CATEGORY_LABELS) as string[]
