import { useState } from 'react'
import { Pressable, Text, TextInput, View } from 'react-native'
import { styles } from './styles'

export interface PasswordInputProps {
  readonly value: string
  readonly onChangeText: (value: string) => void
  readonly error?: string
}

// El "ojo" revela la contrasena mientras dura el evento, no al pulsar una vez para alternar --
// onHoverIn/onHoverOut cubren el raton en web (sin esos eventos en tactil), onPressIn/onPressOut
// cubren mantener pulsado en tactil (y tambien funcionan como mousedown/mouseup en web). Soltar
// u ocultar el raton vuelve a ocultar la contrasena.
export function PasswordInput({ value, onChangeText, error }: PasswordInputProps) {
  const [visible, setVisible] = useState(false)

  return (
    <View style={styles.field}>
      <Text style={styles.label}>Contraseña</Text>
      <View style={styles.passwordRow}>
        <TextInput
          style={[styles.input, styles.passwordInput, error ? styles.inputError : null]}
          value={value}
          onChangeText={onChangeText}
          placeholder="••••••••"
          placeholderTextColor="rgba(255,255,255,0.3)"
          secureTextEntry={!visible}
          autoCapitalize="none"
          autoCorrect={false}
          accessibilityLabel="Contraseña"
        />
        <Pressable
          style={styles.eyeButton}
          onHoverIn={() => setVisible(true)}
          onHoverOut={() => setVisible(false)}
          onPressIn={() => setVisible(true)}
          onPressOut={() => setVisible(false)}
          accessibilityRole="button"
          accessibilityLabel="Mantener pulsado para ver la contraseña"
        >
          <Text style={styles.eyeIcon}>{visible ? '🙈' : '👁️'}</Text>
        </Pressable>
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  )
}
