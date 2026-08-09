import { useEffect } from 'react'
import { Platform, Text, View } from 'react-native'
import { BlurView } from 'expo-blur'
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated'
import { styles } from './StatusPill.styles'

// Cursor parpadeante -- el CSS original usa step-end (parpadeo brusco); aqui se aproxima con
// un fundido rapido ida-vuelta (mismo periodo, transicion suave en vez de instantanea), cambio
// menor documentado en README.
function BlinkingCursor() {
  const opacity = useSharedValue(0.7)

  useEffect(() => {
    opacity.value = withRepeat(withTiming(0, { duration: 550, easing: Easing.linear }), -1, true)
  }, [opacity])

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }))

  return <Animated.View style={[styles.cursor, animatedStyle]} />
}

// expo-blur (BlurView) no tiene efecto real en web -- ahi se sustituye por un fondo
// semitransparente algo mas opaco, degradacion aceptada (ADR-015: diseno visual no crítico).
export function StatusPill() {
  const Wrapper = Platform.OS === 'web' ? View : BlurView

  return (
    <View style={[styles.container, { pointerEvents: 'none' }]}>
      <Wrapper intensity={40} tint="dark" style={styles.pill}>
        <Text style={styles.title}>escaner neuronal</Text>
        <Text style={styles.subtitle}> | procesando</Text>
        <BlinkingCursor />
      </Wrapper>
    </View>
  )
}
