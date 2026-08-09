import { useEffect } from 'react'
import Svg, { Defs, Ellipse, RadialGradient, Stop } from 'react-native-svg'
import Animated, {
  Easing,
  interpolate,
  useAnimatedProps,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated'
import type { ActivityZoneSpec } from './constants'

const AnimatedEllipse = Animated.createAnimatedComponent(Ellipse)

const WIDTH = 44
const HEIGHT = 30
const BASE_RX = WIDTH / 2
const BASE_RY = HEIGHT / 2

// Pulso fMRI de una zona (ADR): escala 0.92 -> 1 -> 1.02 -> 0.95, opacidad 0 -> 1 -> 0.8 -> 0,
// ciclo de 3s, con retardo propio por zona. No hay filter:blur en React Native -- se sustituye
// por un RadialGradient (color -> transparente), visualmente equivalente al blur+radial-gradient
// del prototipo HTML.
export function ActivityZone({ x, y, color, delayMs }: ActivityZoneSpec) {
  const progress = useSharedValue(0)

  useEffect(() => {
    progress.value = withDelay(
      delayMs,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 900, easing: Easing.out(Easing.ease) }),
          withTiming(2, { duration: 900, easing: Easing.inOut(Easing.ease) }),
          withTiming(3, { duration: 1200, easing: Easing.in(Easing.ease) }),
        ),
        -1,
        false,
      ),
    )
  }, [delayMs, progress])

  const animatedProps = useAnimatedProps(() => {
    const scale = interpolate(progress.value, [0, 1, 2, 3], [0.92, 1, 1.02, 0.95])
    const opacity = interpolate(progress.value, [0, 1, 2, 3], [0, 1, 0.8, 0])
    return {
      rx: BASE_RX * scale,
      ry: BASE_RY * scale,
      opacity,
    }
  })

  const gradientId = `zoneGrad-${color.replace('#', '')}`

  return (
    <Svg
      width={WIDTH}
      height={HEIGHT}
      style={{
        position: 'absolute',
        left: `${x * 100}%`,
        top: `${y * 100}%`,
        transform: [{ translateX: -WIDTH / 2 }, { translateY: -HEIGHT / 2 }],
      }}
    >
      <Defs>
        <RadialGradient id={gradientId} cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor={color} stopOpacity={1} />
          <Stop offset="70%" stopColor={color} stopOpacity={0.35} />
          <Stop offset="100%" stopColor={color} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <AnimatedEllipse cx={WIDTH / 2} cy={HEIGHT / 2} fill={`url(#${gradientId})`} animatedProps={animatedProps} />
    </Svg>
  )
}
