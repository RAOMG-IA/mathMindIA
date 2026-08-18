import { useEffect } from 'react'
import { Text, TouchableOpacity, View } from 'react-native'
import { useRouter } from 'expo-router'
import { skipToken, useQuery } from '@tanstack/react-query'
import type { EndSessionResponseDto } from '@mathmind/shared-types'
import { queryKeys } from '../api/queryKeys'
import { BackgroundGrid, NeuralLoader, ParticleField } from '../components'
import { styles } from './SessionSummaryScreen.styles'
import { computeAccuracyPercent, formatAvgResponseTime, formatRatingChange } from './SessionSummaryScreen.format'

interface SessionSummaryScreenProps {
  readonly sessionId: string
}

// US-006-resultado. Sin GET real detras (ver queryKeys.ts) -- el resumen solo existe si
// SessionScreen lo sembro en cache al finalizar (queryClient.setQueryData). queryFn: skipToken
// mantiene la lectura reactiva via TanStack Query (ADR-015) sin disparar una peticion real.
export function SessionSummaryScreen({ sessionId }: SessionSummaryScreenProps) {
  const router = useRouter()
  const summaryQuery = useQuery<EndSessionResponseDto>({
    queryKey: queryKeys.sessionSummary(sessionId),
    queryFn: skipToken,
  })

  // Entrada directa a la URL o recarga -- sin resumen sembrado, no hay nada que mostrar (mismo
  // criterio que SessionScreen ante un sessionId sin sesion en curso: redirige a Home en vez de
  // una pantalla rota).
  useEffect(() => {
    if (summaryQuery.data === undefined) {
      router.replace('/(app)/home')
    }
  }, [summaryQuery.data, router])

  function handleGoHome() {
    router.replace('/(app)/home')
  }

  const summary = summaryQuery.data
  if (!summary) {
    return <NeuralLoader />
  }

  const accuracy = computeAccuracyPercent(summary.correctAttempts, summary.totalAttempts)
  let ratingChangeStyle = null
  if (summary.ratingChange > 0) ratingChangeStyle = styles.statValuePositive
  else if (summary.ratingChange < 0) ratingChangeStyle = styles.statValueNegative

  return (
    <View style={styles.container}>
      <BackgroundGrid />
      <ParticleField />

      <View style={styles.scrollContent}>
        <Text style={styles.title}>Sesión finalizada</Text>
        <Text style={styles.subtitle}>Este es tu resumen de rendimiento</Text>

        <View style={styles.card}>
          {accuracy === null ? (
            <Text style={styles.emptyText}>No respondiste ningún ejercicio en esta sesión.</Text>
          ) : (
            <>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Aciertos</Text>
                <Text style={styles.statValue}>
                  {summary.correctAttempts}/{summary.totalAttempts} ({accuracy}%)
                </Text>
              </View>

              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Tiempo medio de respuesta</Text>
                <Text style={styles.statValue}>{formatAvgResponseTime(summary.avgResponseTimeMs)}</Text>
              </View>

              <View style={[styles.statRow, styles.statRowLast]}>
                <Text style={styles.statLabel}>Variación de rating</Text>
                <Text style={[styles.statValue, ratingChangeStyle]}>{formatRatingChange(summary.ratingChange)}</Text>
              </View>
            </>
          )}
        </View>

        <TouchableOpacity style={styles.homeButton} onPress={handleGoHome} accessibilityRole="button">
          <Text style={styles.homeButtonText}>Volver al inicio</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}
