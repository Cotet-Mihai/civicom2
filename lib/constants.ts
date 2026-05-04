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

export const ORG_CATEGORY_BADGE_CLASSES: Record<string, string> = {
  educatie: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100',
  mediu:    'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100',
  sanatate: 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100',
  social:   'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100',
  animale:  'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100',
  cultura:  'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100',
}

export const ORG_CATEGORIES = Object.keys(ORG_CATEGORY_LABELS) as string[]

export const ORG_TYPE_LABELS: Record<string, string> = {
  asociatie: 'Asociație',
  fundatie: 'Fundație',
  federatie: 'Federație',
  cooperativa: 'Cooperativă',
}

export const ORG_DOC_TYPE_LABELS: Record<string, string> = {
  certificat_inregistrare: 'Certificat de înregistrare',
  statut: 'Statutul organizației',
  act_constitutiv: 'Act constitutiv',
  dovada_sediu: 'Dovada sediului',
}
