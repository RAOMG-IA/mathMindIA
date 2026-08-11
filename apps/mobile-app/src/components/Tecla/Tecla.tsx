import { Text, TouchableOpacity } from 'react-native'
import { styles } from './Tecla.styles'

export type TeclaVariant = 'digit' | 'operator' | 'action'

interface TeclaProps {
  readonly label: string
  // Valor insertado al pulsar -- por defecto el propio label (p. ej. "7" inserta "7"), pero
  // teclas como Borrar necesitan un valor distinto del glifo mostrado (ver TECLADO_BACKSPACE
  // en Teclado.tsx).
  readonly value?: string
  readonly onPress: (value: string) => void
  readonly variant?: TeclaVariant
  readonly disabled?: boolean
  // Ancho relativo dentro de su fila (Teclado) -- p. ej. la tecla "0" suele ocupar el doble.
  readonly flex?: number
}

// Tecla individual de Teclado -- presentacional puro, reutilizable suelta si hiciera falta una
// unica tecla fuera de una cuadricula completa.
export function Tecla({ label, value, onPress, variant = 'digit', disabled = false, flex = 1 }: TeclaProps) {
  return (
    <TouchableOpacity
      style={[
        styles.key,
        variant === 'operator' && styles.keyOperator,
        variant === 'action' && styles.keyAction,
        disabled && styles.keyDisabled,
        { flex },
      ]}
      onPress={() => onPress(value ?? label)}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Text
        style={[styles.keyText, variant === 'operator' && styles.keyTextOperator, variant === 'action' && styles.keyTextAction]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  )
}
