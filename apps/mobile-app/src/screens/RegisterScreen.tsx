import { useState } from 'react'
import { KeyboardAvoidingView, Platform, Text, TouchableOpacity, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useRegister } from '../api'
import { BackgroundGrid, EmailInput, NeuralLoader, ParticleField, PasswordInput } from '../components'
import { styles } from './RegisterScreen.styles'
import type { AcademicLevel, RegisterFormErrors } from './RegisterScreen.validation'
import { validateRegisterForm } from './RegisterScreen.validation'

// Orden ascendente deliberado -- el selector de estrellas es acumulativo (marcar la estrella N
// marca tambien la 1..N-1): un nivel superior siempre incluye los anteriores ("un ingeniero no
// puede ser sin tener primaria"), no son 4 opciones independientes.
const ACADEMIC_LEVELS: ReadonlyArray<{ value: AcademicLevel; label: string }> = [
  { value: 'Primaria', label: 'Primaria' },
  { value: 'Secundaria', label: 'Secundaria' },
  { value: 'Bachillerato', label: 'Bachillerato' },
  { value: 'Ingenieria', label: 'Ingeniería' },
]

const STAR_FILLED = '★'
const STAR_EMPTY = '☆'

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

  const selectedIndex = academicLevel ? ACADEMIC_LEVELS.findIndex((level) => level.value === academicLevel) : -1
  const selectedLabel = selectedIndex >= 0 ? ACADEMIC_LEVELS[selectedIndex].label : null

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
          // (app)/home todavia no existe (pendiente ADR-015) -- mismo criterio que LoginScreen.
          // @ts-expect-error -- ruta real pendiente de construir
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

          <View style={styles.field}>
            <Text style={styles.label}>Nivel de complejidad</Text>
            <View style={styles.starRow}>
              {ACADEMIC_LEVELS.map((level, index) => (
                <TouchableOpacity
                  key={level.value}
                  style={styles.star}
                  onPress={() => setAcademicLevel(level.value)}
                  accessibilityRole="button"
                  accessibilityLabel={`Nivel de complejidad: ${level.label}`}
                  accessibilityState={{ selected: index <= selectedIndex }}
                >
                  <Text style={index <= selectedIndex ? styles.starTextFilled : styles.starTextEmpty}>
                    {index <= selectedIndex ? STAR_FILLED : STAR_EMPTY}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {selectedLabel ? <Text style={styles.levelSelectedLabel}>{selectedLabel}</Text> : null}
            {fieldErrors.academicLevel ? <Text style={styles.errorText}>{fieldErrors.academicLevel}</Text> : null}
          </View>

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
