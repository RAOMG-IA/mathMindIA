import { useEffect } from 'react'
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg'
import Animated, { Easing, useAnimatedProps, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated'
import { ANATOMY_VIEWBOX, BRAIN_DETAIL_PATHS, BRAIN_OUTLINE_PATH, SKULL_PATH } from './anatomyPaths'
import { COLORS } from './constants'

const AnimatedPath = Animated.createAnimatedComponent(Path)

// Pulso de opacidad del craneo (ADR: 0.2 -> 0.38, 4s, ease-in-out, infinito).
function useSkullPulse() {
  const opacity = useSharedValue(0.2)

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.38, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.2, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    )
  }, [opacity])

  return opacity
}

export function HeadAnatomy() {
  const skullOpacity = useSkullPulse()
  const skullAnimatedProps = useAnimatedProps(() => ({ opacity: skullOpacity.value }))

  return (
    <Svg viewBox={ANATOMY_VIEWBOX} style={{ position: 'absolute', width: '100%', height: '100%' }}>
      <Defs>
        <LinearGradient id="brainGrad" x1="70" y1="99" x2="129" y2="150" gradientUnits="userSpaceOnUse">
          <Stop offset="0%" stopColor={COLORS.ice} />
          <Stop offset="50%" stopColor={COLORS.violet} />
          <Stop offset="100%" stopColor={COLORS.pink} />
        </LinearGradient>
      </Defs>

      <AnimatedPath
        d={SKULL_PATH}
        fill="none"
        stroke={COLORS.ice}
        strokeWidth={0.5}
        animatedProps={skullAnimatedProps}
      />

      <Path d={BRAIN_OUTLINE_PATH} fill={COLORS.ice} fillOpacity={0.06} stroke="url(#brainGrad)" strokeWidth={0.7} />

      {BRAIN_DETAIL_PATHS.map((d, index) => (
        <Path
          key={index}
          d={d}
          fill="none"
          stroke="#cfe9fb"
          strokeWidth={0.35}
          strokeLinecap="round"
          opacity={0.4}
        />
      ))}
    </Svg>
  )
}
