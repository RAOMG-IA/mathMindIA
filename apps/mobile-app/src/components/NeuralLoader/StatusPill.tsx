import { useEffect } from 'react'
import { Platform, StyleSheet, Text, View } from 'react-native'
import { BlurView } from 'expo-blur'
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated'
import { COLORS } from './constants'

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
    <View style={styles.container} pointerEvents="none">
      <Wrapper intensity={40} tint="dark" style={styles.pill}>
        <Text style={styles.title}>escaner neuronal</Text>
        <Text style={styles.subtitle}> | procesando</Text>
        <BlinkingCursor />
      </Wrapper>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: '8%',
    alignItems: 'center',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 40,
    borderWidth: 1,
    borderColor: 'rgba(76, 201, 240, 0.12)',
    backgroundColor: Platform.OS === 'web' ? 'rgba(10, 14, 23, 0.55)' : 'rgba(255, 255, 255, 0.04)',
    overflow: 'hidden',
  },
  title: {
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.ice,
  },
  subtitle: {
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
    fontSize: 13,
    color: '#ffffff',
    opacity: 0.4,
  },
  cursor: {
    width: 7,
    height: 14,
    marginLeft: 6,
    backgroundColor: COLORS.ice,
  },
})
