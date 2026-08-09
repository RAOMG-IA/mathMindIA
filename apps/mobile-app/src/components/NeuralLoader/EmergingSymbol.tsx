import { useEffect } from 'react'
import { Text } from 'react-native'
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated'
import type { EmergingSymbolSpec } from './constants'

// Keyframes ADR (0%,15%,50%,85%,100%), duracion total 4s. Sin filter:blur (no soportado en
// estilos de RN) -- se compensa con el propio arco de opacidad, ya bastante marcado.
const KEYFRAME_STOPS = [0, 15, 50, 85, 100]
const SCALE_STOPS = [0.2, 1.3, 1, 0.8, 0.6]
const OPACITY_STOPS = [0, 1, 1, 0.6, 0]

export function EmergingSymbol({ symbol, x, y, color, direction, delayMs }: EmergingSymbolSpec) {
  const progress = useSharedValue(0)
  const sign = direction === 'up' ? -1 : 1

  useEffect(() => {
    progress.value = withDelay(
      delayMs,
      withRepeat(
        withSequence(
          withTiming(15, { duration: 600, easing: Easing.out(Easing.ease) }),
          withTiming(50, { duration: 1400, easing: Easing.out(Easing.ease) }),
          withTiming(85, { duration: 1400, easing: Easing.in(Easing.ease) }),
          withTiming(100, { duration: 600, easing: Easing.in(Easing.ease) }),
        ),
        -1,
        false,
      ),
    )
  }, [delayMs, progress])

  const animatedStyle = useAnimatedStyle(() => {
    const translateStops = [0, 10, 26, 40, 52].map((v) => v * sign)
    const rotateStops = [0, 8, 15, 22, 30].map((v) => v * sign)

    const translateX = interpolate(progress.value, KEYFRAME_STOPS, translateStops)
    const translateY = interpolate(progress.value, KEYFRAME_STOPS, translateStops)
    const scale = interpolate(progress.value, KEYFRAME_STOPS, SCALE_STOPS)
    const rotateDeg = interpolate(progress.value, KEYFRAME_STOPS, rotateStops)
    const opacity = interpolate(progress.value, KEYFRAME_STOPS, OPACITY_STOPS)

    return {
      opacity,
      transform: [{ translateX }, { translateY }, { scale }, { rotate: `${rotateDeg}deg` }],
    }
  })

  return (
    <Animated.View
      style={[
        { position: 'absolute', left: `${x * 100}%`, top: `${y * 100}%` },
        animatedStyle,
      ]}
    >
      <Text style={{ fontSize: 15, fontWeight: '600', color }}>{symbol}</Text>
    </Animated.View>
  )
}
