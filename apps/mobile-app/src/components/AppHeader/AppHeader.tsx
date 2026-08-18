import { Text, TouchableOpacity, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useUserStatistics } from '../../api'
import { useSessionStore } from '../../store/useSessionStore'
import { styles } from './AppHeader.styles'

// Cabecera comun a las 5 pantallas autenticadas de (app) (ADR-015). El email nunca vuelve del
// backend tras login/registro -- se lee del propio Zustand store, cacheado alli en el momento
// del login (ver useSessionStore.ts). Nivel/rating si son dato de servidor: reutiliza
// useUserStatistics, la misma query key que (app)/statistics, sin pedir el dato dos veces.
export function AppHeader() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const email = useSessionStore((state) => state.email)
  const statistics = useUserStatistics()

  const levelLabel = statistics.data ? `${statistics.data.academicLevel} · ${Math.round(statistics.data.rating)}` : '···'

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <View style={styles.identity}>
        <Text style={styles.email} numberOfLines={1}>
          {email}
        </Text>
        <Text style={styles.levelBadge}>{levelLabel}</Text>
      </View>

      <View style={styles.nav}>
        <TouchableOpacity
          style={styles.navButton}
          accessibilityRole="button"
          onPress={() => router.push('/(app)/home')}
        >
          <Text style={styles.navButtonText}>Inicio</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navButton}
          accessibilityRole="button"
          onPress={() => router.push('/(app)/statistics')}
        >
          <Text style={styles.navButtonText}>Estadísticas</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}
