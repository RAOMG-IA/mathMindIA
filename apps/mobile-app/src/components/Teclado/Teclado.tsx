import { Text, TouchableOpacity, View } from 'react-native'
import type { TeclaVariant } from '../Tecla'
import { Tecla } from '../Tecla'
import { styles } from './Teclado.styles'

export type TecladoMode = 'basica' | 'cientifica'

// Sentinel distinto de cualquier glifo real -- quien consuma onKeyPress compara contra esta
// constante para saber que debe borrar el ultimo caracter en vez de insertar texto.
export const TECLADO_BACKSPACE = '__BACKSPACE__'

interface TeclaSpec {
  readonly label: string
  readonly value?: string
  readonly variant?: TeclaVariant
  readonly flex?: number
}

// Modo basica (US-004/US-005, input de Modo Resolucion): digitos, operadores +-*/, punto
// decimal y parentesis -- ver alcance pedido. Borrar añadido como necesidad practica minima
// (sin ella el teclado no permite corregir un error de tecleo), no es parte del alcance pedido
// pero es la unica adicion.
const BASIC_ROWS: readonly (readonly TeclaSpec[])[] = [
  [
    { label: '(', variant: 'operator' },
    { label: ')', variant: 'operator' },
    { label: '⌫', value: TECLADO_BACKSPACE, variant: 'action' },
  ],
  [{ label: '7' }, { label: '8' }, { label: '9' }, { label: '/', variant: 'operator' }],
  [{ label: '4' }, { label: '5' }, { label: '6' }, { label: '*', variant: 'operator' }],
  [{ label: '1' }, { label: '2' }, { label: '3' }, { label: '-', variant: 'operator' }],
  [{ label: '0', flex: 2 }, { label: '.' }, { label: '+', variant: 'operator' }],
]

// Modo cientifica: superset del basico (mismas teclas + funciones), como en una calculadora
// cientifica real -- no un layout completamente distinto. Conjunto de funciones acotado a lo
// relevante para el catalogo de Temas (ADR-006: potencias-raices, trigonometria, calc.*),
// judgment call documentado, no exhaustivo.
const SCIENTIFIC_EXTRA_ROWS: readonly (readonly TeclaSpec[])[] = [
  [
    { label: 'sin', value: 'sin(', variant: 'operator' },
    { label: 'cos', value: 'cos(', variant: 'operator' },
    { label: 'tan', value: 'tan(', variant: 'operator' },
    { label: 'log', value: 'log(', variant: 'operator' },
  ],
  [
    { label: '√', value: '√(', variant: 'operator' },
    { label: 'xʸ', value: '^', variant: 'operator' },
    { label: 'π', variant: 'operator' },
    { label: '%', variant: 'operator' },
  ],
]

interface TecladoProps {
  readonly mode: TecladoMode
  readonly onModeChange: (mode: TecladoMode) => void
  readonly onKeyPress: (value: string) => void
  readonly disabled?: boolean
}

// Teclado matematico propio (Modo Resolucion) -- atributo `mode` controla que juego de teclas
// se muestra, con un conmutador propio dentro del componente (llama a onModeChange) ademas de
// ser controlable desde fuera, mismo patron de componente controlado que Combobox.
export function Teclado({ mode, onModeChange, onKeyPress, disabled = false }: TecladoProps) {
  const rows = mode === 'cientifica' ? [...SCIENTIFIC_EXTRA_ROWS, ...BASIC_ROWS] : BASIC_ROWS

  return (
    <View style={styles.container}>
      <View style={styles.modeSwitchRow}>
        <TouchableOpacity
          style={[styles.modeButton, mode === 'basica' && styles.modeButtonActive]}
          onPress={() => onModeChange('basica')}
          disabled={disabled}
          accessibilityRole="button"
          accessibilityState={{ selected: mode === 'basica' }}
        >
          <Text style={[styles.modeButtonText, mode === 'basica' && styles.modeButtonTextActive]}>Básica</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeButton, mode === 'cientifica' && styles.modeButtonActive]}
          onPress={() => onModeChange('cientifica')}
          disabled={disabled}
          accessibilityRole="button"
          accessibilityState={{ selected: mode === 'cientifica' }}
        >
          <Text style={[styles.modeButtonText, mode === 'cientifica' && styles.modeButtonTextActive]}>Científica</Text>
        </TouchableOpacity>
      </View>

      {rows.map((row) => (
        <View key={row.map((key) => key.label).join('')} style={styles.row}>
          {row.map((key) => (
            <Tecla
              key={key.label}
              label={key.label}
              value={key.value}
              variant={key.variant}
              flex={key.flex}
              disabled={disabled}
              onPress={onKeyPress}
            />
          ))}
        </View>
      ))}
    </View>
  )
}
