// Coordenadas obtidas do OpenStreetMap (relação 4292326 – UFRGS Campus do Vale).
export const CAMPUS_CENTER: [number, number] = [-30.0712, -51.1200]

/** Ponto onde a posição simulada começa: saída do Terminal de ônibus do Campus do Vale. */
export const SIMULATED_START: [number, number] = [-30.0706, -51.1186]

export const CAMPUS_OUTLINE: [number, number][] = [
  [-30.06906, -51.14321], [-30.07357, -51.13725], [-30.07578, -51.13265], [-30.07678, -51.1283],
  [-30.07661, -51.12319], [-30.08007, -51.11245], [-30.07806, -51.1091], [-30.07385, -51.11342],
  [-30.07348, -51.11644], [-30.07288, -51.11707], [-30.06796, -51.11802], [-30.06671, -51.12012],
  [-30.06533, -51.12062], [-30.06728, -51.12478], [-30.07059, -51.12698], [-30.07206, -51.12679],
  [-30.07367, -51.12445], [-30.07423, -51.12483], [-30.07339, -51.13195], [-30.07182, -51.13649],
  [-30.06865, -51.14218], [-30.06842, -51.14288],
]

export const LANDMARKS = [
  { name: 'Terminal de ônibus', pos: [-30.07078, -51.11818] as [number, number] },
  { name: 'RU3', pos: [-30.07176, -51.12075] as [number, number] },
  { name: 'RU6', pos: [-30.0672, -51.12073] as [number, number] },
  { name: 'Informática', pos: [-30.06863, -51.12024] as [number, number] },
  { name: 'Biociências', pos: [-30.06799, -51.1202] as [number, number] },
]
