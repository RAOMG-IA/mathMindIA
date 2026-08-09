import { useEffect } from 'react'
import Animated, { Easing, interpolate, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withTiming } from 'react-native-reanimated'
import type { ScanRingSpec } from './constants'
import { RING_CENTER } from './constants'

const SIZE = 40

// Anillo de escaner expandiendose desde el centro del cerebro (ADR): escala 0.7 -> 1.6,
// opacidad 0.12 -> 0, 4.5s, con retardo propio.
export function ScanRing({ color, delayMs }: ScanRingSpec) {
  const progress = useSharedValue(0)

  useEffect(() => {
    progress.value = withDelay(
      delayMs,
      withRepeat(withTiming(1, { duration: 4500, easing: Easing.out(Easing.ease) }), -1, false),
    )
  }, [delayMs, progress])

  const animatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(progress.value, [0, 1], [0.7, 1.6])
    const opacity = interpolate(progress.value, [0, 1], [0.12, 0])
    return { opacity, transform: [{ scale }] }
  })

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: `${RING_CENTER.x * 100}%`,
          top: `${RING_CENTER.y * 100}%`,
          width: SIZE,
          height: SIZE,
          marginLeft: -SIZE / 2,
          marginTop: -SIZE / 2,
          borderRadius: SIZE / 2,
          borderWidth: 1,
          borderColor: color,
        },
        animatedStyle,
      ]}
    />
  )
}
