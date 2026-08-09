import { useMemo } from 'react'
import { StyleSheet, useWindowDimensions, View } from 'react-native'
import { GREEK_LETTERS } from './constants'
import type { ParticleDescriptor } from './Particle'
import { Particle } from './Particle'

const PARTICLE_COUNT = 22

function randomParticle(): ParticleDescriptor {
  return {
    letter: GREEK_LETTERS[Math.floor(Math.random() * GREEK_LETTERS.length)],
    leftPercent: Math.random() * 100,
    fontSize: 8 + Math.random() * 12,
    durationMs: (18 + Math.random() * 16) * 1000,
    initialDelayMs: Math.random() * 34000,
    driftPx: Math.random() * 60 - 30,
  }
}

// Campo de particulas decorativo -- sin logica de negocio, generado una sola vez por montaje
// (no se recalcula en cada render).
export function ParticleField() {
  const { height } = useWindowDimensions()
  const particles = useMemo(() => Array.from({ length: PARTICLE_COUNT }, randomParticle), [])
  const travelPx = height * 1.15

  return (
    <View style={[StyleSheet.absoluteFill, { pointerEvents: 'none' }]}>
      {particles.map((particle, index) => (
        <Particle key={index} {...particle} travelPx={travelPx} />
      ))}
    </View>
  )
}
