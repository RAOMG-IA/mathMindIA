import { useEffect } from 'react'
import { StyleSheet, useWindowDimensions, View } from 'react-native'
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated'
import { ActivityZone } from './ActivityZone'
import { BackgroundGrid } from './BackgroundGrid'
import { ACTIVITY_ZONES, COLORS, EMERGING_SYMBOLS, SCAN_RINGS } from './constants'
import { EmergingSymbol } from './EmergingSymbol'
import { HeadAnatomy } from './HeadAnatomy'
import { ParticleField } from './ParticleField'
import { ScanRing } from './ScanRing'
import { StatusPill } from './StatusPill'

const VIEWBOX_ASPECT = 103 / 115

function useFloatAnimation() {
  const translateY = useSharedValue(0)
  const scale = useSharedValue(1)

  useEffect(() => {
    const loop = () =>
      withRepeat(
        withSequence(
          withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        false,
      )
    translateY.value = loop()
    scale.value = loop()
  }, [scale, translateY])

  return useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value * -5 }, { scale: 1 + scale.value * 0.005 }],
  }))
}

// Loader animado con estetica de escaner neuronal (fMRI), disenado y validado con el usuario
// como prototipo HTML antes de portar a componente real -- ver
// docs/ADR/ADR-015_mobile_app_screens.md. Sin logica de negocio, puramente decorativo (no
// consume props de dominio); se usa como pantalla/overlay de carga en (auth)/(app) cuando se
// implementen esas rutas.
export function NeuralLoader() {
  const { width: windowWidth } = useWindowDimensions()
  const floatStyle = useFloatAnimation()

  const stageWidth = Math.min(360, Math.max(260, windowWidth * 0.34))
  const stageHeight = stageWidth / VIEWBOX_ASPECT

  return (
    <View style={styles.container}>
      <BackgroundGrid />
      <ParticleField />

      <Animated.View style={[{ width: stageWidth, height: stageHeight }, floatStyle]}>
        <HeadAnatomy />

        {ACTIVITY_ZONES.map((zone) => (
          <ActivityZone key={zone.id} {...zone} />
        ))}

        {EMERGING_SYMBOLS.map((symbol) => (
          <EmergingSymbol key={symbol.id} {...symbol} />
        ))}

        {SCAN_RINGS.map((ring) => (
          <ScanRing key={ring.id} {...ring} />
        ))}
      </Animated.View>

      <StatusPill />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
})
