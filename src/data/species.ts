import type { ArtKind } from '../lib/art'

export interface Species {
  popular: string
  scientific: string
  family: string
  origin: 'nativa' | 'exótica' | 'exótica invasora'
  art: ArtKind
}

/** Catálogo local usado para autocompletar nome popular → nome científico/família. */
export const SPECIES: Species[] = [
  { popular: 'Araucária / Pinheiro-brasileiro', scientific: 'Araucaria angustifolia', family: 'Araucariaceae', origin: 'nativa', art: 'araucaria' },
  { popular: 'Ipê-amarelo', scientific: 'Handroanthus albus', family: 'Bignoniaceae', origin: 'nativa', art: 'ipe' },
  { popular: 'Ipê-roxo', scientific: 'Handroanthus heptaphyllus', family: 'Bignoniaceae', origin: 'nativa', art: 'jacaranda' },
  { popular: 'Jacarandá-mimoso', scientific: 'Jacaranda mimosifolia', family: 'Bignoniaceae', origin: 'exótica', art: 'jacaranda' },
  { popular: 'Figueira-de-folha-miúda', scientific: 'Ficus cestrifolia', family: 'Moraceae', origin: 'nativa', art: 'figueira' },
  { popular: 'Pitangueira', scientific: 'Eugenia uniflora', family: 'Myrtaceae', origin: 'nativa', art: 'generic' },
  { popular: 'Butiá', scientific: 'Butia odorata', family: 'Arecaceae', origin: 'nativa', art: 'palmeira' },
  { popular: 'Jerivá', scientific: 'Syagrus romanzoffiana', family: 'Arecaceae', origin: 'nativa', art: 'palmeira' },
  { popular: 'Canela-preta', scientific: 'Nectandra megapotamica', family: 'Lauraceae', origin: 'nativa', art: 'generic' },
  { popular: 'Corticeira-do-banhado', scientific: 'Erythrina crista-galli', family: 'Fabaceae', origin: 'nativa', art: 'corticeira' },
  { popular: 'Timbaúva', scientific: 'Enterolobium contortisiliquum', family: 'Fabaceae', origin: 'nativa', art: 'figueira' },
  { popular: 'Aroeira-vermelha', scientific: 'Schinus terebinthifolia', family: 'Anacardiaceae', origin: 'nativa', art: 'generic' },
  { popular: 'Guabiroba', scientific: 'Campomanesia xanthocarpa', family: 'Myrtaceae', origin: 'nativa', art: 'generic' },
  { popular: 'Cedro', scientific: 'Cedrela fissilis', family: 'Meliaceae', origin: 'nativa', art: 'generic' },
  { popular: 'Uva-do-japão', scientific: 'Hovenia dulcis', family: 'Rhamnaceae', origin: 'exótica invasora', art: 'generic' },
  { popular: 'Pinus', scientific: 'Pinus elliottii', family: 'Pinaceae', origin: 'exótica invasora', art: 'pinus' },
  { popular: 'Eucalipto', scientific: 'Eucalyptus grandis', family: 'Myrtaceae', origin: 'exótica', art: 'eucalipto' },
  { popular: 'Ligustro / Alfeneiro', scientific: 'Ligustrum lucidum', family: 'Oleaceae', origin: 'exótica invasora', art: 'generic' },
  { popular: 'Amarelinho', scientific: 'Tecoma stans', family: 'Bignoniaceae', origin: 'exótica invasora', art: 'ipe' },
]

function norm(s: string) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

export function searchSpecies(q: string): Species[] {
  const n = norm(q.trim())
  if (n.length < 2) return []
  return SPECIES.filter((s) => norm(s.popular).includes(n) || norm(s.scientific).includes(n)).slice(0, 5)
}

export function findSpecies(scientific: string): Species | undefined {
  const n = norm(scientific.trim())
  return SPECIES.find((s) => norm(s.scientific) === n)
}

/** Fontes abertas sugeridas para citação. */
export function suggestedSources(scientific: string) {
  const q = encodeURIComponent(scientific.trim())
  return [
    { label: 'GBIF', url: `https://www.gbif.org/species/search?q=${q}` },
    { label: 'Flora e Funga do Brasil', url: 'https://floradobrasil.jbrj.gov.br/' },
  ]
}
