import { Text, TouchableOpacity, View } from 'react-native'
import type { RegisterRequestDto } from '@mathmind/shared-types'
import { styles } from './AcademicLevelStars.styles'

// Derivado de RegisterRequestDto (import type, se borra al compilar) -- mismo criterio que
// RegisterScreen.validation.ts, sin depender de @mathmind/shared-domain.
export type AcademicLevel = RegisterRequestDto['academicLevel']

// Orden ascendente deliberado -- selector acumulativo (marcar la estrella N marca tambien la
// 1..N-1): un nivel superior siempre incluye los anteriores ("un ingeniero no puede ser sin
// tener primaria"), no son 4 opciones independientes.
const LEVELS: ReadonlyArray<{ value: AcademicLevel; label: string }> = [
  { value: 'Primaria', label: 'Primaria' },
  { value: 'Secundaria', label: 'Secundaria' },
  { value: 'Bachillerato', label: 'Bachillerato' },
  { value: 'Ingenieria', label: 'Ingeniería' },
]

const STAR_FILLED = '★'
const STAR_EMPTY = '☆'

interface AcademicLevelStarsProps {
  readonly value: AcademicLevel | null
  readonly onChange: (level: AcademicLevel) => void
  readonly label?: string
  readonly error?: string
}

// Extraido de RegisterScreen (US-001) al convertirse en el segundo consumidor (HomeScreen,
// US-003) -- mismo criterio de extraccion ya aplicado a EmailInput/PasswordInput: presentacional
// puro (value/onChange/error), sin logica de validacion propia.
export function AcademicLevelStars({ value, onChange, label = 'Nivel de complejidad', error }: AcademicLevelStarsProps) {
  const selectedIndex = value ? LEVELS.findIndex((level) => level.value === value) : -1
  const selectedLabel = selectedIndex >= 0 ? LEVELS[selectedIndex].label : null

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.starRow}>
        {LEVELS.map((level, index) => (
          <TouchableOpacity
            key={level.value}
            style={styles.star}
            onPress={() => onChange(level.value)}
            accessibilityRole="button"
            accessibilityLabel={`${label}: ${level.label}`}
            accessibilityState={{ selected: index <= selectedIndex }}
          >
            <Text style={index <= selectedIndex ? styles.starTextFilled : styles.starTextEmpty}>
              {index <= selectedIndex ? STAR_FILLED : STAR_EMPTY}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {selectedLabel ? <Text style={styles.levelSelectedLabel}>{selectedLabel}</Text> : null}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  )
}
