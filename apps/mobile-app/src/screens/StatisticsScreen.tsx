import { ScrollView, Text, View } from 'react-native'
import type { TopicStatDto } from '@mathmind/shared-types'
import { useUserStatistics } from '../api'
import { BackgroundGrid, NeuralLoader } from '../components'
import { styles } from './StatisticsScreen.styles'
import { deriveTopicBreakdown } from './StatisticsScreen.validation'

// US-007, dentro del guard de (app)/_layout.tsx. Pantalla de solo lectura: sin formulario ni
// mutacion, consume unicamente useUserStatistics (misma query key/cache que AppHeader, ADR-015).
export function StatisticsScreen() {
  const statistics = useUserStatistics()

  if (statistics.isLoading) {
    return <NeuralLoader />
  }

  const data = statistics.data
  const byTopic = data?.byTopic ?? []
  const hasHistory = byTopic.length > 0
  const { strengths, weaknesses } = deriveTopicBreakdown(byTopic)
  const strengthCodes = new Set(strengths.map((topic) => topic.topic))
  const weaknessCodes = new Set(weaknesses.map((topic) => topic.topic))

  return (
    <View style={styles.container}>
      <BackgroundGrid />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} indicatorStyle="white">
        <Text style={styles.title}>Estadísticas</Text>
        <Text style={styles.subtitle}>Tu progreso acumulado y desglose por tema</Text>

        {statistics.isError ? (
          <View style={styles.serverErrorBanner}>
            <Text style={styles.serverErrorText}>No se pudieron cargar tus estadísticas. Inténtalo de nuevo más tarde.</Text>
          </View>
        ) : null}

        {data ? (
          <>
            {/* "Ver estadisticas globales" (US-007) -- score/nivel/rating son dato de perfil,
                visibles aunque byTopic este vacio. */}
            <View style={styles.card}>
              <View style={styles.metricsRow}>
                <View style={styles.metric}>
                  <Text style={styles.metricValue}>{data.score}</Text>
                  <Text style={styles.metricLabel}>Score</Text>
                </View>
                <View style={styles.metric}>
                  <Text style={styles.metricValue}>{data.academicLevel}</Text>
                  <Text style={styles.metricLabel}>Nivel</Text>
                </View>
                <View style={styles.metric}>
                  <Text style={styles.metricValue}>{Math.round(data.rating)}</Text>
                  <Text style={styles.metricLabel}>Rating</Text>
                </View>
              </View>
            </View>

            {hasHistory ? (
              <>
                <Text style={styles.sectionTitle}>Desglose por tema</Text>
                <View style={styles.card}>
                  {byTopic.map((topic) => (
                    <TopicRow
                      key={topic.topic}
                      topic={topic}
                      isStrength={strengthCodes.has(topic.topic)}
                      isWeakness={weaknessCodes.has(topic.topic)}
                    />
                  ))}
                </View>
              </>
            ) : (
              // "Usuario sin historial" (US-007) -- estado vacio explicito, no un error.
              <View style={styles.emptyStateCard}>
                <Text style={styles.emptyStateTitle}>Aún no tienes datos</Text>
                <Text style={styles.emptyStateText}>
                  Completa tu primera sesión de entrenamiento para ver tu desglose por tema aquí.
                </Text>
              </View>
            )}
          </>
        ) : null}
      </ScrollView>
    </View>
  )
}

function TopicRow({ topic, isStrength, isWeakness }: { topic: TopicStatDto; isStrength: boolean; isWeakness: boolean }) {
  const percentage = Math.round(topic.accuracy * 100)

  return (
    <View style={styles.topicRow}>
      <View style={styles.topicInfo}>
        <View style={styles.topicNameRow}>
          <Text style={styles.topicName}>{topic.topic}</Text>
          {isStrength ? (
            <View style={styles.badgeStrength}>
              <Text style={styles.badgeText}>Fuerte</Text>
            </View>
          ) : null}
          {isWeakness ? (
            <View style={styles.badgeWeakness}>
              <Text style={styles.badgeText}>A mejorar</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.topicArea}>{topic.area}</Text>
        <View style={styles.accuracyBarTrack}>
          <View style={[styles.accuracyBarFill, { width: `${percentage}%` }]} />
        </View>
      </View>
      <View style={styles.topicMetrics}>
        <Text style={styles.topicAccuracy}>{percentage}%</Text>
        <Text style={styles.topicAttempts}>{topic.attemptCount} intentos</Text>
      </View>
    </View>
  )
}
