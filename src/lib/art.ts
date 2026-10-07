// Ilustrações em SVG usadas como "fotos" dos dados de demonstração, para o protótipo
// funcionar sem internet e sem imagens de terceiros. Fotos reais do usuário são data URLs.

export type ArtKind =
  | 'araucaria' | 'ipe' | 'jacaranda' | 'figueira' | 'palmeira'
  | 'pinus' | 'eucalipto' | 'corticeira' | 'generic' | 'misterio'

type Sky = 'dia' | 'tarde' | 'noite' | 'nublado'
type Extra = 'none' | 'pessoa' | 'coracao' | 'macaco' | 'flores'

const SKIES: Record<Sky, [string, string]> = {
  dia: ['#bfe6ff', '#eef8ff'],
  tarde: ['#ffb37a', '#ffe7c2'],
  noite: ['#1b2a4a', '#3b4f7a'],
  nublado: ['#c9d1d6', '#eceff1'],
}

function canopy(kind: ArtKind): string {
  switch (kind) {
    case 'araucaria':
      return `<rect x="193" y="120" width="14" height="210" fill="#6b4a2f"/>
        ${[0, 1, 2, 3].map((i) => {
          const y = 120 + i * 18
          const w = 150 - i * 22
          return `<path d="M200 ${y} q${-w * 0.6} -6 ${-w} ${28 - i * 4}" stroke="#6b4a2f" stroke-width="5" fill="none"/>
            <path d="M200 ${y} q${w * 0.6} -6 ${w} ${28 - i * 4}" stroke="#6b4a2f" stroke-width="5" fill="none"/>
            <ellipse cx="${200 - w}" cy="${y + 20 - i * 4}" rx="34" ry="14" fill="#2f6b3a"/>
            <ellipse cx="${200 + w}" cy="${y + 20 - i * 4}" rx="34" ry="14" fill="#2f6b3a"/>`
        }).join('')}
        <ellipse cx="200" cy="98" rx="120" ry="34" fill="#2f6b3a"/>
        <ellipse cx="200" cy="88" rx="80" ry="22" fill="#3c8048"/>`
    case 'ipe':
    case 'jacaranda': {
      const [a, b] = kind === 'ipe' ? ['#f6c636', '#ffdf6b'] : ['#8b6fd6', '#b49af0']
      return `<path d="M192 330 L196 200 L170 150 M200 210 L232 150 M196 230 L150 190" stroke="#6b4a2f" stroke-width="12" fill="none" stroke-linecap="round"/>
        <circle cx="150" cy="150" r="58" fill="${a}"/><circle cx="250" cy="140" r="62" fill="${a}"/>
        <circle cx="200" cy="105" r="62" fill="${b}"/><circle cx="125" cy="185" r="38" fill="${b}"/>
        <circle cx="275" cy="185" r="36" fill="${a}"/>
        ${Array.from({ length: 14 }, (_, i) => `<circle cx="${110 + ((i * 37) % 190)}" cy="${300 + ((i * 13) % 30)}" r="4" fill="${a}"/>`).join('')}`
    }
    case 'figueira':
      return `<path d="M170 330 C180 260 175 230 150 200 M230 330 C220 260 225 230 250 200 M200 330 L200 180" stroke="#7a5a3c" stroke-width="18" fill="none" stroke-linecap="round"/>
        <ellipse cx="200" cy="150" rx="160" ry="85" fill="#2e7a3e"/>
        <ellipse cx="140" cy="130" rx="80" ry="55" fill="#3b8f4c"/><ellipse cx="260" cy="125" rx="85" ry="58" fill="#3b8f4c"/>
        <ellipse cx="200" cy="95" rx="80" ry="45" fill="#4aa35b"/>`
    case 'palmeira':
      return `<path d="M200 330 Q190 230 205 120" stroke="#8a6a46" stroke-width="16" fill="none"/>
        ${[-70, -35, 0, 35, 70, 110, -110].map((d) => `<path d="M205 120 q${Math.sin((d * Math.PI) / 180) * 70} ${-Math.cos((d * Math.PI) / 180) * 50} ${Math.sin((d * Math.PI) / 180) * 130} ${-Math.cos((d * Math.PI) / 180) * 20 + 40}" stroke="#3f8a3a" stroke-width="12" fill="none" stroke-linecap="round"/>`).join('')}
        <circle cx="205" cy="128" r="10" fill="#f0a030"/><circle cx="196" cy="134" r="8" fill="#f0a030"/>`
    case 'pinus':
      return `<rect x="193" y="150" width="14" height="180" fill="#5a3d26"/>
        <path d="M200 40 L130 140 L165 140 L110 220 L160 220 L95 300 L305 300 L240 220 L290 220 L235 140 L270 140 Z" fill="#245a35"/>`
    case 'eucalipto':
      return `<path d="M200 330 L203 90" stroke="#d8cfc0" stroke-width="16"/><path d="M203 180 L240 130 M202 220 L160 170" stroke="#d8cfc0" stroke-width="8"/>
        <ellipse cx="205" cy="95" rx="55" ry="60" fill="#7aa07a"/><ellipse cx="245" cy="135" rx="40" ry="35" fill="#8fb38c"/>
        <ellipse cx="160" cy="165" rx="38" ry="30" fill="#8fb38c"/>`
    case 'corticeira':
      return `<path d="M195 330 C190 260 210 220 190 180 M195 230 L250 170 M192 200 L140 160" stroke="#6b4a2f" stroke-width="14" fill="none" stroke-linecap="round"/>
        <circle cx="190" cy="140" r="65" fill="#4c8c48"/><circle cx="255" cy="160" r="45" fill="#4c8c48"/><circle cx="135" cy="160" r="42" fill="#5a9c55"/>
        ${Array.from({ length: 16 }, (_, i) => `<circle cx="${120 + ((i * 41) % 170)}" cy="${100 + ((i * 29) % 100)}" r="7" fill="#d83a2e"/>`).join('')}`
    case 'misterio':
      return `<path d="M200 330 C196 260 204 230 198 190" stroke="#6b4a2f" stroke-width="14" fill="none"/>
        <circle cx="200" cy="140" r="78" fill="#4b7f52"/><circle cx="150" cy="170" r="45" fill="#5a9061"/><circle cx="250" cy="170" r="45" fill="#5a9061"/>
        ${Array.from({ length: 12 }, (_, i) => `<circle cx="${135 + ((i * 47) % 135)}" cy="${95 + ((i * 31) % 110)}" r="6" fill="#e4a9e8"/>`).join('')}
        <text x="200" y="160" text-anchor="middle" font-family="sans-serif" font-size="60" font-weight="700" fill="#fff" opacity=".85">?</text>`
    default:
      return `<path d="M200 330 C196 260 204 230 198 190 M199 230 L240 190 M199 250 L160 210" stroke="#6b4a2f" stroke-width="14" fill="none" stroke-linecap="round"/>
        <circle cx="200" cy="140" r="78" fill="#3f8a4a"/><circle cx="145" cy="175" r="48" fill="#4f9a59"/><circle cx="255" cy="175" r="48" fill="#4f9a59"/>
        <circle cx="200" cy="105" r="48" fill="#5aab63"/>`
  }
}

function extra(e: Extra): string {
  switch (e) {
    case 'pessoa':
      return `<g transform="translate(262 230)"><circle cx="0" cy="0" r="16" fill="#ffd9b3" stroke="#333" stroke-width="3"/>
        <path d="M-17 -6 q17 -22 34 0" fill="#c0392b"/><path d="M-6 3 q6 6 12 0" stroke="#333" stroke-width="2.5" fill="none"/>
        <path d="M0 16 L0 62 M0 30 L-22 46 M0 30 L22 14 M0 62 L-14 92 M0 62 L14 92" stroke="#333" stroke-width="5" stroke-linecap="round"/></g>`
    case 'coracao':
      return `<path d="M200 262 c-14 -16 -34 -2 -20 16 l20 18 l20 -18 c14 -18 -6 -32 -20 -16z" fill="#e2445c" stroke="#7a1d2b" stroke-width="2"/>
        <text x="200" y="283" text-anchor="middle" font-family="sans-serif" font-size="11" font-weight="700" fill="#fff">O+S</text>`
    case 'macaco':
      return `<g transform="translate(250 168)"><circle r="14" fill="#5b3a22"/><circle cx="-5" cy="2" r="7" fill="#d9b48f"/><circle cx="5" cy="2" r="7" fill="#d9b48f"/>
        <circle cx="-5" cy="0" r="2" fill="#222"/><circle cx="5" cy="0" r="2" fill="#222"/><path d="M12 8 q22 10 10 40" stroke="#5b3a22" stroke-width="5" fill="none"/></g>`
    case 'flores':
      return Array.from({ length: 9 }, (_, i) => `<circle cx="${60 + i * 36}" cy="${348 + (i % 2) * 8}" r="7" fill="${i % 2 ? '#f7d04a' : '#f28fb0'}"/>`).join('')
    default:
      return ''
  }
}

export function artSvg(kind: ArtKind, sky: Sky = 'dia', ex: Extra = 'none'): string {
  const [s1, s2] = SKIES[sky]
  const celestial = sky === 'noite'
    ? '<circle cx="330" cy="60" r="22" fill="#f4f1d0"/><circle cx="340" cy="54" r="20" fill="#1b2a4a"/>'
    : sky === 'nublado'
      ? '<ellipse cx="90" cy="60" rx="50" ry="18" fill="#fff" opacity=".8"/><ellipse cx="300" cy="80" rx="60" ry="20" fill="#fff" opacity=".8"/>'
      : `<circle cx="330" cy="60" r="26" fill="${sky === 'tarde' ? '#ff8a3d' : '#ffe27a'}"/>`
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">
    <defs><linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${s1}"/><stop offset="1" stop-color="${s2}"/></linearGradient></defs>
    <rect width="400" height="400" fill="url(#s)"/>${celestial}
    <path d="M0 310 Q100 290 200 305 T400 300 V400 H0Z" fill="${sky === 'noite' ? '#2d4a2f' : '#7cbf6a'}"/>
    <path d="M0 340 Q120 325 220 338 T400 335 V400 H0Z" fill="${sky === 'noite' ? '#24402a' : '#68ad58'}"/>
    ${canopy(kind)}${extra(ex)}</svg>`
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg)
}

/** Fotos podem ser "art:tipo:céu:extra" (dados de demonstração) ou data URLs (fotos reais). */
export function photoSrc(p: string): string {
  if (p.startsWith('art:')) {
    const [, kind, sky, ex] = p.split(':')
    return artSvg(kind as ArtKind, (sky as Sky) || 'dia', (ex as Extra) || 'none')
  }
  return p
}
