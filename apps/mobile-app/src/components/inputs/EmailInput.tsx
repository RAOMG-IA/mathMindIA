import { Text, TextInput, View } from 'react-native'
import { styles } from './styles'

export interface EmailInputProps {
  readonly value: string
  readonly onChangeText: (value: string) => void
  // Error a mostrar -- lo decide quien usa el componente, no el propio input. En
  // RegisterScreen puede ser tanto un error de formato como "ese email ya esta en uso"
  // (RegisterUseCase, al enviar); en LoginScreen nunca se le pasa ese segundo tipo de error --
  // el AC de US-002 exige que el fallo de credenciales sea generico, sin atribuirlo a un campo
  // concreto (evita revelar si un email esta registrado, ver ADR-012). El componente no sabe
  // ni le importa la diferencia, solo pinta lo que le llega.
  readonly error?: string
}

export function EmailInput({ value, onChangeText, error }: EmailInputProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>Email</Text>
      <TextInput
        style={[styles.input, error ? styles.inputError : null]}
        value={value}
        onChangeText={onChangeText}
        placeholder="tu@email.com"
        placeholderTextColor="rgba(255,255,255,0.3)"
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        accessibilityLabel="Email"
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  )
}
