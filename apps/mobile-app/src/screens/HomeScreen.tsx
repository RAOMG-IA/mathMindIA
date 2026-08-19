import { useEffect, useState } from 'react'
import { ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useStartSession, useTemas, useUserStatistics } from '../api'
import { AcademicLevelStars, BackgroundGrid, Combobox, NeuralLoader } from '../components'
import { useTrainingSessionStore } from '../store/useTrainingSessionStore'
import { styles } from './HomeScreen.styles'
import { type AcademicLevel, type ExerciseType, type HomeFormErrors, temasForLevel, validateHomeForm } from './HomeScreen.validation'

const MODES: ReadonlyArray<{ value: ExerciseType; label: string }> = [
  { value: 'Test', label: 'Modo Test' },
  { value: 'Resolution', label: 'Modo Resolución' },
]

// US-003, dentro del guard de (app)/_layout.tsx (ya renderiza AppHeader por encima). Fondo base
// (BackgroundGrid, la rejilla -- identidad visual minima de la app) igual que las pantallas
// publicas (auth), pero sin ParticleField: las letras griegas flotantes compiten visualmente con
// un formulario interactivo (Combobox con Modal encima), a diferencia de Login/Register.
export function HomeScreen() {
  const router = useRouter()
  const statistics = useUserStatistics()
  const temasQuery = useTemas()
  const startSession = useStartSession()

  const startTrainingSession = useTrainingSessionStore((state) => state.start)

  const [mode, setMode] = useState<ExerciseType | null>(null)
  const [academicLevel, setAcademicLevel] = useState<AcademicLevel | null>(null)
  const [topic, setTopic] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<HomeFormErrors>({})

  // Nivel preseleccionado desde el perfil del usuario (US-003, "Nivel académico por defecto"),
  // editable despues -- solo mientras academicLevel siga en null, para no pisar una eleccion ya
  // hecha si useUserStatistics se revalida en segundo plano.
  useEffect(() => {
    if (academicLevel === null && statistics.data) {
      setAcademicLevel(statistics.data.academicLevel)
    }
  }, [statistics.data, academicLevel])

  const availableTemas = temasForLevel(temasQuery.data?.temas ?? [], academicLevel)
  const sortedTemas = [...availableTemas].sort((a, b) => a.area.localeCompare(b.area) || a.label.localeCompare(b.label))

  function handleLevelChange(level: AcademicLevel) {
    setAcademicLevel(level)
    // El Tema ya elegido puede dejar de aplicar al nuevo nivel -- se limpia en vez de dejar un
    // topic invalido guardado que solo se detectaria al confirmar.
    setTopic(null)
  }

  function handleSubmit() {
    const errors = validateHomeForm(mode, academicLevel, topic, availableTemas)
    setFieldErrors(errors)
    if (errors.mode || errors.academicLevel || errors.topic || !mode || !academicLevel || !topic) {
      return
    }

    startSession.mutate(
      { mode, academicLevel, topic },
      {
        onSuccess: (data) => {
          // Sin GET real que exponga "el ejercicio actual de una Session" -- se guarda aqui, en
          // Zustand (ADR-015: el cronometro del ejercicio en curso ya vivia alli), para que
          // SessionScreen lo consuma sin depender de la respuesta de esta mutation.
          startTrainingSession({ sessionId: data.session.id, mode: data.session.mode, exercise: data.exercise })
          router.push(`/(app)/session/${data.session.id}`)
        },
      },
    )
  }

  if (temasQuery.isLoading || startSession.isPending) {
    return <NeuralLoader />
  }

  return (
    <View style={styles.container}>
      <BackgroundGrid />
      {/* indicatorStyle="white" -- convencion nativa del scroll formal, ver src/styles/README.md
          (el gris por defecto de iOS es casi ilegible sobre el fondo oscuro de la app) */}
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} indicatorStyle="white">
        <Text style={styles.title}>Nueva sesión de entrenamiento</Text>
        <Text style={styles.subtitle}>Elige modo, nivel y tema para empezar</Text>

        <View style={styles.card}>
          <View style={styles.field}>
            <Text style={styles.label}>Modo</Text>
            <View style={styles.modeRow}>
              {MODES.map((item) => {
                const selected = mode === item.value
                return (
                  <TouchableOpacity
                    key={item.value}
                    style={[styles.modeButton, selected && styles.modeButtonSelected]}
                    onPress={() => setMode(item.value)}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                  >
                    <Text style={[styles.modeButtonText, selected && styles.modeButtonTextSelected]}>{item.label}</Text>
                  </TouchableOpacity>
                )
              })}
            </View>
            {fieldErrors.mode ? <Text style={styles.errorText}>{fieldErrors.mode}</Text> : null}
          </View>

          <AcademicLevelStars
            label="Nivel académico"
            value={academicLevel}
            onChange={handleLevelChange}
            error={fieldErrors.academicLevel}
          />

          <View style={styles.field}>
            <Text style={styles.label}>Tema</Text>
            {sortedTemas.length === 0 ? (
              <Text style={styles.emptyTopicsText}>No hay temas disponibles para este nivel todavía.</Text>
            ) : (
              // multiSelect=false -- US-003 exige un unico Tema por sesion (StartSessionRequestDto
              // solo acepta uno); el mismo Combobox soporta multiSelect=true para un futuro
              // consumidor que sí necesite varios, sin tocar este.
              <Combobox
                items={sortedTemas}
                getKey={(tema) => tema.code}
                getLabel={(tema) => `[${tema.area}] ${tema.label}`}
                multiSelect={false}
                value={topic}
                onChange={setTopic}
                placeholder="Elige un tema"
                error={fieldErrors.topic}
              />
            )}
          </View>

          {startSession.isError ? (
            <View style={styles.serverErrorBanner}>
              <Text style={styles.serverErrorText}>No se pudo iniciar la sesión. Inténtalo de nuevo o elige otro tema.</Text>
            </View>
          ) : null}

          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} accessibilityRole="button">
            <Text style={styles.submitText}>Empezar entrenamiento</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  )
}
