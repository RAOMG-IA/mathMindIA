import { useState } from 'react'
import { KeyboardAvoidingView, Platform, Text, TouchableOpacity, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useGuestLogin, useLogin } from '../api'
import { BackgroundGrid, EmailInput, NeuralLoader, ParticleField, PasswordInput } from '../components'
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
  const guestLogin = useGuestLogin()
  const insets = useSafeAreaInsets()

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
          router.replace('/(app)/home')
        },
      },
    )
  }

  function handleGoToRegister() {
    router.push('/(auth)/register')
  }

  // US-009: acceso de un clic, sin formulario -- pensado para que los tutores del TFM puedan
  // evaluar la app sin registrarse. El servidor genera email/password/nivel (GuestLoginUseCase);
  // este handler no manda nada, solo dispara la mutation.
  function handleGuestLogin() {
    guestLogin.mutate(undefined, {
      onSuccess: () => {
        router.replace('/(app)/home')
      },
    })
  }

  if (login.isPending || guestLogin.isPending) {
    return <NeuralLoader />
  }

  return (
    <View style={styles.container}>
      <BackgroundGrid />
      <ParticleField />

      <TouchableOpacity
        style={[styles.registerButton, { top: insets.top + 12 }]}
        onPress={handleGoToRegister}
        accessibilityRole="button"
      >
        <Text style={styles.registerButtonText}>Registrarse</Text>
      </TouchableOpacity>

      <KeyboardAvoidingView
        style={styles.formWrapper}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Text style={styles.title}>MathMind AI</Text>
        <Text style={styles.subtitle}>Inicia sesión para continuar</Text>

        <View style={styles.card}>
          <EmailInput value={email} onChangeText={setEmail} error={fieldErrors.email} />

          <PasswordInput value={password} onChangeText={setPassword} error={fieldErrors.password} />

          {login.isError ? (
            <View style={styles.serverErrorBanner}>
              <Text style={styles.serverErrorText}>{login.error.message}</Text>
            </View>
          ) : null}

          {guestLogin.isError ? (
            <View style={styles.serverErrorBanner}>
              <Text style={styles.serverErrorText}>{guestLogin.error.message}</Text>
            </View>
          ) : null}

          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} accessibilityRole="button">
            <Text style={styles.submitText}>Entrar</Text>
          </TouchableOpacity>

          {/* US-009: acceso de un clic sin registro, pensado para que los tutores del TFM
              evaluen la app sin friccion -- crea una cuenta "Publico<numero>" real en el
              servidor (GuestLoginUseCase) y entra directamente. */}
          <TouchableOpacity style={styles.guestButton} onPress={handleGuestLogin} accessibilityRole="button">
            <Text style={styles.guestButtonText}>Prueba sin registrarte</Text>
          </TouchableOpacity>

          {/* Sin User Story que lo respalde (US-002/ADR-015 lo marcan explicitamente "fuera de
              alcance") -- por eso es solo texto, no un enlace real: no hay pantalla ni caso de
              uso de recuperacion de contrasena a los que llevar todavia. */}
          <Text style={styles.forgotPasswordText}>¿Olvidaste tu contraseña?</Text>
        </View>
      </KeyboardAvoidingView>
    </View>
  )
}
