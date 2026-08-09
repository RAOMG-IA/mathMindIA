import { useState } from 'react'
import { KeyboardAvoidingView, Platform, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useLogin } from '../api'
import { BackgroundGrid, NeuralLoader } from '../components'
import { styles } from './LoginScreen.styles'
import type { LoginFormErrors } from './LoginScreen.validation'
import { validateLoginForm } from './LoginScreen.validation'

// Estetica calcada del NeuralLoader (ADR-015: "usando como base el diseno generado para el
// loader") -- mismo fondo/paleta (BackgroundGrid + COLORS), y el propio NeuralLoader se
// reutiliza tal cual como estado de carga real mientras useLogin esta pendiente, no solo como
// referencia visual.
export function LoginScreen() {
  const router = useRouter()
  const login = useLogin()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<LoginFormErrors>({})

  function handleSubmit() {
    const errors = validateLoginForm(email, password)
    setFieldErrors(errors)
    if (errors.email || errors.password) {
      return
    }

    login.mutate(
      { email, password },
      {
        onSuccess: () => {
          // (app)/home todavia no existe (pendiente ADR-015) -- Expo Router muestra su
          // pantalla "Unmatched Route" hasta entonces, sin romper la navegacion real.
          router.replace('/(app)/home')
        },
      },
    )
  }

  if (login.isPending) {
    return <NeuralLoader />
  }

  return (
    <View style={styles.container}>
      <BackgroundGrid />
      <KeyboardAvoidingView
        style={styles.formWrapper}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Text style={styles.title}>MathMind AI</Text>
        <Text style={styles.subtitle}>Inicia sesión para continuar</Text>

        <View style={styles.field}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={[styles.input, fieldErrors.email ? styles.inputError : null]}
            value={email}
            onChangeText={setEmail}
            placeholder="tu@email.com"
            placeholderTextColor="rgba(255,255,255,0.3)"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            accessibilityLabel="Email"
          />
          {fieldErrors.email ? <Text style={styles.errorText}>{fieldErrors.email}</Text> : null}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Contraseña</Text>
          <TextInput
            style={[styles.input, fieldErrors.password ? styles.inputError : null]}
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor="rgba(255,255,255,0.3)"
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            accessibilityLabel="Contraseña"
          />
          {fieldErrors.password ? <Text style={styles.errorText}>{fieldErrors.password}</Text> : null}
        </View>

        {login.isError ? (
          <View style={styles.serverErrorBanner}>
            <Text style={styles.serverErrorText}>{login.error.message}</Text>
          </View>
        ) : null}

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} accessibilityRole="button">
          <Text style={styles.submitText}>Entrar</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </View>
  )
}
