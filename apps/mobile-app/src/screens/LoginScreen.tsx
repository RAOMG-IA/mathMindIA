import { useState } from 'react'
import { KeyboardAvoidingView, Platform, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useLogin } from '../api'
import { BackgroundGrid, NeuralLoader, ParticleField } from '../components'
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
          // (app)/home todavia no existe (pendiente ADR-015). Expo Router (typedRoutes) no
          // conoce la ruta hasta que el fichero exista -- @ts-expect-error en vez de `as any`
          // para que TS avise (directiva "no usada") en cuanto se cree esa pantalla y haya que
          // quitar esta silenciacion.
          // @ts-expect-error -- ruta real pendiente de construir, ver comentario arriba
          router.replace('/(app)/home')
        },
      },
    )
  }

  function handleGoToRegister() {
    // (auth)/register todavia no existe (pendiente ADR-015) -- mismo criterio que
    // "/(app)/home" en handleSubmit: @ts-expect-error en vez de `as any`.
    // @ts-expect-error -- ruta real pendiente de construir
    router.push('/(auth)/register')
  }

  if (login.isPending) {
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

          {/* Sin User Story que lo respalde (US-002/ADR-015 lo marcan explicitamente "fuera de
              alcance") -- por eso es solo texto, no un enlace real: no hay pantalla ni caso de
              uso de recuperacion de contrasena a los que llevar todavia. */}
          <Text style={styles.forgotPasswordText}>¿Olvidaste tu contraseña?</Text>
        </View>
      </KeyboardAvoidingView>
    </View>
  )
}
