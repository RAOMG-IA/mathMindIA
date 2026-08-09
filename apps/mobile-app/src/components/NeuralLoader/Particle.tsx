import { useEffect } from 'react'
import { Text } from 'react-native'
import Animated, { Easing, interpolate, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withTiming } from 'react-native-reanimated'
import { COLORS } from './constants'

export interface ParticleDescriptor {
  readonly letter: string
  readonly leftPercent: number
  readonly fontSize: number
  readonly durationMs: number
  readonly initialDelayMs: number
  readonly driftPx: number
}

// Particula griega flotando hacia arriba (ADR): opacidad 0 -> 0.12 -> 0.12 -> 0 a lo largo del
// recorrido, con una deriva horizontal aleatoria pequena. `travelPx` viene del alto de pantalla
// real (useWindowDimensions en ParticleField), no hay unidad "vh" en React Native.
export function Particle({ letter, leftPercent, fontSize, durationMs, initialDelayMs, driftPx, travelPx }: ParticleDescriptor & { travelPx: number }) {
  const progress = useSharedValue(0)

  useEffect(() => {
    progress.value = withDelay(
      initialDelayMs,
      withRepeat(withTiming(1, { duration: durationMs, easing: Easing.linear }), -1, false),
    )
  }, [durationMs, initialDelayMs, progress])

  const animatedStyle = useAnimatedStyle(() => {
    const translateY = interpolate(progress.value, [0, 1], [0, -travelPx])
    const translateX = interpolate(progress.value, [0, 1], [0, driftPx])
    const opacity = interpolate(progress.value, [0, 0.08, 0.92, 1], [0, 0.12, 0.12, 0])
    return { opacity, transform: [{ translateY }, { translateX }] }
  })

  return (
    <Animated.View style={[{ position: 'absolute', left: `${leftPercent}%`, bottom: 0 }, animatedStyle]}>
      <Text style={{ fontSize, color: COLORS.ice }}>{letter}</Text>
    </Animated.View>
  )
}
