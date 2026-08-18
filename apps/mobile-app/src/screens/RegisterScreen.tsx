import { useState } from 'react'
import { KeyboardAvoidingView, Platform, Text, TouchableOpacity, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useRegister } from '../api'
import { AcademicLevelStars, BackgroundGrid, EmailInput, NeuralLoader, ParticleField, PasswordInput } from '../components'
import { styles } from './RegisterScreen.styles'
import type { AcademicLevel, RegisterFormErrors } from './RegisterScreen.validation'
import { validateRegisterForm } from './RegisterScreen.validation'

// El unico mensaje real que RegisterUseCase lanza para email duplicado es en ingles y
// literal ("Email already registered: <email>", routes.ts lo reenvia tal cual, exposeMessage
// true) -- se traduce aqui porque el AC de US-001 exige un texto concreto en español
// ("indicando que el email ya esta en uso"), a diferencia de LoginScreen (US-002), cuyo AC
// solo exige que el mensaje sea generico, no un texto exacto. Se atribuye al propio campo de
// email (via el prop `error` de EmailInput), no a un banner general -- es la "validacion de
// existencia" pedida para el registro (y deliberadamente ausente en LoginScreen: ADR-012 exige
// que el fallo de login sea generico, sin indicar si el email existe).
function isEmailAlreadyRegisteredError(message: string): boolean {
  return message.startsWith('Email already registered')
}

// Mismo patron de diseno que LoginScreen (ADR-015 + convencion establecida): fondo
// BackgroundGrid+ParticleField, formulario en card centrada, NeuralLoader como estado de
// carga real mientras useRegister esta pendiente.
export function RegisterScreen() {
  const router = useRouter()
  const register = useRegister()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [academicLevel, setAcademicLevel] = useState<AcademicLevel | null>(null)
  const [fieldErrors, setFieldErrors] = useState<RegisterFormErrors>({})

  const emailTakenError =
    register.isError && isEmailAlreadyRegisteredError(register.error.message) ? 'Ese email ya está en uso' : undefined
  const showGenericServerError = register.isError && !emailTakenError

  function handleSubmit() {
    const errors = validateRegisterForm(email, password, academicLevel)
    setFieldErrors(errors)
    if (errors.email || errors.password || errors.academicLevel || !academicLevel) {
      return
    }

    register.mutate(
      { email, password, academicLevel },
      {
        onSuccess: () => {
          router.replace('/(app)/home')
        },
      },
    )
  }

  if (register.isPending) {
    return <NeuralLoader />
  }

  return (
    <View style={styles.container}>
      <BackgroundGrid />
      <ParticleField />

      <KeyboardAvoidingView
        style={styles.formWrapper}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Text style={styles.title}>MathMind AI</Text>
        <Text style={styles.subtitle}>Crea tu cuenta para empezar</Text>

        <View style={styles.card}>
          <EmailInput value={email} onChangeText={setEmail} error={fieldErrors.email ?? emailTakenError} />

          <PasswordInput value={password} onChangeText={setPassword} error={fieldErrors.password} />

          <AcademicLevelStars value={academicLevel} onChange={setAcademicLevel} error={fieldErrors.academicLevel} />

          {showGenericServerError ? (
            <View style={styles.serverErrorBanner}>
              <Text style={styles.serverErrorText}>No se pudo completar el registro. Inténtalo de nuevo.</Text>
            </View>
          ) : null}

          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} accessibilityRole="button">
            <Text style={styles.submitText}>Crear cuenta</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/(auth)/login')} accessibilityRole="button">
            <Text style={styles.loginLinkText}>¿Ya tienes cuenta? Inicia sesión</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  )
}
