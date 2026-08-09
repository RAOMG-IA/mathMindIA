// Paleta y datos de posicionamiento, calcados 1:1 del prototipo HTML ya validado con el
// usuario (ver docs/ADR/ADR-015_mobile_app_screens.md). Coordenadas en fraccion (0-1) del
// tamano del stage, equivalentes a los left/top en % del CSS original.
export const COLORS = {
  background: '#0a0e17',
  ice: '#4cc9f0',
  violet: '#a855f7',
  pink: '#f72585',
  amber: '#ffd60a',
  coral: '#ff6b6b',
  grid: 'rgba(76, 201, 240, 0.04)',
} as const

export interface ActivityZoneSpec {
  readonly id: string
  readonly x: number
  readonly y: number
  readonly color: string
  readonly delayMs: number
}

// Delays -- ADR: 0s, 0.8s, 1.6s, 2.4s, 0.4s (frontal, temporal, parietal, cerebelo, occipital).
export const ACTIVITY_ZONES: readonly ActivityZoneSpec[] = [
  { id: 'frontal', x: 0.68, y: 0.24, color: COLORS.pink, delayMs: 0 },
  { id: 'temporal', x: 0.63, y: 0.43, color: COLORS.amber, delayMs: 800 },
  { id: 'parietal', x: 0.49, y: 0.15, color: COLORS.ice, delayMs: 1600 },
  { id: 'cerebellum', x: 0.36, y: 0.48, color: COLORS.violet, delayMs: 2400 },
  { id: 'occipital', x: 0.32, y: 0.26, color: COLORS.coral, delayMs: 400 },
]

export type SymbolDirection = 'up' | 'down'

export interface EmergingSymbolSpec {
  readonly id: string
  readonly symbol: string
  readonly x: number
  readonly y: number
  readonly color: string
  readonly direction: SymbolDirection
  readonly delayMs: number
}

// Un simbolo por zona de origen, color = color de esa zona; direccion arriba/izquierda para
// zonas superiores (frontal, parietal), abajo/derecha para el resto -- tal como especifica el
// diseno original ("dos direcciones", no una por zona).
export const EMERGING_SYMBOLS: readonly EmergingSymbolSpec[] = [
  { id: 'integral', symbol: '∫', x: 0.68, y: 0.24, color: COLORS.pink, direction: 'up', delayMs: 0 },
  { id: 'sum', symbol: '∑', x: 0.68, y: 0.24, color: COLORS.pink, direction: 'up', delayMs: 1200 },
  { id: 'sqrt', symbol: '√', x: 0.49, y: 0.15, color: COLORS.ice, direction: 'up', delayMs: 600 },
  { id: 'approx', symbol: '≈', x: 0.49, y: 0.15, color: COLORS.ice, direction: 'up', delayMs: 1800 },
  { id: 'pi', symbol: 'π', x: 0.63, y: 0.43, color: COLORS.amber, direction: 'down', delayMs: 900 },
  { id: 'partial', symbol: '∂', x: 0.32, y: 0.26, color: COLORS.coral, direction: 'down', delayMs: 2100 },
  { id: 'infinity', symbol: '∞', x: 0.36, y: 0.48, color: COLORS.violet, direction: 'down', delayMs: 2700 },
  { id: 'delta', symbol: 'Δ', x: 0.36, y: 0.48, color: COLORS.violet, direction: 'down', delayMs: 3300 },
]

export interface ScanRingSpec {
  readonly id: string
  readonly color: string
  readonly delayMs: number
}

// Delays -- ADR: 0s, 1.5s, 3s, 0.8s (ice, pink, amber, violet).
export const SCAN_RINGS: readonly ScanRingSpec[] = [
  { id: 'ring-ice', color: COLORS.ice, delayMs: 0 },
  { id: 'ring-pink', color: COLORS.pink, delayMs: 1500 },
  { id: 'ring-amber', color: COLORS.amber, delayMs: 3000 },
  { id: 'ring-violet', color: COLORS.violet, delayMs: 800 },
]

// Centro del cerebro (para los anillos) -- centroide de la bounding box real, ver
// anatomyPaths.ts.
export const RING_CENTER = { x: 0.53, y: 0.34 } as const

export const GREEK_LETTERS: readonly string[] = [
  'α', 'β', 'γ', 'δ', 'λ', 'μ', 'θ', 'φ',
  'ψ', 'ω', 'ξ', 'η', 'κ', 'ν', 'ρ', 'σ', 'τ', 'χ',
]
