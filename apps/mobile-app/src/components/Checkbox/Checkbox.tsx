import { Text, TouchableOpacity, View } from 'react-native'
import { styles } from './Checkbox.styles'

interface CheckboxProps {
  readonly checked: boolean
  readonly onChange: (checked: boolean) => void
  readonly label?: string
  readonly disabled?: boolean
}

// Checkbox personalizado (glifo Unicode "✓", sin icon library nueva -- mismo criterio que las
// estrellas de AcademicLevelStars y el "ojo" de PasswordInput). Puramente presentacional
// (checked/onChange), reutilizado por Combobox en modo multi-select (filas + "seleccionar
// todos") pero sin depender de Combobox -- utilizable suelto en cualquier otro formulario.
export function Checkbox({ checked, onChange, label, disabled = false }: CheckboxProps) {
  return (
    <TouchableOpacity
      style={styles.row}
      onPress={() => !disabled && onChange(!checked)}
      accessibilityRole="checkbox"
      accessibilityState={{ checked, disabled }}
      disabled={disabled}
    >
      <View style={[styles.box, checked && styles.boxChecked, disabled && styles.boxDisabled]}>
        {checked ? <Text style={styles.check}>✓</Text> : null}
      </View>
      {label ? <Text style={styles.label}>{label}</Text> : null}
    </TouchableOpacity>
  )
}
