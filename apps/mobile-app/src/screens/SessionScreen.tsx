import { useEffect, useRef, useState } from 'react'
import { Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useQueryClient } from '@tanstack/react-query'
import type { ExercisePublicDto } from '@mathmind/shared-types'
import { useEndSession, useRequestHint, useSubmitAnswer } from '../api'
import { queryKeys } from '../api/queryKeys'
import { NeuralLoader, RadioButton, TECLADO_BACKSPACE, Teclado } from '../components'
import type { TecladoMode } from '../components'
import type { HintEntry } from '../store/useTrainingSessionStore'
import { useTrainingSessionStore } from '../store/useTrainingSessionStore'
import { styles } from './SessionScreen.styles'
import { computeTimerState } from './SessionScreen.timer'
import { pickMentalMathTip } from './SessionScreen.mentalMathTips'

interface SessionScreenProps {
  readonly sessionId: string
}

interface AnswerResult {
  readonly isCorrect: boolean
  readonly explanation: string
  readonly nextExercise?: ExercisePublicDto
}

interface TestModeOptionsProps {
  readonly options: readonly [string, string, string]
  readonly selectedOption: string | null
  readonly disabled: boolean
  readonly onSelect: (option: string) => void
}

function TestModeOptions({ options, selectedOption, disabled, onSelect }: TestModeOptionsProps) {
  return (
    <View style={styles.optionsColumn}>
      {options.map((option) => (
        <RadioButton
          key={option}
          label={option}
          selected={selectedOption === option}
          onPress={() => onSelect(option)}
          disabled={disabled}
        />
      ))}
    </View>
  )
}

interface ResolutionModeFormProps {
  readonly value: string
  readonly onChangeValue: (value: string) => void
  readonly disabled: boolean
  readonly hints: readonly HintEntry[]
  readonly onSubmit: () => void
  readonly onGiveUp: () => void
}

// Solo iOS/Android muestran el Teclado propio -- en Web el usuario ya tiene teclado fisico,
// no tiene sentido un teclado en pantalla. showSoftInputOnFocus=false en nativo desactiva el
// teclado del terminal (unica forma de editar pasa a ser el Teclado propio, incluido borrar).
const SHOW_TECLADO = Platform.OS !== 'web'

// "Enviar respuesta" y "Resolver" son el mismo boton: sin valor escrito, rendirse (revela la
// solucion, mismo mecanismo que un fallo normal); con valor escrito, envia esa respuesta.
function ResolutionModeForm({ value, onChangeValue, disabled, hints, onSubmit, onGiveUp }: ResolutionModeFormProps) {
  const hasValue = value.trim().length > 0
  const [tecladoMode, setTecladoMode] = useState<TecladoMode>('basica')

  // Sincroniza cada tecla pulsada con el input controlado -- TECLADO_BACKSPACE borra el ultimo
  // caracter, cualquier otro valor se añade al final (sin seguimiento de posicion del cursor,
  // suficiente para un teclado de solo-anadir/borrar).
  function handleKeyPress(key: string) {
    onChangeValue(key === TECLADO_BACKSPACE ? value.slice(0, -1) : value + key)
  }

  return (
    <>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeValue}
        editable={!disabled}
        showSoftInputOnFocus={!SHOW_TECLADO}
        placeholder="Tu respuesta"
        placeholderTextColor="rgba(255,255,255,0.4)"
      />

      {SHOW_TECLADO ? (
        <View style={styles.tecladoWrapper}>
          <Teclado mode={tecladoMode} onModeChange={setTecladoMode} onKeyPress={handleKeyPress} disabled={disabled} />
        </View>
      ) : null}

      {hints.length > 0 ? (
        <View style={styles.hintsList}>
          {hints.map((hint) => (
            <View key={hint.order} style={styles.hintRow}>
              <Text style={styles.hintOrder}>Pista {hint.order}</Text>
              <Text style={styles.hintText}>{hint.content}</Text>
            </View>
          ))}
        </View>
      ) : null}

      <TouchableOpacity
        style={[styles.submitButton, disabled && styles.submitButtonDisabled]}
        onPress={hasValue ? onSubmit : onGiveUp}
        disabled={disabled}
        accessibilityRole="button"
      >
        <Text style={styles.submitButtonText}>{hasValue ? 'Enviar respuesta' : 'Resolver'}</Text>
      </TouchableOpacity>
    </>
  )
}

interface ResultBannerProps {
  readonly result: AnswerResult
}

function ResultBanner({ result }: ResultBannerProps) {
  return (
    <View style={[styles.resultBanner, result.isCorrect ? styles.resultBannerCorrect : styles.resultBannerIncorrect]}>
      <Text style={[styles.resultTitle, result.isCorrect ? styles.resultTitleCorrect : styles.resultTitleIncorrect]}>
        {result.isCorrect ? '¡Correcto!' : 'Incorrecto'}
      </Text>
      <Text style={styles.resultExplanation}>{result.explanation}</Text>
    </View>
  )
}

// US-004/US-005/US-006-accion, dentro del guard de (app). Sin fondo propio -- mismo criterio
// que HomeScreen, vive bajo AppHeader.
export function SessionScreen({ sessionId }: SessionScreenProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const submitAnswer = useSubmitAnswer()
  const requestHint = useRequestHint()
  const endSession = useEndSession()

  const storeSessionId = useTrainingSessionStore((state) => state.sessionId)
  const mode = useTrainingSessionStore((state) => state.mode)
  const exercise = useTrainingSessionStore((state) => state.currentExercise)
  const exerciseShownAt = useTrainingSessionStore((state) => state.exerciseShownAt)
  const hints = useTrainingSessionStore((state) => state.hints)
  const setExercise = useTrainingSessionStore((state) => state.setExercise)
  const addHint = useTrainingSessionStore((state) => state.addHint)
  const clear = useTrainingSessionStore((state) => state.clear)

  const [now, setNow] = useState(() => Date.now())
  const [submittedValue, setSubmittedValue] = useState('')
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [result, setResult] = useState<AnswerResult | null>(null)
  const autoSubmittedRef = useRef(false)

  // Sin sesion en curso en el store (entrada directa a la URL, recarga, o sessionId de otra
  // sesion) -- no hay endpoint para recuperar el ejercicio actual de una Session (hueco de
  // arquitectura aceptado, ver STATUS.md), asi que se redirige a Home en vez de una pantalla rota.
  useEffect(() => {
    if (storeSessionId !== null && storeSessionId !== sessionId) {
      router.replace('/(app)/home')
    }
  }, [storeSessionId, sessionId, router])

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(interval)
  }, [])

  // Al pasar a un ejercicio nuevo (setExercise ya limpia hints en el store) se limpian tambien
  // resultado/respuesta/opcion elegida en el propio componente -- todas las pantallas de
  // ejercicio arrancan siempre en el mismo formato (bloques de pistas y solucion vacios).
  // Dependencia en exerciseShownAt, no en exercise?.id -- UC-008 puede devolver el mismo
  // ejercicio dos veces seguidas (hueco real: pool con pocos candidatos empatados en
  // dificultad, ver GenerateExerciseBatchUseCase), y setExercise siempre actualiza
  // exerciseShownAt aunque el ejercicio "nuevo" sea identico al anterior -- con exercise?.id
  // como dependencia, ese caso no reseteaba nada y "Siguiente ejercicio" parecia no hacer nada.
  useEffect(() => {
    setResult(null)
    setSubmittedValue('')
    setSelectedOption(null)
    autoSubmittedRef.current = false
  }, [exerciseShownAt])

  function handleSubmit(value: string) {
    if (!exercise || !exerciseShownAt || result || submitAnswer.isPending) return

    submitAnswer.mutate(
      { sessionId, exerciseId: exercise.id, submittedValue: value, responseTimeMs: Date.now() - exerciseShownAt },
      { onSuccess: (data) => setResult(data) },
    )
  }

  function handleSelectOption(option: string) {
    setSelectedOption(option)
    handleSubmit(option)
  }

  const timer = exercise && exerciseShownAt ? computeTimerState(exerciseShownAt, exercise.timeLimitMs, now) : null

  // Modo Test: al expirar el tiempo sin responder, se envia automaticamente como incorrecto
  // (submittedValue vacio) -- US-004, "Se agota el tiempo sin responder".
  useEffect(() => {
    if (mode === 'Test' && timer?.expired && !result && !autoSubmittedRef.current) {
      autoSubmittedRef.current = true
      handleSubmit('')
    }
  }, [mode, timer?.expired, result])

  function handleRequestHint() {
    if (!exercise || !exerciseShownAt || result) return
    requestHint.mutate(
      { sessionId, exerciseId: exercise.id, elapsedMs: Date.now() - exerciseShownAt },
      { onSuccess: (data) => addHint({ order: data.order, content: data.content }) },
    )
  }

  function handleFinish() {
    endSession.mutate(
      { sessionId },
      {
        onSuccess: (data) => {
          queryClient.setQueryData(queryKeys.sessionSummary(sessionId), data)
          clear()
          router.replace(`/(app)/session/${sessionId}/summary`)
        },
      },
    )
  }

  if (storeSessionId === null || !exercise || !exerciseShownAt || !mode || !timer) {
    return <NeuralLoader />
  }

  if (submitAnswer.isPending || endSession.isPending) {
    return <NeuralLoader />
  }

  const remainingSeconds = Math.ceil(timer.remainingMs / 1000)
  const tip = mode === 'Test' ? pickMentalMathTip(exercise.id) : null
  const hasAnyError = submitAnswer.isError || requestHint.isError || endSession.isError
  const hintsEnabled = timer.expired && !result
  const canGoNext = Boolean(result?.nextExercise)

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={styles.topRow}>
          <Text style={[styles.timer, timer.expired && styles.timerExpired]}>
            {timer.expired ? 'Tiempo agotado' : `${remainingSeconds}s`}
          </Text>

          <View style={styles.topRowActions}>
            {canGoNext ? (
              <TouchableOpacity
                style={styles.nextButton}
                onPress={() => setExercise(result!.nextExercise!)}
                accessibilityRole="button"
              >
                <Text style={styles.nextButtonText}>Siguiente ejercicio</Text>
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity style={styles.finishButton} onPress={handleFinish} accessibilityRole="button">
              <Text style={styles.finishButtonText}>Finalizar</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.statementRow}>
            <Text style={styles.statement}>{exercise.statement}</Text>

            {mode === 'Resolution' ? (
              <TouchableOpacity
                style={[styles.hintIconButton, !hintsEnabled && styles.hintIconButtonDisabled]}
                onPress={handleRequestHint}
                disabled={!hintsEnabled}
                accessibilityRole="button"
                accessibilityLabel="Pedir pista"
              >
                <Text style={styles.hintIconText}>?</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {tip ? (
            <View style={styles.tipBox}>
              <Text style={styles.tipText}>💡 {tip}</Text>
            </View>
          ) : null}

          {mode === 'Test' && exercise.options ? (
            <TestModeOptions
              options={exercise.options}
              selectedOption={selectedOption}
              disabled={Boolean(result)}
              onSelect={handleSelectOption}
            />
          ) : null}

          {mode === 'Resolution' ? (
            <ResolutionModeForm
              value={submittedValue}
              onChangeValue={setSubmittedValue}
              disabled={Boolean(result)}
              hints={hints}
              onSubmit={() => handleSubmit(submittedValue)}
              onGiveUp={() => handleSubmit('')}
            />
          ) : null}

          {result ? <ResultBanner result={result} /> : null}

          {result && !result.nextExercise ? (
            <Text style={styles.poolExhaustedText}>
              No hay más ejercicios disponibles para este tema por ahora. Puedes finalizar la sesión.
            </Text>
          ) : null}

          {hasAnyError ? (
            <View style={styles.serverErrorBanner}>
              <Text style={styles.serverErrorText}>Algo no funcionó. Inténtalo de nuevo.</Text>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </View>
  )
}
