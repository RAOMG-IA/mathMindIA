import { Text, TouchableOpacity, View } from 'react-native'
import { styles } from './RadioButton.styles'

interface RadioButtonProps {
  readonly selected: boolean
  readonly onPress: () => void
  readonly label: string
  readonly disabled?: boolean
}

// Radio button personalizado (circulo + punto, sin icon library nueva -- mismo criterio que
// Checkbox/AcademicLevelStars). Puramente presentacional (selected/onPress), sin logica de
// grupo -- quien lo use (p. ej. las 3 opciones de Modo Test) gestiona cual es "el elegido".
export function RadioButton({ selected, onPress, label, disabled = false }: RadioButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.row, selected && styles.rowSelected, disabled && styles.rowDisabled]}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="radio"
      accessibilityState={{ selected, disabled }}
    >
      <View style={[styles.circle, selected && styles.circleSelected]}>{selected ? <View style={styles.dot} /> : null}</View>
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  )
}
