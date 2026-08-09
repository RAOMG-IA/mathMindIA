import Svg, { Defs, Line, Pattern, Rect } from 'react-native-svg'
import { COLORS } from './constants'

// Rejilla de fondo tipo "pizarra matematica", 40px de paso, opacidad muy baja (ADR).
export function BackgroundGrid() {
  return (
    <Svg style={{ position: 'absolute', inset: 0 }} width="100%" height="100%">
      <Defs>
        <Pattern id="grid" width={40} height={40} patternUnits="userSpaceOnUse">
          <Line x1={0} y1={0} x2={40} y2={0} stroke={COLORS.grid} strokeWidth={1} />
          <Line x1={0} y1={0} x2={0} y2={40} stroke={COLORS.grid} strokeWidth={1} />
        </Pattern>
      </Defs>
      <Rect x={0} y={0} width="100%" height="100%" fill="url(#grid)" />
    </Svg>
  )
}
